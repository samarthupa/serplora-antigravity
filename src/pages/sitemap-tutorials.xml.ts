import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';
  
  const tutorials = await getCollection('tutorials', (entry) => !entry.data.draft && entry.data.seo?.robotsIndex !== false);
  const lessons = await getCollection('lessons', (entry) => entry.data.seo?.robotsIndex !== false);

  // 1. Generate URLs for the Parent Tutorials
  const tutorialUrls = tutorials.map(tutorial => {
    const slug = tutorial.id.split('/')[0];
    return `
      <url>
        <loc>${new URL(`/tutorials/${slug}`, siteUrl).toString()}</loc>
      </url>
    `;
  });

  // 2. Generate URLs for the Child Lessons
  const lessonUrls = lessons.map(lesson => {
    const tutorialSlug = lesson.data.tutorial; // Grab the parent relationship
    const lessonSlug = lesson.data.urlSlug;    // Grab the custom URL slug from Keystatic schema
    return `
      <url>
        <loc>${new URL(`/tutorials/${tutorialSlug}/${lessonSlug}`, siteUrl).toString()}</loc>
      </url>
    `;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${[...tutorialUrls, ...lessonUrls].join('')}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
}