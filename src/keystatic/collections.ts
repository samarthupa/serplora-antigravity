import { collection, fields } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';
import { seoSchema, customCodeBlocks } from './shared';
import { KeystaticCodePreview } from '../components/keystatic/KeystaticCodePreview';

export const categories = collection({
    label: 'Categories',
    slugField: 'title',
    path: 'src/content/categories/*',
    format: { data: 'json' },
    schema: { title: fields.slug({ name: { label: 'Category Name' } }) }
});

export const tags = collection({
    label: 'Tags',
    slugField: 'title',
    path: 'src/content/tags/*',
    format: { data: 'json' },
    schema: { title: fields.slug({ name: { label: 'Tag Name' } }) }
});

export const posts = collection({
    label: 'Articles',
    slugField: 'title',
    path: 'src/content/posts/*/',
    format: { contentField: 'content' },
    previewUrl: '/articles/{slug}',
    schema: {
        title: fields.slug({ name: { label: 'Title' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }), // 🟢 NEW
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        category: fields.relationship({ label: 'Category', collection: 'categories', validation: { isRequired: false } }),
        tags: fields.relationship({ label: 'Tags', collection: 'tags', validation: { isRequired: false }, many: true }),
        authorName: fields.text({ label: 'Author Name', defaultValue: 'Serplora Team' }),
        authorImage: fields.image({ label: 'Author Avatar', directory: 'public/images/avatars', publicPath: '/images/avatars/' }),
        publishDate: fields.date({ label: 'Publish Date', defaultValue: { kind: 'today' } }),
        updatedDate: fields.date({ label: 'Last Modified Date (Optional)' }),
        image: fields.image({ label: 'Featured Image', directory: 'public/images/posts', publicPath: '/images/posts/' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        faqs: fields.array(
            fields.object({ question: fields.text({ label: 'Question' }), answer: fields.text({ label: 'Answer', multiline: true }) }),
            { label: 'FAQs (Optional)', itemLabel: props => props.fields.question.value || 'New FAQ' }
        ),
        seo: seoSchema,
        content: fields.markdoc({ label: 'Content', options: { image: { directory: 'public/images/posts', publicPath: '/images/posts/' } }, components: customCodeBlocks }),
        customJs: fields.text({ label: 'Custom JavaScript', multiline: true }),
    },
});

export const tutorials = collection({
    label: 'Tutorial Series (Parents)',
    slugField: 'title',
    path: 'src/content/tutorials/*/',
    format: { contentField: 'content' },
    previewUrl: '/tutorials/{slug}',
    schema: {
        title: fields.slug({ name: { label: 'Series Title' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }), // 🟢 NEW
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        category: fields.relationship({ label: 'Category', collection: 'categories', validation: { isRequired: false } }),
        tags: fields.relationship({ label: 'Tags', collection: 'tags', validation: { isRequired: false }, many: true }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        seo: seoSchema,
        content: fields.markdoc({ label: 'Introduction Content', options: { image: { directory: 'public/images/tutorials', publicPath: '/images/tutorials/' } }, components: customCodeBlocks }),
        customJs: fields.text({ label: 'Custom JavaScript', multiline: true }),
    },
});

export const lessons = collection({
    label: 'Lessons (Children)',
    slugField: 'title',
    path: 'src/content/lessons/*/',
    format: { contentField: 'content' },
    schema: {
        title: fields.slug({ name: { label: 'Internal Title' }, slug: { label: 'Folder ID' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }), // 🟢 NEW
        urlSlug: fields.text({ label: 'URL Slug' }),
        tutorial: fields.relationship({ label: 'Belongs to Tutorial Series', collection: 'tutorials', validation: { isRequired: true } }),
        order: fields.integer({ label: 'Lesson Order', defaultValue: 1 }),
        seo: seoSchema,
        content: fields.markdoc({ 
            label: 'Content',
            options: { image: { directory: 'public/images/lessons', publicPath: '/images/lessons/' } },
            components: {
                codeEditor: block({
                    label: '▶️ Interactive Code Editor',
                    ContentView: KeystaticCodePreview,
                    schema: { language: fields.text({ label: 'Language', defaultValue: 'javascript' }), code: fields.text({ label: 'Initial Code', multiline: true }) }
                }),
                ...customCodeBlocks
            }
        }),
        customJs: fields.text({ label: 'Custom JavaScript', multiline: true }),
    },
});

export const pages = collection({
  label: 'Root Pages',
  slugField: 'title',
  path: 'src/content/pages/*/',
  format: { contentField: 'content' },
  schema: {
    // 🟢 Fix: Added slug label to expose the URL editing
    title: fields.slug({ name: { label: 'Title' }, slug: { label: 'SEO Slug' } }),
    
    // 🟢 Fix: Injected your global SEO schema
    seo: seoSchema,
    
    content: fields.markdoc({ label: 'Content' }),
  },
});

export const compilers = collection({
    label: 'Compilers',
    slugField: 'title',
    path: 'src/content/compilers/*/',
    format: { contentField: 'content' }, 
    previewUrl: '/compilers/{slug}',
    schema: {
        title: fields.slug({ name: { label: 'Compiler Name' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }), // 🟢 NEW
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        excerpt: fields.text({ label: 'Short Description', multiline: true }),
        seo: seoSchema,
        starterFiles: fields.array(
            fields.object({
                filename: fields.text({ label: 'Filename' }),
                language: fields.select({ label: 'Language Mode', options: [{ label: 'HTML', value: 'html' }, { label: 'CSS', value: 'css' }, { label: 'JavaScript', value: 'javascript' }, { label: 'Python', value: 'python' }], defaultValue: 'html' }),
                content: fields.text({ label: 'Initial Code', multiline: true })
            }),
            { label: 'Workspace Starter Files', itemLabel: props => props.fields.filename.value || 'New File' }
        ),
        content: fields.markdoc({ label: 'Instructions', options: { image: { directory: 'public/images/compilers', publicPath: '/images/compilers/' } } }),
    },
});

export const quizzes = collection({
    label: 'Quizzes (Parents)',
    slugField: 'title',
    path: 'src/content/quizzes/*/',
    format: { contentField: 'content' },
    previewUrl: '/quizzes/{slug}',
    schema: {
        title: fields.slug({ name: { label: 'Quiz Series Title' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }), // 🟢 NEW
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        seo: seoSchema,
        content: fields.markdoc({ label: 'Introduction Content', options: { image: { directory: 'public/images/quizzes', publicPath: '/images/quizzes/' } } }),
    },
});

export const quizItems = collection({
    label: 'Quiz Items (Children)',
    slugField: 'title',
    path: 'src/content/quizItems/*/',
    format: { contentField: 'content' },
    schema: {
        title: fields.slug({ name: { label: 'Internal Title' }, slug: { label: 'Folder ID' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }), // 🟢 NEW
        urlSlug: fields.text({ label: 'URL Slug' }),
        quizParent: fields.relationship({ label: 'Belongs to Quiz Series', collection: 'quizzes', validation: { isRequired: true } }),
        order: fields.integer({ label: 'Quiz Order', defaultValue: 1 }),
        seo: seoSchema,
        questions: fields.array(
            fields.object({
                questionText: fields.text({ label: 'Question', multiline: true }),
                options: fields.array(fields.object({ text: fields.text({ label: 'Option Answer' }), isCorrect: fields.checkbox({ label: 'Correct answer?', defaultValue: false }) }), { label: 'Answers', itemLabel: props => props.fields.text.value || 'New Option' }),
                explanation: fields.text({ label: 'Explanation', multiline: true })
            }),
            { label: 'Interactive Questions', itemLabel: props => props.fields.questionText.value || 'New Question' }
        ),
        bulkQuestionsJson: fields.text({ label: 'Bulk Questions (Raw JSON)', multiline: true }),
        content: fields.markdoc({ label: 'Pre-Quiz Content', options: { image: { directory: 'public/images/quizItems', publicPath: '/images/quizItems/' } } }),
    },
});