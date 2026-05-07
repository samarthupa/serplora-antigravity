import React from 'react';

export default function ActivityBar({ activeView, setActiveView, isConsoleOpen, setIsConsoleOpen, handleReset, handleShare, isSharing, showConsole = true, isSettingsOpen, setIsSettingsOpen }: any) {    return (
    <div className="w-12 bg-gray-100 dark:bg-[#333333] flex flex-col items-center pt-1 shrink-0 border-r border-gray-300 dark:border-[#252526] transition-colors">
      
      {/* TOP SECTION */}
      <div className="flex flex-col items-center w-full">
        {/* Explorer Icon */}
        <div 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${activeView === 'explorer' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`}
          onClick={() => setActiveView(activeView === 'explorer' ? null : 'explorer')}
          title="Explorer"
        >
          {activeView === 'explorer' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M3 6h18M3 12h18M3 18h18"/>
            <rect x="2" y="3" width="20" height="18" rx="2" strokeWidth="1.5"/>
          </svg>
        </div>


        {/* ---> ADD THIS NEW SEARCH ICON <--- */}
        <div 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${activeView === 'search' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`}
          onClick={() => setActiveView(activeView === 'search' ? null : 'search')}
          title="Search"
        >
          {activeView === 'search' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>}
          <svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="w-5 h-5"
>
  <circle cx="11" cy="11" r="9"></circle>
  <line x1="18" y1="18" x2="23" y2="23"></line>
</svg>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="pb-2 flex flex-col items-center w-full">
        {/* Reset Icon */}
        <div className="w-12 h-12 flex items-center justify-center cursor-pointer text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]" title="Reset Compiler" onClick={handleReset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </div>

        {/* COMMAND PALETTE BUTTON */}
<div 
  onClick={() => window.dispatchEvent(new Event('open-ace-palette'))}
  className="flex items-center justify-center w-12 h-12 text-gray-500 dark:text-[#858585] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors relative group"
  title="Command Palette (F1)"
>
  {/* A classic 'terminal prompt' icon to represent commands */}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
    <line x1="6" y1="8" x2="6.01" y2="8"></line>
    <line x1="10" y1="8" x2="10.01" y2="8"></line>
    <line x1="14" y1="8" x2="14.01" y2="8"></line>
    <line x1="18" y1="8" x2="18.01" y2="8"></line>
    <line x1="8" y1="12" x2="8.01" y2="12"></line>
    <line x1="12" y1="12" x2="12.01" y2="12"></line>
    <line x1="16" y1="12" x2="16.01" y2="12"></line>
    <line x1="7" y1="16" x2="17" y2="16"></line>
  </svg>
</div>
        
        {/* Share Icon */}
        <div 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-colors ${isSharing ? 'text-[#007acc] animate-pulse' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`} 
          title="Share Workspace"
          onClick={!isSharing ? handleShare : undefined}
        >
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
        
        {/* Console Icon */}
        {showConsole && (
          <div 
            className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${isConsoleOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`} 
            title="Console" 
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          >
            {isConsoleOpen && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
          </div>
        )}
        
      </div>

      {/* Settings Icon */}
        <div 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors mt-auto mb-2 ${isSettingsOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`}
          title="Settings"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          {isSettingsOpen && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </div>
      
    </div>
  );
}