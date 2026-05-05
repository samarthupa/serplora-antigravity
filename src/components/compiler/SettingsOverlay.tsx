import React, { useState, useEffect, useRef } from 'react';

export default function SettingsOverlay({ currentSettings, onSave, onClose, isMobile, onReset, onShare, isSharing }: any) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(currentSettings);

  // Handle clicking outside to close without saving
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const handleReset = () => {
    const defaultSettings = {
      fontSize: 14,
      wordWrap: false,
      autoComplete: true,
      showGutter: !isMobile
    };
    setDraft(defaultSettings);
    onSave(defaultSettings);
    onClose();
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div 
      ref={overlayRef}
      className={`absolute z-[99999] bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#454545] shadow-2xl rounded-md p-4 w-64 text-[13px] text-gray-800 dark:text-[#cccccc] animate-in fade-in zoom-in duration-150 ${isMobile ? 'bottom-16 left-2 right-2 w-auto' : 'bottom-14 left-14'}`}
    >
      {/* 🌟 NEW: Mobile-Only Workspace Actions */}
      {isMobile && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-[#3c3c3c] flex justify-between gap-2">
          <button 
            onClick={() => { onClose(); onReset(); }} 
            className="flex-1 flex items-center justify-center gap-2 py-1.5 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded transition-colors text-[13px] font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset
          </button>
          <button 
            onClick={() => { if(!isSharing){ onClose(); onShare(); } }} 
            className="flex-1 flex items-center justify-center gap-2 py-1.5 px-2 bg-[#007acc]/10 hover:bg-[#007acc]/20 text-[#007acc] rounded transition-colors text-[13px] font-medium"
          >
            {isSharing ? (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            )}
            Share
          </button>
        </div>
      )}

      <h4 className="font-bold mb-4 text-[14px] text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#3c3c3c] pb-2">Editor Settings</h4>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span>Font Size</span>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#3c3c3c] rounded px-1">
            <button onClick={() => setDraft({ ...draft, fontSize: Math.max(10, draft.fontSize - 1) })} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-[#555] rounded">-</button>
            <span className="w-4 text-center">{draft.fontSize}</span>
            <button onClick={() => setDraft({ ...draft, fontSize: Math.min(24, draft.fontSize + 1) })} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-[#555] rounded">+</button>
          </div>
        </div>

        <label className="flex items-center justify-between cursor-pointer group">
          <span>Word Wrap</span>
          <input type="checkbox" checked={draft.wordWrap} onChange={(e) => setDraft({ ...draft, wordWrap: e.target.checked })} className="accent-[#007acc] cursor-pointer" />
        </label>

        <label className="flex items-center justify-between cursor-pointer group">
          <span>Autocomplete</span>
          <input type="checkbox" checked={draft.autoComplete} onChange={(e) => setDraft({ ...draft, autoComplete: e.target.checked })} className="accent-[#007acc] cursor-pointer" />
        </label>

        <label className="flex items-center justify-between cursor-pointer group">
          <span>Line Numbers</span>
          <input type="checkbox" checked={draft.showGutter} onChange={(e) => setDraft({ ...draft, showGutter: e.target.checked })} className="accent-[#007acc] cursor-pointer" />
        </label>
      </div>

      <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-200 dark:border-[#3c3c3c]">
        <button onClick={handleReset} className="text-[#007acc] hover:underline text-[12px]">Reset to Default</button>
        <button onClick={handleSave} className="bg-[#007acc] hover:bg-[#005f9e] text-white px-4 py-1.5 rounded transition-colors font-medium">Save</button>
      </div>
    </div>
  );
}