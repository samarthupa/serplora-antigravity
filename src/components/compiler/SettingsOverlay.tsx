import React, { useState, useEffect, useRef } from 'react';

export default function SettingsOverlay({ currentSettings, onSave, onClose, isMobile, onReset, onShare, isSharing }: any) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(currentSettings);

  useEffect(() => {
    if (isMobile) return; 
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !e.composedPath().includes(overlayRef.current)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 10);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isMobile]);

  const handleReset = () => {
    const defaultSettings = { fontSize: 14, wordWrap: false, showGutter: !isMobile };
    setDraft(defaultSettings);
    onSave(defaultSettings);
    onClose();
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  // 🟢 NEW: Smart Toggle Handlers to prevent contradictory states
  const toggleWordWrap = () => {
    setDraft((prev: any) => ({
      ...prev,
      wordWrap: !prev.wordWrap,
      showGutter: !prev.wordWrap ? false : prev.showGutter // Turn OFF gutter if wordWrap turns ON
    }));
  };

  const toggleGutter = () => {
    setDraft((prev: any) => ({
      ...prev,
      showGutter: !prev.showGutter,
      wordWrap: !prev.showGutter ? false : prev.wordWrap // Turn OFF wordWrap if gutter turns ON
    }));
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div onClick={onChange} className={`w-10 h-[22px] flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${checked ? 'bg-[#007acc]' : 'bg-gray-300 dark:bg-[#555]'}`}>
      <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <>
      {isMobile && <div className="fixed inset-0 bg-black/50 z-[99998] animate-in fade-in duration-200" onMouseDown={onClose} />}

      <div 
        ref={overlayRef}
        onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
        className={`${isMobile ? 'fixed bottom-0 left-0 right-0 rounded-t-[20px] pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3' : 'absolute bottom-14 left-14 rounded-md w-64'} bg-white dark:bg-[#252526] shadow-2xl z-[99999] p-5 text-[14px] text-gray-800 dark:text-[#cccccc] animate-in ${isMobile ? 'slide-in-from-bottom-8' : 'fade-in zoom-in'} duration-200`}
      >
        {isMobile && <div className="w-12 h-1.5 bg-gray-300 dark:bg-[#454545] rounded-full mx-auto mb-5" />}

        {isMobile && (
          <div className="mb-5 pb-5 border-b border-gray-200 dark:border-[#3c3c3c] flex justify-between gap-3">
            <button onClick={() => { onClose(); onReset(); }} className="flex-1 flex items-center justify-center gap-2 py-2 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors text-[13px] font-semibold">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset
            </button>
            <button onClick={() => { if(!isSharing) onShare(); }} className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg transition-colors text-[13px] font-semibold ${isSharing ? 'bg-gray-100 dark:bg-[#3c3c3c] text-gray-400 dark:text-[#858585] cursor-not-allowed' : 'bg-[#007acc]/10 hover:bg-[#007acc]/20 text-[#007acc]'}`}>
              {isSharing ? (<><svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>) : (<><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Share</>)}
            </button>
          </div>
        )}

        <h4 className="font-bold mb-4 text-[14px] text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#3c3c3c] pb-2">Editor Settings</h4>
        
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="font-medium">Font Size</span>
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#3c3c3c] rounded-md px-1 py-0.5">
              <button onClick={() => setDraft({ ...draft, fontSize: Math.max(10, draft.fontSize - 1) })} className="px-2.5 py-1 hover:bg-gray-200 dark:hover:bg-[#555] rounded text-lg leading-none">-</button>
              <span className="w-5 text-center font-semibold">{draft.fontSize}</span>
              <button onClick={() => setDraft({ ...draft, fontSize: Math.min(24, draft.fontSize + 1) })} className="px-2.5 py-1 hover:bg-gray-200 dark:hover:bg-[#555] rounded text-lg leading-none">+</button>
            </div>
          </div>
          {/* 🟢 Implement Smart Handlers */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Word Wrap</span>
            <ToggleSwitch checked={draft.wordWrap} onChange={toggleWordWrap} />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Line Numbers</span>
            <ToggleSwitch checked={draft.showGutter} onChange={toggleGutter} />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-[#3c3c3c]">
          <button onClick={handleReset} className="text-[#007acc] hover:underline text-[13px] font-medium">Reset</button>
          <button onClick={handleSave} className="bg-[#007acc] hover:bg-[#005f9e] text-white px-5 py-2 rounded-lg transition-colors font-semibold shadow-sm">Save</button>
        </div>
      </div>
    </>
  );
}