import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';

  // 1. Fetch the Articles/Blog Index Page
  const blogPage = await getEntry('blogPage', 'data');
  let indexUrl = '';
  if (blogPage && blogPage.data.seo?.robotsIndex !== false) {
    indexUrl = `
      <url>
        <loc>${new URL('/articles', siteUrl).toString()}</loc>
      </url>
    `;
  }

  // 2. Fetch all posts
  const posts = await getCollection('posts', (entry) => 
    !entry.data.draft && entry.data.seo?.robotsIndex !== false
  );
  
  const postUrls = posts.map(post => {
    const slug = post.id.split('/')[0];
    const date = post.data.updatedDate || post.data.publishDate || new Date();
    return `
      <url>
        <loc>${new URL(`/articles/${slug}`, siteUrl).toString()}</loc>
        <lastmod>${new Date(date).toISOString()}</lastmod>
      </url>
    `;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${indexUrl}
      ${postUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
};