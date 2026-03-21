import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Keep output as static
  output: 'static', 
  
  // Keep the adapter for Keystatic GitHub Login API
  adapter: cloudflare(), 

  integrations: [react(), markdoc({ allowHTML: true }), keystatic()],

  vite: {
    plugins: [tailwindcss()],
    // 👇 THIS is the magic block that stops the infinite loop and the virtual:keystatic-config error.
    optimizeDeps: {
        exclude: ['@keystatic/astro'],
    },
    ssr: {
        noExternal: ['@keystatic/astro'],
    }
  },
});