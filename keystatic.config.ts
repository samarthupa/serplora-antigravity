import { config, fields, collection, singleton } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';
import { KeystaticCodePreview } from './src/components/KeystaticCodePreview';

// 🟢 NEW: Reusable SEO Block
const seoSchema = fields.object({
    metaTitle: fields.text({ 
        label: 'Meta Title', 
        description: 'Overrides the default page title. Leave blank to auto-generate from the page title.' 
    }),
    metaDescription: fields.text({ 
        label: 'Meta Description', 
        multiline: true,
        description: 'Keep it under 160 characters for best results.'
    }),
    canonicalUrl: fields.text({ 
        label: 'Canonical URL', 
        description: 'Leave blank to use the current auto-generated URL.' 
    }),
    robotsIndex: fields.checkbox({ 
        label: 'Allow Search Engines to Index (index)', 
        defaultValue: true 
    }),
    robotsFollow: fields.checkbox({ 
        label: 'Allow Search Engines to Follow Links (follow)', 
        defaultValue: true 
    }),
}, { label: 'SEO & Meta Tags' });

export default config({
    storage: {
        kind: 'local', 
    },
          
    collections: {
        // 👇 NEW: Categories Collection
        categories: collection({
            label: 'Categories',
            slugField: 'title',
            path: 'src/content/categories/*',
            format: { data: 'json' }, // Saves purely as data
            schema: {
                title: fields.slug({ name: { label: 'Category Name' } })
            }
        }),

        // 👇 NEW: Tags Collection
        tags: collection({
            label: 'Tags',
            slugField: 'title',
            path: 'src/content/tags/*',
            format: { data: 'json' },
            schema: {
                title: fields.slug({ name: { label: 'Tag Name' } })
            }
        }),

        posts: collection({
            label: 'Articles',
            slugField: 'title',
            path: 'src/content/posts/*/',
            format: { contentField: 'content' },
            previewUrl: '/articles/{slug}',
            schema: {
                title: fields.slug({ 
                    name: { label: 'Title' },
                    slug: { label: 'SEO Slug', description: 'Auto-generates from the title.' }
                }),
                draft: fields.checkbox({ label: 'Draft', description: 'Take this post fully offline', defaultValue: false }),
                
                // 👇 NEW: Category and Tag selectors for Posts
                category: fields.relationship({
                    label: 'Category',
                    description: 'Select one main category (Optional)',
                    collection: 'categories',
                    validation: { isRequired: false }
                }),
                tags: fields.relationship({
                    label: 'Tags',
                    description: 'Select multiple tags (Optional)',
                    collection: 'tags',
                    validation: { isRequired: false },
                    many: true // This allows selecting more than one!
                }),

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
                
                seo: seoSchema,
                
                content: fields.markdoc({ 
                    label: 'Content',
                    options: {
                        image: {
                            directory: 'public/images/posts',
                            publicPath: '/images/posts/'
                        }
                    }
                }),
                customJs: fields.text({ 
                    label: 'Custom JavaScript', 
                    multiline: true, 
                    description: 'Paste raw JavaScript here. It will be injected safely at the bottom of the page.' 
                }),
            },
        }),
        
        tutorials: collection({
            label: 'Tutorial Series (Parents)',
            slugField: 'title',
            path: 'src/content/tutorials/*/',
            format: { contentField: 'content' },
            previewUrl: '/tutorials/{slug}',
            schema: {
                title: fields.slug({ 
                    name: { label: 'Series Title (e.g. Python)' },
                    slug: { label: 'SEO Slug' }
                }),
                draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
                
                // 👇 NEW: Category and Tag selectors for Tutorials
                category: fields.relationship({
                    label: 'Category',
                    description: 'Select one main category (Optional)',
                    collection: 'categories',
                    validation: { isRequired: false }
                }),
                tags: fields.relationship({
                    label: 'Tags',
                    description: 'Select multiple tags (Optional)',
                    collection: 'tags',
                    validation: { isRequired: false },
                    many: true
                }),

                excerpt: fields.text({ label: 'Excerpt', multiline: true }),
                seo: seoSchema,
                content: fields.markdoc({ 
                    label: 'Introduction Content',
                    options: {
                        image: {
                            directory: 'public/images/tutorials',
                            publicPath: '/images/tutorials/'
                        }
                    }
                }),
                customJs: fields.text({ 
                    label: 'Custom JavaScript', 
                    multiline: true, 
                    description: 'Paste raw JavaScript here. It will be injected safely at the bottom of the page.' 
                }),
            },
        }),

        lessons: collection({
            label: 'Lessons (Children)',
            slugField: 'title',
            path: 'src/content/lessons/*/',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ 
                    name: { label: 'Internal Title (e.g., Python - Variables)' },
                    slug: { label: 'Keystatic Folder ID (Do not edit)' }
                }),
                urlSlug: fields.text({ 
                    label: 'URL Slug', 
                    description: 'e.g. "variables", "if-statements"' 
                }),
                tutorial: fields.relationship({
                    label: 'Belongs to Tutorial Series',
                    collection: 'tutorials',
                    validation: { isRequired: true }
                }),
                order: fields.integer({ 
                    label: 'Lesson Order', 
                    description: 'Order in the sidebar (1, 2, 3...)', 
                    defaultValue: 1 
                }),
                seo: seoSchema,
                
                content: fields.markdoc({ 
                    label: 'Content',
                    options: {
                        image: {
                            directory: 'public/images/lessons',
                            publicPath: '/images/lessons/'
                        }
                    },
                    components: {
                        codeEditor: block({
                            label: 'Interactive Code Editor',
                            ContentView: KeystaticCodePreview,
                            schema: {
                                language: fields.text({ label: 'Language (e.g., javascript, python)', defaultValue: 'javascript' }),
                                code: fields.text({ label: 'Initial Code', multiline: true })
                            }
                        })
                    }
                }),

                customJs: fields.text({ 
                    label: 'Custom JavaScript', 
                    multiline: true, 
                    description: 'Paste raw JavaScript here. It will be injected safely at the bottom of the page.' 
                }),
            },
        }),

        quizzes: collection({
            label: 'Quizzes (Parents)',
            slugField: 'title',
            path: 'src/content/quizzes/*/',
            format: { contentField: 'content' },
            previewUrl: '/quizzes/{slug}',
            schema: {
                title: fields.slug({ 
                    name: { label: 'Quiz Series Title (e.g. Python Quiz)' },
                    slug: { label: 'SEO Slug' }
                }),
                draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
                excerpt: fields.text({ label: 'Excerpt', multiline: true }),
                seo: seoSchema,
                content: fields.markdoc({ 
                    label: 'Introduction Content',
                    options: {
                        image: { directory: 'public/images/quizzes', publicPath: '/images/quizzes/' }
                    }
                }),
            },
        }),

       quizItems: collection({
            label: 'Quiz Items (Children)',
            slugField: 'title',
            path: 'src/content/quizItems/*/',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ 
                    name: { label: 'Internal Title (e.g., Python - Variables Quiz)' },
                    slug: { label: 'Keystatic Folder ID (Do not edit)' }
                }),
                urlSlug: fields.text({ 
                    label: 'URL Slug', 
                    description: 'e.g. "variables", "if-statements"' 
                }),
                quizParent: fields.relationship({
                    label: 'Belongs to Quiz Series',
                    collection: 'quizzes',
                    validation: { isRequired: true }
                }),
                order: fields.integer({ 
                    label: 'Quiz Order', 
                    description: 'Order in the sidebar (1, 2, 3...)', 
                    defaultValue: 1 
                }),
                seo: seoSchema,
                
                // 👇 NEW: Interactive Questions Builder
                questions: fields.array(
                    fields.object({
                        questionText: fields.text({ label: 'Question', multiline: true }),
                        options: fields.array(
                            fields.object({
                                text: fields.text({ label: 'Option Answer' }),
                                isCorrect: fields.checkbox({ label: 'Is this the CORRECT answer?', defaultValue: false })
                            }),
                            { label: 'Answers', itemLabel: props => props.fields.text.value || 'New Option' }
                        ),
                        explanation: fields.text({ 
                            label: 'Explanation (Optional)', 
                            multiline: true, 
                            description: 'Shown to the user after they select an answer.' 
                        })
                    }),
                    { label: 'Interactive Quiz Questions', itemLabel: props => props.fields.questionText.value || 'New Question' }
                ),
                bulkQuestionsJson: fields.text({
                    label: 'Bulk Questions (Raw JSON)',
                    multiline: true,
                    description: 'PASTE JSON HERE: If you paste a valid JSON array of questions here, it will OVERRIDE the manual question builder above. Great for bulk uploading!'
                }),

                content: fields.markdoc({ 
                    label: 'Pre-Quiz Content (Optional text before the quiz starts)',
                    options: {
                        image: { directory: 'public/images/quizItems', publicPath: '/images/quizItems/' }
                    }
                }),
            },
        }),

    }, 

    singletons: {
        // 🟢 NEW: Home Page Singleton for SEO and Headings
        homePage: singleton({
            label: 'Home Page',
            path: 'src/content/homePage/index', // Changed from data to index
            format: { contentField: 'content' }, // This activates the Markdoc editor
            schema: {
                headline: fields.text({ label: 'Main Headline (H1)', defaultValue: 'Welcome to Serplora' }),
                subheadline: fields.text({ label: 'Subheadline', multiline: true }),
                seo: seoSchema,
                content: fields.markdoc({ 
                    label: 'Page Content',
                    options: {
                        image: {
                            directory: 'public/images/pages',
                            publicPath: '/images/pages/'
                        }
                    }
                }),
            },
        }),

        header: singleton({
            label: 'Site Header',
            path: 'src/content/header/data',
            format: { data: 'json' },
            schema: {
                siteTitle: fields.text({ label: 'Site Title (Optional)' }),
                logo: fields.image({ 
                    label: 'Logo Image (Light Theme)', 
                    directory: 'public/images/logo', 
                    publicPath: '/images/logo/', 
                    validation: { isRequired: false } 
                }),
                
                // 🆕 ADD THIS NEW FIELD FOR THE DARK LOGO
                logoDark: fields.image({ 
                    label: 'Logo Image (Dark Theme)', 
                    directory: 'public/images/logo', 
                    publicPath: '/images/logo/', 
                    validation: { isRequired: false } 
                }),
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
                    label: fields.text({ label: 'Primary Button Label', defaultValue: 'Sign up for free' }), 
                    url: fields.text({ label: 'Primary Button URL', defaultValue: '#' }),
                    show: fields.checkbox({ label: 'Show Primary Button', defaultValue: true })
                }, { label: 'Primary Button (Solid/Right)' })
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
                seo: seoSchema, // 🟢 Added to Blog Page
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
                seo: seoSchema, // 🟢 Added to Tutorials Page
            },
        }),
        sidebarAds: singleton({
            label: 'Sidebar Ads & Banners',
            path: 'src/content/sidebarAds/data',
            format: { data: 'json' },
            schema: {
                globalAd: fields.text({ 
                    label: 'Global Default Ad (HTML)', 
                    multiline: true, 
                    description: 'This HTML will show up on ALL tutorials by default unless overridden below.' 
                }),
                tutorialAds: fields.array(
                    fields.object({
                        tutorial: fields.relationship({ 
                            label: 'Target Tutorial', 
                            collection: 'tutorials',
                            description: 'Select the parent tutorial series to target.'
                        }),
                        htmlContent: fields.text({ 
                            label: 'Custom Ad HTML', 
                            multiline: true,
                            description: 'This will override the Global Ad for this specific tutorial and its child lessons.'
                        })
                    }),
                    { 
                        label: 'Tutorial-Specific Overrides', 
                        itemLabel: props => props.fields.tutorial.value || 'New Tutorial Ad Override' 
                    }
                )
            }
        }),
    },
});