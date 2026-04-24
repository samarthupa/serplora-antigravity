import React, { useState, useEffect } from 'react';
import ReactAce from 'react-ace';

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-tomorrow_night";
import "ace-builds/src-noconflict/theme-github";

export default function AceEditorArea({ 
  isDarkMode, 
  isMobile,
  mobileActiveTab,
  activeFile, files, setFiles, 
  activeFileId, setActiveFileId, 
  openFileIds, setOpenFileIds,
  isConsoleOpen, setIsConsoleOpen, 
  isConsoleFullscreen, setIsConsoleFullscreen,
  logs 
}: any) {
  
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [isResizingConsole, setIsResizingConsole] = useState(false);

  useEffect(() => {
    if (!isResizingConsole) return;
    const handleMouseMove = (e: MouseEvent) => setConsoleHeight(prev => Math.max(35, prev - e.movementY));
    const handleMouseUp = () => setIsResizingConsole(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingConsole]);

  const handleCodeChange = (newValue: string, fileId: string) => {
    setFiles((prevFiles: any) => 
      prevFiles.map((file: any) => 
        file.id === fileId ? { ...file, content: newValue } : file
      )
    );
  };

  const handleCloseTab = (e: any, fileId: string) => {
    e.stopPropagation(); 
    const newOpenFiles = openFileIds.filter((id: string) => id !== fileId);
    setOpenFileIds(newOpenFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const openTabs = openFileIds.map((id: string) => files.find((f: any) => f.id === id)).filter(Boolean);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors">

      {/*
        FIX: Ace gutter line numbers are rendered by the ace library and not
        reachable via Tailwind. Scoped CSS overrides inject passing contrast
        values directly onto #ace-editor's gutter cells.

        Light (github theme):  gutter bg ≈ #f0f0f0 → #57606a gives ~5.4:1 ✓
        Dark (tomorrow_night): gutter bg ≈ #25282c → #9d9d9d gives ~5.2:1 ✓

        The active-line cell gets the full foreground color for even stronger
        contrast since it is the most visually prominent number.
      */}
      <style>{`
        #ace-editor .ace_gutter-cell {
          color: ${isDarkMode ? '#9d9d9d' : '#57606a'};
        }
        #ace-editor .ace_gutter-active-line.ace_gutter-cell {
          color: ${isDarkMode ? '#cccccc' : '#24292f'};
        }

        /* 📱 Mobile Slim Gutter Overrides - Compact Mode */
        .mobile-slim-gutter .ace_gutter,
        .mobile-slim-gutter .ace_gutter-layer {
          width: 34px !important;
          min-width: 34px !important;
        }
        .mobile-slim-gutter .ace_scroller {
          left: 34px !important;
        }
        .mobile-slim-gutter .ace_gutter-cell {
          padding-left: 4px !important;
          padding-right: 12px !important;
          font-size: 11px !important;
          color: ${isDarkMode ? '#858585' : '#888888'} !important;
        }

        /* 🟢 Hides the horizontal scrollbar ONLY for the file tabs */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;             /* Chrome, Safari, and Opera */
        }
      `}</style>
      
      {/* EDITOR SECTION */}
      <div className={`${(isMobile && mobileActiveTab === 'console') || isConsoleFullscreen ? 'hidden' : 'flex flex-col flex-1'} overflow-hidden`}>
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-end overflow-x-auto shrink-0 border-b border-gray-300 dark:border-[#252526] scrollbar-hide transition-colors">
          {openTabs.map((file: any) => (
            <div 
              key={file.id} 
              title={file.name}
              onClick={() => setActiveFileId(file.id)} 
              className={`h-[35px] px-3.5 flex items-center gap-2 text-[13px] cursor-pointer select-none border-r border-gray-300 dark:border-[#252526] transition-colors group max-w-[200px] shrink-0 ${
                activeFileId === file.id
                  // Active tab: high-contrast foreground, no change needed
                  ? 'bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-[#d4d4d4] border-t border-t-[#007acc]'
                  // FIX: Inactive tab was text-gray-500 (~3.7:1) on bg-gray-100.
                  //      text-gray-600 (#4b5563) on bg-gray-100 (#f3f4f6) → ~5.9:1 ✓
                  //      dark:text-[#858585] (~3.5:1) on #2d2d2d.
                  //      dark:text-[#9d9d9d] on #2d2d2d → ~5.2:1 ✓
                  : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-600 dark:text-[#9d9d9d] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] border-t border-t-transparent'
              }`}
            >
                <span className="truncate block">{file.name}</span>
                <div onClick={(e) => handleCloseTab(e, file.id)} className={`w-5 h-5 shrink-0 rounded-[3px] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all ${activeFileId === file.id ? 'opacity-100' : ''}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5"/></svg>
                </div>
            </div>
          ))}
        </div>


        <div className="flex-1 relative bg-white dark:bg-[#1e1e1e]">
          {/* 🌟 4. Editor Memory: Render all open tabs but hide inactive ones */}
          {openTabs.length > 0 ? (
            openTabs.map((tabFile: any) => (
              <div 
                key={tabFile.id} 
                className="absolute inset-0"
                style={{ display: activeFileId === tabFile.id ? 'block' : 'none' }}
              >
                <ReactAce
                  mode={tabFile.language || 'javascript'}
                  theme={isDarkMode ? "tomorrow_night" : "github"}
                  onChange={(val) => handleCodeChange(val, tabFile.id)}
                  value={tabFile.content}
                  name={`ace-editor-${tabFile.id}`}
                  width="100%"
                  height="100%"
                  showPrintMargin={false}
                  className={isMobile ? 'mobile-slim-gutter' : ''}
                  setOptions={{ 
                    fontSize: 14, 
                    showLineNumbers: true,  /* 🟢 MUST BE TRUE: Keeps numbers and fold widgets alive */
                    showGutter: true, 
                    showFoldWidgets: true, 
                    tabSize: 2, 
                    useWorker: false 
                  }}
                  style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }}
                  commands={[
                    {
                      name: 'saveFile',
                      bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
                      exec: () => { alert("File saved!"); }
                    }
                  ]}
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-[#3c3c3c]">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 mb-4 opacity-30"><path d="M17.5 2L9.5 10.5L4 6.5L1 8L5 12L1 16L4 17.5L9.5 13.5L17.5 22L23 19.5V4.5L17.5 2Z" fill="currentColor"/><path d="M17.5 7.5V16.5L11 12L17.5 7.5Z" fill="currentColor"/></svg>
            </div>
          )}
        </div>
      </div>

     {/* CONSOLE SECTION */}
      {/* 🟢 Ensure the console renders if the mobile tab is active, bypassing the desktop toggle state */}
      {(isConsoleOpen || (isMobile && mobileActiveTab === 'console')) && (
        <div style={{ height: (isConsoleFullscreen || isMobile) ? '100%' : `${consoleHeight}px` }} 
             className={`${(isMobile && mobileActiveTab !== 'console') ? 'hidden' : 'flex'} flex-col bg-gray-50 dark:bg-[#1e1e1e] border-t border-gray-300 dark:border-[#3c3c3c] shrink-0 relative transition-colors`}>
          
          {!isConsoleFullscreen && !isMobile && <div className="absolute left-0 right-0 top-[-2px] h-1.5 cursor-row-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingConsole(true)} />}
          {isResizingConsole && <div className="fixed inset-0 z-[9999] cursor-row-resize" />}

          <div className="h-[35px] flex items-center border-b border-gray-300 dark:border-[#3c3c3c] px-2 bg-gray-100 dark:bg-[#252526] transition-colors shrink-0">
            <div className="px-3 h-full flex items-center text-xs cursor-pointer text-gray-800 dark:text-[#cccccc] border-b border-[#007acc]">CONSOLE</div>
            
            {!isMobile && (
              <div className="ml-auto flex gap-1 text-gray-500 dark:text-[#858585]">
                <svg onClick={() => setIsConsoleFullscreen(!isConsoleFullscreen)} className="w-6 h-6 p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2d2e] rounded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{isConsoleFullscreen ? <polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/> : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>}</svg>
                <svg onClick={() => { setIsConsoleOpen(false); setIsConsoleFullscreen(false); }} className="w-6 h-6 p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2d2e] rounded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-3 font-mono text-[13px] overflow-auto text-gray-800 dark:text-[#cccccc] bg-white dark:bg-[#1e1e1e] transition-colors pb-[env(safe-area-inset-bottom)]">
            {logs.length === 0 ? (
              <div className="text-gray-400 dark:text-[#858585] italic opacity-80">Console is empty. Click 'Run' to execute code...</div>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className={`mb-1 py-0.5 border-b border-transparent ${
                  log.method === 'error' ? 'text-red-600 dark:text-[#f48771] bg-red-50 dark:bg-[#f48771]/10 border-b-red-200 dark:border-b-[#f48771]/20 px-2 -mx-2' : 
                  log.method === 'warn' ? 'text-yellow-700 dark:text-[#cca700] bg-yellow-50 dark:bg-[#cca700]/10 border-b-yellow-200 dark:border-b-[#cca700]/20 px-2 -mx-2' : 
                  'text-gray-800 dark:text-[#cccccc]'
                }`}>
                  <span className="text-gray-400 dark:text-[#858585] text-[11px] mr-3 select-none">[{log.time}]</span>
                  <span className="break-all">{log.data}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}