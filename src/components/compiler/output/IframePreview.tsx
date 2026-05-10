import React from 'react';

export default function IframePreview({
  previewContent,
  isMobile,
  mobileActiveTab,
  previewWidth,
  isResizingPreview,
  setIsResizingPreview,
  previewRef,
  runningFile // 🟢 NEW: Track the currently executing file
}: any) {
  // Hide completely if on mobile and not on the preview tab
  const isHidden = isMobile ? mobileActiveTab !== 'preview' : false;
  if (isHidden) return null;

  return (
    <div 
      ref={previewRef}
      style={{ 
        width: isMobile ? '100%' : (typeof previewWidth === 'number' ? `${previewWidth}px` : previewWidth),
        maxWidth: isMobile ? '100%' : 'calc(100% - 10px)' 
      }} 
      className={`${isMobile ? 'flex w-full absolute inset-0 z-30' : 'flex relative'} bg-white dark:bg-[#1e1e1e] flex-col shrink-0 ${isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}
    >
      {/* Desktop Drag Resizer */}
      {!isMobile && (
        <div 
          className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" 
          onMouseDown={() => setIsResizingPreview(true)} 
        />
      )}
      
      {/* Resizing Overlay to prevent iframe pointer-events stealing the mouse */}
      {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
      
      {/* 🟢 NEW: PREVIEW HEADER BAR */}
      <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center px-3 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors">
        <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-[#cccccc] font-medium select-none">
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>{runningFile ? `Preview: ${runningFile.name}` : 'Preview'}</span>
        </div>
      </div>
                
      <iframe
        srcDoc={previewContent}
        className="flex-1 w-full border-none bg-white"
        title="preview"
        sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox"
        style={{ pointerEvents: isResizingPreview ? 'none' : 'auto' }}
      ></iframe>
    </div>
  );
}