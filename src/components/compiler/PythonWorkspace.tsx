import React from 'react';
import CompilerShell from './CompilerShell';
import { useRemoteRunner } from './adapters/useRemoteRunner';
import TerminalPreview from './output/TerminalPreview'; 

// 🟢 Notice showConsole = true added here in the props
export default function PythonWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { 
    logs, 
    isRunning, 
    isWaitingForInput, 
    execute, 
    clearLogs, 
    handleInputSubmit 
  } = useRemoteRunner('https://api.serplora.com/python');

  return (
    <CompilerShell
      showConsole={showConsole} // 🟢 Passed down to the shell
      title={title}
      initialFiles={initialFiles}
      isRunning={isRunning}
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
        />
      )}
    />
  );
}