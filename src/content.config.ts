import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 👇 NEW: Define Categories
const categories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/categories" }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

// 👇 NEW: Define Tags
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
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    
    // 👇 NEW: Support for category and tags
    category: z.string().nullable().optional(),
    tags: z.preprocess((val) => typeof val === 'string' ? [val] : val, z.array(z.string())).optional().default([]),
    
    customJs: z.string().optional(),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string().optional(),
    urlSlug: z.string(),
    tutorial: z.string(), 
    order: z.number().default(1),
    customJs: z.string().optional(),
  }),
});

// 2. Tutorials Page 
const tutorialsPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/tutorialsPage' }),
  schema: z.object({
    headline: z.string().default('Tutorials & Guides'),
    subheadline: z.string().default('Explore our latest guides and learn step-by-step with state-of-the-art tutorials.'),
    hiddenTutorials: z.array(z.string()).default([]),
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
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    
    // 👇 NEW: Support for category and tags
    category: z.string().nullable().optional(),
    tags: z.array(z.string()).optional().default([]),

    publishDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    authorName: z.string().default('Serplora Team'),
    authorImage: z.string().optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string()
    })).optional().default([]),
    customJs: z.string().optional(),
  })
});

// 6. Blog Page 
const blogPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/blogPage' }),
  schema: z.object({
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    hiddenPosts: z.array(z.string()).optional().default([]),
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
    tutorialAds: z.array(z.object({
      tutorial: z.string().nullable(),
      htmlContent: z.string()
    })).optional().default([])
  })
});

// 8. EXPORT ALL COLLECTIONS 👇 (Make sure to export the new ones!)
export const collections = { 
  categories, // <-- Exported
  tags,       // <-- Exported
  tutorials,
  lessons, 
  tutorialsPage, 
  header, 
  footer, 
  posts, 
  blogPage, 
  diagnosticsDashboard,
  sidebarAds,
};