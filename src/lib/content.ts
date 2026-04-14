// src/lib/content.ts
import { getCollection } from 'astro:content';

export async function getPublishedArticles() {
  const articles = await getCollection('posts');
  // Example: Sort by date descending, filter out drafts
  return articles
    // .filter(article => !article.data.draft) 
    .sort((a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf());
}