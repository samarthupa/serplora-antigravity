import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useJsRunner } from './adapters/useJsRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function JsWorkspace({ title, initialFiles }: any) {
  const { logs, isRunning, execute, abort, clearLogs } = useJsRunner();
  const shellRef = useRef<any>(null);

  // Clear the run cache automatically when execution stops. 
  // This ensures the "Run" button always works, even if the code hasn't changed.
  useEffect(() => {
    if (!isRunning && shellRef.current?.clearCacheForFile) {
       const targetFileId = initialFiles.find((f: any) => !f.isFolder && f.name.endsWith('.js'))?.id || initialFiles[0]?.id;
       if (targetFileId) {
         shellRef.current.clearCacheForFile(targetFileId);
       }
    }
  }, [isRunning, initialFiles]);

  return (
    <CompilerShell
      ref={shellRef} 
      showConsole={false} // Force false: JS uses the Terminal output on the right, not the bottom console
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
          isWaitingForInput={false}
        />
      )}
    />
  );
}