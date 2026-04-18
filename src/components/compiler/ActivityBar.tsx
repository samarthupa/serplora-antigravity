import React from 'react';

export default function ActivityBar({ activeView, setActiveView, isConsoleOpen, setIsConsoleOpen, handleReset }: any) {
  return (
    <div className="w-12 bg-gray-100 dark:bg-[#333333] flex flex-col items-center pt-1 shrink-0 border-r border-gray-300 dark:border-[#252526] transition-colors">
      
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


      <div className="pb-2 flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center cursor-pointer text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]" title="Reset Compiler" onClick={handleReset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </div>
        <div className="w-12 h-12 flex items-center justify-center cursor-pointer text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]" title="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
        
        <div 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${isConsoleOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'}`} 
          title="Console" 
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
        >
          {isConsoleOpen && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </div>
  );
}