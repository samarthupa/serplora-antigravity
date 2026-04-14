import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  // Grabs the 'site' URL defined in your astro.config.mjs
  const siteUrl = context.site?.toString() || 'https://serplora.com';

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>${new URL('/api/sitemap-articles.xml', siteUrl).toString()}</loc></sitemap>
      <sitemap><loc>${new URL('/api/sitemap-tutorials.xml', siteUrl).toString()}</loc></sitemap>
      <sitemap><loc>${new URL('/api/sitemap-quizzes.xml', siteUrl).toString()}</loc></sitemap>
      <sitemap><loc>${new URL('/api/sitemap-quizzes.xml', siteUrl).toString()}</loc></sitemap>
      <sitemap><loc>${new URL('/api/sitemap-compilers.xml', siteUrl).toString()}</loc></sitemap>
    </sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: { 'Content-Type': 'application/xml' }
  });
}