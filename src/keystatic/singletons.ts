// src/keystatic/singletons.ts
import { singleton, fields } from '@keystatic/core';
import { seoSchema, createGlobalEditor } from './shared';

export const homePage = singleton({
    label: 'Home Page',
    path: 'src/content/homePage/index',
    format: { contentField: 'content' },
    schema: {
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)' }),
        seo: seoSchema,
        content: createGlobalEditor('Page Content', 'pages'),
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
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true }),
        hiddenPosts: fields.array(fields.relationship({ label: 'Blog Post', collection: 'posts' }), { label: 'Hide Specific Posts' }),
        
        // 🟢 NEW: Pagination Settings
        postsPerPage: fields.integer({ 
            label: 'Posts Per Page', 
            defaultValue: 9, 
            validation: { min: 1 } 
        }),
        paginationTitleTemplate: fields.text({ 
            label: 'Pagination Title Template', 
            defaultValue: ' - Page {page}', 
            description: 'Appended to the meta title on page 2+ (Use {page} as a variable).' 
        }),
        noindexPaginated: fields.checkbox({ 
            label: 'Noindex Paginated Pages', 
            defaultValue: true, 
            description: 'Tell Google not to index Page 2, Page 3, etc. (Recommended to save crawl budget).' 
        }),
        
        seo: seoSchema,
    },
});

export const tutorialsPage = singleton({
    label: 'Tutorials Index Page',
    path: 'src/content/tutorialsPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'Tutorials & Guides' }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true }),
        hiddenTutorials: fields.array(fields.relationship({ label: 'Tutorial', collection: 'tutorials' }), { label: 'Hide Specific Tutorials' }),
        seo: seoSchema,
    },
});

// 🟢 NEW: Quizzes Index Page Singleton
export const quizzesPage = singleton({
    label: 'Quizzes Index Page',
    path: 'src/content/quizzesPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'All Quizzes' }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true, defaultValue: 'Choose a topic below to test your knowledge.' }),
        seo: seoSchema,
    },
});

// 🟢 NEW: Compilers Index Page Singleton
export const compilersPage = singleton({
    label: 'Compilers Index Page',
    path: 'src/content/compilersPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'Online Compilers' }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true, defaultValue: 'Write, run, and test code directly in your browser without any installation or setup.' }),
        seo: seoSchema,
    },
});

// 🟢 NEW: Authors Index Page Singleton
export const authorsPage = singleton({
    label: 'Authors Index Page',
    path: 'src/content/authorsPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'Our Authors' }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true, defaultValue: 'Meet the team of developers and technical writers building the future of online education.' }),
        
        // 🟢 NEW: Pagination Settings
        postsPerPage: fields.integer({ 
            label: 'Posts Per Page', 
            defaultValue: 9, 
            validation: { min: 1 } 
        }),
        paginationTitleTemplate: fields.text({ 
            label: 'Pagination Title Template', 
            defaultValue: ' - Page {page}', 
            description: 'Appended to the meta title on page 2+ (Use {page} as a variable).' 
        }),
        noindexPaginated: fields.checkbox({ 
            label: 'Noindex Paginated Pages', 
            defaultValue: true, 
            description: 'Tell Google not to index Page 2, Page 3, etc. (Recommended to save crawl budget).' 
        }),
        
        seo: seoSchema,
    },
});

// Add this to your exports in src/keystatic/singletons.ts
export const projectsPage = singleton({
    label: 'Projects Index Page',
    path: 'src/content/projectsPage/data',
    format: { data: 'json' },
    schema: {
        headline: fields.text({ label: 'Headline', defaultValue: 'Our Projects' }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)' }),
        subheadline: fields.text({ label: 'Subheadline', multiline: true, defaultValue: 'Explore our latest builds.' }),
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