import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// 👇 CTO FIX: 100% reliable way to detect if Cloudflare is building the site
const isBuild = process.argv.includes('build');

export default defineConfig({
  output: 'static', 

  // 👇 Only use the Cloudflare adapter when deploying. Prevents local crashes!
  adapter: isBuild ? cloudflare() : undefined,

  integrations: [react(), markdoc({ allowHTML: true }), keystatic()],

  vite: {
    plugins: [tailwindcss()],
    // 👇 THIS is mandatory. Do not delete it! It permanently stops the infinite loop.
    ssr: {
        noExternal: ['@keystatic/astro'],
    }
  },
});