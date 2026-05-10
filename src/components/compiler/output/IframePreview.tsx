import React, { useEffect, useState } from 'react';

export default function IframePreview({
  processPreviews, // 🟢 NOW TABS!
  isMobile,
  mobileActiveTab,
  previewWidth,
  isResizingPreview,
  setIsResizingPreview,
  previewRef,
  runningFile
}: any) {
  const isHidden = isMobile ? mobileActiveTab !== 'preview' : false;
  
  // Tab Management State
  const isTabbed = !!processPreviews;
  const processIds = isTabbed ? Object.keys(processPreviews) : [];
  const [viewedProcessId, setViewedProcessId] = useState<string | null>(null);

  // Auto-select the active process when a new one starts
  useEffect(() => {
    if (runningFile) setViewedProcessId(runningFile.id);
  }, [runningFile]);

  if (isHidden) return null;

  const activeContent = isTabbed 
    ? (viewedProcessId && processPreviews[viewedProcessId] ? processPreviews[viewedProcessId].content : '')
    : '';

  return (
    <div 
      ref={previewRef}
      style={{ 
        width: isMobile ? '100%' : (typeof previewWidth === 'number' ? `${previewWidth}px` : previewWidth),
        maxWidth: isMobile ? '100%' : 'calc(100% - 10px)' 
      }} 
      className={`${isMobile ? 'flex w-full absolute inset-0 z-30' : 'flex relative'} bg-white dark:bg-[#1e1e1e] flex-col shrink-0 ${isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}
    >
      {!isMobile && (
        <div 
          className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" 
          onMouseDown={() => setIsResizingPreview(true)} 
        />
      )}
      
      {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
      
      {/* 🟢 PREVIEW HEADER BAR WITH TABS */}
      {isTabbed ? (
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center px-1 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors overflow-x-auto no-scrollbar">
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
      ) : (
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center px-3 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-[#cccccc] font-medium select-none">
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>{runningFile ? `Preview: ${runningFile.name}` : 'Preview'}</span>
          </div>
        </div>
      )}

      {activeContent ? (
        <iframe
          key={viewedProcessId} // Force remount on tab switch for pristine state
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