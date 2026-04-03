import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import pagefind from 'astro-pagefind'; // 👈 NEW

// Detect if you are running locally
const isLocalDev = process.argv.includes('dev');

export default defineConfig({
  output: 'static', 

  // 1. Rename the default _astro folder to assets
  build: {
    assets: 'assets' 
  },

  integrations: [
    react(), 
    markdoc({ allowHTML: true }), 
    pagefind(), // 👈 NEW
    // Keystatic ONLY runs locally
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
    // 👇 2. Unconditionally enforce hashed filenames (NO ternary condition here)
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