import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useRemoteRunner } from './adapters/useRemoteRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function PythonWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { 
    logs, 
    runningFile, 
    isRunning, 
    isWaitingForInput, 
    execute, 
    abort,      
    clearLogs, 
    handleInputSubmit 
  } = useRemoteRunner('https://api.serplora.com/python');

  const shellRef = useRef<any>(null);

  // Error Recovery Logic
  useEffect(() => {
    if (logs && logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      // If last message was an error or a system termination/timeout
      if (lastLog.type === 'err' || (lastLog.type === 'sys' && lastLog.content.includes('Terminated'))) {
        if (shellRef.current?.clearCacheForFile && runningFile) {
          shellRef.current.clearCacheForFile(runningFile.id);
        }
      }
    }
  }, [logs, runningFile]);

  return (
    <CompilerShell
      ref={shellRef} 
      showConsole={showConsole} 
      title={title}
      initialFiles={initialFiles}
      isRunning={isRunning}
      onAbort={abort} 
      cooldownDuration={1500} // 🟢 NEW: 1.5 second UI lock passed to shell
      onRun={async (files: any[], activeFile: any) => {
        await execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <TerminalPreview 
          {...layoutProps} 
          logs={logs}
          onClear={clearLogs}
          isWaitingForInput={isWaitingForInput}
          onInputSubmit={handleInputSubmit}
          runningFile={runningFile} 
          isRunning={isRunning} 
          onAbort={abort} 
        />
      )}
    />
  );
}