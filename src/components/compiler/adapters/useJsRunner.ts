import { useState, useRef, useCallback, useEffect } from 'react';

export function useJsRunner() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const addLog = useCallback((type: 'sys' | 'err' | 'std' | 'image', content: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), type, content }]);
  }, []);

  const clearLogs = () => setLogs([]);

  const abort = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
    addLog('sys', '\n// Execution Terminated manually.');
  }, [addLog]);

  const execute = async (files: any[], activeFile: any) => {
    setIsRunning(true);
    clearLogs();
    
    // Find the JS file to run
    const jsFile = activeFile?.name.endsWith('.js') 
      ? activeFile 
      : files.find((f: any) => f.name === 'main.js' || f.name.endsWith('.js'));

    if (!jsFile) {
      addLog('err', 'No JavaScript file found to execute.');
      setIsRunning(false);
      return false;
    }

    addLog('sys', '// Compiling and executing...');

    // Kill any existing worker before starting a new one
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // 🚀 The Web Worker Payload
    const workerCode = `
      function serialize(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (arg instanceof Error) return arg.stack || arg.message;
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); } 
          catch (e) { return '[Circular Object]'; }
        }
        return String(arg);
      }

      // Intercept console commands
      ['log', 'error', 'warn', 'info'].forEach(method => {
        const original = console[method];
        console[method] = (...args) => {
          const type = (method === 'error' || method === 'warn') ? 'err' : 'std';
          const data = args.map(serialize).join(' ');
          postMessage({ type, data });
        };
      });

      // Listen for code from the main thread
      self.onmessage = async (e) => {
        try {
          // AsyncFunction allows top-level await support dynamically
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const exec = new AsyncFunction(e.data.code);
          await exec();
          
          postMessage({ type: 'sys', data: '\\n// Execution Finished' });
        } catch (err) {
          postMessage({ type: 'err', data: err.toString() });
          postMessage({ type: 'sys', data: '\\n// Execution Finished' });
        }
      };
    `;

    // Spin up the worker securely via a Blob URL
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    // Listen for logs coming back from the worker
    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (typeof data === 'string' && data.startsWith('data:image/')) {
        addLog('image', data);
      } else {
        addLog(type, data);
        if (type === 'sys' && data.includes('Finished')) {
          setIsRunning(false);
        }
      }
    };

    // Catch fatal worker errors
    worker.onerror = (err) => {
      addLog('err', err.message);
      setIsRunning(false);
    };

    // Send the user's code to the worker to execute
    worker.postMessage({ code: jsFile.content });
    return true;
  };

  // Cleanup to prevent memory leaks if the user leaves the page
  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  return { logs, isRunning, execute, abort, clearLogs };
}