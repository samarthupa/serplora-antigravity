import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // 👇 Add this line so Astro knows to build server files
  output: 'server', 
  
  adapter: cloudflare(),
  integrations: [react(), markdoc({ allowHTML: true }), keystatic()],

  vite: {
    plugins: [tailwindcss()],
    // 👇 Add this entire ssr block to fix the Vite crash
    ssr: {
      noExternal: ['@keystatic/astro'],
    },
  },
});