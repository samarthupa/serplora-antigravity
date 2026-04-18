import React, { useState, useEffect, useRef } from 'react';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import AceEditorArea from './AceEditorArea';

export default function CompilerApp({ title, initialFiles }: any) {
  const compilerRef = useRef<HTMLDivElement>(null);
  
  // Responsive States - FIXED: Synchronous initialization to prevent layout shift
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [mobileActiveTab, setMobileActiveTab] = useState<'files' | 'editor' | 'preview' | 'console'>('editor');

  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<string | null>('explorer'); 
  
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

  // 🟢 Helper to compute the full file path dynamically
  const getActiveFilePath = () => {
    if (!activeFile) return '';
    const path = [activeFile.name];
    let currentParentId = activeFile.parentId;
    
    // Climb up the tree until we hit the root
    while (currentParentId) {
      const parentFolder = files.find((f: any) => f.id === currentParentId);
      if (parentFolder) {
        path.unshift(parentFolder.name);
        currentParentId = parentFolder.parentId;
      } else {
        break;
      }
    }
    
    return `${projectName} > ${path.join(' > ')}`;
  };

  // Resize Listener for Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
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
      if (isMobile) setMobileActiveTab('console'); // Go to console to see error on mobile
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
    
    // Switch to preview tab automatically on mobile
    if (isMobile) {
      setMobileActiveTab('preview');
    }
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
      // FIXED: Pure CSS responsive classes instead of relying heavily on the isMobile JS variable
      className={`flex flex-col w-full overflow-hidden font-sans transition-colors bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-[#cccccc] ${
        isAppFullscreen 
          ? 'h-[100dvh] md:h-screen rounded-none border-none my-0 z-50' 
          : 'h-[100dvh] my-0 rounded-none border-none md:h-[calc(100vh-100px)] md:my-0 md:rounded-xl md:border md:border-gray-300 md:dark:border-[#3c3c3c]'
      }`}
    >
     <div className="h-[44px] md:h-[30px] bg-gray-200 dark:bg-[#3c3c3c] flex items-center select-none shrink-0 transition-colors">
        
        {/* 🟢 MOBILE NAVIGATION ICONS (Hidden on Desktop) */}
        <div className="flex md:hidden items-center justify-evenly flex-1 px-1">
          <div onClick={() => setMobileActiveTab('files')} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'files' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </div>
          <div onClick={() => setMobileActiveTab('editor')} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'editor' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          
          {/* 🟢 CHANGED: Clicking Preview now triggers runCode() directly */}
          <div onClick={runCode} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'preview' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          
          <div onClick={() => setMobileActiveTab('console')} className={`relative cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'console' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8"/></svg>
             {logs.length > 0 && <span className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-[#f48771] border border-gray-200 dark:border-[#3c3c3c]"></span>}
          </div>
          
          <div onClick={handleReset} className="cursor-pointer p-1.5 text-gray-600 dark:text-[#9d9d9d] transition-colors">
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </div>
          
          <div className="cursor-pointer p-1.5 text-gray-600 dark:text-[#9d9d9d] transition-colors">
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </div>

          {/* 🟢 NEW: Fullscreen Icon */}
          <div onClick={toggleFullscreen} className="cursor-pointer p-1.5 text-gray-600 dark:text-[#9d9d9d] transition-colors">
             {isAppFullscreen ? (
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/></svg>
             ) : (
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
             )}
          </div>
        </div>

        {/* 🟢 DESKTOP TITLE (Hidden on Mobile) */}
        <div className="hidden md:block flex-1 text-center text-sm font-normal text-gray-500 dark:text-[#858585]">
          {activeFile?.name ? `${activeFile.name} — ${projectName}` : projectName}
        </div>

        <div className="hidden md:flex h-full items-center pr-2 gap-2 md:gap-1">
          {/* Prominent Run Button
              FIX: green-600 (#16a34a) on white is only ~3.1:1 — fails WCAG AA.
                   green-700 (#15803d) on white is ~4.7:1 — passes AA.
                   md:text-green-700 replaces md:text-green-600 for the same reason
                   on the gray-200 title bar background. Dark mode [#89d185] on
                   [#3c3c3c] is already ~5.5:1 so no change needed there.
          */}
          <button onClick={runCode} className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 md:py-0.5 md:bg-transparent md:text-green-700 md:dark:text-[#89d185] md:hover:bg-black/5 md:dark:hover:bg-white/10 rounded transition-colors" title="Run">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
             <span className="text-xs font-bold md:hidden tracking-wider">RUN</span>
          </button>
          <div onClick={toggleFullscreen} className="hidden md:flex w-7 h-6 items-center justify-center rounded cursor-pointer text-gray-500 dark:text-[#858585] hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-[#cccccc]" title={isAppFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
             {isAppFullscreen ? (
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/></svg>
             ) : (
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {!isPreviewFullscreen && (
          <div className="hidden md:flex">
            <ActivityBar activeView={activeView} setActiveView={setActiveView} isConsoleOpen={isConsoleOpen} setIsConsoleOpen={setIsConsoleOpen} handleReset={handleReset}/>
          </div>
        )}

        {/* Sidebar View */}
        <div className={`${isMobile ? (mobileActiveTab === 'files' ? 'flex absolute inset-0 w-full z-20' : 'hidden') : (!isPreviewFullscreen && activeView ? 'flex relative' : 'hidden')} bg-gray-50 dark:bg-[#252526]`}>
            <Sidebar projectName={projectName} setProjectName={setProjectName} activeView={isMobile ? 'explorer' : activeView} files={files} setFiles={setFiles} activeFileId={activeFileId} setActiveFileId={(id: string) => { setActiveFileId(id); if (isMobile) setMobileActiveTab('editor'); }} isMobile={isMobile} />
        </div>
        
        {/* Editor & Console View */}
        <div className={`${isMobile ? ((mobileActiveTab === 'editor' || mobileActiveTab === 'console') ? 'flex w-full absolute inset-0 z-10' : 'hidden') : 'flex flex-1 relative'} overflow-hidden`}>
          {!isPreviewFullscreen && (
            <AceEditorArea 
              isDarkMode={isDarkMode}
              isMobile={isMobile}
              mobileActiveTab={mobileActiveTab}
              activeFile={activeFile} files={files} setFiles={setFiles}
              activeFileId={activeFileId} setActiveFileId={setActiveFileId}
              openFileIds={openFileIds} setOpenFileIds={setOpenFileIds}
              isConsoleOpen={isConsoleOpen} setIsConsoleOpen={setIsConsoleOpen}
              isConsoleFullscreen={isConsoleFullscreen} setIsConsoleFullscreen={setIsConsoleFullscreen}
              logs={logs}
            />
          )}
        </div>

        {/* Browser Preview View */}
        {(isPreviewOpen || (isMobile && mobileActiveTab === 'preview')) && (
          <div style={{ width: (isMobile || isPreviewFullscreen) ? '100%' : `${previewWidth}px` }} className={`${isMobile ? (mobileActiveTab === 'preview' ? 'flex w-full absolute inset-0 z-30' : 'hidden') : 'flex relative'} bg-white flex-col shrink-0 ${isPreviewFullscreen || isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}>
            {!isPreviewFullscreen && !isMobile && <div className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingPreview(true)} />}
            {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
            <div className="h-[35px] bg-gray-100 dark:bg-[#252526] border-b border-gray-300 dark:border-[#3c3c3c] flex items-center px-3 shrink-0 text-gray-800 dark:text-[#cccccc] transition-colors">
              <div className="text-[11px] font-bold tracking-[0.08em] uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-[#007acc]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                 PREVIEW
              </div>
              
              {!isMobile && (
                <div className="ml-auto flex gap-1">
                   <svg onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)} className="w-6 h-6 p-1 cursor-pointer hover:bg-black/5 dark:hover:bg-[#2a2d2e] rounded text-gray-500 dark:text-[#858585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{isPreviewFullscreen ? <polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/> : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>}</svg>
                   <svg onClick={() => { setIsPreviewOpen(false); setIsPreviewFullscreen(false); }} className="w-6 h-6 p-1 cursor-pointer hover:bg-black/5 dark:hover:bg-[#2a2d2e] rounded text-gray-500 dark:text-[#858585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
              )}
            </div>
            <iframe srcDoc={previewContent} className="flex-1 w-full border-none bg-white" title="preview" sandbox="allow-scripts allow-same-origin allow-modals"></iframe>
          </div>
        )}
      </div>

{/* Footer Area: Status Bar (Responsive) */}
      <div className="h-[22px] bg-[#3c3c3c] flex items-center px-2 text-xs text-white select-none shrink-0 z-50">
        
        {/* Hidden on mobile, visible on desktop */}
        <div className="hidden md:flex items-center h-full px-2 cursor-pointer hover:bg-white/15 gap-1.5 opacity-90 text-[11px] tracking-wide">
           {getActiveFilePath()}
        </div>

        <div className="ml-auto flex items-center h-full">
           {/* Visible on both mobile and desktop */}
           <div className="px-2 h-full flex items-center cursor-pointer hover:bg-white/15">
             Ln {activeFile?.content ? activeFile.content.split('\n').length : 0}, Ch {activeFile?.content ? activeFile.content.length : 0}
           </div>
           
           {/* Hidden on mobile, visible on desktop */}
           <div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-white/15">UTF-8</div>
           <div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-white/15">{activeFile?.language?.toUpperCase() || 'TEXT'}</div>
        </div>
      </div>
    </div>
  );
}