import React from 'react';
import CompilerShell from './CompilerShell';
import { useHtmlRunner } from './adapters/useHtmlRunner';
import IframePreview from './output/IframePreview'; 

export default function HtmlWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { processPreviews, processLogs, execute, runningFile } = useHtmlRunner();

  // Extract the active file's console logs to pass to the CompilerShell
  const activeConsoleLogs = runningFile && processLogs[runningFile.id] ? processLogs[runningFile.id].logs : [];

  return (
    <CompilerShell
      showConsole={showConsole} 
      title={title}
      initialFiles={initialFiles}
      editorConsoleLogs={activeConsoleLogs} 
      allowReRunWithoutEdit={true}
      onRun={async (files: any[], activeFile: any) => {
        execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <IframePreview 
          {...layoutProps} 
          processPreviews={processPreviews} // 🟢 Pass the tabs data!
          runningFile={runningFile} 
        />
      )}
    />
  );
}