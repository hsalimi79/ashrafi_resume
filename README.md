# Mohammad Javad Ashrafi — bilingual resume site

Vite + Three.js static site (Persian RTL / English LTR). Deployed to GitHub Pages.

## Edit content
- Text (both languages), projects, services: `src/data/content.js`
- Contact buttons (phone / WhatsApp / Telegram / Instagram / email): `contact` at the bottom of `src/data/content.js` — empty values stay hidden.
- Photos/videos: `public/media/<project>/`. After adding files run `npm run manifest` (dev/build do it automatically).

## Run
```
npm install
npm run dev
npm run build   # outputs dist/
```

## Custom subdomain on GitHub Pages
1. Create `public/CNAME` containing only your subdomain, e.g. `resume.example.com`.
2. DNS: add a `CNAME` record `resume` → `<github-username>.github.io`.
3. Repo → Settings → Pages → Source: **GitHub Actions**, then enable *Enforce HTTPS*.

## Media
Optimized copies (WebP / H.264) live in `public/media` (~600 MB, every file < 100 MB).
`optimize_media.sh` re-creates them from the raw originals if you add more.

## Language links
The link picks the language; no parameter means Persian.
- Persian: `https://<site>/`
- English: `https://<site>/?lang=en`
- A project, in English: `https://<site>/?lang=en#/project/einstein`
(project ids: `kids-land`, `kidzlounge`, `einstein`, `javaneha`, `expo`, `fereshtegan`)
The language button also updates the address bar, so copying the URL keeps the language.
