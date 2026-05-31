// src/components/compiler/DownloadModal.tsx
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';

export default function DownloadModal({ files, projectName, onClose }: any) {
  // Filter out folders to only select actual files. Folders are implicitly created.
  const downloadableFiles = files.filter((f: any) => !f.isFolder);
  
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(
    downloadableFiles.map((f: any) => f.id)
  );
  const [exportName, setExportName] = useState(projectName || 'Workspace');

  // Update default export name dynamically based on selection count
  useEffect(() => {
    if (selectedFileIds.length === 1) {
      const singleFile = files.find((f: any) => f.id === selectedFileIds[0]);
      if (singleFile) {
        const nameWithoutExt = singleFile.name.includes('.') 
          ? singleFile.name.substring(0, singleFile.name.lastIndexOf('.')) 
          : singleFile.name;
        setExportName(nameWithoutExt);
      }
    } else {
      setExportName(projectName || 'Workspace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileIds.length, projectName]); // <--- FIXED

  const toggleSelection = (id: string) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const getFilePath = (file: any) => {
    let path = file.name;
    let currentParent = file.parentId;
    while (currentParent) {
      const parent = files.find((f: any) => f.id === currentParent);
      if (parent) {
        path = `${parent.name}/${path}`;
        currentParent = parent.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const handleDownload = async () => {
    if (selectedFileIds.length === 0) return;

    const safeExportName = exportName.trim() || 'download';

    if (selectedFileIds.length === 1) {
      // Single file download
      const file = downloadableFiles.find((f: any) => f.id === selectedFileIds[0]);
      if (!file) return;
      
      let finalName = safeExportName;
      const extMatch = file.name.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '';
      if (ext && !finalName.endsWith(ext)) {
        finalName += ext;
      }

      const element = document.createElement("a");
      const fileBlob = new Blob([file.content || ''], {type: 'text/plain'});
      element.href = URL.createObjectURL(fileBlob);
      element.download = finalName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // Multi-file ZIP download
      const zip = new JSZip();
      selectedFileIds.forEach(id => {
        const file = downloadableFiles.find((f: any) => f.id === id);
        if (file) {
          const fullPath = getFilePath(file);
          zip.file(fullPath, file.content || '');
        }
      });

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const finalName = safeExportName.endsWith('.zip') ? safeExportName : `${safeExportName}.zip`;
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = finalName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
    onClose();
  };

  const isSingle = selectedFileIds.length === 1;
  const downloadLabel = isSingle 
    ? `Download File` 
    : `Download .zip (${selectedFileIds.length})`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#3c3c3c] rounded-[12px] shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col"
      >
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#3c3c3c] flex justify-between items-center bg-gray-50 dark:bg-[#1e1e1e]">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Export Workspace</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto max-h-[40vh] custom-scrollbar bg-white dark:bg-[#252526]">
          <p className="text-[11px] font-bold text-gray-500 dark:text-[#858585] mb-3 uppercase tracking-wider">Select Files to Include</p>
          <div className="flex flex-col gap-2">
            {downloadableFiles.map((file: any) => (
              <label key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#444]">
                <input 
                  type="checkbox" 
                  checked={selectedFileIds.includes(file.id)}
                  onChange={() => toggleSelection(file.id)}
                  className="w-4 h-4 text-[#007acc] bg-gray-100 border-gray-300 rounded focus:ring-[#007acc] dark:focus:ring-[#007acc] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[13px] font-semibold text-gray-800 dark:text-[#cccccc] truncate">{file.name}</span>
                  {file.parentId && (
                    <span className="text-[11px] text-gray-500 dark:text-[#858585] truncate opacity-70">
                      {getFilePath(file).split('/').slice(0, -1).join('/') + '/'}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-[#3c3c3c] bg-gray-50 dark:bg-[#1e1e1e] flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-[#858585] mb-1.5 block uppercase tracking-wider">
              {isSingle ? 'File Name' : 'Archive Name'}
            </label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                className="w-full bg-white dark:bg-[#333333] border border-gray-300 dark:border-[#555] text-gray-900 dark:text-white text-[13px] font-mono rounded-md px-3 py-2 outline-none focus:border-[#007acc] transition-colors"
              />
              {!isSingle && <span className="absolute right-3 text-gray-400 text-[13px] pointer-events-none font-mono">.zip</span>}
            </div>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={selectedFileIds.length === 0}
            className="w-full bg-[#007acc] hover:bg-[#005f9e] disabled:bg-gray-400 disabled:dark:bg-[#444] disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-md transition-colors font-semibold shadow-sm flex justify-center items-center gap-2 text-[14px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            {downloadLabel}
          </button>
        </div>
      </div>
    </div>
  );
}