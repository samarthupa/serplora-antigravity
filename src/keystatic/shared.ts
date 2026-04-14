import { fields } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';
import { KeystaticPreformattedPreview } from '../components/keystatic/KeystaticPreformattedPreview';

export const seoSchema = fields.object({
    metaTitle: fields.text({ label: 'Meta Title', description: 'Overrides the default page title. Leave blank to auto-generate.' }),
    metaDescription: fields.text({ label: 'Meta Description', multiline: true, description: 'Keep it under 160 characters.' }),
    canonicalUrl: fields.text({ label: 'Canonical URL', description: 'Leave blank to use the current auto-generated URL.' }),
    robotsIndex: fields.checkbox({ label: 'Allow Search Engines to Index (index)', defaultValue: true }),
    robotsFollow: fields.checkbox({ label: 'Allow Search Engines to Follow Links (follow)', defaultValue: true }),
}, { label: 'SEO & Meta Tags' });

export const customCodeBlocks = {
    preformatted: block({
        label: '📝 Preformatted Text (<pre>)',
        ContentView: KeystaticPreformattedPreview,
        schema: {
            text: fields.text({ label: 'Raw Text / Terminal Output', multiline: true })
        }
    })
};