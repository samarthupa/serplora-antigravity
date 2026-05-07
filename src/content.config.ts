// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 🟢 NEW: Define a reusable Zod schema for SEO so Astro doesn't strip the data out
const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robotsIndex: z.boolean().optional(),
  disableStickyHeader: z.boolean().optional().default(false),
  robotsFollow: z.boolean().optional(),
  schemaType: z.string().optional().default('none'),
}).optional();

// 🟢 NEW: Define Authors Collection
const authors = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/authors" }),
  schema: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    kaggle: z.string().optional(),
    website: z.string().optional(),
    seo: seoSchema,
  }),
});

// 🟢 Define Categories
const categories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/categories" }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

// 🟢 Define Tags
const tags = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/tags" }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

// 1. Tutorials (Your Markdown/Markdoc files)
const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 NEW: Breadcrumb support
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    
    // Support for category and tags
    category: z.string().nullable().optional(),
    tags: z.preprocess((val) => typeof val === 'string' ? [val] : val, z.array(z.string())).optional().default([]),
    
    // Inject SEO Schema
    seo: seoSchema,
    
    customJs: z.string().optional(),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 NEW: Breadcrumb support
    urlSlug: z.string(),
    tutorial: z.string(), 
    order: z.number().default(1),
    
    // Inject SEO Schema
    seo: seoSchema,

    customJs: z.string().optional(),
  }),
});

// 2. Tutorials Page 
const tutorialsPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/tutorialsPage' }),
  schema: z.object({
    headline: z.string().default('Tutorials & Guides'),
    breadcrumbTitle: z.string().optional(), // 🟢 ADD THIS HERE
    subheadline: z.string().default('Explore our latest guides and learn step-by-step with state-of-the-art tutorials.'),
    hiddenTutorials: z.array(z.string()).default([]),
    
    // Inject SEO Schema
    seo: seoSchema,
  }),
});

// 3. Header 
const header = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/header' }),
  schema: z.object({
    siteTitle: z.string().optional(),
    logo: z.string().optional(),
    logoDark: z.string().optional(),
    favicon: z.string().optional(), 
    navItems: z.array(z.object({
      label: z.string().optional(),
      url: z.string().default('#'),
      subItems: z.array(z.object({
        label: z.string().optional(),
        url: z.string().default('#'),
      })).optional().default([])
    })).optional().default([]),
    primaryButton: z.object({
      label: z.string().default('Sign up free'),
      url: z.string().default('#'),
      show: z.boolean().default(true)
    }).optional(),
    secondaryButton: z.object({
      label: z.string().default('Log in'),
      url: z.string().default('#'),
      show: z.boolean().default(true)
    }).optional()
  }),
});

// 4. Footer 
const footer = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/footer' }),
  schema: z.object({
    brand: z.object({
      show: z.boolean().default(false),
      text: z.string().optional(),
      logo: z.string().optional()
    }).optional(),
    description: z.string().optional(),
    columns: z.array(z.object({
      title: z.string(),
      links: z.array(z.object({
        label: z.string(),
        url: z.string()
      }))
    })).optional().default([]),
    socialLinks: z.array(z.object({
      platform: z.string(),
      url: z.string()
    })).optional().default([]),
    copyrightText: z.string().optional()
  })
});

// 5. Posts 
const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 NEW: Breadcrumb support
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    
    // Support for category and tags
    category: z.string().nullable().optional(),
    tags: z.preprocess((val) => typeof val === 'string' ? [val] : val, z.array(z.string())).optional().default([]),

    publishDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    
    // 🟢 UPDATED: Relational Author ID
    author: z.string().default('editorial-team'),
    
    // Inject SEO Schema
    seo: seoSchema,

    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string()
    })).optional().default([]),
    customJs: z.string().optional(),
  })
});

const compilers = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/compilers" }),
  schema: z.object({
    title: z.string().optional(),
    breadcrumbTitle: z.string().optional(), 
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    
    // 🟢 NEW: Add the language validation so Astro doesn't strip it out
    language: z.enum(['html', 'python', 'cpp', 'java']).default('html'),
    
    showConsole: z.boolean().default(true), // 🟢 NEW: Tell Astro to expect this boolean
    
    seo: seoSchema,
    
    starterFiles: z.array(z.object({
      filename: z.string(),
      language: z.string(),
      content: z.string()
    })).optional().default([]),
  }),
});

// 6. Blog Page 
const blogPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/blogPage' }),
  schema: z.object({
    headline: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 ADD THIS HERE
    subheadline: z.string().optional(),
    hiddenPosts: z.array(z.string()).optional().default([]),
    
    // 🟢 NEW: Validate Pagination Settings
    postsPerPage: z.number().default(9),
    paginationTitleTemplate: z.string().default(' - Page {page}'),
    noindexPaginated: z.boolean().default(true),
    
    // Inject SEO Schema
    seo: seoSchema,
  })
});

// 7. Diagnostics Dashboard 
const diagnosticsDashboard = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/diagnosticsDashboard' }),
  schema: z.object({
    notice: z.string().optional()
  })
});

const sidebarAds = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/sidebarAds' }),
  schema: z.object({
    globalAd: z.string().optional(),
    
    // 🟢 NEW: Match the Keystatic Tutorial Ads Group
    tutorialAdsGroup: z.object({
      allTutorialsAd: z.string().optional(),
      specificOverrides: z.array(z.object({
        target: z.string().nullable(),
        adContent: z.string()
      })).optional().default([])
    }).optional(),

    // 🟢 NEW: Match the Keystatic Compiler Ads Group
    compilerAdsGroup: z.object({
      allCompilersAd: z.string().optional(),
      specificOverrides: z.array(z.object({
        target: z.string().nullable(),
        adContent: z.string()
      })).optional().default([])
    }).optional()

  })
});

const quizzes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/quizzes" }),
  schema: z.object({
    title: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 NEW: Breadcrumb support
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    seo: seoSchema,
  }),
});

const quizItems = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/quizItems" }),
  schema: z.object({
    title: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 NEW: Breadcrumb support
    urlSlug: z.string(),
    quizParent: z.string(), 
    order: z.number().default(1),
    seo: seoSchema,
    // 👇 NEW: Validate the questions array
    questions: z.array(z.object({
      questionText: z.string(),
      options: z.array(z.object({
        text: z.string(),
        isCorrect: z.boolean().default(false)
      })),
      explanation: z.string().optional()
    })).optional().default([]),
    bulkQuestionsJson: z.string().optional(),
  }),
});

// 🟢 NEW: Home Page Support
const homePage = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx,mdoc}', base: './src/content/homePage' }),
  schema: z.object({
    headline: z.string().optional(),
    breadcrumbTitle: z.string().optional(), // 🟢 ADD THIS HERE
    subheadline: z.string().optional(),
    seo: seoSchema,
  })
});

// 🟢 NEW: Quizzes Page
const quizzesPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/quizzesPage' }),
  schema: z.object({
    headline: z.string().optional(),
    breadcrumbTitle: z.string().optional(),
    subheadline: z.string().optional(),
    seo: seoSchema,
  })
});

// 🟢 NEW: Compilers Page
const compilersPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/compilersPage' }),
  schema: z.object({
    headline: z.string().optional(),
    breadcrumbTitle: z.string().optional(),
    subheadline: z.string().optional(),
    seo: seoSchema,
  })
});

// 🟢 NEW: Define the Root Pages collection for Astro
const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string().optional(),
    seo: seoSchema, // Don't strip SEO data!
  })
});

// 🟢 NEW: Authors Page Singleton Support
// 🟢 NEW: Authors Page Singleton Support
const authorsPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/authorsPage' }),
  schema: z.object({
    headline: z.string().optional(),
    breadcrumbTitle: z.string().optional(),
    subheadline: z.string().optional(),
    
    // 🟢 NEW: Validate Pagination Settings
    postsPerPage: z.number().default(9),
    paginationTitleTemplate: z.string().default(' - Page {page}'),
    noindexPaginated: z.boolean().default(true),
    
    seo: seoSchema,
  })
});

// 8. EXPORT ALL COLLECTIONS (Make sure to export the new ones!)
export const collections = { 
  authors,
  authorsPage,   // 🟢 ADD THIS
  categories, 
  tags,       
  tutorials,
  lessons, 
  quizzes,      
  quizItems,    
  tutorialsPage, 
  header, 
  footer, 
  posts, 
  blogPage, 
  diagnosticsDashboard,
  sidebarAds,
  homePage,
  compilers,
  pages,
  quizzesPage,   
  compilersPage, 
};