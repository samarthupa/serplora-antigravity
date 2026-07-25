import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';

  // 1. Fetch the Quizzes Index Page
  const quizzesPage = await getEntry('quizzesPage', 'data');
  let indexUrl = '';
  if (quizzesPage && quizzesPage.data.seo?.robotsIndex !== false) {
    indexUrl = `
      <url>
        <loc>${new URL('/quizzes', siteUrl).toString()}</loc>
      </url>
    `;
  }

  const quizzes = await getCollection('quizzes', (entry) => 
    !entry.data.draft && entry.data.seo?.robotsIndex !== false
  );
  const quizItems = await getCollection('quizItems', (entry) => 
    entry.data.seo?.robotsIndex !== false
  );

  // 2. Generate URLs for the Parent Quizzes
  const quizUrls = quizzes.map(quiz => {
    const slug = quiz.id.split('/')[0];
    return `
      <url>
        <loc>${new URL(`/quizzes/${slug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  // 3. Generate URLs for the Child Quiz Items
  const itemUrls = quizItems.map(item => {
    const quizSlug = item.data.quizParent;
    const itemSlug = item.data.urlSlug;
    return `
      <url>
        <loc>${new URL(`/quizzes/${quizSlug}/${itemSlug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${indexUrl}
      ${quizUrls}
      ${itemUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
};