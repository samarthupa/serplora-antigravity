import React, { useEffect, useRef, useState } from 'react';

// Exact log types corresponding to your staging CSS classes
export type TerminalLog = {
  id: string;
  type: 'sys' | 'err' | 'std' | 'input-context' | 'image';
  content: string;
};

export default function TerminalPreview({
  logs,
  onClear,
  isMobile,
  mobileActiveTab,
  previewWidth,
  isResizingPreview,
  setIsResizingPreview,
  previewRef,
  // Interactive Input Props
  isWaitingForInput,
  onInputSubmit,
  // Process Tracking Props
  runningFile,
  isRunning
}: any) {
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll the container (not the window) whenever logs update
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
    if (isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [logs, isWaitingForInput]);

  const handleInputSubmit = () => {
    if (!isWaitingForInput) return;
    onInputSubmit(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  const isHidden = isMobile ? mobileActiveTab !== 'preview' : false;
  if (isHidden) return null;

  return (
    <div 
      ref={previewRef}
      style={{ 
        width: isMobile ? '100%' : (typeof previewWidth === 'number' ? `${previewWidth}px` : previewWidth),
        maxWidth: isMobile ? '100%' : 'calc(100% - 10px)' 
      }} 
      className={`${isMobile ? 'flex w-full absolute inset-0 z-30' : 'flex relative'} bg-white dark:bg-[#1e1e1e] flex-col shrink-0 transition-colors ${isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}
    >
      {/* Desktop Drag Resizer */}
      {!isMobile && (
        <div 
          className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" 
          onMouseDown={() => setIsResizingPreview(true)} 
        />
      )}
      {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}

      {/* TERMINAL HEADER BAR */}
      <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-between px-3 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors">
        <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-[#cccccc] font-medium select-none">
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          <span>{runningFile ? `Output: ${runningFile.name}` : 'Output'}</span>
          {(isRunning || isWaitingForInput) && (
            <span className="flex h-2 w-2 ml-1 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Console Area */}
      <div
        ref={consoleContainerRef} 
        className="flex-1 p-[15px] overflow-y-auto font-mono text-[14px] leading-[1.7] whitespace-pre-wrap custom-scrollbar transition-colors"
      >
        {logs.map((log: TerminalLog) => {
          if (log.type === 'sys') return <div key={log.id} className="text-blue-600 dark:text-[#4dabf7] italic mb-[5px] transition-colors">{log.content}</div>;
          if (log.type === 'err') return <div key={log.id} className="text-red-600 dark:text-[#ff6b6b] transition-colors">{log.content}</div>;
          if (log.type === 'input-context') return <span key={log.id} className="text-gray-700 dark:text-[#e9ecef] opacity-80 whitespace-pre-wrap transition-colors">{log.content}</span>;
          if (log.type === 'image') {
            const imgSrc = log.content.startsWith('data:image') ? log.content : `data:image/png;base64,${log.content}`;
            return <img key={log.id} src={imgSrc} alt="Terminal Output" className="max-w-full rounded-[4px] mt-[10px] bg-white block" />;
          }
          
          return <span key={log.id} className="text-gray-900 dark:text-[#e9ecef] transition-colors">{log.content}</span>;
        })}

        {isWaitingForInput && (
          <span className="inline-flex items-center max-w-full">
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none shadow-none text-gray-900 dark:text-white font-inherit text-[14px] font-bold border-b border-gray-400 dark:border-[#666] p-0 m-0 min-w-[10px] transition-colors"
              style={{ width: `${Math.max(1, inputValue.length) + 1}ch`, borderRadius: 0, appearance: 'none' }}
              autoFocus
            />
            <button 
              onClick={handleInputSubmit}
              title="Submit Input"
              className="bg-gray-200 dark:bg-[#444] border border-gray-300 dark:border-[#666] text-gray-700 dark:text-white rounded-[4px] ml-4 px-[6px] py-[2px] text-[12px] cursor-pointer hover:bg-gray-300 dark:hover:bg-[#555] transition-colors hidden xl:inline-block"
            >
              &#8629;
            </button>
          </span>
        )}

      </div>
    </div>
  );
}