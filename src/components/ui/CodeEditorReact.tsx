import React, { useState, useEffect, useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';

export default function CodeEditorReact({ code, language }) {
  // Core State
  const [value, setValue] = useState(code || '');
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  
  // Refs for DOM nodes
  const containerRef = useRef(null); 
  const scrollerRef = useRef(null);  

  // New Feature States
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<{ text: string; isError: boolean } | null>(null);
  const [isOutputVisible, setIsOutputVisible] = useState(true);

  // Memoize extensions to prevent internal CodeMirror resets on scroll
  const extensions = useMemo(() => {
    const exts = [];
    if (language === 'javascript' || language === 'js') exts.push(javascript());
    if (language === 'python' || language === 'py') exts.push(python());
    
    exts.push(EditorView.contentAttributes.of({ 'aria-label': 'Interactive code editor' }));
    return exts;
  }, [language]);

  // Force layout recalculation when lazy-loaded into the viewport
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // 1. Scroll Detection Logic
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
      setIsAtBottom(reachedBottom);
    };

    handleScroll();
    scroller.addEventListener('scroll', handleScroll);
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [value, isScrollable, isFullscreen]);

  // 2. Watch for Light/Dark mode changes
  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Watch for class changes on the html tag
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 3. Native Fullscreen Listener (Detects if user presses ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 4. Action Handlers
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setValue(code || '');
    setOutput(null);
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

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);
    setIsOutputVisible(true);
    
    try {
      const response = await fetch('https://samarthu78-s-python-compiler.hf.space/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.error) {
           setOutput({ text: data.error, isError: true });
        } else {
           setOutput({ text: data.output || data.result || 'Successfully executed with no output.', isError: false });
        }
      } else {
        setOutput({ text: data.error || 'Execution failed on server.', isError: true });
      }
    } catch (err) {
      setOutput({ text: 'Failed to connect to the compiler. Is the server awake?', isError: true });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={isFullscreen ? "bg-surface w-full h-full flex flex-col m-0" : "relative my-8 rounded-[0.75rem] overflow-hidden border border-subtle shadow-sm bg-surface flex flex-col"}
    >
      {/* HEADER & CONTROLS */}
      <div className="bg-surface px-4 py-2 border-b border-subtle flex justify-between items-center shrink-0">
        <span className="text-tx-muted text-xs font-mono tracking-widest uppercase opacity-80">
          {language || 'code'}
        </span>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          
          {/* RESET BUTTON */}
          <button onClick={handleReset} className="p-1.5 text-tx-muted hover:text-tx-main hover:bg-[rgba(128,128,128,0.08)] rounded-md transition-colors" title="Reset Code">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </button>

          {/* RUN BUTTON */}
          {(language === 'python' || language === 'py') && (
            <button 
              onClick={handleRun} 
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-tx-main bg-[rgba(128,128,128,0.08)] hover:bg-[rgba(128,128,128,0.15)] border border-subtle disabled:opacity-50 rounded-md transition-colors"
            >
              {isRunning ? (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
              )}
              {isRunning ? 'Running...' : 'Run'}
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
        </div>
      </div>
      
      {/* EDITOR BODY */}
      <div className="relative group code-editor-wrapper flex-grow flex flex-col min-h-0" ref={scrollerRef}>
        
        {/* The actual code area */}
        <div className="flex-grow overflow-auto relative bg-surface">
          <CodeMirror
            value={value}
            height={isFullscreen ? "100%" : "auto"}
            maxHeight={isFullscreen ? "none" : "360px"}
            extensions={extensions}
            onChange={(val) => setValue(val)}
            theme={isDarkMode ? "dark" : "light"}
            basicSetup={{ lineNumbers: true, foldGutter: true, indentOnInput: true }}
            className="text-[14px] md:text-[15px] h-full"
          />
          
          {/* Smart Scroll Indicator Overlay */}
          {isScrollable && !isAtBottom && !isFullscreen && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none flex items-end justify-center pb-3 transition-opacity duration-300 z-10 opacity-100 group-hover:opacity-0">
            </div>
          )}

        </div>

       {/* TERMINAL OUTPUT */}
        {output && (
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
              <div className="px-4 pb-4 pt-1 overflow-y-auto font-mono text-[13px] md:text-[14px] flex-grow bg-main">
                <pre className={`whitespace-pre-wrap m-0 !bg-transparent !border-none !shadow-none !p-1 ${output.isError ? 'text-red-500' : 'text-tx-main'}`}>
                  {output.text}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}