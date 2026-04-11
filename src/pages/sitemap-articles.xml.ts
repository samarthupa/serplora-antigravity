import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';
  
  // Fetch all posts and filter out the ones marked as draft
  const posts = await getCollection('posts', (entry) => !entry.data.draft && entry.data.seo?.robotsIndex !== false);

  const urls = posts.map(post => {
    // Keystatic saves in folders, so we extract the base slug (e.g., 'mera-desh-badal-raha-hai')
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
      ${urls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
}