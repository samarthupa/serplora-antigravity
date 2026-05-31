// src/components/compiler/EditorArea.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CodeJar } from 'codejar';
import { withLineNumbers } from 'codejar-linenumbers';
import Prism from 'prismjs';

// Bundle syntax languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML

// --------------------------------------------------------
// 1. INDIVIDUAL TAB EDITOR (Preserves Native Undo/Redo)
// --------------------------------------------------------
function CodeJarEditor({ file, isDarkMode, settings, onChange, isActive }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const jarRef = useRef<any>(null);
  
  // Lock to prevent React from wiping the history stack on every keystroke
  const isTyping = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const highlight = (editor: HTMLElement) => {
      let lang = file.language || 'javascript';
      if (lang === 'html') lang = 'markup'; 
      const syntax = Prism.languages[lang] || Prism.languages.javascript;
      editor.innerHTML = Prism.highlight(editor.textContent || '', syntax, lang);
    };

    // Smart Toggle: Hide gutter completely if wordWrap is enabled
    const shouldShowGutter = settings?.showGutter && !settings?.wordWrap;

    const jar = CodeJar(
      editorRef.current,
      shouldShowGutter ? withLineNumbers(highlight) : highlight,
      { tab: '  ', history: true } 
    );
    jarRef.current = jar;

    jar.onUpdate((code: string) => {
      isTyping.current = true;
      onChange(code, file.id);
      setTimeout(() => { isTyping.current = false; }, 0);
    });
    
    jar.updateCode(file.content || '');

    return () => jar.destroy();
  }, [settings?.showGutter, settings?.wordWrap, file.language]);

  // Sync state if changed externally
  useEffect(() => {
    if (jarRef.current && !isTyping.current && file.content !== jarRef.current.toString()) {
      const pos = jarRef.current.save();
      jarRef.current.updateCode(file.content || '');
      jarRef.current.restore(pos);
    }
  }, [file.content]);

  return (
    <div style={{ display: isActive ? 'block' : 'none' }} className="absolute inset-0 overflow-auto bg-white dark:bg-[#1e1e1e] custom-scrollbar">
      <div
        ref={editorRef}
        style={{
          fontSize: `${settings?.fontSize || 14}px`,
          minHeight: '100%',
        }}
        // 🟢 NEW: Added the 'codejar-editor-core' class to force !important wrap rules
        className={`codejar-editor-core font-mono p-3 outline-none ${isDarkMode ? 'dark-theme text-[#cccccc]' : 'light-theme text-[#333333]'}`}
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
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors">
      
      <style>{`
        /* 1. CodeJar Line Number Layout */
        .codejar-wrap { 
          display: flex !important; 
          flex-direction: row !important; 
          min-height: 100%; 
          /* 🟢 NEW: Forces the wrapper to expand, activating the parent's horizontal scrollbar */
          ${!editorSettings?.wordWrap ? 'min-width: max-content !important;' : ''}
        }
        
        /* 2. The Code Editor Wrapper */
        .codejar-wrap > div:last-child { 
          flex: 1 1 auto !important; 
          min-width: 0 !important; 
          padding-left: 12px !important; 
        }

        /* 🟢 3. FORCE WORD WRAP RULES (Overrides CodeJar's hardcoded JS) */
        .codejar-editor-core {
          white-space: ${editorSettings?.wordWrap ? 'pre-wrap' : 'pre'} !important;
          overflow-wrap: ${editorSettings?.wordWrap ? 'anywhere' : 'normal'} !important;
        }

        /* 4. The Line Numbers Gutter */
        .codejar-linenumbers {
          font-family: monospace;
          padding-left: 10px !important; 
          padding-right: 10px !important; 
          border-right: 1px solid ${isDarkMode ? '#3c3c3c' : '#e5e7eb'} !important;
          background-color: ${isDarkMode ? '#1e1e1e' : '#ffffff'} !important;
          flex-shrink: 0 !important; 
          text-align: right !important;
          position: sticky !important; 
          left: 0 !important; 
          z-index: 10 !important;
        }

        /* OVERRIDE: Force the inner numbers to ignore the plugin's inline light gray style */
        .codejar-linenumber {
          color: ${isDarkMode ? '#858585' : '#6b7280'} !important;
        }

        /* PrismJS Themes */
        .light-theme .token.comment, .light-theme .token.doctype, .light-theme .token.cdata { color: #6a737d; font-style: italic; }
        .light-theme .token.punctuation { color: #24292e; }
        .light-theme .token.property, .light-theme .token.tag, .light-theme .token.boolean, .light-theme .token.number, .light-theme .token.constant { color: #005cc5; }
        .light-theme .token.selector, .light-theme .token.attr-name, .light-theme .token.string, .light-theme .token.builtin { color: #032f62; }
        .light-theme .token.operator, .light-theme .token.entity, .light-theme .token.url, .light-theme .token.keyword { color: #d73a49; }
        .light-theme .token.function, .light-theme .token.class-name { color: #6f42c1; }
        
        .dark-theme .token.comment, .dark-theme .token.doctype, .dark-theme .token.cdata { color: #999999; font-style: italic; }
        .dark-theme .token.punctuation { color: #cccccc; }
        .dark-theme .token.tag, .dark-theme .token.attr-name { color: #e2777a; }
        .dark-theme .token.function-name { color: #6196cc; }
        .dark-theme .token.boolean, .dark-theme .token.number, .dark-theme .token.function { color: #f08d49; }
        .dark-theme .token.property, .dark-theme .token.class-name, .dark-theme .token.constant { color: #f8c555; }
        .dark-theme .token.selector, .dark-theme .token.keyword, .dark-theme .token.builtin { color: #cc99cd; }
        .dark-theme .token.string, .dark-theme .token.attr-value, .dark-theme .token.variable { color: #7ec699; }
        .dark-theme .token.operator, .dark-theme .token.entity, .dark-theme .token.url { color: #67cdcc; }

        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      
      <div className={`${(isMobile && mobileActiveTab === 'console') || isConsoleFullscreen ? 'hidden' : 'flex flex-col flex-1'} overflow-hidden`}>
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

        <div className="flex-1 relative bg-white dark:bg-[#1e1e1e]">
          {openTabs.length > 0 ? (
            openTabs.map((file: any) => (
              <CodeJarEditor 
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
             className={`${(isMobile && mobileActiveTab !== 'console') ? 'hidden' : 'flex'} flex-col bg-gray-50 dark:bg-[#1e1e1e] border-t border-gray-300 dark:border-[#3c3c3c] shrink-0 relative transition-colors`}>
          
          {!isConsoleFullscreen && !isMobile && <div className="absolute left-0 right-0 top-[-2px] h-1.5 cursor-row-resize hover:bg-[#007acc] z-20" onMouseDown={() => setIsResizingConsole(true)} />}
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