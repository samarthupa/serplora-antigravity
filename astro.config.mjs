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

  // Rename the default folder to assets
  build: {
    assets: 'assets' 
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