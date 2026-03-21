import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// 👇 1. Bring the Cloudflare adapter back
import cloudflare from '@astrojs/cloudflare'; 

export default defineConfig({
  // 👇 2. Change this to 'hybrid' (the best of both worlds)
  output: 'hybrid', 
  
  // 👇 3. Tell Astro to use the Cloudflare adapter
  adapter: cloudflare(), 

  integrations: [react(), markdoc({ allowHTML: true }), keystatic()],

  vite: {
    plugins: [tailwindcss()],
  },
});