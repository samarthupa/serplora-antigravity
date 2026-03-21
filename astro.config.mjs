import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// 👇 CTO FIX: Detect if we are building for production or running locally
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  output: 'static', 
  
  // 👇 ONLY use the adapter when building on Cloudflare. 
  // This completely stops the infinite loop and crashes on your local Mac.
  adapter: isProd ? cloudflare() : undefined, 

  integrations: [react(), markdoc({ allowHTML: true }), keystatic()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
        // 👇 ONLY apply this fix during production builds to satisfy Cloudflare's bundler.
        noExternal: isProd ? ['@keystatic/astro'] : [],
    }
  },
});