import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import pagefind from 'astro-pagefind';

// Detect if you are running locally
const isLocalDev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://serplora.com',
  output: 'static', 
  
  // 👇 1. Tell Astro to build links without trailing slashes
  trailingSlash: 'never',

  build: {
    // 👇 2. Output flat files (e.g., articles.html) so Cloudflare handles the redirects automatically
    format: 'file', 
    assets: 'assets',
    inlineStylesheets: 'always'
  },

  integrations: [
    react(), 
    markdoc({ allowHTML: true }), 
    pagefind(), 
    ...(isLocalDev ? [keystatic()] : [])
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
        external: ['relatinator']
    },
    optimizeDeps: {
        exclude: ['relatinator']
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(isLocalDev ? 'development' : 'production')
    },
    
    // 👇 ASTRO V6 FIX: Apply the hash rules to the client environment
    environments: {
      client: {
        build: {
          target: 'es2022', // 🌟 NEW: Prevent polyfilling legacy JS features to save ~7.5 KiB
          rollupOptions: {
            output: {
              entryFileNames: 'assets/[hash].js',
              chunkFileNames: 'assets/[hash].js',
              assetFileNames: 'assets/[hash][extname]'
            }
          }
        }
      }
    },
    
    // 👇 Keep standard build rules for SSR/server consistency
    build: {
      target: 'es2022', // 🌟 NEW: Match the standard build target to the client target
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]'
        }
      }
    }
  },
});