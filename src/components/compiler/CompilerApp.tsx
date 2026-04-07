import React, { useState, useEffect, useRef } from 'react';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import AceEditorArea from './AceEditorArea';

export default function CompilerApp({ title, initialFiles }: any) {
  const compilerRef = useRef<HTMLDivElement>(null);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<string | null>('explorer'); 
  
  // NEW: Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [files, setFiles] = useState(initialFiles);
  const [activeFileId, setActiveFileId] = useState(initialFiles[0]?.id);
  const [openFileIds, setOpenFileIds] = useState<string[]>(
    initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id)
  );

  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isConsoleFullscreen, setIsConsoleFullscreen] = useState(false);
  const [logs, setLogs] = useState<{method: string, data: string, time: string}[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewWidth, setPreviewWidth] = useState(500);
  const [isResizingPreview, setIsResizingPreview] = useState(false);

  const [projectName, setProjectName] = useState(title || 'Workspace');
  const activeFile = files.find((f: any) => f.id === activeFileId);

  // NEW: Listen for your Website's Dark Mode Toggle
  useEffect(() => {
    // Check initial state
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Watch for changes on the <html> tag
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsAppFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const file = files.find((f: any) => f.id === activeFileId);
    if (file && !file.isFolder && !openFileIds.includes(activeFileId)) {
      setOpenFileIds([...openFileIds, activeFileId]);
    }
  }, [activeFileId, files, openFileIds]);

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

  useEffect(() => {
    if (!isResizingPreview) return;
    const handleMouseMove = (e: MouseEvent) => setPreviewWidth(prev => Math.max(200, prev - e.movementX));
    const handleMouseUp = () => setIsResizingPreview(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPreview]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the compiler? All your changes will be lost.")) {
      setFiles(initialFiles);
      setActiveFileId(initialFiles[0]?.id);
      setOpenFileIds(initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id));
      setProjectName(title || 'Workspace');
      setPreviewContent('');
      setLogs([]);
    }
  };

  const runCode = () => {
    const htmlFile = files.find((f: any) => f.name.endsWith('.html'));
    if (!htmlFile) {
      setLogs([{ method: 'error', data: 'No HTML file found to run.', time: new Date().toLocaleTimeString() }]);
      return;
    }

    let rawHtml = htmlFile.content;

    rawHtml = rawHtml.replace(/<link\s+[^>]*href=["']([^"']*\.css)["'][^>]*>/gi, (match: string, filename: string) => {
      const cssFile = files.find((f: any) => f.name === filename);
      return cssFile ? `<style>\n${cssFile.content}\n</style>` : match;
    });

    rawHtml = rawHtml.replace(/<script\s+[^>]*src=["']([^"']*\.js)["'][^>]*>[\s\S]*?<\/script>/gi, (match: string, filename: string) => {
      const jsFile = files.find((f: any) => f.name === filename);
      return jsFile ? `<script>\n${jsFile.content}\n<\/script>` : match;
    });

    const consoleInterceptor = `
      <script>
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
      </script>
    `;

    if (rawHtml.includes('<head>')) {
      rawHtml = rawHtml.replace('<head>', '<head>\n' + consoleInterceptor);
    } else {
      rawHtml = consoleInterceptor + '\n' + rawHtml;
    }

    setLogs([]); 
    setPreviewContent(rawHtml);
    setIsPreviewOpen(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      compilerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={compilerRef} 
      className={`flex flex-col w-full overflow-hidden font-sans shadow-2xl transition-colors bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-[#cccccc] ${
        isAppFullscreen ? 'h-screen rounded-none border-none my-0' : 'h-[80vh] border border-gray-300 dark:border-[#3c3c3c] rounded-xl my-8'
      }`}
    >
      <div className="h-[30px] bg-gray-200 dark:bg-[#3c3c3c] flex items-center select-none shrink-0 transition-colors">
        <h1 className="px-4 text-xs font-normal cursor-default hidden sm:block">Serplora Compiler</h1>
        
        <div className="flex-1 text-center text-xs text-gray-500 dark:text-[#858585]">
          {activeFile?.name ? `${activeFile.name} — ${projectName}` : projectName}
        </div>

        <div className="flex h-full items-center pr-2 gap-1">
          <div onClick={runCode} className="w-7 h-6 flex items-center justify-center rounded cursor-pointer text-green-600 dark:text-[#89d185] hover:bg-black/5 dark:hover:bg-white/10" title="Run">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
          </div>
          <div onClick={toggleFullscreen} className="w-7 h-6 flex items-center justify-center rounded cursor-pointer text-gray-500 dark:text-[#858585] hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-[#cccccc]" title={isAppFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
             {isAppFullscreen ? (
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/></svg>
             ) : (
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {!isPreviewFullscreen && (
          <>
            <ActivityBar activeView={activeView} setActiveView={setActiveView} isConsoleOpen={isConsoleOpen} setIsConsoleOpen={setIsConsoleOpen} handleReset={handleReset}/>
            <Sidebar projectName={projectName} setProjectName={setProjectName} activeView={activeView} files={files} setFiles={setFiles} activeFileId={activeFileId} setActiveFileId={setActiveFileId}/>
          </>
        )}
        <div className="flex flex-1 overflow-hidden relative">
          {!isPreviewFullscreen && (
            <AceEditorArea 
              isDarkMode={isDarkMode} // Passing theme down
              activeFile={activeFile} files={files} setFiles={setFiles}
              activeFileId={activeFileId} setActiveFileId={setActiveFileId}
              openFileIds={openFileIds} setOpenFileIds={setOpenFileIds}
              isConsoleOpen={isConsoleOpen} setIsConsoleOpen={setIsConsoleOpen}
              isConsoleFullscreen={isConsoleFullscreen} setIsConsoleFullscreen={setIsConsoleFullscreen}
              logs={logs}
            />
          )}
          {isPreviewOpen && (
            <div style={{ width: isPreviewFullscreen ? '100%' : `${previewWidth}px` }} className={`bg-white flex flex-col shrink-0 relative ${isPreviewFullscreen ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}>
              {!isPreviewFullscreen && <div className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingPreview(true)} />}
              {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
              <div className="h-[35px] bg-gray-100 dark:bg-[#252526] border-b border-gray-300 dark:border-[#3c3c3c] flex items-center px-3 shrink-0 text-gray-800 dark:text-[#cccccc] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.08em] uppercase flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#007acc]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  BROWSER PREVIEW
                </div>
                <div className="ml-auto flex gap-1">
                   <svg onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)} className="w-6 h-6 p-1 cursor-pointer hover:bg-black/5 dark:hover:bg-[#2a2d2e] rounded text-gray-500 dark:text-[#858585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{isPreviewFullscreen ? <polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/> : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>}</svg>
                   <svg onClick={() => { setIsPreviewOpen(false); setIsPreviewFullscreen(false); }} className="w-6 h-6 p-1 cursor-pointer hover:bg-black/5 dark:hover:bg-[#2a2d2e] rounded text-gray-500 dark:text-[#858585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
              </div>
              <iframe srcDoc={previewContent} className="flex-1 w-full border-none bg-white" title="preview" sandbox="allow-scripts allow-same-origin allow-modals"></iframe>
            </div>
          )}
        </div>
      </div>

      <div className="h-[22px] bg-[#007acc] flex items-center px-2 text-xs text-white select-none shrink-0">
        <div className="flex items-center h-full px-2 cursor-pointer hover:bg-white/15 gap-1">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
           main
        </div>
        <div className="ml-auto flex items-center h-full">
           <div className="px-2 h-full flex items-center cursor-pointer hover:bg-white/15">UTF-8</div>
           <div className="px-2 h-full flex items-center cursor-pointer hover:bg-white/15">{activeFile?.language?.toUpperCase() || 'TEXT'}</div>
        </div>
      </div>
    </div>
  );
}