import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// 👇 Detect if you are running 'npm run dev' on your local Mac
const isLocalDev = process.argv.includes('dev');

export default defineConfig({
  output: 'static', 

  // Notice: The Cloudflare adapter is completely gone! 

  integrations: [
    react(), 
    markdoc({ allowHTML: true }), 
    
    // 👇 This is the magic. It only injects Keystatic when you are developing locally.
    // Cloudflare will never see it, build it, or crash from it.
    ...(isLocalDev ? [keystatic()] : [])
  ],

  vite: {
    plugins: [tailwindcss()],
    // Notice: All the messy SSR and optimizeDeps hacks are gone too!
  },
});