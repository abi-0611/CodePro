import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Used for canonical URLs + sitemap generation.
  // Set `SITE_URL` in your deployment environment (e.g. https://edulaunch.edu).
  site: process.env.SITE_URL ?? 'http://localhost:3000',
  // For GitHub Pages project sites (e.g. https://user.github.io/repo/), set `SITE_BASE` to "/repo".
  base: process.env.SITE_BASE ?? '',
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});