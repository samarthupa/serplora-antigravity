import React, { useState, useEffect } from 'react';

export default function Sidebar({ activeView, files, setFiles, activeFileId, setActiveFileId, projectName, setProjectName }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['root']);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: any } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut', file: any } | null>(null);
  
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

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

  const collapseAll = () => setExpandedFolders(['root']);

  const handleCreate = (isFolder: boolean) => {
    const activeItem = files.find((f:any) => f.id === activeFileId);
    const parentId = activeItem ? (activeItem.isFolder ? activeItem.id : (activeItem.parentId || null)) : null;
    if (parentId && !expandedFolders.includes(parentId)) setExpandedFolders([...expandedFolders, parentId]);
    
    const newId = Date.now().toString();
    const newItem = {
      id: newId, name: '', isFolder, parentId: parentId,
      content: isFolder ? undefined : '', language: isFolder ? undefined : 'javascript'
    };
    
    setFiles([...files, newItem]);
    setRenamingId(newId);
    setRenameText(isFolder ? 'New Folder' : 'New File');
  };

  const handleRenameSubmit = () => {
    if (renamingId === 'root') {
      if (renameText.trim() !== '') setProjectName(renameText);
      setRenamingId(null);
      return;
    }
    if (renameText.trim() === '') {
      setFiles(files.filter((f: any) => f.id !== renamingId));
    } else {
      setFiles(files.map((f: any) => f.id === renamingId ? { ...f, name: renameText } : f));
      if (!files.find((f:any)=>f.id === renamingId)?.isFolder) {
         setFiles((prev:any) => prev.map((f:any) => f.id === renamingId ? {...f, language: renameText.endsWith('.html') ? 'html' : renameText.endsWith('.css') ? 'css' : renameText.endsWith('.py') ? 'python' : 'javascript'} : f));
      }
    }
    setRenamingId(null);
  };

  const handleDelete = (idToDelete: string) => {
    setFiles(files.filter((f: any) => f.id !== idToDelete && f.parentId !== idToDelete));
    if (activeFileId === idToDelete) setActiveFileId(files.find((f:any) => !f.isFolder)?.id || null);
  };

  const handleDuplicate = (fileToDuplicate: any) => {
    const newId = Date.now().toString();
    setFiles([...files, { ...fileToDuplicate, id: newId, name: `${fileToDuplicate.name} copy` }]);
  };

  const handlePaste = (targetParentId: string | null) => {
    if (!clipboard) return;
    const newId = Date.now().toString();
    if (clipboard.action === 'cut') {
      setFiles(files.map((f:any) => f.id === clipboard.file.id ? { ...f, parentId: targetParentId } : f));
      setClipboard(null); 
    } else {
      setFiles([...files, { ...clipboard.file, id: newId, parentId: targetParentId, name: `${clipboard.file.name} copy` }]);
    }
  };

  const handleDownload = (file: any) => {
    if (!file.id || file.isFolder) {
      const getFolderFiles = (parentId: string | null) => {
          let result: any[] = [];
          files.forEach((f: any) => {
              if (f.parentId === parentId) {
                  result.push(f);
                  if (f.isFolder) result = result.concat(getFolderFiles(f.id));
              }
          });
          return result;
      };
      const folderContents = getFolderFiles(file.id);
      const fileName = file.id ? `${file.name}-backup.json` : `${projectName.replace(/\s+/g, '-').toLowerCase()}-backup.json`;
      const element = document.createElement("a");
      const fileBlob = new Blob([JSON.stringify({ folder: file.name, contents: folderContents }, null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(fileBlob);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      const element = document.createElement("a");
      const fileBlob = new Blob([file.content], {type: 'text/plain'});
      element.href = URL.createObjectURL(fileBlob);
      element.download = file.name || 'untitled.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const renderTree = (parentId: string | null, level: number = 0) => {
    const items = files.filter((f: any) => parentId === null ? !f.parentId : f.parentId === parentId);
    items.sort((a: any, b: any) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    });

    return items.map((file: any) => {
      const isExpanded = expandedFolders.includes(file.id);
      const paddingLeft = `${(level * 12) + 8}px`;

      return (
        <div key={file.id}>
          <div 
            style={{ paddingLeft }}
            className={`group relative flex items-center pr-2 py-0.5 text-[13px] cursor-pointer select-none whitespace-nowrap ${
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
                className="bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-white border border-[#007acc] outline-none text-[13px] px-1 w-[80%]"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
              <span className="truncate">{file.name}</span>
            )}

            <div 
              className="absolute right-1 opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-[#3c3c3c] rounded p-0.5 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({ x: rect.right, y: rect.bottom, file });
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

  const searchResults = files.filter((file: any) => {
    if (!searchQuery || file.isFolder) return false;
    const q = searchQuery.toLowerCase();
    return file.name.toLowerCase().includes(q) || (file.content && file.content.toLowerCase().includes(q));
  });

  return (
    <div 
      style={{ width: `${sidebarWidth}px` }} 
      className="bg-gray-50 dark:bg-[#252526] flex flex-col shrink-0 border-r border-gray-300 dark:border-[#3c3c3c] overflow-hidden relative transition-colors"
    >
      <div className="absolute right-[-2px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#007acc] z-20 transition-colors" onMouseDown={() => setIsResizingSidebar(true)} />
      {isResizingSidebar && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}

      <div className="h-[35px] flex items-center px-3 text-[11px] font-bold tracking-[0.08em] uppercase text-gray-600 dark:text-[#cccccc] shrink-0 select-none">
        {activeView}
        {activeView === 'explorer' && (
          <div className="ml-auto flex gap-0.5 pr-2">
            <div className="w-6 h-6 flex items-center justify-center cursor-pointer rounded-[3px] text-gray-500 dark:text-[#858585] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] hover:text-gray-800 dark:hover:text-[#cccccc]" title="New File" onClick={() => handleCreate(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <div className="w-6 h-6 flex items-center justify-center cursor-pointer rounded-[3px] text-gray-500 dark:text-[#858585] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] hover:text-gray-800 dark:hover:text-[#cccccc]" title="New Folder" onClick={() => handleCreate(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            </div>
            <div className="w-6 h-6 flex items-center justify-center cursor-pointer rounded-[3px] text-gray-500 dark:text-[#858585] hover:bg-gray-200 dark:hover:bg-[#2a2d2e] hover:text-gray-800 dark:hover:text-[#cccccc]" title="Collapse Folders" onClick={collapseAll}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3m8-18h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 3v18"/></svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto flex flex-col py-1" onContextMenu={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file: { id: null, isFolder: true, name: projectName, isRoot: true } }); }}}>
        {activeView === 'explorer' && (
          <div className="flex-1">
            <div className="flex items-center px-2 py-0.5 text-[13px] font-bold cursor-pointer select-none whitespace-nowrap text-gray-700 dark:text-[#cccccc] hover:bg-gray-200/50 dark:hover:bg-[#2a2d2e]" onClick={() => toggleFolder('root')} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, file: { id: null, isFolder: true, name: projectName, isRoot: true } }); }}>
              <svg className={`w-4 h-4 mr-0.5 text-gray-500 dark:text-[#858585] transition-transform ${expandedFolders.includes('root') ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              {renamingId === 'root' ? (
                <input autoFocus className="bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-white border border-[#007acc] outline-none text-[13px] px-1 ml-1 w-[80%]" value={renameText} onChange={(e) => setRenameText(e.target.value)} onBlur={handleRenameSubmit} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()} onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="ml-1">{projectName ? projectName.toUpperCase() : 'WORKSPACE'}</span>
              )}
            </div>
            {expandedFolders.includes('root') && renderTree(null, 0)}
          </div>
        )}

        {activeView === 'search' && (
           <div className="flex flex-col h-full overflow-hidden pr-2">
             <div className="px-3 py-2 flex flex-col gap-2 shrink-0">
               <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-[#3c3c3c] text-gray-800 dark:text-[#cccccc] border border-gray-300 dark:border-[#3c3c3c] focus:border-[#007acc] outline-none px-2 py-1 text-[13px]" />
             </div>
             <div className="flex-1 overflow-auto">
               {searchResults.map((file: any) => (
                 <div key={file.id} onClick={() => setActiveFileId(file.id)} className="px-3 py-1.5 cursor-pointer text-[13px] text-gray-700 dark:text-[#cccccc] hover:bg-gray-200/50 dark:hover:bg-[#2a2d2e]">📄 {file.name}</div>
               ))}
             </div>
           </div>
        )}
      </div>

      {contextMenu && (
        <div className="fixed z-50 bg-white dark:bg-[#252526] border border-gray-300 dark:border-[#454545] shadow-xl rounded-[4px] py-1 w-48 text-[13px] text-gray-800 dark:text-[#cccccc]" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.file.isFolder && clipboard && <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { handlePaste(contextMenu.file.id); setContextMenu(null); }}>Paste</div>}
          <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { handleDownload(contextMenu.file); setContextMenu(null); }}>Download</div>
          <div className="h-[1px] bg-gray-200 dark:bg-[#454545] my-1"></div>
          {contextMenu.file.isRoot && <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setRenamingId('root'); setRenameText(projectName); setContextMenu(null); }}>Rename</div>}
          {contextMenu.file.id && (
            <>
              <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setClipboard({ action: 'copy', file: contextMenu.file }); setContextMenu(null); }}>Copy</div>
              <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setClipboard({ action: 'cut', file: contextMenu.file }); setContextMenu(null); }}>Cut</div>
              <div className="h-[1px] bg-gray-200 dark:bg-[#454545] my-1"></div>
              <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { setRenamingId(contextMenu.file.id); setRenameText(contextMenu.file.name); setContextMenu(null); }}>Rename</div>
              <div className="px-6 py-1 hover:bg-[#007acc] hover:text-white cursor-pointer" onClick={() => { handleDuplicate(contextMenu.file); setContextMenu(null); }}>Duplicate</div>
              <div className="h-[1px] bg-gray-200 dark:bg-[#454545] my-1"></div>
              <div className="px-6 py-1 hover:bg-red-500 hover:text-white cursor-pointer text-red-500 dark:text-red-400" onClick={() => { handleDelete(contextMenu.file.id); setContextMenu(null); }}>Delete</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}