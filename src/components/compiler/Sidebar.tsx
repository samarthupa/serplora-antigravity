import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';

export default function Sidebar({ activeView, files, setFiles, activeFileId, setActiveFileId, projectName, setProjectName, isMobile }: any) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['root']);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: any } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut', file: any } | null>(null);
  
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const [past, setPast] = useState<any[][]>([]);
  const [future, setFuture] = useState<any[][]>([]);

  const updateFilesWithHistory = (newFilesOrUpdater: any) => {
    setFiles((currentFiles: any[]) => {
      const nextFiles = typeof newFilesOrUpdater === 'function' ? newFilesOrUpdater(currentFiles) : newFilesOrUpdater;
      setPast((prev) => [...prev, currentFiles]);
      setFuture([]); 
      return nextFiles;
    });
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    setFiles((currentFiles: any[]) => {
      const previousFiles = past[past.length - 1];
      setPast(prev => prev.slice(0, -1));
      setFuture(prev => [...prev, currentFiles]);

      return previousFiles.map(prevFile => {
         const currentFile = currentFiles.find(f => f.id === prevFile.id);
         return currentFile ? { ...prevFile, content: currentFile.content } : prevFile;
      });
    });
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    setFiles((currentFiles: any[]) => {
      const nextFiles = future[future.length - 1];
      setFuture(prev => prev.slice(0, -1));
      setPast(prev => [...prev, currentFiles]);

      return nextFiles.map(nextFile => {
         const currentFile = currentFiles.find(f => f.id === nextFile.id);
         return currentFile ? { ...nextFile, content: currentFile.content } : nextFile;
      });
    });
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;
    const handleMouseMove = (e: MouseEvent) => setSidebarWidth(prev => Math.max(150, Math.min(600, prev + e.movementX)));
    const handleMouseUp = () => setIsResizingSidebar(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  if (!activeView) return null;

  const toggleFolder = (folderId: string) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  const handleCreate = (isFolder: boolean) => {
    const activeItem = files.find((f:any) => f.id === activeFileId);
    const parentId = activeItem ? (activeItem.isFolder ? activeItem.id : (activeItem.parentId || null)) : null;
    if (parentId && !expandedFolders.includes(parentId)) setExpandedFolders([...expandedFolders, parentId]);
    
    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    const newItem = {
      id: newId, name: '', isFolder, parentId: parentId,
      content: isFolder ? undefined : '', language: isFolder ? undefined : 'javascript'
    };
    
    updateFilesWithHistory([...files, newItem]);
    setRenamingId(newId);
    setRenameText(isFolder ? 'new_folder' : 'untitled.html');
  };

  const handleRenameSubmit = () => {
    if (renamingId === 'root') {
      if (renameText.trim() !== '') setProjectName(renameText.trim());
      setRenamingId(null);
      return;
    }

    const trimmedName = renameText.trim();
    const fileBeingRenamed = files.find((f: any) => f.id === renamingId);

    if (!fileBeingRenamed) {
      setRenamingId(null);
      return;
    }

    if (trimmedName === '') {
      if (fileBeingRenamed.name === '') updateFilesWithHistory(files.filter((f: any) => f.id !== renamingId));
    } else {
      const isDuplicate = files.some((f: any) => f.parentId === fileBeingRenamed.parentId && f.id !== renamingId && f.name.toLowerCase() === trimmedName.toLowerCase());
      
      if (isDuplicate) {
        alert(`A file or folder named "${trimmedName}" already exists at this location.`);
        if (fileBeingRenamed.name === '') updateFilesWithHistory(files.filter((f: any) => f.id !== renamingId));
        setRenamingId(null);
        return;
      }

      updateFilesWithHistory(files.map((f: any) => {
        if (f.id === renamingId) {
          let updatedFile = { ...f, name: trimmedName };
          if (!f.isFolder) {
            updatedFile.language = trimmedName.endsWith('.html') ? 'html' : trimmedName.endsWith('.css') ? 'css' : trimmedName.endsWith('.py') ? 'python' : 'javascript';
          }
          return updatedFile;
        }
        return f;
      }));
    }
    setRenamingId(null);
  };

  const handleDelete = (idToDelete: string) => {
    const getDescendants = (parentId: string) => {
      let descendants: string[] = [];
      files.forEach((f: any) => {
        if (f.parentId === parentId) {
          descendants.push(f.id);
          if (f.isFolder) descendants = descendants.concat(getDescendants(f.id));
        }
      });
      return descendants;
    };

    const idsToRemove = [idToDelete, ...getDescendants(idToDelete)];
    const newFiles = files.filter((f: any) => !idsToRemove.includes(f.id));
    updateFilesWithHistory(newFiles);

    if (idsToRemove.includes(activeFileId)) {
      setActiveFileId(newFiles.find((f:any) => !f.isFolder)?.id || null);
    }
  };

  const handleDuplicate = (fileToDuplicate: any) => {
    let nameWithoutExt = fileToDuplicate.name;
    let ext = '';
    
    if (!fileToDuplicate.isFolder) {
      const dotIndex = fileToDuplicate.name.lastIndexOf('.');
      if (dotIndex !== -1 && dotIndex !== 0) {
        nameWithoutExt = fileToDuplicate.name.substring(0, dotIndex);
        ext = fileToDuplicate.name.substring(dotIndex);
      }
    }

    // 🟢 FIXED: Extract the base name and any trailing numbers
    const match = nameWithoutExt.match(/^(.*?)(\d*)$/);
    const baseName = match ? match[1] : nameWithoutExt;
    // If it already has a number, increment it. Otherwise, start at 2.
    let counter = match && match[2] ? parseInt(match[2], 10) + 1 : 2;

    let newName = `${baseName}${counter}${ext}`;
    
    // Check if it exists, incrementing if necessary
    while (files.some((f:any) => f.parentId === fileToDuplicate.parentId && f.name.toLowerCase() === newName.toLowerCase())) {
        counter++;
        newName = `${baseName}${counter}${ext}`;
    }

    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    updateFilesWithHistory([...files, { ...fileToDuplicate, id: newId, name: newName }]);
  };

  const handlePaste = (targetParentId: string | null) => {
    if (!clipboard) return;
    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    if (clipboard.action === 'cut') {
      const isDuplicate = files.some((f:any) => f.parentId === targetParentId && f.name.toLowerCase() === clipboard.file.name.toLowerCase());
      if (isDuplicate) {
         alert(`Cannot move. A file named "${clipboard.file.name}" already exists at this location.`);
         return; 
      }
      updateFilesWithHistory(files.map((f:any) => f.id === clipboard.file.id ? { ...f, parentId: targetParentId } : f));
      setClipboard(null); 
    } else {
      
      let nameWithoutExt = clipboard.file.name;
      let ext = '';
      if (!clipboard.file.isFolder) {
        const dotIndex = clipboard.file.name.lastIndexOf('.');
        if (dotIndex !== -1 && dotIndex !== 0) {
          nameWithoutExt = clipboard.file.name.substring(0, dotIndex);
          ext = clipboard.file.name.substring(dotIndex);
        }
      }

      // 🟢 FIXED: Apply the exact same numbered logic for pasting
      const match = nameWithoutExt.match(/^(.*?)(\d*)$/);
      const baseName = match ? match[1] : nameWithoutExt;
      let counter = match && match[2] ? parseInt(match[2], 10) + 1 : 2;

      let newName = `${baseName}${counter}${ext}`;
      
      while (files.some((f:any) => f.parentId === targetParentId && f.name.toLowerCase() === newName.toLowerCase())) {
          counter++;
          newName = `${baseName}${counter}${ext}`;
      }
      
      updateFilesWithHistory([...files, { ...clipboard.file, id: newId, parentId: targetParentId, name: newName }]);
    }
  };

  const handleDownload = async (file: any) => {
    if (!file.id || file.isFolder) {
      const zip = new JSZip();

      const addFilesToZip = (targetParentId: string | null, currentZipFolder: JSZip) => {
        // 🌟 THE FIX: Treat 'undefined' and 'null' as the exact same root level
        files.filter((f: any) => (f.parentId || null) === (targetParentId || null)).forEach((f: any) => {
          if (f.isFolder) {
            const newFolder = currentZipFolder.folder(f.name);
            if (newFolder) addFilesToZip(f.id, newFolder);
          } else {
            currentZipFolder.file(f.name, f.content || '');
          }
        });
      };

      // Pass root (null) if it's the main workspace, otherwise pass folder ID
      addFilesToZip(file.id || null, zip); 
      
      // 🟢 NEW: Prevent downloading an empty ZIP if something goes wrong
      if (Object.keys(zip.files).length === 0) {
         alert("No files found to download!");
         return;
      }

      const fileName = file.id ? `${file.name}.zip` : `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`;
      
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // Single file download
      const element = document.createElement("a");
      const fileBlob = new Blob([file.content], {type: 'text/plain'});
      element.href = URL.createObjectURL(fileBlob);
      element.download = file.name || 'untitled.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleUpload = (e: any) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!uploadedFiles.length) return;

    const allowedExtensions = ['.html', '.htm', '.css', '.scss', '.less', '.js', '.ts', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.json', '.xml'];

    const activeItem = files.find((f:any) => f.id === activeFileId);
    const parentId = activeItem ? (activeItem.isFolder ? activeItem.id : (activeItem.parentId || null)) : null;
    if (parentId && !expandedFolders.includes(parentId)) setExpandedFolders([...expandedFolders, parentId]);

    uploadedFiles.forEach((file: any) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (allowedExtensions.includes(ext)) {
        const reader = new FileReader();
        const isText = ['.html', '.htm', '.css', '.scss', '.less', '.js', '.ts', '.json', '.xml', '.svg'].includes(ext);

        reader.onload = (event) => {
           updateFilesWithHistory((prevFiles: any) => {
             let newName = file.name;
             let counter = 1;
             while (prevFiles.some((f:any) => f.parentId === parentId && f.name.toLowerCase() === newName.toLowerCase())) {
               const dotIndex = file.name.lastIndexOf('.');
               if (dotIndex !== -1 && dotIndex !== 0) newName = `${file.name.substring(0, dotIndex)} (${counter})${file.name.substring(dotIndex)}`;
               else newName = `${file.name} (${counter})`;
               counter++;
             }

             const newId = Date.now().toString() + Math.random().toString(36).substring(7);
             return [...prevFiles, {
               id: newId,
               name: newName,
               isFolder: false,
               parentId: parentId,
               content: event.target?.result,
               language: ext.includes('html') ? 'html' : ext.includes('css') ? 'css' : ext.includes('js') ? 'javascript' : 'text'
             }];
           });
        };

        if (isText) reader.readAsText(file);
        else reader.readAsDataURL(file);
      }
    });
    
    e.target.value = ''; 
  };

  const renderTree = (parentId: string | null, level: number = 1) => {
    const items = files.filter((f: any) => parentId === null ? !f.parentId : f.parentId === parentId);
    items.sort((a: any, b: any) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    });

    return items.map((file: any) => {
      const isExpanded = expandedFolders.includes(file.id);
      const paddingLeft = `${(level * 16) + 4}px`;

      return (
        <div key={file.id}>
          <div 
            draggable={!isMobile} // Disable HTML5 drag-and-drop on mobile touch devices
            onDragStart={(e) => {
              setDraggedFileId(file.id);
              e.dataTransfer.setData('text/plain', file.id);
            }}
            onDragOver={(e) => {
              if (file.isFolder) {
                e.preventDefault(); 
                e.currentTarget.classList.add('bg-[#007acc]/20', 'dark:bg-[#007acc]/30'); 
              }
            }}
            onDragLeave={(e) => {
               e.currentTarget.classList.remove('bg-[#007acc]/20', 'dark:bg-[#007acc]/30');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-[#007acc]/20', 'dark:bg-[#007acc]/30');
              if (file.isFolder && draggedFileId && draggedFileId !== file.id) {
                const draggedFile = files.find((f:any) => f.id === draggedFileId);
                const isDuplicate = files.some((f:any) => f.parentId === file.id && f.name.toLowerCase() === draggedFile?.name.toLowerCase());
                
                if (isDuplicate) {
                   alert(`Cannot move "${draggedFile?.name}" because a file or folder with that name already exists in "${file.name}".`);
                   setDraggedFileId(null);
                   return;
                }
                updateFilesWithHistory(files.map((f: any) => f.id === draggedFileId ? { ...f, parentId: file.id } : f));
              }
              setDraggedFileId(null);
            }}
            style={{ paddingLeft }}
            className={`group relative flex items-center pr-2 py-2 md:py-1 text-[16px] md:text-[15px] cursor-pointer select-none whitespace-nowrap transition-colors ${
              activeFileId === file.id && !file.isFolder ? 'bg-gray-200 dark:bg-[#37373d] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-[#cccccc] hover:bg-gray-200/50 dark:hover:bg-[#2a2d2e]'
            }`}
            onClick={() => file.isFolder ? toggleFolder(file.id) : setActiveFileId(file.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, file });
            }}
          >
            {file.isFolder ? (
              <>
                <svg className={`w-4 h-4 mr-0.5 text-gray-500 dark:text-[#858585] transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                <svg className="w-4 h-4 mr-1.5 text-yellow-600 dark:text-[#dcb862] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H2v16h20V8H12l-2-4z"/></svg>
              </>
            ) : (
              <svg className="w-4 h-4 ml-4 mr-1.5 text-blue-600 dark:text-[#519aba] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            )}

            {renamingId === file.id ? (
              <input 
                autoFocus
                type="search" 
                enterKeyHint="done" /* 🟢 THE FIX: Forces the keyboard to show 'Done' or 'Enter' instead of 'Search' */
                autoComplete="off"
                className="bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-white border border-[#007acc] outline-none text-[13px] px-1 w-[80%] [&::-webkit-search-cancel-button]:hidden" 
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
              <span className="truncate">{file.name}</span>
            )}

            {/* Force Context Menu Dots to be always visible on Mobile because hover doesn't exist */}
            <div 
              className={`absolute right-1 ${isMobile ? 'opacity-100 p-2' : 'opacity-0 group-hover:opacity-100 p-0.5'} hover:bg-gray-300 dark:hover:bg-[#3c3c3c] rounded transition-opacity`}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                // Ensure menu opens inwards on mobile if near edge
                setContextMenu({ 
                  x: isMobile ? rect.right - 150 : rect.right, 
                  y: rect.bottom, 
                  file 
                });
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </div>
          </div>
          
          {file.isFolder && isExpanded && renderTree(file.id, level + 1)}
        </div>
      );
    });
  };


  return (
    <div 
      style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }} 
      className="bg-gray-50 dark:bg-[#252526] flex flex-col h-full shrink-0 border-r border-gray-300 dark:border-[#3c3c3c] overflow-hidden relative transition-colors focus:outline-none"
      tabIndex={0} 
      onKeyDown={(e) => {
        // 🟢 FIX: Ignore all global shortcuts (like Backspace/Delete) if typing in an input
        if (renamingId !== null || (e.target as HTMLElement).tagName === 'INPUT') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }

        if (!activeFileId) return;
        const activeFile = files.find((f: any) => f.id === activeFileId);
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
          handleDelete(activeFileId);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          setClipboard({ action: 'copy', file: activeFile });
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
          setClipboard({ action: 'cut', file: activeFile });
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          handlePaste(activeFile?.parentId || null);
        } else if (e.key === 'F2') {
          setRenamingId(activeFileId);
          setRenameText(activeFile?.name || '');
        }
      }}
    >
      {/* Hide Resize handles on Mobile */}
      {!isMobile && <div className="absolute right-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingSidebar(true)} />}
      {!isMobile && isResizingSidebar && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}

      <div className="h-[44px] md:h-[35px] flex items-center px-3 text-[12px] md:text-[11px] font-bold tracking-[0.08em] uppercase text-gray-600 dark:text-[#cccccc] shrink-0 select-none">
        {activeView}
        {activeView === 'explorer' && (
          <div className="ml-auto flex gap-1.5 md:gap-0.5 pr-2">
            
            <input type="file" id="file-upload" multiple className="hidden" style={{display: 'none'}} onChange={handleUpload} />

            <div className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center cursor-pointer rounded-[3px] text-gray-500 dark:text-[#858585] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] hover:text-gray-800 dark:hover:text-[#cccccc]" title="New File" onClick={() => handleCreate(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <div className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center cursor-pointer rounded-[3px] text-gray-500 dark:text-[#858585] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] hover:text-gray-800 dark:hover:text-[#cccccc]" title="New Folder" onClick={() => handleCreate(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            </div>
            
            <div className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center cursor-pointer rounded-[3px] text-gray-500 dark:text-[#858585] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] hover:text-gray-800 dark:hover:text-[#cccccc]" title="Upload File(s)" onClick={() => document.getElementById('file-upload')?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto flex flex-col py-1 pb-[env(safe-area-inset-bottom)]" onContextMenu={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file: { id: null, isFolder: true, name: projectName, isRoot: true } }); }}}>
        {activeView === 'explorer' && (
          <div className="flex-1">
            <div 
              className="group relative flex items-center px-2 py-2 md:py-0.5 text-[14px] md:text-[13px] font-bold cursor-pointer select-none whitespace-nowrap text-gray-700 dark:text-[#cccccc] hover:bg-gray-200/50 dark:hover:bg-[#2a2d2e] transition-colors" 
              onClick={() => toggleFolder('root')} 
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, file: { id: null, isFolder: true, name: projectName, isRoot: true } }); }}
            >
              <svg className={`w-4 h-4 mr-0.5 text-gray-500 dark:text-[#858585] transition-transform ${expandedFolders.includes('root') ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              {renamingId === 'root' ? (
                <input 
                  autoFocus 
                  type="search"
                  enterKeyHint="done" /* 🟢 THE FIX */
                  autoComplete="off"
                  className="bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-white border border-[#007acc] outline-none text-[13px] px-1 ml-1 w-[80%] [&::-webkit-search-cancel-button]:hidden" 
                  value={renameText} 
                  onChange={(e) => setRenameText(e.target.value)} 
                  onBlur={handleRenameSubmit} 
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()} 
                  onClick={(e) => e.stopPropagation()} 
                />
              ) : (
                <span className="ml-1">{projectName ? projectName.toUpperCase() : 'WORKSPACE'}</span>
              )}

              {/* 🟢 NEW: Three Dots for Root Folder */}
              <div 
                className={`absolute right-1 ${isMobile ? 'opacity-100 p-2' : 'opacity-0 group-hover:opacity-100 p-0.5'} hover:bg-gray-300 dark:hover:bg-[#3c3c3c] rounded transition-opacity`}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setContextMenu({ 
                    x: isMobile ? rect.right - 150 : rect.right, 
                    y: rect.bottom, 
                    file: { id: null, isFolder: true, name: projectName, isRoot: true } 
                  });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </div>
            </div>
            {expandedFolders.includes('root') && renderTree(null, 1)}
          </div>
        )}
      </div>

      {contextMenu && (
        <div className="fixed z-50 bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#454545] shadow-xl rounded-[4px] py-1 w-48 text-[14px] md:text-[13px] text-gray-800 dark:text-[#cccccc]" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.file.isFolder && clipboard && <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { handlePaste(contextMenu.file.id); setContextMenu(null); }}>Paste</div>}
          <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { handleDownload(contextMenu.file); setContextMenu(null); }}>Download</div>
          <div className="h-[1px] bg-gray-200 dark:bg-[#454545] my-1"></div>
          {contextMenu.file.isRoot && <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setRenamingId('root'); setRenameText(projectName); setContextMenu(null); }}>Rename</div>}
          {contextMenu.file.id && (
            <>
              <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setClipboard({ action: 'copy', file: contextMenu.file }); setContextMenu(null); }}>Copy</div>
              <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setClipboard({ action: 'cut', file: contextMenu.file }); setContextMenu(null); }}>Cut</div>
              <div className="h-[1px] bg-gray-200 dark:bg-[#454545] my-1"></div>
              <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setRenamingId(contextMenu.file.id); setRenameText(contextMenu.file.name); setContextMenu(null); }}>Rename</div>
              <div className="px-6 py-2.5 md:py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { handleDuplicate(contextMenu.file); setContextMenu(null); }}>Duplicate</div>
              <div className="h-[1px] bg-gray-200 dark:bg-[#454545] my-1"></div>
              <div className="px-6 py-2.5 md:py-1 hover:bg-red-500 hover:text-white cursor-pointer text-red-500 dark:text-red-400" onClick={() => { handleDelete(contextMenu.file.id); setContextMenu(null); }}>Delete</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}