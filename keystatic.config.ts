import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
    // 👇 Pure local storage. Keystatic is now completely decoupled from Cloudflare.
    storage: {
        kind: 'local', 
    },
          
    collections: {
        posts: collection({
            label: 'Blog Posts',
            slugField: 'title',
            path: 'src/content/posts/*/',
            format: { contentField: 'content' },
            previewUrl: '/blog/{slug}',
            schema: {
                title: fields.slug({ 
                    name: { label: 'Title' },
                    slug: { label: 'SEO Slug', description: 'Auto-generates from the title.' }
                }),
                draft: fields.checkbox({ label: 'Draft', description: 'Take this post fully offline', defaultValue: false }),
                
                authorName: fields.text({ label: 'Author Name', defaultValue: 'Serplora Team' }),
                authorImage: fields.image({ label: 'Author Avatar', directory: 'public/images/avatars', publicPath: '/images/avatars/' }),
                publishDate: fields.date({ label: 'Publish Date', defaultValue: { kind: 'today' } }),
                updatedDate: fields.date({ label: 'Last Modified Date (Optional)', description: 'Leave blank to just show publish date' }),
                
                image: fields.image({ label: 'Featured Image', directory: 'public/images/posts', publicPath: '/images/posts/' }),
                excerpt: fields.text({ label: 'Excerpt', multiline: true }),
                
                faqs: fields.array(
                    fields.object({
                        question: fields.text({ label: 'Question' }),
                        answer: fields.text({ label: 'Answer', multiline: true })
                    }),
                    { label: 'FAQs (Optional)', itemLabel: props => props.fields.question.value || 'New FAQ' }
                ),
                
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
                title: fields.slug({ 
                    name: { label: 'Title' },
                    slug: { 
                        label: 'SEO Slug', 
                        description: 'Auto-generates from the title, but you can edit it to be shorter and cleaner for SEO (e.g. "xbox-guide").' 
                    }
                }),
                draft: fields.checkbox({ label: 'Draft', description: 'Take this page fully offline (returns a 404 Not Found)', defaultValue: false }),
                excerpt: fields.text({ label: 'Excerpt (HTML Allowed)', multiline: true }),
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
                favicon: fields.image({ 
            label: 'Favicon (.png, .svg, or .ico)', 
            directory: 'public/images/favicon', 
            publicPath: '/images/favicon/', 
            validation: { isRequired: false } 
        }),
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
                    label: fields.text({ label: 'Primary Button Label', defaultValue: 'Sign up for free' }), // Updated default label
                    url: fields.text({ label: 'Primary Button URL', defaultValue: '#' }),
                    show: fields.checkbox({ label: 'Show Primary Button', defaultValue: true })
                }, { label: 'Primary Button (Solid/Right)' })
                // Completely removed the secondaryButton schema here
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
    },
});