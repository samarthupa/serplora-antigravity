import { useState, useRef, useEffect, useCallback } from 'react';
import type { TerminalLog } from '../output/TerminalPreview';

export function useRemoteRunner(wsUrl: string) {
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  // Persistent refs for the active socket and the ping timer
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: TerminalLog['type'], content: string) => {
    setLogs((prev) => [...prev, { id: Math.random().toString(36).substring(2, 9), type, content }]);
  };

  const clearLogs = () => setLogs([]);

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

    let targetFile = files.find((f: any) => !f.name.endsWith('.txt')) || activeFile;
    if (!targetFile) {
      addLog('err', 'No executable file found.');
      return false;
    }

    cleanup(); // Hard reset any lingering state
    setIsRunning(true);
    setIsWaitingForInput(false); 
    setLogs([{ id: Math.random().toString(36).substring(2, 9), type: 'sys', content: '// Connecting to server... Executing...\n' }]);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // (Removed the second addLog here)
        
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
            // 🟢 RULE 2: Open the input box ONLY when requested by backend
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
        addLog('err', '\n// WebSocket Connection Error.');
        cleanup();
      };

    } catch (err) {
      addLog('err', "Failed to establish WebSocket connection.");
      cleanup();
    }
    
    return true;
  };

  // --- 4. INTERACTIVE INPUT HANDLER ---
  const handleInputSubmit = (value: string) => {
    // 🟢 RULE 3: Hide the box the precise millisecond they hit Enter
    setIsWaitingForInput(false); 
    
    // 🟢 RULE 4: Echo keystrokes to the UI (added \n so subsequent output drops to a new line)
    addLog('std', value + '\n'); 
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: value }));
    } else {
      addLog('err', '\n// Cannot send input. Connection is closed.');
    }
  };

  // --- 5. MANUAL ABORT ---
  const abort = () => {
    addLog('sys', '\n// Execution Terminated manually.');
    cleanup();
  };

  return {
    logs,
    isRunning,
    isWaitingForInput,
    execute,
    abort,
    clearLogs,
    handleInputSubmit
  };
}