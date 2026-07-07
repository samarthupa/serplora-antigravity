import React, { useEffect, useState } from 'react';

export default function IframePreview({
  processPreviews,
  isMobile,
  mobileActiveTab,
  previewWidth,
  isResizingPreview,
  setIsResizingPreview,
  previewRef,
  runningFile,
  // 🟢 NEW PROPS FROM SHELL
  handleRun, handleAbortWrapper, isRunning, isCooldown, toggleFullscreen, isAppFullscreen
}: any) {
  const isHidden = isMobile ? mobileActiveTab !== 'preview' : false;
  
  const isTabbed = !!processPreviews;
  const processIds = isTabbed ? Object.keys(processPreviews) : [];
  const [viewedProcessId, setViewedProcessId] = useState<string | null>(null);

  useEffect(() => {
    if (runningFile) setViewedProcessId(runningFile.id);
  }, [runningFile]);

  if (isHidden) return null;

  const activeContent = isTabbed 
    ? (viewedProcessId && processPreviews[viewedProcessId] ? processPreviews[viewedProcessId].content : '')
    : '';

  // 🟢 DESKTOP ACTION BUTTONS
  const actionButtons = (
    <div className="hidden md:flex h-full items-center gap-1 shrink-0 ml-auto pr-2">
      {isRunning ? (
        <button onClick={handleAbortWrapper} disabled={isCooldown} className={`flex items-center justify-center w-7 h-6 rounded transition-colors ${isCooldown ? 'opacity-50 cursor-not-allowed bg-transparent text-red-500' : 'bg-transparent text-red-500 hover:bg-red-500/10'}`} title="Stop">
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>
        </button>
      ) : (
        <button onClick={handleRun} disabled={isCooldown} className={`flex items-center justify-center w-7 h-6 rounded transition-colors ${isCooldown ? 'opacity-50 cursor-not-allowed bg-transparent text-green-700 dark:text-[#89d185]' : 'bg-transparent text-green-700 dark:text-[#89d185] hover:bg-black/5 dark:hover:bg-white/10'}`} title="Run">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
        </button>
      )}
      <div onClick={toggleFullscreen} className="flex w-7 h-6 items-center justify-center rounded cursor-pointer text-gray-500 dark:text-[#858585] hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-[#cccccc]" title={isAppFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
        {isAppFullscreen ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20M20 10 14 10 14 4M14 10 21 3M3 21 10 14"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>}
      </div>
    </div>
  );

  return (
    <div 
      ref={previewRef}
      style={{ 
        width: isMobile ? '100%' : (typeof previewWidth === 'number' ? `${previewWidth}px` : previewWidth),
        maxWidth: isMobile ? '100%' : 'calc(100% - 10px)' 
      }} 
      className={`${isMobile ? 'flex w-full absolute inset-0 z-30' : 'flex relative'} bg-white dark:bg-[#1e1e1e] flex-col shrink-0 ${isMobile ? '' : 'border-l border-r border-gray-300 dark:border-[#3c3c3c]'}`}
    >
      {!isMobile && (
        <div className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingPreview(true)} />
      )}
      
      {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
      
      {/* 🟢 HEADER INCLUDES ACTION BUTTONS */}
      {isTabbed ? (
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-between border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors">
          <div className="flex items-center overflow-x-auto no-scrollbar flex-1">
            {processIds.length === 0 && <span className="text-[12px] text-gray-500 px-3 select-none">No preview history</span>}
            
            {processIds.map(id => {
              const isActive = viewedProcessId === id;
              return (
                <div
                  key={id}
                  onClick={() => setViewedProcessId(id)}
                  className={`flex items-center gap-2 px-4 h-[35px] cursor-pointer border-b-2 text-[13px] font-medium transition-colors select-none ${isActive ? 'border-[#007acc] text-[#007acc] bg-white dark:bg-[#1e1e1e]' : 'border-transparent text-gray-600 dark:text-[#9d9d9d] hover:bg-gray-200 dark:hover:bg-[#3c3c3c]'}`}
                >
                   <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                   {processPreviews[id].name}
                </div>
              )
            })}
          </div>
          {actionButtons}
        </div>
      ) : (
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-between px-3 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-[#cccccc] font-medium select-none">
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>{runningFile ? `Preview: ${runningFile.name}` : 'Preview'}</span>
          </div>
          {actionButtons}
        </div>
      )}

      {activeContent ? (
        <iframe
          key={viewedProcessId}
          srcDoc={activeContent}
          className="flex-1 w-full border-none bg-white"
          title="preview"
          sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox"
          style={{ pointerEvents: isResizingPreview ? 'none' : 'auto' }}
        ></iframe>
      ) : (
        <div className="flex-1 w-full bg-white dark:bg-[#1e1e1e]"></div>
      )}
    </div>
  );
}