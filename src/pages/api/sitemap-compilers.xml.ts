import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';

  // 1. Fetch the Compilers Index Page
  const compilersPage = await getEntry('compilersPage', 'data');
  let indexUrl = '';
  if (compilersPage && compilersPage.data.seo?.robotsIndex !== false) {
    indexUrl = `
      <url>
        <loc>${new URL('/compilers', siteUrl).toString()}</loc>
      </url>
    `;
  }

  // 2. Fetch all compilers and filter out drafts/noindex
  const compilers = await getCollection('compilers', (entry) => 
    !entry.data.draft && entry.data.seo?.robotsIndex !== false
  );
  
  const compilerUrls = compilers.map(compiler => {
    const slug = compiler.id.split('/')[0]; 
    return `
      <url>
        <loc>${new URL(`/compilers/${slug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${indexUrl}
      ${compilerUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
};