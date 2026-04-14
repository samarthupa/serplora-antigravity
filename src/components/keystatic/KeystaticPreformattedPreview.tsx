import React from 'react';

export const KeystaticPreformattedPreview = (props: { value: { text: string } }) => {
  return (
    <pre style={{
      backgroundColor: '#1e1e1e',
      color: '#e2e8f0',
      padding: '16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      whiteSpace: 'pre-wrap',
      margin: 0
    }}>
      {props.value.text || 'Empty preformatted text block...'}
    </pre>
  );
};