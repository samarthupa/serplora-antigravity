// src/components/keystatic/KeystaticHtmlPreview.tsx
import React from 'react';

export function KeystaticHtmlPreview(props: { value: { html: string } }) {
    return (
        <div style={{ padding: '1rem', backgroundColor: '#1e1e1e', color: '#d4d4d4', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                🌐 Raw HTML
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px', fontFamily: 'monospace' }}>
                {props.value.html || ''}
            </pre>
        </div>
    );
}