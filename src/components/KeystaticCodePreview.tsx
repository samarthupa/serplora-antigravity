import React from 'react';

export function KeystaticCodePreview(props) {
    const code = props.value?.code || '';
    const language = props.value?.language || 'code';

    return (
        <div style={{ 
            backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '16px', 
            border: '1px solid #444', cursor: 'pointer', margin: '16px 0'
        }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {language} Editor (Click to edit in sidebar)
            </div>
            <pre style={{ 
                margin: 0, color: '#d4d4d4', fontFamily: 'monospace', fontSize: '14px', 
                whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'hidden', 
                opacity: code ? 1 : 0.5 
            }}>
                {code ? code : '// Click here to open the sidebar and add your code...'}
            </pre>
        </div>
    );
}