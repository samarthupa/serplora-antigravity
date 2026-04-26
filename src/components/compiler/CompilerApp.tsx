import React, { useState, useEffect, useRef } from 'react';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import AceEditorArea from './AceEditorArea';

export default function CompilerApp({ title, initialFiles }: any) {
  const compilerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null); 
  
  // Reference specifically for the isolated Editor + Preview area
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

  // Modals & Sharing States
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);

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

  // Check for shared URL hash on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const loadSharedData = async () => {
      setIsLoadingShared(true);
      try {
        const response = await fetch(`https://api.serplora.com/share-compilers?id=${hash}`);
        if (!response.ok) throw new Error("Not found");
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
           setFiles(data);
           // Find the first actual file (not a folder) to set as active
           const firstFile = data.find((f: any) => !f.isFolder);
           if (firstFile) {
             setActiveFileId(firstFile.id);
             setOpenFileIds([firstFile.id]);
           }
        }
      } catch (error) {
        alert("Could not load the shared code snippet. It may have expired or been removed.");
        window.history.replaceState(null, '', window.location.pathname);
      } finally {
        setIsLoadingShared(false);
      }
    };

    loadSharedData();
  }, []);

  // Resize calculation for Editor vs Preview
  useEffect(() => {
    if (!isResizingPreview) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPreviewWidth(prev => {
        const containerWidth = splitViewRef.current?.getBoundingClientRect().width || window.innerWidth;
        const maxAllowedWidth = containerWidth - 10; 

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

  // Prevent accidental refresh/close if real code changes were made
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasRealChanges = files.some((currentFile: any) => {
        const originalFile = initialFiles.find((f: any) => f.id === currentFile.id);
        if (!originalFile) return true; 
        if (currentFile.name !== originalFile.name) return true;
        const currentContent = currentFile.content?.trim() || '';
        const originalContent = originalFile.content?.trim() || '';
        if (currentContent !== originalContent) return true;
        return false;
      }) || files.length !== initialFiles.length; 

      if (hasRealChanges) {
        e.preventDefault();
        e.returnValue = ''; 
        return ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [files, initialFiles]);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const executeReset = () => {
    setFiles(initialFiles);
    setActiveFileId(initialFiles[0]?.id);
    setOpenFileIds(initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id));
    setProjectName(title || 'Workspace');
    setPreviewContent('');
    setLogs([]);
    setShowResetConfirm(false);

    if (isMobile) {
      setMobileActiveTab('editor');
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch("https://api.serplora.com/share-compilers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(files) 
      });

      if (!response.ok) throw new Error("Share failed");
      const { id } = await response.json();
      
      const newUrl = `${window.location.origin}${window.location.pathname}#${id}`;
      window.history.pushState({}, '', newUrl);
      setShareUrl(newUrl);
      setShowShareModal(true);
      setIsCopied(false);
    } catch (error) {
      alert("Failed to generate share link.");
      console.error(error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runCode = () => {
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
          <div onClick={!isSharing ? handleShare : undefined} className={`cursor-pointer p-1.5 transition-colors ${isSharing ? 'text-[#007acc] animate-pulse' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
            {isSharing ? (
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            )}
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
          <ActivityBar 
            activeView={activeView} 
            setActiveView={setActiveView} 
            isConsoleOpen={isConsoleOpen} 
            setIsConsoleOpen={setIsConsoleOpen} 
            handleReset={handleReset}
            handleShare={handleShare}
            isSharing={isSharing}
          />
        </div>

        <div className={`${isMobile ? (mobileActiveTab === 'files' ? 'flex absolute inset-0 w-full z-20' : 'hidden') : (activeView ? 'flex relative' : 'hidden')} bg-gray-50 dark:bg-[#252526]`}>
            <Sidebar projectName={projectName} setProjectName={setProjectName} activeView={isMobile ? 'explorer' : activeView} files={files} setFiles={setFiles} activeFileId={activeFileId} setActiveFileId={(id: string) => { setActiveFileId(id); if (isMobile) setMobileActiveTab('editor'); }} isMobile={isMobile} />
        </div>
        
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

      <div className="h-[22px] w-full bg-gray-200 dark:bg-[#3c3c3c] transition-colors flex items-center justify-between px-2 text-xs text-gray-700 dark:text-[#cccccc] select-none shrink-0 z-50">
        <div className="flex items-center h-full">
           <div className="px-2 h-full flex items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
             Ln {activeFile?.content ? activeFile.content.split('\n').length : 0}, Ch {activeFile?.content ? activeFile.content.length : 0}
           </div>
           <div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">UTF-8</div>
           <div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">{activeFile?.language?.toUpperCase() || 'TEXT'}</div>
        </div>

        {(isPreviewOpen || (isMobile && mobileActiveTab === 'preview')) && (
          <div className="flex items-center h-full">
             <div className="px-2 h-full flex items-center font-mono text-[11px] tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
               Preview: {previewDims.w}px × {previewDims.h}px
             </div>
          </div>
        )}
      </div>

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

      {showShareModal && (
        <div className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#3c3c3c] p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Share Workspace</h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="flex-1 bg-gray-50 dark:bg-[#3c3c3c] border border-gray-300 dark:border-[#555] text-gray-900 dark:text-white text-sm rounded px-3 py-2 outline-none focus:border-[#007acc]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={copyToClipboard}
                className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${isCopied ? 'bg-green-600' : 'bg-[#007acc] hover:bg-[#005f9e]'}`}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#3c3c3c] rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoadingShared && (
        <div className="absolute inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#1e1e1e]">
           <svg className="w-10 h-10 text-[#007acc] animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <div className="text-gray-600 dark:text-[#cccccc] font-medium tracking-wide">Loading Workspace...</div>
        </div>
      )}
    </div>
  );
}