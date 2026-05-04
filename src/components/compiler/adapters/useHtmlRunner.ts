import { useState, useEffect, useRef } from 'react';

export type HtmlLog = {
  method: string;
  data: string;
  time: string;
};

export function useHtmlRunner() {
  const [previewContent, setPreviewContent] = useState('');
  const [logs, setLogs] = useState<HtmlLog[]>([]);

  // 🌟 NEW: Generate a unique ID for this specific compiler instance
  const workspaceIdRef = useRef(Math.random().toString(36).substring(2, 15));

  // Listen for console logs coming from the injected iframe script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 🌟 NEW: Strictly filter messages so we only process logs from OUR iframe
      if (event.data && event.data.type === 'CONSOLE_LOG' && event.data.workspaceId === workspaceIdRef.current) {
        setLogs((prevLogs) => [
          ...prevLogs, 
          { method: event.data.method, data: event.data.data, time: new Date().toLocaleTimeString([], {hour12: false}) }
        ]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const clearLogs = () => setLogs([]);

  const execute = (files: any[], activeFile: any) => {
    let htmlFile = null;
    
    // Find the file to run (prioritize the active tab if it's HTML)
    if (activeFile && activeFile.name.endsWith('.html')) {
      htmlFile = activeFile;
    } else {
      htmlFile = files.find((f: any) => f.name === 'index.html') || files.find((f: any) => f.name.endsWith('.html'));
    }

    if (!htmlFile) {
      setLogs([{ method: 'error', data: 'No HTML file found to run.', time: new Date().toLocaleTimeString([], {hour12: false}) }]);
      return false; // Indicates failure to run
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFile.content, 'text/html');

    // Inject Smart Link Interceptor
    const linkInterceptor = document.createElement('script');
    linkInterceptor.innerHTML = `
      document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href');
        if (!href) return;

        // 1. Allow javascript: links to execute normally
        if (href.startsWith('javascript:')) {
          return; 
        }

        // 2. Fix the "Inception" bug for hash links
        if (href.startsWith('#')) {
          e.preventDefault(); // Stop the browser from reloading the parent URL
          
          // If it's a real anchor jump-link (e.g., #section2), scroll to it manually
          if (href.length > 1) {
            try {
              const target = document.querySelector(href);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            } catch(err) {} // Ignore invalid query selectors
          }
          return;
        }

        // 3. Open all other real URLs in a new tab
        e.preventDefault();
        window.open(a.href, '_blank');
      });
    `;
    
    if (doc.head) doc.head.insertBefore(linkInterceptor, doc.head.firstChild);
    else doc.insertBefore(linkInterceptor, doc.firstChild);

    // Inject CSS
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

    // Inject JS
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

    // Inject Console Interceptor
    const consoleInterceptor = document.createElement('script');
    consoleInterceptor.innerHTML = `
      (function() {
        const originalConsole = window.console;
        // 🌟 NEW: Embed the unique ID into the iframe's memory
        const currentWorkspaceId = "${workspaceIdRef.current}";

        // 🌟 NEW: Safe Serialization Logic
        function serialize(arg) {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          if (typeof arg === 'function') return arg.toString();
          if (arg instanceof Error) return arg.stack || arg.message;
          
          // Format HTML elements cleanly instead of crashing
          if (arg instanceof HTMLElement) {
            return '<' + arg.tagName.toLowerCase() + 
                   (arg.id ? ' id="' + arg.id + '"' : '') + 
                   (arg.className ? ' class="' + arg.className + '"' : '') + 
                   '>...';
          }
          
          if (typeof arg === 'object') {
            try {
              // Add a 2-space indent so objects look beautiful in the terminal
              return JSON.stringify(arg, null, 2); 
            } catch (e) {
              // Fallback for circular references so the compiler never crashes
              return '[Circular or Unserializable Object]'; 
            }
          }
          return String(arg);
        }

        window.console = {
          log: function(...args) { 
            originalConsole.log(...args); 
            window.parent.postMessage({ type: 'CONSOLE_LOG', workspaceId: currentWorkspaceId, method: 'log', data: args.map(serialize).join(' ') }, '*'); 
          },
          error: function(...args) { 
            originalConsole.error(...args); 
            window.parent.postMessage({ type: 'CONSOLE_LOG', workspaceId: currentWorkspaceId, method: 'error', data: args.map(serialize).join(' ') }, '*'); 
          },
          warn: function(...args) { 
            originalConsole.warn(...args); 
            window.parent.postMessage({ type: 'CONSOLE_LOG', workspaceId: currentWorkspaceId, method: 'warn', data: args.map(serialize).join(' ') }, '*'); 
          },
          info: function(...args) { 
            originalConsole.info(...args); 
            window.parent.postMessage({ type: 'CONSOLE_LOG', workspaceId: currentWorkspaceId, method: 'info', data: args.map(serialize).join(' ') }, '*'); 
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

    clearLogs();
    setPreviewContent("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
    return true; // Indicates success
  };

  return {
    previewContent,
    setPreviewContent,
    logs,
    clearLogs,
    execute
  };
}