import React, { useState, useEffect, useRef } from 'react';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import AceEditorArea from './AceEditorArea';

export default function CompilerApp({ title, initialFiles }: any) {
  const compilerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null); 
  
  // 🟢 NEW: Reference specifically for the isolated Editor + Preview area
  const splitViewRef = useRef<HTMLDivElement>(null); 
  
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [mobileActiveTab, setMobileActiveTab] = useState<'files' | 'editor' | 'preview' | 'console'>('editor');

  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null); 
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [files, setFiles] = useState(initialFiles);
  const [activeFileId, setActiveFileId] = useState(initialFiles[0]?.id);
  const [openFileIds, setOpenFileIds] = useState<string[]>(
    initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id)
  );

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleFullscreen, setIsConsoleFullscreen] = useState(false);
  const [logs, setLogs] = useState<{method: string, data: string, time: string}[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [previewContent, setPreviewContent] = useState('');
  const [previewWidth, setPreviewWidth] = useState<number | string>('50%');
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  
  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });

  const [projectName, setProjectName] = useState(title || 'Workspace');
  const activeFile = files.find((f: any) => f.id === activeFileId);

  // 🛑 NEW: State for our custom reset confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getActiveFilePath = () => {
    if (!activeFile) return '';
    const path = [activeFile.name];
    let currentParentId = activeFile.parentId;
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
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

  // 🟢 FIXED: The math now calculates based ONLY on the isolated splitViewRef container.
  useEffect(() => {
    if (!isResizingPreview) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPreviewWidth(prev => {
        // Use the strict available space of the split container, not the whole app
        const containerWidth = splitViewRef.current?.getBoundingClientRect().width || window.innerWidth;
        const maxAllowedWidth = containerWidth - 10; 

        // Clamp the starting pixel width in case the sidebar was toggled
        let currentPixelWidth = typeof prev === 'string' 
            ? containerWidth / 2 
            : prev;
            
        currentPixelWidth = Math.min(currentPixelWidth, maxAllowedWidth);
        
        const newWidth = currentPixelWidth - e.movementX;
        
        return Math.min(maxAllowedWidth, Math.max(200, newWidth));
      });
    };
    const handleMouseUp = () => setIsResizingPreview(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPreview]);

  useEffect(() => {
    if (!previewRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setPreviewDims({
          w: Math.round(entries[0].contentRect.width),
          h: Math.round(entries[0].contentRect.height)
        });
      }
    });
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [isPreviewOpen, mobileActiveTab]);

  // 🛑 Prevent accidental refresh/close if real code changes were made
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 1. Check if any "real" changes exist
      const hasRealChanges = files.some((currentFile: any) => {
        const originalFile = initialFiles.find((f: any) => f.id === currentFile.id);
        
        // If a file was added that wasn't there originally
        if (!originalFile) return true; 

        // If the file was renamed
        if (currentFile.name !== originalFile.name) return true;

        // If the code content changed (using .trim() to ignore blank lines at the start/end)
        const currentContent = currentFile.content?.trim() || '';
        const originalContent = originalFile.content?.trim() || '';
        if (currentContent !== originalContent) return true;

        return false;
      }) || files.length !== initialFiles.length; // Also triggers if a file was deleted

      // 2. If changes exist, trigger the browser's native warning dialog
      if (hasRealChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for modern browsers like Chrome
        return ''; // Required for older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [files, initialFiles]);

  // 🛑 FIXED: Open custom modal instead of browser confirm
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  // 🛑 FIXED: Execute the actual reset logic
  const executeReset = () => {
    setFiles(initialFiles);
    setActiveFileId(initialFiles[0]?.id);
    setOpenFileIds(initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id));
    setProjectName(title || 'Workspace');
    setPreviewContent('');
    setLogs([]);
    setShowResetConfirm(false); // Hide the modal after resetting

    // 🟢 NEW: Instantly switch back to the editor view on mobile
    if (isMobile) {
      setMobileActiveTab('editor');
    }
  };

  const runCode = () => {
    // 🟢 FIXED: Try to run the currently active file first. 
    // If they are editing a .js or .css file, fallback to index.html or the first available HTML file.
    let htmlFile = null;
    
    if (activeFile && activeFile.name.endsWith('.html')) {
      htmlFile = activeFile;
    } else {
      htmlFile = files.find((f: any) => f.name === 'index.html') || files.find((f: any) => f.name.endsWith('.html'));
    }

    if (!htmlFile) {
      setLogs([{ method: 'error', data: 'No HTML file found to run.', time: new Date().toLocaleTimeString() }]);
      if (isMobile) setMobileActiveTab('console');
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFile.content, 'text/html');

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

    setLogs([]); 
    setPreviewContent("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
    setIsPreviewOpen(true);
    
    if (isMobile) setMobileActiveTab('preview');
  };

  useEffect(() => {
    // 🛑 Prevent auto-run on mobile devices
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const initTimer = setTimeout(() => {
      runCode();
    }, 150);
    return () => clearTimeout(initTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      className={`flex flex-col w-full overflow-hidden font-sans transition-colors bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-[#cccccc] ${
        isAppFullscreen 
          ? 'h-[100dvh] md:h-screen rounded-none border-none my-0 z-50 relative' 
          : 'h-[100dvh] my-0 rounded-none border border-gray-300 dark:border-[#3c3c3c] md:h-[calc(100vh-100px)] md:my-0 md:rounded-xl md:border md:border-gray-300 md:dark:border-[#3c3c3c] relative'
      }`}
    >
     <div className="h-[44px] md:h-[30px] bg-gray-200 dark:bg-[#3c3c3c] flex items-center select-none shrink-0 transition-colors">
        
        <div className="flex md:hidden items-center justify-between flex-1 px-1">
          {/* 🟢 FIXED: Toggle mobile active tab logic + SVG path */}
          <div onClick={() => setMobileActiveTab(prev => prev === 'files' ? 'editor' : 'files')} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'files' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div onClick={() => setMobileActiveTab('editor')} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'editor' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div onClick={runCode} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'preview' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5 pl-0.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polygon points="5 3 19 12 5 21"/>
</svg>
          </div>
          <div onClick={() => setMobileActiveTab('console')} className={`relative cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'console' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8"/></svg>
             {logs.length > 0 && <span className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-[#f48771] border border-gray-200 dark:border-[#3c3c3c]"></span>}
          </div>
          <div onClick={handleReset} className="cursor-pointer p-1.5 text-gray-600 dark:text-[#9d9d9d] transition-colors">
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </div>
          <div className="cursor-pointer p-1.5 text-gray-600 dark:text-[#9d9d9d] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
</svg>
          </div>
          <div onClick={toggleFullscreen} className="cursor-pointer p-1.5 text-gray-600 dark:text-[#9d9d9d] transition-colors">
             {isAppFullscreen ? (
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/></svg>
             ) : (
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
             )}
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center flex-1 text-sm font-normal text-gray-500 dark:text-[#858585]">
          {getActiveFilePath()}
        </div>

        <div className="hidden md:flex h-full items-center pr-2 gap-2 md:gap-1">
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
        <div className="hidden md:flex">
          <ActivityBar activeView={activeView} setActiveView={setActiveView} isConsoleOpen={isConsoleOpen} setIsConsoleOpen={setIsConsoleOpen} handleReset={handleReset}/>
        </div>

        <div className={`${isMobile ? (mobileActiveTab === 'files' ? 'flex absolute inset-0 w-full z-20' : 'hidden') : (activeView ? 'flex relative' : 'hidden')} bg-gray-50 dark:bg-[#252526]`}>
            <Sidebar projectName={projectName} setProjectName={setProjectName} activeView={isMobile ? 'explorer' : activeView} files={files} setFiles={setFiles} activeFileId={activeFileId} setActiveFileId={(id: string) => { setActiveFileId(id); if (isMobile) setMobileActiveTab('editor'); }} isMobile={isMobile} />
        </div>
        
        {/* 🟢 FIXED: Wrapped the Editor and Preview cleanly so they know exactly how much space they have to share */}
        <div ref={splitViewRef} className="flex flex-1 overflow-hidden relative">
            <div className={`${isMobile ? ((mobileActiveTab === 'editor' || mobileActiveTab === 'console') ? 'flex w-full absolute inset-0 z-10' : 'hidden') : 'flex flex-1 relative'} overflow-hidden`}>
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
            </div>

            {(isPreviewOpen || (isMobile && mobileActiveTab === 'preview')) && (
              <div 
                ref={previewRef}
                style={{ 
                  width: isMobile ? '100%' : (typeof previewWidth === 'number' ? `${previewWidth}px` : previewWidth),
                  // The max-width prevents the preview from breaking out of bounds when the sidebar opens
                  maxWidth: isMobile ? '100%' : 'calc(100% - 10px)' 
                }} 
                className={`${isMobile ? (mobileActiveTab === 'preview' ? 'flex w-full absolute inset-0 z-30' : 'hidden') : 'flex relative'} bg-white flex-col shrink-0 ${isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}
              >
                {!isMobile && <div className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingPreview(true)} />}
                {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
                                
                <iframe 
                  srcDoc={previewContent} 
                  className="flex-1 w-full border-none bg-white" 
                  title="preview" 
                  sandbox="allow-scripts allow-same-origin allow-modals"
                  style={{ pointerEvents: isResizingPreview ? 'none' : 'auto' }}
                ></iframe>
              </div>
            )}
        </div>
      </div>

     {/* 🟢 FIXED: Added w-full and justify-between to split left/right sides */}
      <div className="h-[22px] w-full bg-gray-200 dark:bg-[#3c3c3c] transition-colors flex items-center justify-between px-2 text-xs text-gray-700 dark:text-[#cccccc] select-none shrink-0 z-50">
        
        {/* Left Side: Editor Info */}
        <div className="flex items-center h-full">
           <div className="px-2 h-full flex items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
             Ln {activeFile?.content ? activeFile.content.split('\n').length : 0}, Ch {activeFile?.content ? activeFile.content.length : 0}
           </div>
           <div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">UTF-8</div>
           <div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">{activeFile?.language?.toUpperCase() || 'TEXT'}</div>
        </div>

        {/* 🟢 Right Side: Preview Dimensions (Only shows when preview is active) */}
        {(isPreviewOpen || (isMobile && mobileActiveTab === 'preview')) && (
          <div className="flex items-center h-full">
             <div className="px-2 h-full flex items-center font-mono text-[11px] tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
               Preview: {previewDims.w}px × {previewDims.h}px
             </div>
          </div>
        )}
      </div>

      {/* 🛑 CUSTOM RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#3c3c3c] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reset Compiler?</h3>
            <p className="text-sm text-gray-600 dark:text-[#cccccc] mb-6">
              Are you sure you want to reset the compiler? All your unsaved changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#3c3c3c] rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeReset} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}