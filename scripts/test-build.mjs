// Run after npm run build. Checks the deployed artifact, not just source templates.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { person, projects, ui } from '../src/data/content.js';
import { renderPage } from '../src/render.js';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const media = JSON.parse(await readFile(path.join(root, 'src/data/media.json'), 'utf8'));
assert(!html.includes('<!--resume-content-->'), 'HTML must be rendered during build');
assert(html.includes(renderPage(media)), 'Build must contain the full shared page template');
assert(html.includes(person.name.fa) && html.includes(person.name.en));
for (const id of ['top', 'about', 'process', 'projects', 'services', 'contact']) {
  assert(html.includes(`id="${id}"`), `Missing static section: ${id}`);
}
for (const project of projects) {
  assert(html.includes(`data-project="${project.id}"`));
  assert(html.includes(project.title.fa) && html.includes(project.title.en));
}
for (const step of ui.process.steps) assert(html.includes(step.d.fa));

// All page assets resolve on both a domain root and a project subpath.
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) {
  assert((await stat(path.join(dist, match[1]))).isFile(), `Missing asset: ${match[1]}`);
  assert(new URL(match[1], 'https://example.com/resume/').pathname.startsWith('/resume/'));
}
const entryName = html.match(/<script[^>]+type="module"[^>]+src="\.\/(assets\/[^\"]+)"/)?.[1];
assert(entryName, 'Missing module entry');
const entry = await readFile(path.join(dist, entryName), 'utf8');
assert(/import\([^)]*scene-/.test(entry), '3D must remain a dynamic import');
assert(!/<link[^>]+rel="modulepreload"[^>]+scene-/.test(html), 'Do not preload optional 3D');
for (const name of await readdir(path.join(dist, 'assets'))) {
  if (name.endsWith('.js') && !name.startsWith('scene-')) {
    const bytes = gzipSync(await readFile(path.join(dist, 'assets', name))).byteLength;
    assert(bytes < 64 * 1024, `Initial JS chunk is too large: ${name} (${bytes})`);
    console.log(`${name}: ${(bytes / 1024).toFixed(1)} KiB gzip`);
  }
}

let files = 0;
async function checkPublic(dir = '') {
  for (const file of await readdir(path.join(root, 'public', dir), { withFileTypes: true })) {
    const relative = path.join(dir, file.name);
    if (file.isDirectory()) await checkPublic(relative);
    else {
      const original = await readFile(path.join(root, 'public', relative));
      assert(original.equals(await readFile(path.join(dist, relative))), `Changed public file: ${relative}`);
      files++;
    }
  }
}
await checkPublic();
let images = 0, localVideos = 0, remoteVideos = 0;
for (const gallery of Object.values(media)) {
  images += gallery.images.length;
  for (const item of [...gallery.images, ...gallery.videos]) {
    if (/^https:\/\//.test(item.src)) {
      remoteVideos++;
      if (item.provider === 'google-drive') assert(item.src.endsWith('/preview'));
    } else {
      assert((await stat(path.join(dist, item.src))).isFile(), `Missing media: ${item.src}`);
      if (item.poster) localVideos++;
    }
    if (item.poster) assert((await stat(path.join(dist, item.poster))).isFile());
  }
}
async function checkSize(dir = dist) {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, file.name);
    if (file.isDirectory()) await checkSize(name);
    else assert((await stat(name)).size <= 25 * 1024 * 1024, `Oversized deploy file: ${name}`);
  }
}
await checkSize();
console.log(`PASS: rendered bilingual HTML; ${files} unchanged public files; ${images} images, ${localVideos} local videos, ${remoteVideos} external videos; no file over 25 MiB.`);
