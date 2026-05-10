import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useJsRunner } from './adapters/useJsRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function JsWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { 
    logs, 
    runningFile, 
    isRunning, 
    execute, 
    abort, 
    clearLogs, 
    isWaitingForInput, 
    submitInput 
  } = useJsRunner();
  
  const shellRef = useRef<any>(null);

  useEffect(() => {
    if (logs && logs.length > 0) {
      const lastLog = logs[logs.length - 1];
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
      onRun={async (files: any[], activeFile: any) => {
        await execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <TerminalPreview 
          {...layoutProps} 
          logs={logs}
          onClear={clearLogs}
          isWaitingForInput={isWaitingForInput}
          onInputSubmit={submitInput}
          runningFile={runningFile} 
          isRunning={isRunning} 
          onAbort={abort} 
        />
      )}
    />
  );
}