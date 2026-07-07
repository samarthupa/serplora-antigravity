import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import EditorArea from './EditorArea';
import SettingsOverlay from './SettingsOverlay';
import DownloadModal from './DownloadModal';

const CompilerShell = forwardRef(({ 
  title, 
  initialFiles,
  onRun, 
  isRunning, 
  OutputPane, 
  editorConsoleLogs = [], 
  showConsole = true,
  onAbort,
  cooldownDuration = 0, 
  allowReRunWithoutEdit = false
}: any, ref) => {
  const compilerRef = useRef<HTMLDivElement>(null);
  const splitViewRef = useRef<HTMLDivElement>(null); 
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  // 🟢 Removed 'files' from mobile tabs
  const [mobileActiveTab, setMobileActiveTab] = useState<'editor' | 'preview' | 'console'>('editor');

  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null); 
  const [isDarkMode, setIsDarkMode] = useState(true);

  const deepClone = (items: any[]) => structuredClone(items);

  const [files, setFiles] = useState(() => deepClone(initialFiles));
  const [activeFileId, setActiveFileId] = useState(initialFiles[0]?.id);
  const [openFileIds, setOpenFileIds] = useState<string[]>(
    initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id)
  );

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleFullscreen, setIsConsoleFullscreen] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [previewWidth, setPreviewWidth] = useState<number | string>('50%');
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });

  const [projectName, setProjectName] = useState(title || 'Workspace');
  const activeFile = files.find((f: any) => f.id === activeFileId);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  const [isCooldown, setIsCooldown] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('serplora_editor_settings');
      if (saved) {
        let parsed = JSON.parse(saved);
        
        // 🟢 SANITIZE BROKEN CACHE: Force mutual exclusivity 
        if (parsed.wordWrap && parsed.showGutter) {
          parsed.showGutter = false; // Prioritize word wrap over line numbers if corrupted
        }
        return parsed;
      }
    }
    // Fallback defaults
    return {
      fontSize: 14,
      wordWrap: false,
      showGutter: false
    };
  });

  const saveSettings = (newSettings: any) => {
    setEditorSettings(newSettings);
    localStorage.setItem('serplora_editor_settings', JSON.stringify(newSettings));
  };

  const [runHistory, setRunHistory] = useState<{ [fileId: string]: string }>({});
  const [lastSharedState, setLastSharedState] = useState<{ fingerprint: string, url: string } | null>(null);

  useImperativeHandle(ref, () => ({
    clearCacheForFile: (fileId: string) => {
      setRunHistory(prev => {
        const newHistory = { ...prev };
        delete newHistory[fileId];
        return newHistory;
      });
    }
  }));

  const generateCodeFingerprint = (targetFiles: any[], active: any) => {
    if (active && (active.name.endsWith('.py') || active.language === 'python')) {
      return `${active.id}:${active.content?.trim() || ''}`;
    }
    
    return targetFiles
      .filter((f: any) => !f.isFolder)
      .sort((a: any, b: any) => a.id.localeCompare(b.id))
      .map((f: any) => `${f.name}:${f.content?.trim() || ''}`)
      .join('|');
  };

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
        if (mutation.attributeName === 'class') setIsDarkMode(document.documentElement.classList.contains('dark'));
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
           const allFileIds = data.filter((f: any) => !f.isFolder).map((f: any) => f.id);
           setOpenFileIds(allFileIds);
           const firstFile = data.find((f: any) => !f.isFolder);
           if (firstFile) setActiveFileId(firstFile.id);
        }
      } catch (error) {
        alert("Could not load the shared code snippet.");
        window.history.replaceState(null, '', window.location.pathname);
      } finally {
        setIsLoadingShared(false);
      }
    };
    loadSharedData();
  }, []);

  useEffect(() => {
    if (!isResizingPreview) return;
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => {
      setPreviewWidth(prev => {
        const containerWidth = splitViewRef.current?.getBoundingClientRect().width || window.innerWidth;
        const maxAllowedWidth = containerWidth - 10; 
        let currentPixelWidth = typeof prev === 'string' ? containerWidth / 2 : prev;
        currentPixelWidth = Math.min(currentPixelWidth, maxAllowedWidth);
        const newWidth = currentPixelWidth - e.movementX;
        return Math.min(maxAllowedWidth, Math.max(200, newWidth));
      });
    };
    const handleMouseUp = () => {
      document.body.style.userSelect = '';
      setIsResizingPreview(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.userSelect = '';
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const initialFingerprint = generateCodeFingerprint(initialFiles, null);
      const currentFingerprint = generateCodeFingerprint(files, null);
      if (initialFingerprint !== currentFingerprint) {
        e.preventDefault();
        e.returnValue = ''; 
        return ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [files, initialFiles]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('transfer') === 'true') {
      const transferredCode = localStorage.getItem('serplora_transfer_code');
      if (transferredCode) {
        setFiles((prevFiles: any[]) => {
          const newFiles = [...prevFiles];
          const targetIndex = newFiles.findIndex(f => !f.isFolder);
          if (targetIndex !== -1) {
            newFiles[targetIndex] = { ...newFiles[targetIndex], content: transferredCode };
          }
          return newFiles;
        });
        window.history.replaceState(null, '', window.location.pathname);
        localStorage.removeItem('serplora_transfer_code');
      }
    }
  }, []);

  const handleReset = () => setShowResetConfirm(true);

  const executeReset = () => {
    setFiles(deepClone(initialFiles)); 
    setActiveFileId(initialFiles[0]?.id);
    setOpenFileIds(initialFiles.filter((f: any) => !f.isFolder).map((f: any) => f.id));
    setProjectName(title || 'Workspace');
    setRunHistory({}); 
    setLastSharedState(null);
    setShowResetConfirm(false);
    window.history.replaceState(null, '', window.location.pathname);
    if (isMobile) setMobileActiveTab('editor');
  };

  const handleShare = async () => {
    const currentFingerprint = generateCodeFingerprint(files, null);
    if (lastSharedState && lastSharedState.fingerprint === currentFingerprint) {
      setShareUrl(lastSharedState.url);
      setShowShareModal(true);
      setIsSettingsOpen(false); 
      setIsCopied(false);
      return; 
    }
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
      setLastSharedState({ fingerprint: currentFingerprint, url: newUrl });
      window.history.pushState({}, '', newUrl);
      setShareUrl(newUrl);
      setShowShareModal(true);
      setIsSettingsOpen(false); 
      setIsCopied(false);
    } catch (error) {
      alert("Failed to generate share link.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleRun = async () => {
    if (cooldownDuration > 0) {
      if (isCooldown) return; 
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), cooldownDuration); 
    }

    const currentFingerprint = generateCodeFingerprint(files, activeFile);
    setIsPreviewOpen(true);
    if (isMobile) setMobileActiveTab('preview');
    if (!allowReRunWithoutEdit && runHistory[activeFileId] === currentFingerprint) {
      return; 
    }
    setRunHistory(prev => ({ ...prev, [activeFileId]: currentFingerprint }));
    if (onRun) {
      await onRun(files, activeFile);
    }
  };

  const handleAbortWrapper = () => {
    if (cooldownDuration > 0) {
      if (isCooldown) return; 
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), cooldownDuration); 
    }

    if (onAbort) onAbort();
    setRunHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[activeFileId];
      return newHistory;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('run-code-btn')?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      compilerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const layoutProps = {
    isMobile, mobileActiveTab, previewWidth, isResizingPreview, setIsResizingPreview, previewRef, activeFileId,
    // 🟢 PASS EXECUTION PROPS DOWN
    handleRun, handleAbortWrapper, isRunning, isCooldown, toggleFullscreen, isAppFullscreen
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div ref={compilerRef} className={`flex flex-col w-full h-full overflow-hidden font-sans transition-colors bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-[#cccccc] ${isAppFullscreen ? 'h-[100dvh] md:h-screen z-50 relative' : 'relative border-b border-gray-300 dark:border-[#3c3c3c]'}`}>
     {/* 🟢 CHANGED: Added md:hidden to completely remove the top strip on desktop */}
     <div className="h-[44px] md:hidden bg-gray-100 dark:bg-[#2d2d2d] flex items-center select-none shrink-0 transition-colors">
        <div className="flex md:hidden items-center justify-between flex-1 px-1">
          {/* 🟢 Removed Mobile Files Toggle Button entirely */}
          <div onClick={() => setMobileActiveTab('editor')} className={`cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'editor' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
          
          <div 
            onClick={() => {
              if (isCooldown) return;
              if (isRunning) {
                if (mobileActiveTab !== 'preview') {
                  setMobileActiveTab('preview'); 
                } else {
                  handleAbortWrapper(); 
                }
              } else {
                handleRun(); 
              }
            }} 
            className={`p-1.5 transition-colors ${isCooldown ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${mobileActiveTab === 'preview' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}
          >
            {isRunning ? (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>
            ) : (
              <svg className="w-5 h-5 pl-0.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21"/></svg>
            )}
          </div>

          {showConsole && (<div onClick={() => setMobileActiveTab('console')} className={`relative cursor-pointer p-1.5 transition-colors ${mobileActiveTab === 'console' ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8"/></svg>{editorConsoleLogs.length > 0 && <span className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-[#f48771] border border-gray-200 dark:border-[#3c3c3c]"></span>}</div>)}
          
          <div onClick={() => setIsDownloadOpen(!isDownloadOpen)} className={`cursor-pointer p-1.5 transition-colors ${isDownloadOpen ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          
          <div onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`cursor-pointer p-1.5 transition-colors ${isSettingsOpen ? 'text-[#007acc]' : 'text-gray-600 dark:text-[#9d9d9d]'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center flex-1 text-sm font-normal text-gray-500 dark:text-[#858585]">{getActiveFilePath()}</div>
        <div className="hidden md:flex h-full items-center pr-2 gap-2 md:gap-1">
          {isRunning ? <button id="abort-code-btn" onClick={handleAbortWrapper} disabled={isCooldown} className={`flex items-center gap-1.5 px-3 py-1.5 md:py-0.5 rounded transition-colors ${isCooldown ? 'opacity-50 cursor-not-allowed bg-red-600 text-white md:bg-transparent md:text-red-500' : 'bg-red-600 hover:bg-red-700 text-white md:bg-transparent md:text-red-500 md:hover:bg-red-500/10'}`} title="Stop"><svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg><span className="text-xs font-bold md:hidden tracking-wider">STOP</span></button> : <button id="run-code-btn" onClick={handleRun} disabled={isCooldown} className={`flex items-center gap-1.5 px-3 py-1.5 md:py-0.5 rounded transition-colors ${isCooldown ? 'opacity-50 cursor-not-allowed bg-green-700 text-white md:bg-transparent md:text-green-700 md:dark:text-[#89d185]' : 'bg-green-700 hover:bg-green-800 text-white md:bg-transparent md:text-green-700 md:dark:text-[#89d185] md:hover:bg-black/5 md:dark:hover:bg-white/10'}`} title="Run"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg><span className="text-xs font-bold md:hidden tracking-wider">RUN</span></button>}
          <div id="fullscreen-btn" onClick={toggleFullscreen} className="hidden md:flex w-7 h-6 items-center justify-center rounded cursor-pointer text-gray-500 dark:text-[#858585] hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-[#cccccc]" title={isAppFullscreen ? "Exit Fullscreen" : "Fullscreen"}>{isAppFullscreen ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>}</div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden relative border-t border-gray-300 dark:border-[#3c3c3c]">
        <div className="hidden md:flex">
          <ActivityBar 
             activeView={activeView} 
             setActiveView={setActiveView} 
             isConsoleOpen={isConsoleOpen} 
             setIsConsoleOpen={setIsConsoleOpen} 
             handleReset={handleReset} 
             handleShare={handleShare} 
             isSharing={isSharing} 
             showConsole={showConsole}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            isDownloadOpen={isDownloadOpen}
            setIsDownloadOpen={setIsDownloadOpen}
          />
        </div>
        
        {/* 🟢 Removed Mobile file explorer injection logic entirely */}
        <div className={`${isMobile ? 'hidden' : (activeView ? 'flex relative' : 'hidden')} bg-gray-50 dark:bg-[#252526]`}>
          <Sidebar projectName={projectName} setProjectName={setProjectName} activeView={activeView} files={files} setFiles={setFiles} activeFileId={activeFileId} setActiveFileId={(id: string) => setActiveFileId(id)} isMobile={isMobile} />
        </div>
        
        <div ref={splitViewRef} className="flex flex-1 overflow-hidden relative">
            <div className={`${isMobile ? ((mobileActiveTab === 'editor' || mobileActiveTab === 'console') ? 'flex w-full absolute inset-0 z-10' : 'hidden') : 'flex flex-1 relative'} overflow-hidden`}>
              <EditorArea 
                isDarkMode={isDarkMode} 
                isMobile={isMobile} 
                mobileActiveTab={mobileActiveTab} 
                activeFile={activeFile} 
                files={files} 
                setFiles={setFiles} 
                activeFileId={activeFileId} 
                setActiveFileId={setActiveFileId} 
                openFileIds={openFileIds} 
                setOpenFileIds={setOpenFileIds} 
                isConsoleOpen={isConsoleOpen} 
                setIsConsoleOpen={setIsConsoleOpen} 
                isConsoleFullscreen={isConsoleFullscreen} 
                setIsConsoleFullscreen={setIsConsoleFullscreen} 
                logs={editorConsoleLogs} 
                showConsole={showConsole}
                editorSettings={editorSettings}
              />
            </div>
            {OutputPane && OutputPane(layoutProps)}
        </div>
      </div>
      <div className="h-[22px] w-full bg-gray-100 dark:bg-[#2d2d2d] transition-colors flex items-center justify-between px-2 text-xs text-gray-700 dark:text-[#cccccc] select-none shrink-0 z-50">
        <div className="flex items-center h-full"><div className="px-2 h-full flex items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">Ln {activeFile?.content ? activeFile.content.split('\n').length : 0}, Ch {activeFile?.content ? activeFile.content.length : 0}</div><div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">UTF-8</div><div className="hidden md:flex px-2 h-full items-center cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">{activeFile?.language?.toUpperCase() || 'TEXT'}</div></div>
        {(isPreviewOpen || (isMobile && mobileActiveTab === 'preview')) && (<div className="flex items-center h-full"><div className="px-2 h-full flex items-center font-mono text-[11px] tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">Preview: {previewDims.w}px × {previewDims.h}px</div></div>)}
      </div>
      {showResetConfirm && (<div className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#3c3c3c] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200"><h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reset Compiler?</h3><p className="text-sm text-gray-600 dark:text-[#cccccc] mb-6">Are you sure you want to reset the compiler? All your unsaved changes will be lost.</p><div className="flex justify-end gap-3"><button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#3c3c3c] rounded transition-colors">Cancel</button><button onClick={executeReset} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm">Yes, Reset</button></div></div></div>)}
      {showShareModal && (<div className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#3c3c3c] p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200"><h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Share Workspace</h3><div className="flex gap-2 mb-6"><input type="text" readOnly value={shareUrl} className="flex-1 bg-gray-50 dark:bg-[#3c3c3c] border border-gray-300 dark:border-[#555] text-gray-900 dark:text-white text-sm rounded px-3 py-2 outline-none focus:border-[#007acc]" onClick={(e) => (e.target as HTMLInputElement).select()} /><button onClick={copyToClipboard} className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${isCopied ? 'bg-green-600' : 'bg-[#007acc] hover:bg-[#005f9e]'}`}>{isCopied ? 'Copied!' : 'Copy'}</button></div><div className="flex justify-end"><button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#3c3c3c] rounded transition-colors">Close</button></div></div></div>)}
      {isLoadingShared && (<div className="absolute inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#1e1e1e]"><svg className="w-10 h-10 text-[#007acc] animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><div className="text-gray-600 dark:text-[#cccccc] font-medium tracking-wide">Loading Workspace...</div></div>)}
      
      {isSettingsOpen && (
        <SettingsOverlay 
           isMobile={isMobile}
          currentSettings={editorSettings} 
           onSave={saveSettings} 
           onClose={() => setIsSettingsOpen(false)} 
           onReset={handleReset} 
           onShare={handleShare} 
           isSharing={isSharing} 
         />
      )}
      
      {isDownloadOpen && (
        <DownloadModal 
          files={files} 
          projectName={projectName} 
          onClose={() => setIsDownloadOpen(false)} 
        />
      )}
    </div>
  );
});

export default CompilerShell;