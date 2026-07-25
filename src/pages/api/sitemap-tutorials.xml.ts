import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';

  // 1. Fetch the Tutorials Index Page
  const tutorialsPage = await getEntry('tutorialsPage', 'data');
  let indexUrl = '';
  if (tutorialsPage && tutorialsPage.data.seo?.robotsIndex !== false) {
    indexUrl = `
      <url>
        <loc>${new URL('/tutorials', siteUrl).toString()}</loc>
      </url>
    `;
  }

  const tutorials = await getCollection('tutorials', (entry) => 
    !entry.data.draft && entry.data.seo?.robotsIndex !== false
  );
  // Optional safety update: ensuring lessons belong to non-draft tutorials
  const lessons = await getCollection('lessons', (entry) => 
    entry.data.seo?.robotsIndex !== false
  );

  // 2. Generate URLs for the Parent Tutorials
  const tutorialUrls = tutorials.map(tutorial => {
    const slug = tutorial.id.split('/')[0];
    return `
      <url>
        <loc>${new URL(`/tutorials/${slug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  // 3. Generate URLs for the Child Lessons
  const lessonUrls = lessons.map(lesson => {
    const tutorialSlug = lesson.data.tutorial; 
    const lessonSlug = lesson.data.urlSlug;    
    return `
      <url>
        <loc>${new URL(`/tutorials/${tutorialSlug}/${lessonSlug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${indexUrl}
      ${tutorialUrls}
      ${lessonUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
};