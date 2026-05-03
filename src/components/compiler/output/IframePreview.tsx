import React from 'react';

export default function IframePreview({
  previewContent,
  isMobile,
  mobileActiveTab,
  previewWidth,
  isResizingPreview,
  setIsResizingPreview,
  previewRef
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
      className={`${isMobile ? 'flex w-full absolute inset-0 z-30' : 'flex relative'} bg-white flex-col shrink-0 ${isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}
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