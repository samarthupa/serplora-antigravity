import { useState, useRef, useEffect, useCallback } from 'react';
import type { TerminalLog } from '../output/TerminalPreview';

export type ProcessLog = {
  name: string;
  logs: TerminalLog[];
};

export function useRemoteRunner(wsUrl: string) {
  // 🟢 NEW: Stores a history of logs for every file run
  const [processLogs, setProcessLogs] = useState<Record<string, ProcessLog>>({});
  const [runningFile, setRunningFile] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetFileIdRef = useRef<string | null>(null); // Track which file WS belongs to

  const addLog = (type: TerminalLog['type'], content: string) => {
    const fileId = targetFileIdRef.current;
    if (!fileId) return;
    
    setProcessLogs((prev) => {
      const currentProcess = prev[fileId];
      if (!currentProcess) return prev;
      return {
        ...prev,
        [fileId]: {
          ...currentProcess,
          logs: [...currentProcess.logs, { id: Math.random().toString(36).substring(2, 9), type, content }]
        }
      };
    });
  };

  const clearLogs = (fileId?: string) => {
    if (fileId) {
      setProcessLogs(prev => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    } else {
      setProcessLogs({});
    }
  };

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (wsRef.current) {
       if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
         wsRef.current.close();
       }
       wsRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingForInput(false);
  }, []);

  useEffect(() => { return cleanup; }, [cleanup]);

  const parseAndRenderOutput = (rawText: string) => {
    const regex = /@@@IMAGE_START@@@(.*?)@@@IMAGE_END@@@/gs;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      const textBefore = rawText.substring(lastIndex, match.index);
      if (textBefore.trim()) addLog('std', textBefore);
      addLog('image', match[1]);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < rawText.length) {
      const textAfter = rawText.substring(lastIndex);
      if (textAfter.trim()) addLog('std', textAfter);
    }
  };

  const execute = async (files: any[], activeFile: any) => {
    if (isRunning) return false;

    let targetFile = activeFile || files.find((f: any) => !f.name.endsWith('.txt'));
    if (!targetFile) return false;

    cleanup(); 
    setIsRunning(true);
    setIsWaitingForInput(false); 
    setRunningFile(targetFile); 
    targetFileIdRef.current = targetFile.id; // 🟢 Lock WS logs to this file ID

    // 🟢 Initialize the tab/process for this file
    setProcessLogs(prev => ({
      ...prev,
      [targetFile.id]: {
        name: targetFile.name,
        logs: [{ id: Math.random().toString(36).substring(2, 9), type: 'sys', content: 'Executing...\n' }]
      }
    }));

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ code: targetFile.content }));
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output') parseAndRenderOutput(msg.data);
          else if (msg.type === 'input_request') setIsWaitingForInput(true);
          else if (msg.type === 'status' && msg.data === 'completed') {
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
           if (event.code === 1008) addLog('sys', '\n// Execution Terminated: Idle timeout exceeded.');
           else if (event.code !== 1000 && event.code !== 1005) addLog('err', '\n// Connection Closed Unexpectedly.');
           cleanup();
        }
      };
      ws.onerror = () => {
        addLog('err', '\n// Time exceeded. Reset the compiler and try again.');
        cleanup();
      };
    } catch (err) {
      addLog('err', "Failed to establish connection.");
      cleanup();
    }
    return true;
  };

  const handleInputSubmit = (value: string) => {
    setIsWaitingForInput(false); 
    addLog('std', value + '\n'); 
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: value }));
    }
  };

  const abort = () => {
    if (!isRunning) return;
    addLog('sys', '\n// Execution Terminated manually.');
    cleanup();
  };

  return { processLogs, runningFile, isRunning, isWaitingForInput, execute, abort, clearLogs, handleInputSubmit };
}