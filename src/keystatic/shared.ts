// src/keystatic/shared.ts
import { fields } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';
import { KeystaticPreformattedPreview } from '../components/keystatic/KeystaticPreformattedPreview';
import { KeystaticCodePreview } from '../components/keystatic/KeystaticCodePreview';
import { KeystaticHtmlPreview } from '../components/keystatic/KeystaticHtmlPreview'; // 🟢 NEW IMPORT

export const seoSchema = fields.object({
    metaTitle: fields.text({ label: 'Meta Title', description: 'Overrides the default page title. Leave blank to auto-generate.' }),
    metaDescription: fields.text({ label: 'Meta Description', multiline: true, description: 'Keep it under 160 characters.' }),
    canonicalUrl: fields.text({ label: 'Canonical URL', description: 'Leave blank to use the current auto-generated URL.' }),
    robotsIndex: fields.checkbox({ label: 'Allow Search Engines to Index (index)', defaultValue: true }),
    robotsFollow: fields.checkbox({ label: 'Allow Search Engines to Follow Links (follow)', defaultValue: true }),

    disableStickyHeader: fields.checkbox({ 
        label: 'Disable Smart Sticky Header', 
        description: 'Check this to make the header scroll naturally with the page instead of hiding/appearing on scroll.',
        defaultValue: false 
    }),

    schemaType: fields.select({
      label: 'Structured Data (Schema.org)',
      description: 'Select the primary schema type for this page.',
      options: [
        { label: 'None (Global Organization only)', value: 'none' },
        { label: 'Article / Blog Post', value: 'BlogPosting' },
        { label: 'Technical Article / Guide', value: 'TechArticle' },
        { label: 'Software / Compiler Tool', value: 'WebApplication' },
        { label: 'Quiz / Multiple Choice', value: 'Quiz' }
      ],
      defaultValue: 'none',
    }),
    
}, { label: 'SEO & Meta Tags' });

export const customCodeBlocks = {
    preformatted: block({
        label: '📝 Preformatted Text (<pre>)',
        ContentView: KeystaticPreformattedPreview,
        schema: {
            text: fields.text({ label: 'Raw Text / Terminal Output', multiline: true })
        }
    }),
    codeEditor: block({
        label: '▶️ Interactive Code Editor',
        ContentView: KeystaticCodePreview,
        schema: { 
            language: fields.text({ label: 'Language', defaultValue: 'python' }), 
            code: fields.text({ label: 'Initial Code', multiline: true }) 
        }
    }),
    // 🟢 NEW: Raw HTML Block
    rawHtml: block({
        label: '🌐 Raw HTML',
        ContentView: KeystaticHtmlPreview,
        schema: {
            html: fields.text({ label: 'HTML Code', multiline: true })
        }
    })
};

// Global Editor Factory
export const createGlobalEditor = (label: string, imageFolder?: string) => {
    return fields.markdoc({
        label,
        components: customCodeBlocks, // Globally applied to all editors!
        options: imageFolder ? {
            image: {
                directory: `public/images/${imageFolder}`,
                publicPath: `/images/${imageFolder}/`,
            }
        } : undefined,
    });
};