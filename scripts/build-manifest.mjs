// Scans public/media/<slug>/ and writes src/data/media.json
// (image + video lists with dimensions so the gallery can reserve space and avoid layout shift).
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const mediaDir = path.join(root, 'public', 'media');
const outFile = path.join(root, 'src', 'data', 'media.json');

const size = async (file) => {
  const { width, height } = await sharp(file).metadata();
  return { w: width, h: height };
};

const manifest = {};
for (const slug of (await readdir(mediaDir)).sort()) {
  const dir = path.join(mediaDir, slug);
  const files = (await readdir(dir)).sort();
  const images = [];
  const videos = [];

  for (const f of files) {
    if (f.endsWith('.poster.webp')) continue;
    const url = `media/${slug}/${f}`;
    if (f.endsWith('.webp')) {
      images.push({ src: url, ...(await size(path.join(dir, f))) });
    } else if (f.endsWith('.mp4')) {
      const posterName = f.replace(/\.mp4$/, '.poster.webp');
      if (!existsSync(path.join(dir, posterName))) continue;
      videos.push({
        src: url,
        poster: `media/${slug}/${posterName}`,
        ...(await size(path.join(dir, posterName))),
      });
    }
  }
  manifest[slug] = { images, videos };
}

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(manifest));
for (const [slug, m] of Object.entries(manifest)) {
  console.log(`${slug.padEnd(20)} ${m.images.length} images, ${m.videos.length} videos`);
}
