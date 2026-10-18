import { defineConfig } from 'vite';

// Custom domain on GitHub Pages serves from the root, so base stays '/'.
export default defineConfig({
  base: '/',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
