import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useRemoteRunner } from './adapters/useRemoteRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function PythonWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { 
    logsByFile, 
    isRunning, 
    isWaitingForInput, 
    execute, 
    abort,      
    clearLogs, 
    handleInputSubmit 
  } = useRemoteRunner('https://api.serplora.com/python');

  // 🌟 NEW: Reference to the shell's internal history setter
  const shellRef = useRef<any>(null);

  // 🌟 NEW: Error Recovery Logic
  // If the last log entry is an error or system timeout, we tell the shell 
  // to forget this run so the user can click "Run" again without changing code.
  useEffect(() => {
    Object.keys(logsByFile).forEach(fileId => {
      const logs = logsByFile[fileId];
      if (logs && logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        // If last message was an error or a system termination/timeout
        if (lastLog.type === 'err' || (lastLog.type === 'sys' && lastLog.content.includes('Terminated'))) {
          if (shellRef.current?.clearCacheForFile) {
            shellRef.current.clearCacheForFile(fileId);
          }
        }
      }
    });
  }, [logsByFile]);

  return (
    <CompilerShell
      ref={shellRef} // 🌟 Attach the ref
      showConsole={showConsole} 
      title={title}
      initialFiles={initialFiles}
      isRunning={isRunning}
      onAbort={abort} 
      onRun={async (files: any[], activeFile: any) => {
        await execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <TerminalPreview 
          {...layoutProps} 
          logs={logsByFile[layoutProps.activeFileId] || []}
          onClear={() => clearLogs(layoutProps.activeFileId)}
          isWaitingForInput={isWaitingForInput}
          onInputSubmit={handleInputSubmit}
        />
      )}
    />
  );
}