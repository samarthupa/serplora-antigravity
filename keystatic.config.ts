import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
    storage: {
        kind: 'local', // Saves directly to your Mac while developing
    },
    collections: {
        posts: collection({
            label: 'Blog Posts',
            slugField: 'title',
            path: 'src/content/posts/*/',
            format: { contentField: 'content' },
            previewUrl: '/blog/{slug}',
            schema: {
                title: fields.text({ label: 'Title', validation: { isRequired: false } }),
                slug: fields.text({ label: 'Custom URL Slug (Auto-population is natively blocked by Astro Zod typing bug)', defaultValue: '', validation: { isRequired: false } }),
                draft: fields.checkbox({ label: 'Draft', description: 'Take this post fully offline (returns a 404 Not Found)', defaultValue: false }),
                description: fields.text({ label: 'Description' }),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),
        tutorials: collection({
            label: 'Tutorials',
            slugField: 'title',
            path: 'src/content/tutorials/*/',
            format: { contentField: 'content' },
            previewUrl: '/tutorials/{slug}',
            schema: {
                title: fields.text({ label: 'Title', validation: { isRequired: false } }),
                slug: fields.text({ label: 'Custom URL Slug (Auto-population is natively blocked by Astro Zod typing bug)', defaultValue: '', validation: { isRequired: false } }),
                draft: fields.checkbox({ label: 'Draft', description: 'Take this page fully offline (returns a 404 Not Found)', defaultValue: false }),
                description: fields.text({ label: 'Description' }),
                content: fields.markdoc({ label: 'Content' }),
            },
        }),
    },
    singletons: {
        header: singleton({
            label: 'Site Header',
            path: 'src/content/header/data',
            format: { data: 'json' },
            schema: {
                siteTitle: fields.text({ label: 'Site Title (Optional)' }),
                logo: fields.image({ label: 'Logo Image (Optional)', directory: 'public/images/logo', publicPath: '/images/logo/', validation: { isRequired: false } }),
                navItems: fields.array(
                    fields.object({
                        label: fields.text({ label: 'Menu Label' }),
                        url: fields.text({ label: 'Link URL', defaultValue: '#' }),
                        subItems: fields.array(
                            fields.object({
                                label: fields.text({ label: 'Sub-Menu Label' }),
                                url: fields.text({ label: 'Sub-Menu URL', defaultValue: '#' }),
                            }),
                            { label: 'Sub-Menu Items (Optional)', itemLabel: props => props.fields.label.value || 'Sub-Menu Item' }
                        )
                    }),
                    { label: 'Navigation Menu Items', itemLabel: props => props.fields.label.value || 'Menu Item' }
                ),
                primaryButton: fields.object({
                    label: fields.text({ label: 'Primary Button Label', defaultValue: 'Sign up free' }),
                    url: fields.text({ label: 'Primary Button URL', defaultValue: '#' }),
                    show: fields.checkbox({ label: 'Show Primary Button', defaultValue: true })
                }, { label: 'Primary Button (Solid/Right)' }),
                secondaryButton: fields.object({
                    label: fields.text({ label: 'Secondary Button Label', defaultValue: 'Log in' }),
                    url: fields.text({ label: 'Secondary Button URL', defaultValue: '#' }),
                    show: fields.checkbox({ label: 'Show Secondary Button', defaultValue: true })
                }, { label: 'Secondary Button (Ghost/Left)' })
            },
        }),
        footer: singleton({
            label: 'Site Footer',
            path: 'src/content/footer/data',
            format: { data: 'json' },
            schema: {
                brand: fields.object({
                    show: fields.checkbox({ label: 'Show Brand in Footer', defaultValue: false }),
                    text: fields.text({ label: 'Custom Site Name (Optional)' }),
                    logo: fields.image({ label: 'Custom Logo Image (Optional)', directory: 'public/images/footer-logo', publicPath: '/images/footer-logo/' })
                }, { label: 'Brand & Logo' }),
                description: fields.text({ label: 'Company Description', multiline: true, defaultValue: 'Building state-of-the-art tools for the web.' }),
                columns: fields.array(
                    fields.object({
                        title: fields.text({ label: 'Column Title' }),
                        links: fields.array(
                            fields.object({
                                label: fields.text({ label: 'Link Label' }),
                                url: fields.text({ label: 'URL', defaultValue: '#' })
                            }),
                            { label: 'Links', itemLabel: props => props.fields.label.value || 'Link' }
                        )
                    }),
                    { label: 'Footer Link Columns', itemLabel: props => props.fields.title.value || 'Column' }
                ),
                socialLinks: fields.array(
                    fields.object({
                        platform: fields.select({
                            label: 'Platform',
                            options: [
                                { label: 'Twitter / X', value: 'twitter' },
                                { label: 'GitHub', value: 'github' },
                                { label: 'LinkedIn', value: 'linkedin' },
                                { label: 'YouTube', value: 'youtube' },
                                { label: 'Facebook', value: 'facebook' },
                                { label: 'Instagram', value: 'instagram' },
                            ],
                            defaultValue: 'twitter'
                        }),
                        url: fields.text({ label: 'Profile URL', defaultValue: '#' })
                    }),
                    { label: 'Social Profiles', itemLabel: props => props.fields.platform.value || 'Social Profile' }
                ),
                copyrightText: fields.text({ label: 'Copyright Text', defaultValue: '© 2026 Serplora. All rights reserved.' })
            }
        }),
        blogPage: singleton({
            label: 'Blog Index Page',
            path: 'src/content/blogPage/data',
            format: { data: 'json' },
            schema: {
                headline: fields.text({ label: 'Headline', defaultValue: 'Our Blog' }),
                subheadline: fields.text({ label: 'Subheadline', defaultValue: 'Read the latest updates, stories, and announcements.', multiline: true }),
                hiddenPosts: fields.array(
                    fields.relationship({ label: 'Blog Post', collection: 'posts' }),
                    {
                        label: 'Hide Specific Posts from Index',
                        description: 'Select any posts you want to explicitly HIDE from the Index Page. By default, all non-draft posts are shown.',
                        itemLabel: props => props.value || 'Select a post',
                    }
                ),
            },
        }),
        tutorialsPage: singleton({
            label: 'Tutorials Index Page',
            path: 'src/content/tutorialsPage/data',
            format: { data: 'json' },
            schema: {
                headline: fields.text({ label: 'Headline', defaultValue: 'Tutorials & Guides' }),
                subheadline: fields.text({ label: 'Subheadline', defaultValue: 'Explore our latest guides and learn step-by-step with state-of-the-art tutorials.', multiline: true }),
                hiddenTutorials: fields.array(
                    fields.relationship({ label: 'Tutorial', collection: 'tutorials' }),
                    {
                        label: 'Hide Specific Tutorials from Index',
                        description: 'Select any tutorials you want to explicitly HIDE from the Index Page. By default, all non-draft tutorials are shown.',
                        itemLabel: props => props.value || 'Select a tutorial',
                    }
                ),
            },
        }),
        diagnosticsDashboard: singleton({
            label: 'System Diagnostics & Health',
            path: 'src/content/diagnosticsDashboard/data',
            format: { data: 'json' },
            schema: {
                notice: fields.text({
                    label: 'System Message',
                    defaultValue: 'Keystatic natively hides corrupted or malformed files from the CMS. To view a complete list of all living files, orphaned directories, and potential data corruptions across all collections, click the "Preview" button above or visit /admin/diagnostics.',
                    multiline: true
                })
            },
            previewUrl: '/admin/diagnostics',
        }),
    },
});