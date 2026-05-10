import { useState, useEffect, useRef, useCallback } from 'react';

export type JsProcessLog = {
  name: string;
  logs: any[];
};

export function useJsRunner() {
  const [processLogs, setProcessLogs] = useState<Record<string, JsProcessLog>>({});
  const [runningFile, setRunningFile] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  const workspaceIdRef = useRef(Math.random().toString(36).substring(2, 15));
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);
  const targetFileIdRef = useRef<string | null>(null);

  const addLog = useCallback((type: 'sys' | 'err' | 'std' | 'image', content: string) => {
    const fileId = targetFileIdRef.current;
    if (!fileId) return;
    
    setProcessLogs(prev => {
      const current = prev[fileId];
      if (!current) return prev;
      return {
        ...prev,
        [fileId]: {
          ...current,
          logs: [...current.logs, { id: Math.random().toString(36).substring(2, 9), type, content }]
        }
      };
    });
  }, []);

  const clearLogs = useCallback((fileId?: string) => {
    if (fileId) {
      setProcessLogs(prev => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    } else {
      setProcessLogs({});
    }
  }, []);

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
          addLog('std', data + '\n');
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
    
    const jsFile = activeFile?.name.endsWith('.js') 
      ? activeFile 
      : files.find((f: any) => f.name === 'main.js' || f.name.endsWith('.js'));

    if (!jsFile) {
      setIsRunning(false);
      return false;
    }

    setRunningFile(jsFile);
    targetFileIdRef.current = jsFile.id;
    
    // 🟢 Initialize the tab/process for this JS file
    setProcessLogs(prev => ({
      ...prev,
      [jsFile.id]: {
        name: jsFile.name,
        logs: [{ id: Math.random().toString(36).substring(2, 9), type: 'sys', content: '// Executing locally...\n' }]
      }
    }));

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
          window.__activeTasks = 1; 
          
          window.prompt = function(message) {
            window.__activeTasks++; 
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
            window.__activeTasks = 0; 
            return true;
          };

          window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled Promise Rejection: ' + event.reason);
            window.__activeTasks = 0; 
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
            const wrappedCode = "(async () => {\\n" + userCode + "\\n})();";
            const compiled = Babel.transform(wrappedCode, { plugins: ['loopProtection'] }).code;
            eval(compiled);
          } catch (err) {
            console.error(err.message);
          } finally {
            window.__activeTasks--;
          }

          const checkInterval = setInterval(() => {
            if (window.__activeTasks <= 0) {
              clearInterval(checkInterval);
              setTimeout(() => {
                window.parent.postMessage({ type: 'JS_CONSOLE', workspaceId, method: 'system', data: '\\n// Execution Finished.' }, '*');
              }, 20); 
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

  return { processLogs, runningFile, isRunning, execute, abort, clearLogs, isWaitingForInput, submitInput };
}