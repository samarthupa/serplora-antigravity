import React from 'react';
import CompilerShell from './CompilerShell';
import { useHtmlRunner } from './adapters/useHtmlRunner';
import IframePreview from './output/IframePreview'; 

export default function HtmlWorkspace({ title, initialFiles, showConsole = true }: any) {
  const { previewContent, logs, execute, runningFile } = useHtmlRunner();

  return (
    <CompilerShell
      showConsole={showConsole} 
      title={title}
      initialFiles={initialFiles}
      editorConsoleLogs={logs} 
      onRun={async (files: any[], activeFile: any) => {
        execute(files, activeFile);
      }}
      OutputPane={(layoutProps: any) => (
        <IframePreview 
          {...layoutProps} 
          previewContent={previewContent} 
          runningFile={runningFile} 
        />
      )}
    />
  );
}