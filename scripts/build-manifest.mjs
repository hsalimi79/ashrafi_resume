// Scans public/media/<slug>/ and writes src/data/media.json
// (image + video lists with dimensions so the gallery can reserve space and avoid layout shift).
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const mediaDir = path.join(root, 'public', 'media');
const outFile = path.join(root, 'src', 'data', 'media.json');
const videoSources = JSON.parse(await readFile(path.join(root, 'src', 'data', 'video-sources.json'), 'utf8'));

for (const slug of Object.keys(videoSources)) {
  if (!existsSync(path.join(mediaDir, slug))) throw new Error(`Unknown video project: ${slug}`);
}

const size = async (file) => {
  const { width, height } = await sharp(file).metadata();
  return { w: width, h: height };
};

const manifest = {};
for (const slug of (await readdir(mediaDir)).sort()) {
  const dir = path.join(mediaDir, slug);
  // Keep remote videos in the gallery after their local MP4 has been removed.
  const remote = videoSources[slug] ?? {};
  for (const [file, source] of Object.entries(remote)) {
    if (!file.endsWith('.mp4') || path.basename(file) !== file) {
      throw new Error(`Invalid video filename: ${slug}/${file}`);
    }
    const url = new URL(source.src);
    if (url.protocol !== 'https:' || (source.provider && source.provider !== 'google-drive')) {
      throw new Error(`Invalid external video source: ${slug}/${file}`);
    }
    if (source.provider === 'google-drive' &&
        (url.origin !== 'https://drive.google.com' || !/^\/file\/d\/[\w-]+\/preview$/.test(url.pathname))) {
      throw new Error(`Google Drive videos require a /file/d/<file-id>/preview URL: ${slug}/${file}`);
    }
    // Vite copies all of public/, even files the manifest no longer references.
    if (existsSync(path.join(dir, file))) {
      throw new Error(`External video still has a local MP4 in public/media/${slug}/${file}. Move it outside public/ before building.`);
    }
  }
  const files = [...new Set([...(await readdir(dir)), ...Object.keys(remote)])].sort();
  const images = [];
  const videos = [];

  for (const f of files) {
    if (f.endsWith('.poster.webp')) continue;
    const url = `media/${slug}/${f}`;
    if (f.endsWith('.webp')) {
      images.push({ src: url, ...(await size(path.join(dir, f))) });
    } else if (f.endsWith('.mp4')) {
      const posterName = f.replace(/\.mp4$/, '.poster.webp');
      if (!existsSync(path.join(dir, posterName))) {
        if (remote[f]) throw new Error(`Missing poster for external video: ${slug}/${posterName}`);
        continue;
      }
      videos.push({
        src: remote[f] ? new URL(remote[f].src).href : url,
        ...(remote[f]?.provider ? { provider: remote[f].provider } : {}),
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
