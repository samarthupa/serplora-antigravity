import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useJsRunner } from './adapters/useJsRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function JsWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { 
    processLogs, // 🟢 NOW TABS!
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
      allowReRunWithoutEdit={true}
      onRun={async (files: any[], activeFile: any) => {
        await execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <TerminalPreview 
          {...layoutProps} 
          processLogs={processLogs} // 🟢 Pass the new object format
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