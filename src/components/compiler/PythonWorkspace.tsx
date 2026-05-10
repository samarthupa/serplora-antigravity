import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useRemoteRunner } from './adapters/useRemoteRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function PythonWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { 
    processLogs, // 🟢 Updated destructure
    runningFile, 
    isRunning, 
    isWaitingForInput, 
    execute, 
    abort,      
    clearLogs, 
    handleInputSubmit 
  } = useRemoteRunner('https://api.serplora.com/python');

  const shellRef = useRef<any>(null);

  // Error Recovery Logic checks all tracked processes
  useEffect(() => {
    Object.keys(processLogs).forEach(fileId => {
      const logs = processLogs[fileId].logs;
      if (logs && logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        if (lastLog.type === 'err' || (lastLog.type === 'sys' && lastLog.content.includes('Terminated'))) {
          if (shellRef.current?.clearCacheForFile) {
            shellRef.current.clearCacheForFile(fileId);
          }
        }
      }
    });
  }, [processLogs]);

  return (
    <CompilerShell
      ref={shellRef} 
      showConsole={showConsole} 
      title={title}
      initialFiles={initialFiles}
      isRunning={isRunning}
      onAbort={abort} 
      cooldownDuration={1500}
      onRun={async (files: any[], activeFile: any) => {
        await execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <TerminalPreview 
          {...layoutProps} 
          processLogs={processLogs} // 🟢 Pass the new object format
          onClear={clearLogs}
          isWaitingForInput={isWaitingForInput}
          onInputSubmit={handleInputSubmit}
          runningFile={runningFile} 
          isRunning={isRunning} 
        />
      )}
    />
  );
}