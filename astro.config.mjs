import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// Detect if you are running locally
const isLocalDev = process.argv.includes('dev');

export default defineConfig({
  output: 'static', 

  integrations: [
    react(), 
    markdoc({ allowHTML: true }), 
    
    // Keystatic ONLY runs on your Mac now.
    ...(isLocalDev ? [keystatic()] : [])
  ],

  vite: {
    plugins: [tailwindcss()],
    // 👇 THIS is the fix for the blank white screen! 
    // It forces React to render the HTML properly on Cloudflare's servers.
    define: {
        'process.env.NODE_ENV': JSON.stringify(isLocalDev ? 'development' : 'production')
    }
  },
});