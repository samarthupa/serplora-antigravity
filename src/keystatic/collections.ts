// src/keystatic/collections.ts
import { collection, fields } from '@keystatic/core';
import { seoSchema, createGlobalEditor } from './shared';

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

// --- NEW: Authors Collection ---
export const authors = collection({
    label: 'Authors',
    slugField: 'name',
    path: 'src/content/authors/*/', // <-- ADDED trailing slash
    format: { contentField: 'bio' }, // <-- CHANGED from json
    schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        avatar: fields.image({ label: 'Avatar', directory: 'public/images/avatars', publicPath: '/images/avatars/' }),
        bio: createGlobalEditor('Short Bio', 'authors'), // <-- CHANGED to rich text editor
        twitter: fields.text({ label: 'Twitter URL (Optional)' }),
        linkedin: fields.text({ label: 'LinkedIn URL (Optional)' }),
        github: fields.text({ label: 'GitHub URL (Optional)' }),
        kaggle: fields.text({ label: 'Kaggle URL (Optional)' }),
        website: fields.text({ label: 'Personal Website URL (Optional)' }),
        seo: seoSchema
    }
});
// -------------------------------

export const posts = collection({
    label: 'Articles',
    slugField: 'title',
    path: 'src/content/posts/*/',
    format: { contentField: 'content' },
    previewUrl: '/articles/{slug}',
    schema: {
        title: fields.slug({ name: { label: 'Title' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        category: fields.relationship({ label: 'Category', collection: 'categories', validation: { isRequired: false } }),
        tags: fields.relationship({ label: 'Tags', collection: 'tags', validation: { isRequired: false }, many: true }),
        
        // --- UPDATED: Relational Author Field ---
        author: fields.relationship({ 
            label: 'Author', 
            collection: 'authors', 
            validation: { isRequired: true },
            defaultValue: 'editorial-team' // <-- Auto-selects for new posts
        }),
        // ----------------------------------------

        publishDate: fields.date({ label: 'Publish Date', defaultValue: { kind: 'today' } }),
        updatedDate: fields.date({ label: 'Last Modified Date (Optional)' }),
        image: fields.image({ label: 'Featured Image', directory: 'public/images/posts', publicPath: '/images/posts/' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        faqs: fields.array(
            fields.object({ question: fields.text({ label: 'Question' }), answer: fields.text({ label: 'Answer', multiline: true }) }),
            { label: 'FAQs (Optional)', itemLabel: props => props.fields.question.value || 'New FAQ' }
        ),
        seo: seoSchema,
        content: createGlobalEditor('Content', 'posts'),
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
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        category: fields.relationship({ label: 'Category', collection: 'categories', validation: { isRequired: false } }),
        tags: fields.relationship({ label: 'Tags', collection: 'tags', validation: { isRequired: false }, many: true }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        seo: seoSchema,
        content: createGlobalEditor('Introduction Content', 'tutorials'),
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
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        urlSlug: fields.text({ label: 'URL Slug' }),
        tutorial: fields.relationship({ label: 'Belongs to Tutorial Series', collection: 'tutorials', validation: { isRequired: true } }),
        order: fields.integer({ label: 'Lesson Order', defaultValue: 1 }),
        seo: seoSchema,
        content: createGlobalEditor('Content', 'lessons'),
        customJs: fields.text({ label: 'Custom JavaScript', multiline: true }),
    },
});

export const pages = collection({
  label: 'Root Pages',
  slugField: 'title',
  path: 'src/content/pages/*/',
  format: { contentField: 'content' },
  schema: {
    title: fields.slug({ name: { label: 'Title' }, slug: { label: 'SEO Slug' } }),
    seo: seoSchema,
    content: createGlobalEditor('Content', 'pages'),
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
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        excerpt: fields.text({ label: 'Short Description', multiline: true }),
        
        // 🟢 NEW: Root language selector to route to the correct Workspace
        language: fields.select({
            label: 'Compiler Engine (Execution Environment)',
            description: 'Which workspace should this load?',
            options: [
                { label: 'HTML / Web', value: 'html' },
                { label: 'Python (Interactive)', value: 'python' },
                { label: 'C++ (Interactive)', value: 'cpp' },
                { label: 'Java (Interactive)', value: 'java' },
                { label: 'JavaScript (Web)', value: 'javascript' },
            ],
            defaultValue: 'html',
        }),

        // 🟢 NEW: Add the console toggle checkbox
        showConsole: fields.checkbox({ 
            label: 'Enable Browser Console', 
            description: 'Check to show the browser console UI (useful for HTML/JS). Uncheck to hide it for backend languages like Python.',
            defaultValue: true 
        }),

        seo: seoSchema,

        starterFiles: fields.array(
            fields.object({
                filename: fields.text({ label: 'Filename' }),
                // 🟢 UPDATED: Changed from a strict dropdown to a flexible text field so you can type "c_cpp", "java", etc. for Ace Editor.
                language: fields.text({ 
                    label: 'Editor Highlighting Language', 
                    description: 'Used by Ace Editor (e.g. python, html, javascript, c_cpp)' 
                }),
                content: fields.text({ label: 'Initial Code', multiline: true })
            }),
            { label: 'Workspace Starter Files', itemLabel: props => props.fields.filename.value || 'New File' }
        ),
        content: createGlobalEditor('Instructions', 'compilers'),
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
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        seo: seoSchema,
        content: createGlobalEditor('Introduction Content', 'quizzes'),
    },
});

// Add this to your exports in src/keystatic/collections.ts
export const projects = collection({
    label: 'Projects',
    slugField: 'title',
    path: 'src/content/projects/*/',
    format: { contentField: 'content' },
    previewUrl: '/projects/{slug}',
    schema: {
        title: fields.slug({ name: { label: 'Project Name' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        excerpt: fields.text({ label: 'Short Description', multiline: true }),
        
        // NEW FIELDS FOR PROJECT DESIGN
        difficulty: fields.select({
            label: 'Difficulty',
            options: [
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' }
            ],
            defaultValue: 'beginner'
        }),
        duration: fields.text({ label: 'Estimated Duration (e.g., 2 Hrs)', defaultValue: '2 Hrs' }),
        githubUrl: fields.text({ label: 'GitHub Repository URL' }),
        heroCode: fields.text({ 
            label: 'Hero Terminal Code (Python/JS)', 
            multiline: true, 
            description: 'The code snippet to display in the Mac terminal mockup.' 
        }),
        
        categories: fields.relationship({
            label: 'Categories (Select multiple)',
            collection: 'projectCategories',
            many: true,
             validation: { length: { min: 1 } }
        }),
        
        seo: seoSchema,
        content: createGlobalEditor('Project Details', 'projects'),
    },
});

export const projectCategories = collection({
    label: 'Project Categories',
    slugField: 'title',
    path: 'src/content/projectCategories/*/',
    format: { contentField: 'content' },
    schema: {
        title: fields.slug({ name: { label: 'Category Name' }, slug: { label: 'SEO Slug' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)' }),
        description: fields.text({ label: 'Description', multiline: true }),
        iconSvg: fields.text({ label: 'Raw SVG Icon', multiline: true, description: 'Paste the raw <svg> tag here.' }),
        
        // NEW: Pagination Settings
        postsPerPage: fields.integer({ 
            label: 'Projects Per Page', 
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
        content: createGlobalEditor('Category Details', 'projectCategories'),
    }
});

export const quizItems = collection({
    label: 'Quiz Items (Children)',
    slugField: 'title',
    path: 'src/content/quizItems/*/',
    format: { contentField: 'content' },
    schema: {
        title: fields.slug({ name: { label: 'Internal Title' }, slug: { label: 'Folder ID' } }),
        breadcrumbTitle: fields.text({ label: 'Breadcrumb Title (Optional)', description: 'A shorter title used specifically for navigation paths.' }),
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
        content: createGlobalEditor('Pre-Quiz Content', 'quizItems'),
    },
});