// src/components/compiler/EditorArea.tsx
import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { search } from '@codemirror/search'; 

// --------------------------------------------------------
// 1. INDIVIDUAL TAB EDITOR (Virtualization for 10k+ lines)
// --------------------------------------------------------
function VirtualizedEditor({ file, isDarkMode, settings, onChange, isActive }: any) {
  
  // Map file extensions to CM6 language parsers
  const getLanguageExtension = (lang: string) => {
    switch(lang) {
      case 'html': return html();
      case 'css': return css();
      case 'python': return python();
      default: return javascript();
    }
  };

  // Strip down CM6 to feel like a raw textarea
  const minimalTheme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: `${settings?.fontSize || 14}px`,
      backgroundColor: "transparent !important", 
    },
    ".cm-content": {
      fontFamily: "monospace",
      padding: "8px 12px 12px 6px",
    },
    ".cm-scroller": {
      overflow: "auto !important",
      height: "100% !important",
      fontFamily: "monospace",
    },
    // Hide all the noisy IDE visual elements
    ".cm-activeLine": { backgroundColor: "transparent !important" },
    ".cm-activeLineGutter": { backgroundColor: "transparent !important" },
    ".cm-gutters": {
      backgroundColor: "transparent !important",
      borderRight: `1px solid ${isDarkMode ? "#3c3c3c" : "#e5e7eb"} !important`, 
      color: isDarkMode ? "#858585" : "#6b7280",
      position: "static !important", 
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 8px !important", 
    }
  });

  const extensions = [
    getLanguageExtension(file.language),
    minimalTheme,
    search({ top: true }), 
    ...(settings?.wordWrap ? [EditorView.lineWrapping] : [])
  ];

  return (
    <div 
      style={{ display: isActive ? 'block' : 'none' }} 
      className="absolute inset-0 overflow-hidden bg-white dark:bg-[#1e1e1e] mobile-editor-wrapper"
    >
      <CodeMirror
        className="h-full w-full"
        value={file.content || ''}
        height="100%"
        theme={isDarkMode ? 'dark' : 'light'}
        extensions={extensions}
        onChange={(val) => onChange(val, file.id)}
        // Turn off heavy IDE features to keep it lightweight
        basicSetup={{
          lineNumbers: settings?.showGutter,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          autocompletion: false, 
        }}
      />
    </div>
  );
}

// --------------------------------------------------------
// 2. MAIN WORKSPACE COMPONENT
// --------------------------------------------------------
export default function EditorArea({ 
  isDarkMode, isMobile, mobileActiveTab,
  activeFileId, setActiveFileId, openFileIds, setOpenFileIds, files, setFiles,
  isConsoleOpen, setIsConsoleOpen, isConsoleFullscreen, setIsConsoleFullscreen,
  logs, showConsole = true, editorSettings 
}: any) {
  
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [isResizingConsole, setIsResizingConsole] = useState(false);

  useEffect(() => {
    if (!isResizingConsole) return;
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => setConsoleHeight(prev => Math.max(35, prev - e.movementY));
    const handleMouseUp = () => {
      document.body.style.userSelect = '';
      setIsResizingConsole(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingConsole]);

  const handleCodeChange = (newValue: string, fileId: string) => {
    setFiles((prev: any) => prev.map((f: any) => f.id === fileId ? { ...f, content: newValue } : f));
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
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors min-w-0 min-h-0">
      
      <style>{`
        /* 1. Mobile Constraints */
        .mobile-editor-wrapper {
          -webkit-tap-highlight-color: transparent !important;
        }
        .cm-content {
          -webkit-user-select: text !important;
          user-select: text !important;
        }

        /* 2. Custom Scrollbars */
        .cm-scroller {
          scrollbar-width: auto;
          scrollbar-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.2) transparent' : 'rgba(0, 0, 0, 0.2) transparent'};
        }
        .cm-scroller::-webkit-scrollbar { width: 14px; height: 14px; }
        .cm-scroller::-webkit-scrollbar-track { background: transparent; }
        .cm-scroller::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border: 4px solid transparent; background-clip: padding-box; border-radius: 8px;
        }
        .cm-scroller::-webkit-scrollbar-thumb:hover { background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}; }
        .cm-scroller::-webkit-scrollbar-corner { background: transparent; }

        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }

        /* 🟢 4. SQUARE-STYLE VS CODE SEARCH WIDGET */
        .cm-panels { background-color: transparent !important; }
        .cm-panels-top { border-bottom: none !important; }
        
        .cm-search {
          display: block !important; 
          position: absolute !important;
          top: 12px !important;
          right: 28px !important; 
          z-index: 100;
          background-color: ${isDarkMode ? '#252526' : '#ffffff'} !important;
          border: 1px solid ${isDarkMode ? '#454545' : '#cccccc'} !important;
          border-radius: 6px !important;
          padding: 12px 36px 12px 16px !important; 
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          font-family: system-ui, -apple-system, sans-serif;
          color: ${isDarkMode ? '#cccccc' : '#333333'};
          width: 320px !important; 
          max-width: calc(100vw - 40px) !important;
        }

        .cm-search br { display: none !important; }

        /* ROW 1: Inputs */
        .cm-search input[type="text"], .cm-search input.cm-textfield {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          background-color: ${isDarkMode ? '#3c3c3c' : '#f3f4f6'} !important;
          border: 1px solid ${isDarkMode ? '#555' : '#ccc'} !important;
          color: ${isDarkMode ? '#fff' : '#000'} !important;
          border-radius: 4px;
          padding: 6px 10px;
          margin: 0 0 8px 0 !important;
          outline: none;
          font-size: 13px;
          transition: border-color 0.2s;
        }
        .cm-search input.cm-textfield:focus {
          border-color: #007acc !important;
        }

        /* Buttons Global */
        .cm-search button {
          appearance: none !important;
          background-color: ${isDarkMode ? '#333333' : '#f8f9fa'} !important;
          border: 1px solid ${isDarkMode ? '#555' : '#ccc'} !important;
          color: ${isDarkMode ? '#ccc' : '#333'} !important;
          border-radius: 4px;
          padding: 5px 12px;
          cursor: pointer;
          text-transform: capitalize;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .cm-search button:hover {
          background-color: ${isDarkMode ? '#444' : '#e5e7eb'} !important;
          color: ${isDarkMode ? '#fff' : '#000'} !important;
        }

        /* ROW 1.5: Find Buttons */
        .cm-search button[name="next"],
        .cm-search button[name="prev"],
        .cm-search button[name="select"] {
          display: inline-block !important;
          margin: 0 6px 12px 0 !important;
        }

        /* ROW 2: Checkboxes */
        .cm-search label {
          display: inline-flex !important;
          align-items: center;
          gap: 4px;
          margin: 0 10px 12px 0 !important;
          cursor: pointer;
          font-size: 12px;
          color: ${isDarkMode ? '#bbb' : '#555'};
        }
        .cm-search label:hover { color: ${isDarkMode ? '#ddd' : '#333'}; }
        .cm-search label input[type="checkbox"] {
          margin: 0;
          width: 14px;
          height: 14px;
          accent-color: #007acc;
          cursor: pointer;
        }

        /* ROW 3.5: Replace Buttons */
        .cm-search button[name="replace"],
        .cm-search button[name="replaceAll"] {
          display: inline-block !important;
          margin: 0 6px 0 0 !important;
        }

        /* The Close (X) Button */
        .cm-search button[name="close"] {
          position: absolute !important;
          top: 6px !important;
          right: 6px !important;
          width: 26px !important;
          height: 26px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
          font-size: 20px !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: ${isDarkMode ? '#858585' : '#888'} !important;
        }
        .cm-search button[name="close"]:hover {
          background-color: ${isDarkMode ? '#444' : '#e5e7eb'} !important;
          color: ${isDarkMode ? '#fff' : '#000'} !important;
          border-radius: 4px !important;
        }
      `}</style>
      
      <div className={`${(isMobile && mobileActiveTab === 'console') || isConsoleFullscreen ? 'hidden' : 'flex flex-col flex-1'} overflow-hidden min-w-0 min-h-0`}>
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-end overflow-x-auto shrink-0 border-b border-gray-300 dark:border-[#252526] scrollbar-hide transition-colors">
          {openTabs.map((file: any) => (
            <div key={file.id} title={file.name} onClick={() => setActiveFileId(file.id)} 
              className={`h-[35px] px-3.5 flex items-center gap-2 text-[13px] cursor-pointer select-none border-r border-gray-300 dark:border-r-[#252526] transition-colors group max-w-[200px] shrink-0 ${
                activeFileId === file.id 
                ? 'bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-[#d4d4d4] border-t-2 border-t-[#007acc] dark:border-t-[#007acc]' 
                : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-600 dark:text-[#9d9d9d] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] border-t-2 border-t-transparent dark:border-t-transparent'
              }`}
            >
                <span className="truncate block">{file.name}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 relative bg-white dark:bg-[#1e1e1e] min-w-0 min-h-0">
          {openTabs.length > 0 ? (
            openTabs.map((file: any) => (
              <VirtualizedEditor 
                key={`${file.id}-wrap:${editorSettings.wordWrap}-gutter:${editorSettings.showGutter}`}
                file={file} 
                isActive={activeFileId === file.id} 
                isDarkMode={isDarkMode} 
                settings={editorSettings} 
                onChange={handleCodeChange} 
              />
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-[#3c3c3c]">
              <svg viewBox="0 0 24 24" fill="none" className="w-32 h-32 mb-4 opacity-30"><path d="M17.5 2L9.5 10.5L4 6.5L1 8L5 12L1 16L4 17.5L9.5 13.5L17.5 22L23 19.5V4.5L17.5 2Z" fill="currentColor"/><path d="M17.5 7.5V16.5L11 12L17.5 7.5Z" fill="currentColor"/></svg>
            </div>
          )}
        </div>
      </div>

      {showConsole && (isConsoleOpen || (isMobile && mobileActiveTab === 'console')) && (
        <div style={{ height: (isConsoleFullscreen || isMobile) ? '100%' : `${consoleHeight}px` }} 
             className={`${(isMobile && mobileActiveTab !== 'console') ? 'hidden' : 'flex'} flex-col bg-gray-50 dark:bg-[#1e1e1e] shrink-0 relative transition-colors`}>
          
          {!isConsoleFullscreen && !isMobile && <div className="absolute left-0 right-0 top-[-2px] h-1.5 cursor-row-resize hover:bg-[#007acc] z-20" onMouseDown={() => setIsResizingConsole(true)} />}
          {isResizingConsole && <div className="fixed inset-0 z-[9999] cursor-row-resize" />}

          <div className="h-[35px] flex items-center border-b border-gray-300 dark:border-[#3c3c3c] px-2 bg-gray-100 dark:bg-[#252526] transition-colors shrink-0">
            <div className="px-3 h-full flex items-center text-xs cursor-pointer text-gray-800 dark:text-[#cccccc] border-b border-[#007acc]">CONSOLE</div>
            
            {!isMobile && (
              <div className="ml-auto flex gap-1 text-gray-500 dark:text-[#858585]">
                <svg onClick={() => setIsConsoleFullscreen(!isConsoleFullscreen)} className="w-6 h-6 p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2d2e] rounded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isConsoleFullscreen ? (
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  ) : (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  )}
                </svg>
                <svg onClick={() => { setIsConsoleOpen(false); setIsConsoleFullscreen(false); }} className="w-6 h-6 p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2d2e] rounded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-3 font-mono text-[13px] overflow-auto text-gray-800 dark:text-[#cccccc] bg-white dark:bg-[#1e1e1e] pb-[env(safe-area-inset-bottom)] custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-gray-400 dark:text-[#858585] italic opacity-80">Console is empty. Click 'Run' to execute code...</div>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className={`mb-1 py-0.5 border-b border-transparent ${log.method === 'error' ? 'text-red-600 bg-red-50 dark:bg-[#f48771]/10 px-2 -mx-2' : log.method === 'warn' ? 'text-yellow-700 bg-yellow-50 dark:bg-[#cca700]/10 px-2 -mx-2' : 'text-gray-800 dark:text-[#cccccc]'}`}>
                  <span className="text-gray-400 text-[11px] mr-3 select-none">[{log.time}]</span><span className="break-all">{log.data}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}