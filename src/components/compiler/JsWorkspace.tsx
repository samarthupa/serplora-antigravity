// compiler/JsWorkspace.tsx
import React, { useEffect, useRef } from 'react';
import CompilerShell from './CompilerShell';
import { useJsRunner } from './adapters/useJsRunner';
import TerminalPreview from './output/TerminalPreview'; 

export default function JsWorkspace({ title, initialFiles, showConsole = true }: any) {
  // 🟢 UPDATED: Destructure the new properties from the hook
  const { logs, isRunning, execute, abort, clearLogs, isWaitingForInput, submitInput } = useJsRunner();
  const shellRef = useRef<any>(null);

  useEffect(() => {
    if (logs && logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      if (lastLog.type === 'err' || (lastLog.type === 'sys' && lastLog.content.includes('Terminated'))) {
        const targetFileId = initialFiles.find((f: any) => !f.isFolder && f.name.endsWith('.js'))?.id;
        if (targetFileId && shellRef.current?.clearCacheForFile) {
          shellRef.current.clearCacheForFile(targetFileId);
        }
      }
    }
  }, [logs, initialFiles]);

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
          // 🟢 UPDATED: Pass the dynamic properties to the UI
          isWaitingForInput={isWaitingForInput}
          onInputSubmit={submitInput}
        />
      )}
    />
  );
}