// src/components/ui/CodeEditorReact.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { useRemoteRunner } from '../compiler/adapters/useRemoteRunner';

export default function CodeEditorReact({ code, language }: any) {
  // Core State
  const [value, setValue] = useState(code || '');
  const [isScrollable, setIsScrollable] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Refs for DOM nodes
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  // Feature States
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOutputVisible, setIsOutputVisible] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [lastRunCode, setLastRunCode] = useState<string | null>(null);

  // CONNECT TO THE WEBSOCKET BACKEND
  const {
    logsByFile,
    isRunning,
    isWaitingForInput,
    execute,
    clearLogs,
    handleInputSubmit
  } = useRemoteRunner('wss://api.serplora.com/python');

  // Safely extract logs for this standalone editor
  const logs = logsByFile['standalone-editor'] || [];

  // Memoize extensions
  const extensions = useMemo(() => {
    const exts = [];
    if (language === 'javascript' || language === 'js') exts.push(javascript());
    if (language === 'python' || language === 'py') exts.push(python());
    
    exts.push(EditorView.contentAttributes.of({ 'aria-label': 'Interactive code editor' }));
    return exts;
  }, [language]);

  // Force layout recalculation
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll Detection Logic
  useEffect(() => {
    const lineCount = value.split('\n').length;
    setIsScrollable(lineCount > 18);
  }, [value]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const scroller = scrollerRef.current.querySelector('.cm-scroller');
    if (!scroller) return;

    const handleScroll = () => {
      const reachedBottom = Math.abs(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop) < 2;
      if (gradientRef.current) {
        gradientRef.current.style.opacity = reachedBottom ? '0' : '1';
      }
    };
    
    handleScroll();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [value, isScrollable, isFullscreen]);

  // Light/Dark mode changes
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Native Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Action Handlers
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error("Error entering fullscreen:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const handleOpenInCompiler = () => {
    // 1. Determine the destination based on the language
    const targetPath = (language === 'python' || language === 'py') 
      ? '/compilers/python' 
      : '/compilers/html';

    // 2. Save the code to local storage temporarily
    localStorage.setItem('serplora_transfer_code', value);

    // 3. Open the compiler page in a new tab, passing a ?transfer=true flag
    window.open(`${targetPath}?transfer=true`, '_blank');
  };

  // TRIGGER WEBSOCKET EXECUTION
  const handleRun = async () => {
    if (isRunning || value.trim() === (lastRunCode || '').trim()) return;
    
    setLastRunCode(value);
    clearLogs('standalone-editor');
    setIsOutputVisible(true);
    
    const mockFiles = [{ id: 'standalone-editor', name: 'main.py', content: value, isFolder: false }];
    await execute(mockFiles, null);
  };

  // HANDLE TERMINAL INPUT SUBMISSION
  const onTerminalInputSubmit = () => {
    if (!isWaitingForInput) return;
    handleInputSubmit(inputVal);
    setInputVal('');
  };

  return (
    <div
      ref={containerRef}
      className={isFullscreen ? "bg-surface w-full h-full flex flex-col m-0 relative z-[9999]" : "relative my-8 rounded-[0.75rem] overflow-hidden border border-subtle shadow-sm bg-surface"}
    >
      {/* HEADER & CONTROLS */}
      <div className="bg-surface px-4 py-2 border-b border-subtle flex justify-between items-center shrink-0">
        <span className="text-tx-muted text-xs font-mono tracking-widest uppercase opacity-80">
          {language || 'code'}
        </span>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          
          {/* RUN BUTTON */}
          {(language === 'python' || language === 'py') && (
            <button
              onClick={handleRun}
              disabled={isRunning || value.trim() === (lastRunCode || '').trim()}
              className="flex items-center px-3 py-1.5 text-xs font-semibold text-tx-main disabled:opacity-50 rounded-md transition-colors"
              title="Run Code"
            >
              {isRunning ? (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}

          {/* COPY BUTTON */}
          <button onClick={handleCopy} className="p-1.5 text-tx-muted hover:text-tx-main hover:bg-[rgba(128,128,128,0.08)] rounded-md transition-colors" title="Copy Code">
            {isCopied ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25H10.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
            )}
          </button>

          {/* FULLSCREEN BUTTON */}
          <button onClick={toggleFullscreen} className="p-1.5 text-tx-muted hover:text-tx-main hover:bg-[rgba(128,128,128,0.08)] rounded-md transition-colors" title="Toggle Fullscreen">
            {isFullscreen ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            )}
          </button>

          {/* OPEN IN COMPILER BUTTON */}
          <button 
            onClick={handleOpenInCompiler} 
            className="ml-2 sm:ml-2 p-1.5 text-tx-muted hover:text-tx-main hover:bg-[rgba(128,128,128,0.08)] rounded-md transition-colors" 
            title="Open in Full Compiler"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>

        </div>
      </div>
      
      {/* EDITOR BODY */}
      <div className={`relative group code-editor-wrapper ${isFullscreen ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : ''}`} ref={scrollerRef}>
        
        {/* The actual code area */}
        <div className={`relative bg-surface ${isFullscreen ? 'flex-1 min-h-0 overflow-auto' : ''}`}>
          <CodeMirror
            ref={editorRef}
            value={value}
            readOnly={true} // Locks only while running
            editable={false}      // Always editable now
            height={isFullscreen ? "100%" : "auto"}
            maxHeight={isFullscreen ? "none" : "360px"}
            extensions={extensions}
            onChange={(val) => setValue(val)}
            theme={isDarkMode ? "dark" : "light"}
            basicSetup={{ lineNumbers: true, foldGutter: true, indentOnInput: true }}
            className="text-[14px] md:text-[15px]"
          />
          
          {isScrollable && !isFullscreen && (
            <div 
              ref={gradientRef}
              className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none flex items-end justify-center pb-3 transition-opacity duration-300 z-10 opacity-100 group-hover:opacity-0"
            >
            </div>
          )}
        </div>

        {/* REAL-TIME TERMINAL OUTPUT */}
        {(logs.length > 0) && (
          <div className={`shrink-0 bg-main border-t border-subtle flex flex-col ${isOutputVisible ? (isFullscreen ? 'h-1/3' : 'max-h-[250px]') : ''}`}>
            
            {/* Terminal Header */}
            <div className="flex justify-between items-center px-4 pt-3 pb-2">
              <span className="text-tx-muted text-[11px] font-mono font-semibold uppercase tracking-wider opacity-80">Output</span>
              <button 
                onClick={() => setIsOutputVisible(!isOutputVisible)}
                className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-tx-muted hover:text-tx-main hover:bg-[rgba(128,128,128,0.08)] rounded transition-colors"
              >
                {isOutputVisible ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Terminal Body */}
            {isOutputVisible && (
              <div className="px-4 pb-4 pt-1 overflow-y-auto font-mono text-[13px] md:text-[14px] flex-grow bg-main leading-[1.7] whitespace-pre-wrap custom-scrollbar">
                
                {logs.map((log: any) => {
                  if (log.type === 'sys') return null;
                  if (log.type === 'err') return <div key={log.id} className="text-red-500 transition-colors">{log.content}</div>;
                  if (log.type === 'input-context') return <span key={log.id} className="text-tx-muted opacity-80 transition-colors">{log.content}</span>;
                  if (log.type === 'image') {
                    const imgSrc = log.content.startsWith('data:image') ? log.content : `data:image/png;base64,${log.content}`;
                    return <img key={log.id} src={imgSrc} alt="Terminal Output" className="max-w-full rounded mt-[10px] bg-white block" />;
                  }
                  
                  return <span key={log.id} className="text-tx-main transition-colors">{log.content}</span>;
                })}

                {/* Inline Interactive Input Box */}
                {isWaitingForInput && (
                  <span className="inline-flex items-center max-w-full">
                    <input 
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onTerminalInputSubmit();
                      }}
                      className="bg-transparent border-none outline-none shadow-none text-tx-main font-inherit text-[14px] font-bold border-b border-gray-400 p-0 m-0 min-w-[10px] transition-colors"
                      style={{ width: `${Math.max(1, inputVal.length) + 1}ch`, borderRadius: 0, appearance: 'none' }}
                      autoFocus
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}