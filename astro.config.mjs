import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import markdoc from '@astrojs/markdoc';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react(), markdoc({ allowHTML: true }), keystatic()],

  vite: {
    plugins: [tailwindcss()],
  },
});