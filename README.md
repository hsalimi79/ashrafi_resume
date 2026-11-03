# Mohammad Javad Ashrafi — bilingual resume site

Vite + Three.js static site (Persian RTL / English LTR). Deployed to GitHub Pages.

## Edit content
- Text (both languages), projects, services: `src/data/content.js`
- Contact buttons (phone / WhatsApp / Telegram / Instagram / email): `contact` at the bottom of `src/data/content.js` — empty values stay hidden.
- Photos/videos: `public/media/<project>/`. After adding files run `npm run manifest` (dev/build do it automatically).
- External videos: `src/data/video-sources.json` maps a project slug and original MP4 filename to an object with an HTTPS `src` URL. For a direct playable video, omit `provider`; for Google Drive use `provider: "google-drive"` and a `/file/d/<file-id>/preview` URL. Drive videos use an iframe; direct URLs and local videos use the existing HTML video player. The Drive file must be viewable by anyone with the link.
- Keep each external video's matching `.poster.webp` in `public/media/<project>/`, but move its MP4 outside `public/`. The manifest validates the configuration and fails if an external video's local MP4 is still present, so Vite cannot accidentally copy it into `dist/`.

## Run
```
npm install
npm run dev
npm run build   # outputs dist/
npm run test:build   # checks rendered HTML, chunks, media and deployment size
```

## Resilient first load
Vite renders the existing bilingual page templates from `src/render.js` into HTML during dev/build. Content, section links and contact/download links remain visible if JavaScript is delayed or unavailable; galleries and language controls are enhanced by `src/main.js`. Reveal animations only hide off-screen elements after their observer is installed. The process steps are a readable list until their controls initialize.

The Three.js scene is an optional dynamic import, scheduled after the first paint. A failed scene download or unavailable WebGL does not prevent the resume and galleries from initializing. No changes to DNS or the hosting service are required.

## Cloudflare Pages
Use `npm run build` as the build command and `dist` as the output directory. Each deployed file must be at most 25 MiB. Vite copies `public/` into `dist/`, so changing a manifest URL alone does not exclude a local MP4 from deployment. All remaining local files must also satisfy the size limit; externalizing one video does not automatically make the entire output eligible.

## Custom subdomain on GitHub Pages
1. Create `public/CNAME` containing only your subdomain, e.g. `resume.example.com`.
2. DNS: add a `CNAME` record `resume` → `<github-username>.github.io`.
3. Repo → Settings → Pages → Source: **GitHub Actions**, then enable *Enforce HTTPS*.

## Media
Optimized copies (WebP / H.264) live in `public/media` (~600 MB, every file < 100 MB).
`optimize_media.sh` re-creates them from the raw originals if you add more.

## Language links
The link picks the language; no parameter means Persian.
- Persian: `https://<site>/` (or `?lang=fa`)
- English: `https://<site>/?lang=en`
- A project, in English: `https://<site>/?lang=en#/project/einstein`
(project ids: `kids-land`, `kidzlounge`, `einstein`, `javaneha`, `expo`, `fereshtegan`)
The language button writes `?lang=fa` or `?lang=en` into the address bar, so copying the URL keeps the language.

## Resume PDFs (Persian + English)
`npm run build` does not regenerate them. To rebuild after editing `src/data/content.js`:
```
npx vite preview --port 4173 &      # only needed to re-capture the 3D snapshots
node scripts/snapshot-scene.mjs     # optional: pdf/assets/scene-*.png
node scripts/build-pdf.mjs          # -> public/downloads/*.pdf
```
