import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  base: '/admin',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Content-hashed filenames for CDN cache-busting
      rollupOptions: {
        output: {
          assetFileNames: '_assets/[name].[hash][extname]',
          chunkFileNames: '_assets/[name].[hash].js',
          entryFileNames: '_assets/[name].[hash].js',
        },
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
  server: {
    port: 4322,
    host: '0.0.0.0',
  },
});
