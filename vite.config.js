import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { renderPage } from './src/render.js';

// Relative base: works at a domain root, a subdomain, or a project sub-path
// (e.g. https://example.com/ashrafi_resume/) without rebuilding.
export default defineConfig({
  base: './',
  plugins: [{
    name: 'prerender-resume',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const media = JSON.parse(readFileSync(new URL('./src/data/media.json', import.meta.url), 'utf8'));
        return html.replace('<!--resume-content-->', renderPage(media));
      },
    },
  }],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'motion', test: /node_modules[\\/](gsap|lenis)[\\/]/ }],
        },
      },
    },
  },
});
