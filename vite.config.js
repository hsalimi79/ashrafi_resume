import { defineConfig } from 'vite';

// Relative base: works at a domain root, a subdomain, or a project sub-path
// (e.g. https://example.com/ashrafi_resume/) without rebuilding.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
