import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const siteUrl = context.site?.toString() || 'https://serplora.com';

  // 1. Fetch the Projects Index Page (e.g., /projects)
  const projectsPage = await getEntry('projectsPage', 'data');
  let indexUrl = '';
  if (projectsPage && projectsPage.data.seo?.robotsIndex !== false) {
    indexUrl = `
      <url>
        <loc>${new URL('/projects', siteUrl).toString()}</loc>
      </url>
    `;
  }

  // 2. Fetch Project Categories (e.g., /projects/python, /projects/java)
  const projectCategories = await getCollection('projectCategories', (entry) => 
    entry.data.seo?.robotsIndex !== false
  );
  
  const categoryUrls = projectCategories.map(category => {
    const slug = category.id.split('/')[0];
    return `
      <url>
        <loc>${new URL(`/projects/${slug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  // 3. Fetch Individual Projects (e.g., /projects/python/dndndd)
  const projects = await getCollection('projects', (entry) => 
    !entry.data.draft && entry.data.seo?.robotsIndex !== false
  );
  
  const projectUrls = projects.map(project => {
    const slug = project.id.split('/')[0];
    
    // Grab the first category from the array to construct the parent path
    // Fallback to a default string just in case a project was saved without a category
    const categorySlug = project.data.categories?.[0] || 'general';
    
    return `
      <url>
        <loc>${new URL(`/projects/${categorySlug}/${slug}`, siteUrl).toString()}</loc>
      </url>
    `;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${indexUrl}
      ${categoryUrls}
      ${projectUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
};