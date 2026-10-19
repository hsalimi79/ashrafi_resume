// Builds the two presentation PDFs (Persian + English) from src/data/content.js.
//   node scripts/build-pdf.mjs
// Output: public/downloads/*.pdf  (HTML sources are kept in pdf/.cache for debugging)
import { chromium } from 'playwright-core';
import QRCode from 'qrcode';
import sharp from 'sharp';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { person, ui, services, projects, contact } from '../src/data/content.js';
import media from '../src/data/media.json' with { type: 'json' };
import { icon } from '../src/icons.js';

const root = path.resolve(import.meta.dirname, '..');
const cache = path.join(root, 'pdf/.cache');
const assets = path.join(root, 'pdf/assets');
const outDir = path.join(root, 'public/downloads');
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const SITE = 'https://ashrafi.resumio.ir/';
const fontDir = path.join(root, 'node_modules/@fontsource-variable');
const fontUrl = (pkg, file) => pathToFileURL(path.join(fontDir, pkg, 'files', file)).href;

/* ───────── images → JPEG (smaller PDF, no alpha needed) ───────── */
const portraitJpg = path.join(cache, 'portrait.jpg');
await sharp(path.join(root, 'public/img/portrait.webp')).jpeg({ quality: 88 }).toFile(portraitJpg);

const coverFiles = {};
for (const p of projects) {
  const m = p.slug ? media[p.slug] : null;
  const img = m?.images[p.cover ?? 0];
  if (!img) continue;
  const f = path.join(cache, `cover-${p.id}.jpg`);
  await sharp(path.join(root, 'public', img.src)).resize({ width: 1000 }).jpeg({ quality: 82 }).toFile(f);
  coverFiles[p.id] = f;
}
const fileUrl = (f) => pathToFileURL(f).href;
const scene = (n) => fileUrl(path.join(assets, `scene-${n}.png`));

/* ───────── helpers ───────── */
const toFA = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const phoneView = (n) => {
  const d = String(n).replace(/\D/g, '');
  return `+${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
};

function css(lang) {
  const fa = lang === 'fa';
  return `
@font-face{font-family:'Vz';src:url('${fontUrl('vazirmatn', 'vazirmatn-arabic-wght-normal.woff2')}');font-weight:100 900;unicode-range:U+0600-06FF,U+0750-077F,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE80-FEFC;}
@font-face{font-family:'Vz';src:url('${fontUrl('vazirmatn', 'vazirmatn-latin-wght-normal.woff2')}');font-weight:100 900;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:'Inter';src:url('${fontUrl('inter', 'inter-latin-wght-normal.woff2')}');font-weight:100 900;}
@font-face{font-family:'Fraunces';src:url('${fontUrl('fraunces', 'fraunces-latin-wght-normal.woff2')}');font-weight:100 900;}
@page{size:A4;margin:0}
:root{--ink:#15110d;--ink2:#1d1812;--paper:#f4ecdd;--paper2:#ebe0cb;--blue:#7fd0ff;--amber:#f2a93b;--coral:#ff6b4a;--teal:#2fb5a3;--pink:#ff8fb1;--sky:#5aa9ff;
 --dim:rgba(244,236,221,.72);--line:rgba(244,236,221,.16);--tink:#241c14;--tdim:#5a4c3b;
 --body:${fa ? "'Vz'" : "'Inter'"},'Vz',sans-serif;--disp:${fa ? "'Vz'" : "'Fraunces'"},'Vz',serif}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html{font-family:var(--body);font-size:13px;line-height:${fa ? 1.85 : 1.6}}
body{background:var(--ink)}
a{color:inherit;text-decoration:none}
ul{list-style:none}
.ico{width:1.15em;height:1.15em;flex:none}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
.dark{background:var(--ink);color:var(--paper)}
.paper{background:var(--paper);color:var(--tink)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(127,208,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(127,208,255,.07) 1px,transparent 1px);background-size:38px 38px}
.glow{position:absolute;border-radius:50%;filter:blur(40px)}
.disp{font-family:var(--disp);font-weight:${fa ? 900 : 600};letter-spacing:${fa ? 0 : '-0.02em'}}
.kicker{display:inline-flex;align-items:center;gap:8px;font-size:${fa ? 12 : 10.5}px;font-weight:700;letter-spacing:${fa ? 0 : '.16em'};text-transform:uppercase;color:var(--amber)}
.kicker::before{content:'';width:22px;height:2px;background:currentColor;border-radius:2px}
.paper .kicker{color:#c2511f}
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;font-weight:700;font-size:11.5px}

/* shared header / footer on inner pages */
.top{position:absolute;inset-inline:44px;top:34px;display:flex;justify-content:space-between;align-items:center;font-size:11px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800}
.mono{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--amber),var(--coral));color:#1a1208;font-weight:900;font-size:12px}
.foot{position:absolute;inset-inline:44px;bottom:26px;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;padding-top:12px;border-top:1px solid rgba(36,28,20,.15);color:var(--tdim)}
.dark .foot{border-color:var(--line);color:var(--dim)}
.foot a{font-weight:700}
.body{position:absolute;inset-inline:44px;top:92px;bottom:70px}
.h2{font-family:var(--disp);font-weight:${fa ? 900 : 600};font-size:${fa ? 30 : 31}px;line-height:1.2;margin-top:8px;letter-spacing:${fa ? 0 : '-.02em'}}

/* cover */
.cover .inner{position:absolute;inset:0;padding:40px 44px}
.cover .bar{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--dim)}
.cover .bar b{color:var(--paper)}
.hero{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-top:46px}
.hero .txt{flex:1;padding-top:6px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border:1px solid var(--line);border-radius:99px;color:var(--blue);font-size:11.5px;font-weight:600;background:rgba(127,208,255,.06)}
.eyebrow::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--blue)}
.name{font-family:var(--disp);font-weight:${fa ? 900 : 600};font-size:${fa ? 58 : 60}px;line-height:${fa ? 1.25 : 1.04};letter-spacing:${fa ? 0 : '-.03em'};margin:18px 0 14px;color:#fff}
.name em{font-style:normal;color:var(--amber)}
.role{font-size:${fa ? 17 : 16}px;color:var(--dim);max-width:300px;line-height:1.55}
.portrait{position:relative;width:250px;height:333px;flex:none;margin-top:4px;margin-inline-end:26px;margin-inline-start:14px}
.portrait i{position:absolute;inset:0;border-radius:999px 999px 20px 20px}
.portrait .a{background:linear-gradient(160deg,var(--amber),var(--coral));transform:translate(20px,-14px) rotate(4deg)}
.portrait .b{background:var(--teal);transform:translate(-20px,12px) rotate(-5deg)}
.portrait img{position:relative;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:999px 999px 20px 20px;box-shadow:0 24px 50px -20px rgba(0,0,0,.7)}
.model{position:absolute;inset-inline:0;top:455px;display:flex;justify-content:center}
.model img{width:640px;filter:drop-shadow(0 30px 28px rgba(0,0,0,.55))}
.cap{position:absolute;inset-inline:44px;top:850px;display:flex;justify-content:center;font-size:11px;color:var(--dim)}
.stats{position:absolute;inset-inline:44px;bottom:118px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.stats li{padding:13px 16px;border-radius:16px;background:rgba(244,236,221,.06);border:1px solid var(--line)}
.stats b{display:block;font-family:var(--disp);font-weight:${fa ? 900 : 600};font-size:27px;line-height:1.1;color:var(--amber)}
.stats span{font-size:11px;color:var(--dim);line-height:1.4;display:block;margin-top:3px}
.linkbar{position:absolute;inset-inline:44px;bottom:40px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 20px;border-radius:99px;background:var(--amber);color:#1a1208;font-weight:800;font-size:13px}
.linkbar small{font-weight:600;opacity:.75;font-size:11px}

/* about */
.born{margin:14px 0 14px;padding:9px 14px;border-inline-start:3px solid var(--amber);background:rgba(36,28,20,.05);border-radius:5px 12px 12px 5px;font-size:11.5px;color:var(--tdim)}
.about p.lead{font-size:13px;color:var(--tdim);margin-bottom:10px}
.pillars{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.pillars li{padding:5px 14px;border-radius:99px;background:var(--tink);color:var(--paper);font-weight:700;font-size:11.5px}
.pillars li:nth-child(2){background:#c2511f}.pillars li:nth-child(3){background:#0f7a6d}
.proc{margin-top:30px;padding:26px 24px 22px;border-radius:24px;background:var(--ink);color:var(--paper);position:relative;overflow:hidden}
.proc .grid{opacity:.8}
.proc>*{position:relative}
.proc h3{font-family:var(--disp);font-weight:${fa ? 900 : 600};font-size:19px;margin-top:6px}
.stages{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.stage{display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px 8px 10px;border-radius:16px;background:rgba(244,236,221,.05);border:1px solid var(--line)}
.stage .im{height:176px;display:flex;align-items:center;justify-content:center}
.stage img{max-width:100%;max-height:176px}
.stage b{display:block;margin-top:12px;font-size:12.5px;color:var(--amber)}
.stage span{font-size:10.5px;color:var(--dim);line-height:1.55;margin-top:3px}
.steps5{display:flex;gap:6px;margin-top:16px}
.steps5 li{flex:1;text-align:center;font-size:10px;font-weight:700;padding:5px 2px;border-radius:99px;border:1px solid var(--line);color:var(--dim)}
.steps5 li b{color:var(--amber);margin-inline-end:3px}

/* services */
.svcs{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}
.svc{padding:11px 15px 8px;border-radius:18px;background:#fff9ee;border:1px solid rgba(36,28,20,.09)}
.svc .ic{display:grid;place-items:center;width:29px;height:29px;border-radius:9px;background:var(--tink);color:var(--amber);margin-bottom:6px}
.svc .ic .ico{width:16px;height:16px}
.svc:nth-child(4n+2) .ic{color:var(--teal)}.svc:nth-child(4n+3) .ic{color:var(--pink)}.svc:nth-child(4n) .ic{color:var(--sky)}
.svc h4{font-size:13px;font-weight:800;line-height:1.35;margin-bottom:4px}
.svc li{position:relative;padding-inline-start:13px;font-size:10.4px;line-height:1.5;color:var(--tdim);margin-bottom:2px}
.svc li::before{content:'';position:absolute;inset-inline-start:0;top:.62em;width:5px;height:5px;border-radius:1px;background:var(--amber);transform:rotate(45deg)}
.tools{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.tools li{padding:4px 12px;border-radius:99px;border:1px solid rgba(36,28,20,.2);font-size:11px;font-weight:700}
.quote{margin-top:14px;padding:15px 22px 14px;border-radius:22px;background:var(--ink);color:var(--paper);position:relative;overflow:hidden}
.quote::before{content:'';position:absolute;inset:auto auto -60px -40px;width:200px;height:200px;border-radius:50%;background:rgba(242,169,59,.18);filter:blur(30px)}
.quote p{position:relative;font-family:var(--disp);font-weight:${fa ? 800 : 600};font-size:${fa ? 15.5 : 15.5}px;line-height:1.5}
.prin{position:relative;display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.prin li{padding:3px 11px;border-radius:99px;border:1px solid var(--amber);color:var(--amber);font-size:10.5px;font-weight:700}
.prin li:nth-child(2){border-color:var(--blue);color:var(--blue)}.prin li:nth-child(3){border-color:var(--teal);color:var(--teal)}.prin li:nth-child(4){border-color:var(--pink);color:var(--pink)}.prin li:nth-child(5){border-color:var(--coral);color:var(--coral)}

/* projects */
.cards{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:16px}
.card{position:relative;border-radius:18px;overflow:hidden;background:var(--ink);color:var(--paper);height:282px;display:flex;flex-direction:column}
.card .ph{height:172px;position:relative;background:var(--ink2);flex:none}
.card .ph img{width:100%;height:100%;object-fit:cover}
.card .ph::after{content:'';position:absolute;inset:auto 0 0;height:50px;background:linear-gradient(transparent,var(--ink))}
.card .n{position:absolute;top:10px;inset-inline-end:10px;z-index:2;padding:2px 10px;border-radius:99px;background:var(--accent);color:#1a1208;font-weight:800;font-size:11px}
.card .tx{padding:6px 14px 12px;flex:1}
.card .m{font-size:10.2px;font-weight:700;color:var(--accent)}
.card h4{font-size:14.5px;font-weight:800;line-height:1.35;margin:1px 0 3px}
.card p{font-size:11px;line-height:1.55;color:var(--dim);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card .ph.none{display:grid;place-items:center}
.card .ph.none span{font-family:var(--disp);font-weight:900;font-size:90px;line-height:1;color:transparent;-webkit-text-stroke:1.5px var(--accent);opacity:.55}

/* contact */
.contact .inner{position:absolute;inset:0;padding:40px 44px}
.big{font-family:var(--disp);font-weight:${fa ? 900 : 600};font-size:${fa ? 52 : 54}px;line-height:1.15;letter-spacing:${fa ? 0 : '-.03em'};color:var(--amber);margin-top:12px}
.lede{font-size:15px;color:var(--dim);max-width:380px;margin-top:10px}
.rows{margin-top:30px;display:grid;gap:10px;max-width:520px;position:relative;z-index:2}
.row{display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:18px;background:rgba(244,236,221,.07);border:1px solid var(--line)}
.row .ic{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:var(--amber);color:#1a1208;flex:none}
.row .ic .ico{width:20px;height:20px}
.row:nth-child(2) .ic{background:var(--teal)}.row:nth-child(3) .ic{background:var(--sky)}.row:nth-child(4) .ic{background:var(--pink)}
.row small{display:block;font-size:10.5px;color:var(--dim);line-height:1.3}
.row b{font-size:16px;font-weight:800;line-height:1.35}
.qrwrap{position:relative;z-index:2;margin-top:28px;display:flex;align-items:center;gap:20px}
.qr{width:150px;height:150px;padding:12px;border-radius:20px;background:var(--paper);flex:none}
.qr svg{width:100%;height:100%;display:block}
.qrtxt b{display:block;font-size:22px;font-weight:800;color:#fff;line-height:1.3}
.qrtxt span{display:block;font-size:12px;color:var(--dim);margin-top:4px}
.qrtxt .url{display:inline-block;margin-top:10px;padding:7px 18px;border-radius:99px;background:var(--amber);color:#1a1208;font-weight:800;font-size:13.5px}
.bp{position:absolute;inset-inline-end:-80px;bottom:30px;width:560px;opacity:.9}
.cfoot{position:absolute;inset-inline:44px;bottom:26px;display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim);border-top:1px solid var(--line);padding-top:12px}
`;
}

function build(lang) {
  const fa = lang === 'fa';
  const L = (o) => (o ? o[lang] : '');
  const num = (n) => (fa ? toFA(n) : String(n));
  const dir = fa ? 'rtl' : 'ltr';
  const siteUrl = fa ? SITE : `${SITE}?lang=en`;
  const siteLabel = 'ashrafi.resumio.ir';
  const name = L(person.name);
  const nameParts = name.split(' ');
  const nameHtml = fa
    ? `${nameParts.slice(0, -1).join(' ')} <em>${nameParts.at(-1)}</em>`
    : `${nameParts.slice(0, 2).join(' ')}<br><em>${nameParts.slice(2).join(' ')}</em>`;

  const stats = ui.about.stats
    .map((s) => `<li><b>${s.plain ? (fa ? toFA(s.value) : s.en) : num(s.value)}</b><span>${L(s.label)}</span></li>`)
    .join('');

  const stageDefs = [
    { img: 'stage1', i: 0 },
    { img: 'stage3', i: 2 },
    { img: 'stage5', i: 4 },
  ];
  const stagesHtml = stageDefs
    .map(({ img, i }) => {
      const s = ui.process.steps[i];
      return `<div class="stage"><div class="im"><img src="${scene(img)}" alt=""></div><b>${num('0' + (i + 1))} · ${L(s.t)}</b><span>${L(s.d)}</span></div>`;
    })
    .join('');
  const steps5 = ui.process.steps.map((s, i) => `<li><b>${num('0' + (i + 1))}</b>${L(s.t)}</li>`).join('');

  const svcs = services
    .map(
      (s) => `<article class="svc"><div class="ic">${icon(s.icon)}</div><h4>${L(s.t)}</h4><ul>${s.items.map((it) => `<li>${L(it)}</li>`).join('')}</ul></article>`,
    )
    .join('');

  const cards = projects
    .map((p) => {
      const ph = coverFiles[p.id]
        ? `<div class="ph"><img src="${fileUrl(coverFiles[p.id])}" alt=""></div>`
        : `<div class="ph none"><span>${p.n}</span></div>`;
      return `<article class="card" style="--accent:${p.color}">${ph}<span class="n">${fa ? toFA(p.n) : p.n}</span><div class="tx"><div class="m">${L(p.location)} · ${L(p.year)}</div><h4>${L(p.title)}</h4><p>${L(p.topic)}</p></div></article>`;
    })
    .join('');

  const rows = [];
  if (contact.phone)
    rows.push(`<a class="row" href="tel:${contact.phone}"><span class="ic">${icon('phone')}</span><span><small>${fa ? 'تلفن' : 'Phone'}</small><b dir="ltr">${phoneView(contact.phone)}</b></span></a>`);
  if (contact.whatsapp)
    rows.push(`<a class="row" href="https://wa.me/${contact.whatsapp}"><span class="ic">${icon('chat')}</span><span><small>WhatsApp</small><b dir="ltr">${phoneView(contact.whatsapp)}</b></span></a>`);
  if (contact.telegram)
    rows.push(`<a class="row" href="https://t.me/${contact.telegram.startsWith('+') ? contact.telegram : '+' + contact.telegram}"><span class="ic">${icon('send')}</span><span><small>Telegram</small><b dir="ltr">${phoneView(contact.telegram)}</b></span></a>`);
  if (contact.instagram)
    rows.push(`<a class="row" href="https://instagram.com/${contact.instagram}"><span class="ic">${icon('insta')}</span><span><small>Instagram</small><b dir="ltr">@${contact.instagram}</b></span></a>`);
  if (contact.email)
    rows.push(`<a class="row" href="mailto:${contact.email}"><span class="ic">${icon('mail')}</span><span><small>Email</small><b dir="ltr">${contact.email}</b></span></a>`);

  const footLink = `<a href="${siteUrl}">${siteLabel}</a>`;
  const top = (label) => `<div class="top"><div class="brand"><span class="mono">${L(person.initials)}</span><span>${name}</span></div><span style="opacity:.65">${label}</span></div>`;
  const foot = (n) => `<div class="foot">${footLink}<span dir="ltr">${num(n)} / ${num(5)}</span></div>`;

  return { dir, siteUrl, html: (qrSvg) => `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${name} — ${fa ? 'رزومه' : 'Resume'}</title><style>${css(lang)}</style></head><body>

<!-- 1 · cover -->
<section class="page dark cover">
  <div class="grid"></div>
  <div class="glow" style="width:380px;height:380px;background:rgba(242,169,59,.22);top:-120px;inset-inline-end:-80px"></div>
  <div class="glow" style="width:340px;height:340px;background:rgba(127,208,255,.14);bottom:60px;inset-inline-start:-120px"></div>
  <div class="inner">
    <div class="bar"><div class="brand"><span class="mono">${L(person.initials)}</span><b>${fa ? 'رزومه و نمونه‌کار' : 'Resume & portfolio'}</b></div><a href="${siteUrl}"><b>${siteLabel}</b></a></div>
    <div class="hero">
      <div class="txt">
        <span class="eyebrow">${L(ui.hero.eyebrow)}</span>
        <h1 class="name">${nameHtml}</h1>
        <p class="role">${L(person.role)}</p>
      </div>
      <div class="portrait"><i class="a"></i><i class="b"></i><img src="${fileUrl(portraitJpg)}" alt="${person.name.en}"></div>
    </div>
    <div class="model"><img src="${scene('built')}" alt=""></div>
    <div class="cap">${L(ui.hero.caption)}</div>
    <ul class="stats">${stats}</ul>
    <a class="linkbar" href="${siteUrl}"><span>${fa ? 'مشاهده سایت و ویدیوی پروژه‌ها' : 'See the website, photos & project videos'}</span><span dir="ltr">${siteLabel} →</span></a>
  </div>
</section>

<!-- 2 · about + process -->
<section class="page paper">
  ${top(L(ui.about.kicker))}
  <div class="body about">
    <span class="kicker">${L(ui.about.kicker)}</span>
    <h2 class="h2">${L(ui.about.title)}</h2>
    <p class="born">${L(ui.about.born)}</p>
    ${ui.about.paragraphs.slice(0, 3).map((p) => `<p class="lead">${L(p)}</p>`).join('')}
    <ul class="pillars">${ui.about.pillars.map((p) => `<li>${L(p)}</li>`).join('')}</ul>
    <div class="proc dark">
      <div class="grid"></div>
      <span class="kicker">${L(ui.process.kicker)}</span>
      <h3>${L(ui.process.title)}</h3>
      <div class="stages">${stagesHtml}</div>
      <ul class="steps5">${steps5}</ul>
    </div>
  </div>
  ${foot(2)}
</section>

<!-- 3 · services -->
<section class="page paper">
  ${top(L(ui.services.kicker))}
  <div class="body">
    <span class="kicker">${L(ui.services.kicker)}</span>
    <h2 class="h2">${L(ui.services.title)}</h2>
    <div class="svcs">${svcs}</div>
    <div class="quote">
      <p>“${L(ui.approach.quote)}”</p>
      <ul class="prin">${ui.approach.principles.map((p) => `<li>${L(p)}</li>`).join('')}</ul>
    </div>
  </div>
  ${foot(3)}
</section>

<!-- 4 · projects -->
<section class="page paper">
  ${top(L(ui.projects.kicker))}
  <div class="body">
    <span class="kicker">${L(ui.projects.kicker)}</span>
    <h2 class="h2" style="font-size:${fa ? 24 : 25}px">${L(ui.projects.title)}</h2>
    <div class="cards">${cards}</div>
  </div>
  ${foot(4)}
</section>

<!-- 5 · contact -->
<section class="page dark contact">
  <div class="grid"></div>
  <div class="glow" style="width:420px;height:420px;background:rgba(242,169,59,.18);top:-140px;inset-inline-start:-100px"></div>
  <img class="bp" src="${scene('stage1')}" alt="">
  <div class="inner">
    <span class="kicker">${L(ui.contact.kicker)}</span>
    <h2 class="big">${L(ui.contact.title)}</h2>
    <p class="lede">${L(ui.contact.text)}</p>
    <div class="rows">${rows.join('')}</div>
    <div class="qrwrap">
      <div class="qr">${qrSvg}</div>
      <div class="qrtxt">
        <b>${fa ? 'سایت کامل با ویدیوها' : 'The full site, with videos'}</b>
        <span>${fa ? 'کد را اسکن کنید یا روی لینک بزنید' : 'Scan the code or tap the link'}</span>
        <a class="url" href="${siteUrl}" dir="ltr">${siteLabel}</a>
      </div>
    </div>
  </div>
  <div class="cfoot"><span>${L(person.name)} · ${L(person.location)}</span><span dir="ltr">${num(5)} / ${num(5)}</span></div>
</section>

</body></html>` };
}

/* ───────── render ───────── */
const exe = path.join(os.homedir(), '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome');
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const names = { fa: 'Mohammad-Javad-Ashrafi-Resume-FA.pdf', en: 'Mohammad-Javad-Ashrafi-Resume-EN.pdf' };

for (const lang of ['fa', 'en']) {
  const { html, siteUrl } = build(lang);
  const qr = await QRCode.toString(siteUrl, { type: 'svg', margin: 0, color: { dark: '#15110d', light: '#00000000' } });
  const htmlFile = path.join(cache, `resume-${lang}.html`);
  fs.writeFileSync(htmlFile, html(qr));
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(outDir, names[lang]), preferCSSPageSize: true, printBackground: true });
  await page.close();
  console.log('wrote', names[lang], (fs.statSync(path.join(outDir, names[lang])).size / 1024).toFixed(0) + ' KB');
}
await browser.close();
