import React, { useState, useEffect, useRef } from 'react';

export default function SettingsOverlay({ currentSettings, onSave, onClose, isMobile }: any) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(currentSettings);

  // Handle clicking outside to close without saving
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Small delay to prevent immediate trigger on the toggle click
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
      <h4 className="font-bold mb-4 text-[14px] text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#3c3c3c] pb-2">Editor Settings</h4>
      
      <div className="flex flex-col gap-4">
        {/* Font Size */}
        <div className="flex items-center justify-between">
          <span>Font Size</span>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#3c3c3c] rounded px-1">
            <button onClick={() => setDraft({ ...draft, fontSize: Math.max(10, draft.fontSize - 1) })} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-[#555] rounded">-</button>
            <span className="w-4 text-center">{draft.fontSize}</span>
            <button onClick={() => setDraft({ ...draft, fontSize: Math.min(24, draft.fontSize + 1) })} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-[#555] rounded">+</button>
          </div>
        </div>

        {/* Word Wrap */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span>Word Wrap</span>
          <input 
            type="checkbox" 
            checked={draft.wordWrap} 
            onChange={(e) => setDraft({ ...draft, wordWrap: e.target.checked })}
            className="accent-[#007acc] cursor-pointer"
          />
        </label>

        {/* Autocomplete */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span>Autocomplete</span>
          <input 
            type="checkbox" 
            checked={draft.autoComplete} 
            onChange={(e) => setDraft({ ...draft, autoComplete: e.target.checked })}
            className="accent-[#007acc] cursor-pointer"
          />
        </label>

        {/* Show Gutter */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span>Line Numbers (Gutter)</span>
          <input 
            type="checkbox" 
            checked={draft.showGutter} 
            onChange={(e) => setDraft({ ...draft, showGutter: e.target.checked })}
            className="accent-[#007acc] cursor-pointer"
          />
        </label>
      </div>

      <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-200 dark:border-[#3c3c3c]">
        <button onClick={handleReset} className="text-[#007acc] hover:underline text-[12px]">Reset to Default</button>
        <button onClick={handleSave} className="bg-[#007acc] hover:bg-[#005f9e] text-white px-4 py-1.5 rounded transition-colors font-medium">Save</button>
      </div>
    </div>
  );
}