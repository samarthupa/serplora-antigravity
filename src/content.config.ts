import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';



// 1. Tutorials (Your Markdown/Markdoc files)
const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/tutorials" }),
    schema: z.object({
    title: z.string().optional(),
    draft: z.boolean().optional(),
    excerpt: z.string().optional(), // <-- Renamed this
  }),
});

// 2. Tutorials Page (The JSON settings for the tutorials index)
const tutorialsPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/tutorialsPage' }),
  schema: z.object({
    headline: z.string().default('Tutorials & Guides'),
    subheadline: z.string().default('Explore our latest guides and learn step-by-step with state-of-the-art tutorials.'),
    hiddenTutorials: z.array(z.string()).default([]),
  }),
});

// 3. Header (The JSON settings for your top nav)
const header = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/header' }),
  schema: z.object({
    siteTitle: z.string().optional(),
    logo: z.string().optional(),
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

// 4. NEW: Footer (The JSON settings for your bottom nav and social links)
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

// 5. NEW: Posts (Your Blog Markdown/Markdoc files)
const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string().optional(),
    draft: z.boolean().optional(),
    excerpt: z.string().optional(),
    publishDate: z.coerce.date().optional(),
    // 🟢 NEW FIELDS FOR THE REDESIGN:
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    authorName: z.string().default('Serplora Team'),
    authorImage: z.string().optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string()
    })).optional().default([]),
  })
});

// 6. NEW: Blog Page (The JSON settings for the blog index)
const blogPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/blogPage' }),
  schema: z.object({
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    hiddenPosts: z.array(z.string()).optional().default([]),
  })
});

// 7. NEW: Diagnostics Dashboard (JSON notice setting)
const diagnosticsDashboard = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/diagnosticsDashboard' }),
  schema: z.object({
    notice: z.string().optional()
  })
});

// 8. EXPORT ALL COLLECTIONS (This tells Astro to build them)
export const collections = { 
  tutorials, 
  tutorialsPage, 
  header, 
  footer, 
  posts, 
  blogPage, 
  diagnosticsDashboard,
};