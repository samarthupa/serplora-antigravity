import { useState, useEffect } from 'react';

export type HtmlLog = {
  method: string;
  data: string;
  time: string;
};

export function useHtmlRunner() {
  const [previewContent, setPreviewContent] = useState('');
  const [logs, setLogs] = useState<HtmlLog[]>([]);

  // Listen for console logs coming from the injected iframe script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_LOG') {
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

    // NEW: Force all links to open in a new tab
const baseTag = document.createElement('base');
baseTag.target = "_blank";
if (doc.head) {
  doc.head.insertBefore(baseTag, doc.head.firstChild);
} else {
  doc.insertBefore(baseTag, doc.firstChild);
}

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
        window.console = {
          log: function(...args) { originalConsole.log(...args); window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'log', data: args.map(String).join(' ') }, '*'); },
          error: function(...args) { originalConsole.error(...args); window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'error', data: args.map(String).join(' ') }, '*'); },
          warn: function(...args) { originalConsole.warn(...args); window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'warn', data: args.map(String).join(' ') }, '*'); },
          info: function(...args) { originalConsole.info(...args); window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'info', data: args.map(String).join(' ') }, '*'); }
        };
        window.onerror = function(message, source, lineno, colno, error) {
          window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'error', data: message + ' at line ' + lineno }, '*');
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