import { useState, useRef, useEffect, useCallback } from 'react';
import type { TerminalLog } from '../output/TerminalPreview';

export function useRemoteRunner(wsUrl: string) {
  // 🌟 NEW: Terminal Memory Dictionary (stores logs per file ID)
  const [logsByFile, setLogsByFile] = useState<Record<string, TerminalLog[]>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  // Persistent refs for the active socket, ping timer, and active process
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const runningFileIdRef = useRef<string | null>(null); // 🌟 Tracks the active process

  const addLog = (type: TerminalLog['type'], content: string) => {
    const fileId = runningFileIdRef.current;
    if (!fileId) return;

    setLogsByFile((prev) => {
      const currentLogs = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: [...currentLogs, { id: Math.random().toString(36).substring(2, 9), type, content }]
      };
    });
  };

  const clearLogs = (fileId: string) => {
    setLogsByFile((prev) => ({ ...prev, [fileId]: [] }));
  };

  // --- 1. CLEANUP UTILITY ---
  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (wsRef.current) {
       if (wsRef.current.readyState === WebSocket.OPEN) {
         wsRef.current.close();
       }
       wsRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingForInput(false);
    runningFileIdRef.current = null;
  }, []);

  // Ensure connection dies if the component unmounts
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // --- 2. OUTPUT PARSER (Images & Text) ---
  const parseAndRenderOutput = (rawText: string) => {
    const regex = /@@@IMAGE_START@@@(.*?)@@@IMAGE_END@@@/gs;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      const textBefore = rawText.substring(lastIndex, match.index);
      if (textBefore.trim()) addLog('std', textBefore);

      const base64Data = match[1];
      addLog('image', base64Data);

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      const textAfter = rawText.substring(lastIndex);
      if (textAfter.trim()) addLog('std', textAfter);
    }
  };

  // --- 3. MAIN EXECUTION ENGINE ---
  const execute = async (files: any[], activeFile: any) => {
    if (isRunning) return false;

    let targetFile = activeFile || files.find((f: any) => !f.name.endsWith('.txt'));
    if (!targetFile) {
      // If nothing found, log error to the first file's console to show the user
      runningFileIdRef.current = files[0]?.id;
      addLog('err', 'No executable file found.');
      return false;
    }

    cleanup(); // Hard reset any lingering state
    setIsRunning(true);
    setIsWaitingForInput(false); 
    runningFileIdRef.current = targetFile.id; // 🌟 Lock memory to this file

    // 🌟 Reset logs for this specific file on a fresh run
    setLogsByFile((prev) => ({
      ...prev,
      [targetFile.id]: [{ id: Math.random().toString(36).substring(2, 9), type: 'sys', content: '// Connecting to server... Executing...\n' }]
    }));

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // 1. Send the initial code payload
        ws.send(JSON.stringify({ code: targetFile.content }));

        // 2. Start the 20-second keep-alive ping
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'output') {
            parseAndRenderOutput(msg.data);
          } else if (msg.type === 'input_request') {
            setIsWaitingForInput(true);
          } else if (msg.type === 'status' && msg.data === 'completed') {
            addLog('sys', '\n// Execution Finished');
            cleanup();
          } else if (msg.type === 'error') {
            addLog('err', `\nError: ${msg.data}`);
            cleanup();
          }
        } catch (e) {
          parseAndRenderOutput(event.data);
        }
      };

      ws.onclose = (event) => {
        if (wsRef.current === ws) {
           if (event.code === 1008) {
              addLog('sys', '\n// Execution Terminated: Idle timeout exceeded.');
           } else if (event.code !== 1000 && event.code !== 1005) {
              addLog('err', '\n// Connection Closed Unexpectedly.');
           }
           cleanup();
        }
      };

      ws.onerror = (error) => {
        addLog('err', '\n// Time exceeded. Reset the compiler and try again.');
        cleanup();
      };

    } catch (err) {
      addLog('err', "Failed to establish connection.");
      cleanup();
    }
    
    return true;
  };

  // --- 4. INTERACTIVE INPUT HANDLER ---
  const handleInputSubmit = (value: string) => {
    setIsWaitingForInput(false); 
    addLog('std', value + '\n'); 
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: value }));
    } else {
      addLog('err', '\n// Cannot send input. Connection is closed.');
    }
  };

  // --- 5. MANUAL ABORT ---
  const abort = () => {
    if (!isRunning) return;
    addLog('sys', '\n// Execution Terminated manually.');
    cleanup();
  };

  return {
    logsByFile,
    isRunning,
    isWaitingForInput,
    execute,
    abort,
    clearLogs,
    handleInputSubmit
  };
}