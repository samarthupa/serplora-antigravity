import { useState, useEffect, useRef, useCallback } from 'react';

export function useJsRunner() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const workspaceIdRef = useRef(Math.random().toString(36).substring(2, 15));
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);

  const addLog = useCallback((type: 'sys' | 'err' | 'std' | 'image', content: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), type, content }]);
  }, []);

  const clearLogs = () => setLogs([]);

  const submitInput = useCallback((value: string) => {
    addLog('std', value + '\n');
    setIsWaitingForInput(false);
    
    const iframe = iframeContainerRef.current?.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'JS_PROMPT_ANSWER', data: value }, '*');
    }
  }, [addLog]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.workspaceId !== workspaceIdRef.current) return;

      if (event.data.type === 'JS_PROMPT') {
        addLog('std', event.data.data); 
        setIsWaitingForInput(true);
        return;
      }

      if (event.data.type === 'JS_CONSOLE') {
        const { method, data } = event.data;
        if (typeof data === 'string' && data.startsWith('data:image/')) {
          addLog('image', data);
        } else if (method === 'error') {
          addLog('err', data);
        } else if (method === 'system') {
          addLog('sys', data);
          setIsRunning(false); 
        } else {
          addLog('std', data);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  const abort = useCallback(() => {
    if (iframeContainerRef.current) iframeContainerRef.current.innerHTML = ''; 
    setIsRunning(false);
    setIsWaitingForInput(false); 
    addLog('sys', '\n// Execution Terminated manually.');
  }, [addLog]);

  const execute = async (files: any[], activeFile: any) => {
    setIsRunning(true);
    clearLogs();
    
    const jsFile = activeFile?.name.endsWith('.js') 
      ? activeFile 
      : files.find((f: any) => f.name === 'main.js' || f.name.endsWith('.js'));

    if (!jsFile) {
      addLog('err', 'No JavaScript file found to execute.');
      setIsRunning(false);
      return false;
    }

    if (!iframeContainerRef.current) {
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);
      iframeContainerRef.current = container;
    }

    iframeContainerRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts'); 
    iframeContainerRef.current.appendChild(iframe);

    const htmlPayload = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script>
          const workspaceId = "${workspaceIdRef.current}";
          
          // 🟢 THE REAL FIX: Active Task Tracking
          // This tracks asynchronous pauses (like waiting for input) regardless of how the user nested their promises.
          window.__activeTasks = 1; // Start with 1 representing the main thread evaluation
          
          window.prompt = function(message) {
            window.__activeTasks++; // Register a pending async task
            return new Promise(resolve => {
              const handler = function(event) {
                if (event.data && event.data.type === 'JS_PROMPT_ANSWER') {
                  window.removeEventListener('message', handler);
                  resolve(event.data.data);
                }
              };
              window.addEventListener('message', handler);
              window.parent.postMessage({ type: 'JS_PROMPT', workspaceId, data: message ? message + ' ' : '' }, '*');
            }).then(res => {
              // Delay the task decrement slightly so the event loop can process subsequent lines 
              // of user code (like the next console.log) before we accidentally declare execution finished.
              setTimeout(() => { window.__activeTasks--; }, 15);
              return res;
            });
          };

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
          
          ['log', 'error', 'warn', 'info'].forEach(method => {
            const original = console[method];
            console[method] = (...args) => {
              original.apply(console, args);
              window.parent.postMessage({ 
                type: 'JS_CONSOLE', workspaceId, 
                method: method === 'error' || method === 'warn' ? 'error' : 'log', 
                data: args.map(serialize).join(' ') 
              }, '*');
            };
          });

          window.onerror = function(msg, url, line) {
            console.error(msg + ' at line ' + (line - 1));
            window.__activeTasks = 0; // Force terminate on error
            return true;
          };

          window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled Promise Rejection: ' + event.reason);
            window.__activeTasks = 0; // Force terminate on unhandled async error
          });

          Babel.registerPlugin('loopProtection', ({ types: t }) => {
            const buildGuard = () => t.ifStatement(
                t.binaryExpression(">", t.updateExpression("++", t.memberExpression(t.identifier("window"), t.identifier("__loopCounter"))), t.numericLiteral(100000)),
                t.throwStatement(t.newExpression(t.identifier("Error"), [t.stringLiteral("Infinite Loop Detected (100k steps)")]))
            );
            return { visitor: { "WhileStatement|ForStatement": (path) => { 
                if (!t.isBlockStatement(path.node.body)) path.node.body = t.blockStatement([path.node.body]);
                path.node.body.body.unshift(buildGuard());
            }}};
          });
        </script>
      </head>
      <body>
        <script>
          window.__loopCounter = 0;
          const userCode = ${JSON.stringify(jsFile.content)};
          
          try {
            // Wrap to support native top-level await if the user writes it
            const wrappedCode = "(async () => {\\n" + userCode + "\\n})();";
            
            const compiled = Babel.transform(wrappedCode, {
              plugins: ['loopProtection'] 
            }).code;
            
            // Execute the code
            eval(compiled);
          } catch (err) {
            console.error(err.message);
          } finally {
            // The main synchronous evaluation is done. Decrease the base task count.
            window.__activeTasks--;
          }

          // Polling engine: Wait until all async tasks (prompts) are totally resolved
          const checkInterval = setInterval(() => {
            if (window.__activeTasks <= 0) {
              clearInterval(checkInterval);
              setTimeout(() => {
                window.parent.postMessage({ type: 'JS_CONSOLE', workspaceId, method: 'system', data: '\\n// Execution Finished.' }, '*');
              }, 20); // Small buffer to ensure final console.logs reach the parent UI
            }
          }, 50);

        </script>
      </body>
      </html>
    `;
    iframe.srcdoc = htmlPayload;
    return true;
  };

  useEffect(() => { return () => abort(); }, [abort]);

  return { logs, isRunning, execute, abort, clearLogs, isWaitingForInput, submitInput };
}