import { useState, useEffect, useRef, useCallback } from 'react';

export type ProcessPreview = { name: string; content: string; };
export type HtmlProcessLog = { name: string; logs: any[]; };

export function useHtmlRunner() {
  const [processPreviews, setProcessPreviews] = useState<Record<string, ProcessPreview>>({});
  const [processLogs, setProcessLogs] = useState<Record<string, HtmlProcessLog>>({});
  const [runningFile, setRunningFile] = useState<any>(null);

  const workspaceIdRef = useRef(Math.random().toString(36).substring(2, 15));
  const targetFileIdRef = useRef<string | null>(null);

  const addLog = useCallback((method: string, data: string) => {
    const fileId = targetFileIdRef.current;
    if (!fileId) return;
    
    setProcessLogs((prev) => {
      const current = prev[fileId];
      if (!current) return prev;
      return {
        ...prev,
        [fileId]: {
          ...current,
          logs: [
            ...current.logs,
            { 
              method: method, 
              data: data, 
              time: new Date().toLocaleTimeString([], {hour12: false}) 
            }
          ]
        }
      };
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_LOG' && event.data.workspaceId === workspaceIdRef.current) {
        addLog(event.data.method, event.data.data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  const clearLogs = useCallback((fileId?: string) => {
    if (fileId) {
      setProcessLogs(prev => { const next = {...prev}; delete next[fileId]; return next; });
      setProcessPreviews(prev => { const next = {...prev}; delete next[fileId]; return next; });
    } else {
      setProcessLogs({});
      setProcessPreviews({});
    }
  }, []);

  const execute = (files: any[], activeFile: any) => {
    let htmlFile = null;
    
    if (activeFile && activeFile.name.endsWith('.html')) htmlFile = activeFile;
    else htmlFile = files.find((f: any) => f.name === 'index.html') || files.find((f: any) => f.name.endsWith('.html'));

    if (!htmlFile) return false;

    setRunningFile(htmlFile);
    targetFileIdRef.current = htmlFile.id;
    
    setProcessLogs(prev => ({ ...prev, [htmlFile.id]: { name: htmlFile.name, logs: [] } }));

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFile.content, 'text/html');

    const linkInterceptor = document.createElement('script');
    linkInterceptor.innerHTML = `
      document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('javascript:')) return;
        if (href.startsWith('#')) {
          e.preventDefault();
          if (href.length > 1) {
            try {
              const target = document.querySelector(href);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            } catch(err) {} 
          }
          return;
        }
        e.preventDefault();
        window.open(a.href, '_blank');
      });
    `;
    if (doc.head) doc.head.insertBefore(linkInterceptor, doc.head.firstChild);
    else doc.insertBefore(linkInterceptor, doc.firstChild);

    doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const cssFile = files.find((f: any) => f.name === href);
        if (cssFile) {
          const style = document.createElement('style');
          style.innerHTML = `\n/* Source: ${href} */\n${cssFile.content}`;
          link.replaceWith(style);
        }
      }
    });

    doc.querySelectorAll('script[src]').forEach((script) => {
      const src = script.getAttribute('src');
      if (src) {
        const jsFile = files.find((f: any) => f.name === src);
        if (jsFile) {
          script.removeAttribute('src');
          script.innerHTML = `\n/* Source: ${src} */\n${jsFile.content}`;
        }
      }
    });

    const consoleInterceptor = document.createElement('script');
    consoleInterceptor.innerHTML = `
      (function() {
        const originalConsole = window.console;
        const currentWorkspaceId = "${workspaceIdRef.current}";

        function serialize(arg) {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          if (typeof arg === 'function') return arg.toString();
          if (arg instanceof Error) return arg.stack || arg.message;
          if (arg instanceof HTMLElement) {
            return '<' + arg.tagName.toLowerCase() + 
                   (arg.id ? ' id="' + arg.id + '"' : '') + 
                   (arg.className ? ' class="' + arg.className + '"' : '') + 
                   '>...';
          }
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2); } 
            catch (e) { return '[Circular or Unserializable Object]'; }
          }
          return String(arg);
        }

        // 🟢 1. CSS Stripper & Standard Logs
        ['log', 'error', 'warn', 'info'].forEach(method => {
          const original = originalConsole[method];
          window.console[method] = function(...args) {
            original.apply(originalConsole, args);
            
            // Handle %c CSS styling by stripping it and its corresponding style strings
            if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('%c')) {
              const count = (args[0].match(/%c/g) || []).length;
              args[0] = args[0].replace(/%c/g, '');
              args.splice(1, count); // Remove the CSS string arguments
            }

            window.parent.postMessage({ 
              type: 'CONSOLE_LOG', 
              workspaceId: currentWorkspaceId, 
              method: method === 'error' || method === 'warn' ? 'error' : 'log', 
              data: args.map(serialize).join(' ') 
            }, '*');
          };
        });

        // 🟢 2. Time & TimeEnd Handlers
        window.__consoleTimers = {};
        window.console.time = function(label = 'default') {
          window.__consoleTimers[label] = performance.now();
        };
        window.console.timeEnd = function(label = 'default') {
          const start = window.__consoleTimers[label];
          if (start) {
            const duration = performance.now() - start;
            window.console.log(label + ': ' + duration.toFixed(3) + ' ms');
            delete window.__consoleTimers[label];
          } else {
            window.console.warn("Timer '" + label + "' does not exist");
          }
        };

        // 🟢 3. Table Handler
        window.console.table = function(data) {
          if (typeof data === 'object' && data !== null) {
            window.console.log(JSON.stringify(data, null, 2));
          } else {
            window.console.log(data);
          }
        };

        window.onerror = function(message, source, lineno, colno, error) {
          window.parent.postMessage({ type: 'CONSOLE_LOG', workspaceId: currentWorkspaceId, method: 'error', data: message + ' at line ' + lineno }, '*');
          return false;
        };
      })();
    `;
    if (doc.head) doc.head.insertBefore(consoleInterceptor, doc.head.firstChild);
    else doc.insertBefore(consoleInterceptor, doc.firstChild);

    setProcessPreviews(prev => ({
      ...prev,
      [htmlFile.id]: { name: htmlFile.name, content: "<!DOCTYPE html>\n" + doc.documentElement.outerHTML }
    }));

    return true; 
  };

  return { processPreviews, processLogs, runningFile, clearLogs, execute };
}