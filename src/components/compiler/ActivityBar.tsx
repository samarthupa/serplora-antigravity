import React from 'react';

export default function ActivityBar({ activeView, setActiveView, isConsoleOpen, setIsConsoleOpen, handleReset, handleShare, isSharing, showConsole = true, setShowSettingsModal }: any) {
    return (
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

        {/* Search Icon */}
        <div 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${activeView === 'search' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`}
          onClick={() => setActiveView(activeView === 'search' ? null : 'search')}
          title="Search"
        >
          {activeView === 'search' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="22" x2="14" y2="14"></line>
          </svg>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="pb-2 flex flex-col items-center w-full">
        
        {/* ---> NEW SETTINGS ICON <--- */}
        <div 
          className="w-12 h-12 flex items-center justify-center cursor-pointer text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc] transition-colors" 
          title="Editor Settings" 
          onClick={() => setShowSettingsModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Reset Icon */}
        <div className="w-12 h-12 flex items-center justify-center cursor-pointer text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]" title="Reset Compiler" onClick={handleReset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        )}
      </div>
      
    </div>
  );
}