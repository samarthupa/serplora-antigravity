import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';
  
  // Fetch all compilers and filter out drafts/noindex
  const compilers = await getCollection('compilers', (entry) => !entry.data.draft && entry.data.seo?.robotsIndex !== false);

  const urls = compilers.map(compiler => {
    const slug = compiler.id.split('/')[0]; 
    return `
      <url>
        <loc>${new URL(`/compilers/${slug}`, siteUrl).toString()}</loc>
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