import React, { useEffect, useRef, useState } from 'react';

export type TerminalLog = {
  id: string;
  type: 'sys' | 'err' | 'std' | 'input-context' | 'image';
  content: string;
};

export default function TerminalPreview({
  logs,           // Legacy Single Log Array (Used by JS Compiler)
  processLogs,    // 🟢 NEW: Tabbed Process Object (Used by Python)
  onClear,
  isMobile,
  mobileActiveTab,
  previewWidth,
  isResizingPreview,
  setIsResizingPreview,
  previewRef,
  isWaitingForInput,
  onInputSubmit,
  runningFile,
  isRunning
}: any) {
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  // 🟢 NEW: Tab Management State
  const isTabbed = !!processLogs;
  const processIds = isTabbed ? Object.keys(processLogs) : [];
  const [viewedProcessId, setViewedProcessId] = useState<string | null>(null);

  // Auto-select the active process when a new one starts
  useEffect(() => {
    if (runningFile) setViewedProcessId(runningFile.id);
  }, [runningFile]);

  // Determine which logs to show based on the active tab
  const activeLogs = isTabbed
    ? (viewedProcessId && processLogs[viewedProcessId] ? processLogs[viewedProcessId].logs : [])
    : (logs || []);

  const activeIsRunning = isRunning && (!isTabbed || viewedProcessId === runningFile?.id);
  const activeIsWaiting = isWaitingForInput && activeIsRunning;

  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
    if (activeIsWaiting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeLogs, activeIsWaiting]);

  const handleInputSubmit = () => {
    if (!activeIsWaiting) return;
    onInputSubmit(inputValue);
    setInputValue('');
  };

  const isHidden = isMobile ? mobileActiveTab !== 'preview' : false;
  if (isHidden) return null;

  return (
    <div 
      ref={previewRef}
      style={{ width: isMobile ? '100%' : (typeof previewWidth === 'number' ? `${previewWidth}px` : previewWidth), maxWidth: isMobile ? '100%' : 'calc(100% - 10px)' }} 
      className={`${isMobile ? 'flex w-full absolute inset-0 z-30' : 'flex relative'} bg-white dark:bg-[#1e1e1e] flex-col shrink-0 transition-colors ${isMobile ? '' : 'border-l border-gray-300 dark:border-[#3c3c3c]'}`}
    >
      {!isMobile && <div className="absolute left-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingPreview(true)} />}
      {isResizingPreview && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}

      {/* 🟢 NEW: DYNAMIC HEADER (Tabs vs Single) */}
      {isTabbed ? (
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center px-1 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors overflow-x-auto no-scrollbar">
          {processIds.length === 0 && <span className="text-[12px] text-gray-500 px-3 select-none">No output history</span>}
          
          {processIds.map(id => {
            const isActive = viewedProcessId === id;
            const isThisRunning = isRunning && runningFile?.id === id;
            return (
              <div
                key={id}
                onClick={() => setViewedProcessId(id)}
                className={`flex items-center gap-2 px-4 h-[35px] cursor-pointer border-b-2 text-[13px] font-medium transition-colors select-none ${isActive ? 'border-[#007acc] text-[#007acc] bg-white dark:bg-[#1e1e1e]' : 'border-transparent text-gray-600 dark:text-[#9d9d9d] hover:bg-gray-200 dark:hover:bg-[#3c3c3c]'}`}
              >
                 <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                 {processLogs[id].name}
                 {isThisRunning && (
                    <span className="flex h-2 w-2 ml-1 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                 )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Legacy Single Terminal Header */
        <div className="h-[35px] bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-between px-3 border-b border-gray-300 dark:border-[#252526] shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-[#cccccc] font-medium select-none">
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            <span>{runningFile ? `Terminal: ${runningFile.name}` : 'Terminal'}</span>
            {(isRunning || isWaitingForInput) && (
              <span className="flex h-2 w-2 ml-1 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Console Area */}
      <div ref={consoleContainerRef} className="flex-1 p-[15px] overflow-y-auto font-mono text-[14px] leading-[1.7] whitespace-pre-wrap custom-scrollbar transition-colors">
        {activeLogs.map((log: TerminalLog) => {
          if (log.type === 'sys') return <div key={log.id} className="text-blue-600 dark:text-[#4dabf7] italic mb-[5px] transition-colors">{log.content}</div>;
          if (log.type === 'err') return <div key={log.id} className="text-red-600 dark:text-[#ff6b6b] transition-colors">{log.content}</div>;
          if (log.type === 'input-context') return <span key={log.id} className="text-gray-700 dark:text-[#e9ecef] opacity-80 whitespace-pre-wrap transition-colors">{log.content}</span>;
          if (log.type === 'image') {
            const imgSrc = log.content.startsWith('data:image') ? log.content : `data:image/png;base64,${log.content}`;
            return <img key={log.id} src={imgSrc} alt="Terminal Output" className="max-w-full rounded-[4px] mt-[10px] bg-white block" />;
          }
          return <span key={log.id} className="text-gray-900 dark:text-[#e9ecef] transition-colors">{log.content}</span>;
        })}

        {activeIsWaiting && (
          <span className="inline-flex items-center max-w-full">
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
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