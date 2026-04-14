import { singleton, fields } from '@keystatic/core';
import { seoSchema } from './shared';

export const homePage = singleton({
    label: 'Home Page',
    path: 'src/content/homePage/index',
    format: { contentField: 'content' },
    schema: {
        headline: fields.text({ label: 'Main Headline', defaultValue: 'Welcome to Serplora' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true }),
        seo: seoSchema,
        content: fields.markdoc({ label: 'Page Content', options: { image: { directory: 'public/images/pages', publicPath: '/images/pages/' } } }),
    },
});

export const header = singleton({
    label: 'Site Header',
    path: 'src/content/header/data',
    format: { data: 'json' },
    schema: {
        siteTitle: fields.text({ label: 'Site Title' }),
        logo: fields.image({ label: 'Logo Image (Light)', directory: 'public/images/logo', publicPath: '/images/logo/', validation: { isRequired: false } }),
        logoDark: fields.image({ label: 'Logo Image (Dark)', directory: 'public/images/logo', publicPath: '/images/logo/', validation: { isRequired: false } }),
        favicon: fields.image({ label: 'Favicon', directory: 'public/images/favicon', publicPath: '/images/favicon/', validation: { isRequired: false } }),
        navItems: fields.array(
            fields.object({ label: fields.text({ label: 'Menu Label' }), url: fields.text({ label: 'Link URL', defaultValue: '#' }), subItems: fields.array(fields.object({ label: fields.text({ label: 'Sub-Menu Label' }), url: fields.text({ label: 'Sub-Menu URL', defaultValue: '#' }) }), { label: 'Sub-Menu Items', itemLabel: props => props.fields.label.value || 'Sub-Menu Item' }) }),
            { label: 'Navigation Menu Items', itemLabel: props => props.fields.label.value || 'Menu Item' }
        ),
        primaryButton: fields.object({ label: fields.text({ label: 'Primary Button Label', defaultValue: 'Sign up' }), url: fields.text({ label: 'Button URL', defaultValue: '#' }), show: fields.checkbox({ label: 'Show Primary Button', defaultValue: true }) }, { label: 'Primary Button' })
    },
});

export const footer = singleton({
    label: 'Site Footer',
    path: 'src/content/footer/data',
    format: { data: 'json' },
    schema: {
        brand: fields.object({ show: fields.checkbox({ label: 'Show Brand', defaultValue: false }), text: fields.text({ label: 'Site Name' }), logo: fields.image({ label: 'Custom Logo', directory: 'public/images/footer-logo', publicPath: '/images/footer-logo/' }) }, { label: 'Brand & Logo' }),
        description: fields.text({ label: 'Description', multiline: true }),
        columns: fields.array(fields.object({ title: fields.text({ label: 'Column Title' }), links: fields.array(fields.object({ label: fields.text({ label: 'Link Label' }), url: fields.text({ label: 'URL', defaultValue: '#' }) }), { label: 'Links', itemLabel: props => props.fields.label.value || 'Link' }) }), { label: 'Footer Link Columns', itemLabel: props => props.fields.title.value || 'Column' }),
        socialLinks: fields.array(fields.object({ platform: fields.select({ label: 'Platform', options: [{ label: 'Twitter', value: 'twitter' }, { label: 'GitHub', value: 'github' }, { label: 'LinkedIn', value: 'linkedin' }, { label: 'YouTube', value: 'youtube' }], defaultValue: 'twitter' }), url: fields.text({ label: 'Profile URL', defaultValue: '#' }) }), { label: 'Social Profiles', itemLabel: props => props.fields.platform.value || 'Social Profile' }),
        copyrightText: fields.text({ label: 'Copyright Text', defaultValue: '© 2026 Serplora.' })
    }
});

export const blogPage = singleton({
    label: 'Blog Index Page',
    path: 'src/content/blogPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'Our Blog' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true }),
        hiddenPosts: fields.array(fields.relationship({ label: 'Blog Post', collection: 'posts' }), { label: 'Hide Specific Posts' }),
        seo: seoSchema,
    },
});

export const tutorialsPage = singleton({
    label: 'Tutorials Index Page',
    path: 'src/content/tutorialsPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'Tutorials & Guides' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true }),
        hiddenTutorials: fields.array(fields.relationship({ label: 'Tutorial', collection: 'tutorials' }), { label: 'Hide Specific Tutorials' }),
        seo: seoSchema,
    },
});

export const sidebarAds = singleton({
    label: 'Sidebar Ads Manager',
    path: 'src/content/sidebarAds/data',
    format: { data: 'json' },
    schema: {
        globalAd: fields.text({ label: 'Global Fallback Ad', multiline: true }),
        tutorialAdsGroup: fields.object({ allTutorialsAd: fields.text({ label: 'All Tutorials Ad', multiline: true }), specificOverrides: fields.array(fields.object({ target: fields.relationship({ label: 'Select Tutorial', collection: 'tutorials' }), adContent: fields.text({ label: 'Ad Content', multiline: true }) }), { label: 'Overrides', itemLabel: props => `Override: ${props.fields.target.value}` }) }, { label: 'Tutorials Placement' }),
        compilerAdsGroup: fields.object({ allCompilersAd: fields.text({ label: 'All Compilers Ad', multiline: true }), specificOverrides: fields.array(fields.object({ target: fields.relationship({ label: 'Select Compiler', collection: 'compilers' }), adContent: fields.text({ label: 'Ad Content', multiline: true }) }), { label: 'Overrides', itemLabel: props => `Override: ${props.fields.target.value}` }) }, { label: 'Compilers Placement' })
    },
});