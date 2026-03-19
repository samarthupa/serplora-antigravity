import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string().optional(),
    draft: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const tutorialsPage = defineCollection({
  loader: glob({ pattern: 'data.json', base: './src/content/tutorialsPage' }),
  schema: z.object({
    headline: z.string().default('Tutorials & Guides'),
    subheadline: z.string().default('Explore our latest guides and learn step-by-step with state-of-the-art tutorials.'),
    hiddenTutorials: z.array(z.string()).default([]),
  }),
});

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

export const collections = { tutorials, tutorialsPage, header };
