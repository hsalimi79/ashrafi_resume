import '@fontsource-variable/vazirmatn';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './style.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { person, ui, services, projects, contact } from './data/content.js';
import media from './data/media.json';
import { icon } from './icons.js';
import { createScene } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

const BASE = import.meta.env.BASE_URL;
const asset = (p) => BASE + p;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => innerWidth >= 960;

/* ───────────── i18n ───────────── */
const bi = (o) => `<span data-l="fa">${o.fa}</span><span data-l="en">${o.en}</span>`;
const toFA = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const getLang = () => document.documentElement.lang;

function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'fa' || q === 'en') return q;
  try {
    const s = localStorage.getItem('lang');
    if (s === 'fa' || s === 'en') return s;
  } catch {}
  return (navigator.language || 'fa').toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function applyLang(lang, { persist = true } = {}) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.title =
    lang === 'fa'
      ? `${person.name.fa} — طراح و مجری فضاهای کودک`
      : `${person.name.en} — Designer & builder of children’s spaces`;
  document.querySelector('meta[name="description"]').content =
    lang === 'fa'
      ? 'رزومه محمد جواد اشرفی؛ مهندس معماری، طراح و مجری دکوراسیون داخلی، مهدکودک، خانه‌بازی و سازه‌های سفارشی MDF و فلز در اصفهان.'
      : 'Resume of Mohammad Javad Ashrafi — architectural engineer, interior designer and builder of kindergartens, play houses and custom MDF & steel structures in Isfahan, Iran.';
  document.querySelectorAll('[data-aria]').forEach((el) => {
    el.setAttribute('aria-label', el.dataset[`aria${lang === 'fa' ? 'Fa' : 'En'}`]);
  });
  if (persist) {
    try {
      localStorage.setItem('lang', lang);
    } catch {}
  }
  layoutScene();
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* ───────────── markup ───────────── */
const mediaOf = (p) => (p.slug ? media[p.slug] : null);
const coverSrc = (p) => {
  const m = mediaOf(p);
  if (!m || !m.images.length) return null;
  return m.images[p.cover ?? 0] ?? m.images[0];
};

function navHTML() {
  const links = ['about', 'process', 'projects', 'services', 'contact']
    .map((k) => `<a href="#${k}" data-nav="${k}">${bi(ui.nav[k])}</a>`)
    .join('');
  return `
  <header class="nav" id="nav">
    <a class="nav__brand" href="#top" aria-label="${person.name.en}">
      <span class="nav__mono">${bi(person.initials)}</span>
      <span class="nav__name">${bi(person.name)}</span>
    </a>
    <nav class="nav__links" id="menu" aria-label="Main">${links}</nav>
    <div class="nav__tools">
      <button class="lang" id="lang" type="button" data-aria data-aria-fa="Switch to English" data-aria-en="تغییر زبان به فارسی">
        <span data-l="fa">EN</span><span data-l="en">فا</span>
      </button>
      <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" data-aria data-aria-fa="منو" data-aria-en="Menu">
        <i></i><i></i>
      </button>
    </div>
  </header>`;
}

function heroHTML() {
  return `
  <section class="hero" id="top">
    <div class="hero__grid" aria-hidden="true"></div>
    <div class="wrap hero__inner">
      <div class="hero__text">
        <p class="eyebrow" data-hero>${bi(ui.hero.eyebrow)}</p>
        <h1 class="hero__name" data-hero>${bi(person.name)}</h1>
        <p class="hero__role" data-hero>${bi(person.role)}</p>
        <div class="hero__cta" data-hero>
          <a class="btn btn--primary" href="#projects">${bi(ui.hero.ctaProjects)}${icon('arrow')}</a>
          <a class="btn btn--ghost" href="#about">${bi(ui.hero.ctaAbout)}</a>
        </div>
      </div>
    </div>
    <p class="hero__caption" data-hero>${bi(ui.hero.caption)}</p>
    <a class="hero__scroll" href="#about" data-hero data-aria data-aria-fa="${ui.hero.scroll.fa}" data-aria-en="${ui.hero.scroll.en}">
      <span>${bi(ui.hero.scroll)}</span><i></i>
    </a>
  </section>`;
}

function aboutHTML() {
  const a = ui.about;
  const stats = a.stats
    .map((s) => {
      if (s.plain) {
        return `<li><b>${bi({ fa: toFA(s.value), en: String(s.en) })}</b><span>${bi(s.label)}</span></li>`;
      }
      return `<li><b data-count="${s.value}">${bi({ fa: toFA(s.value), en: String(s.value) })}</b><span>${bi(s.label)}</span></li>`;
    })
    .join('');
  return `
  <section class="about paper" id="about">
    <div class="wrap about__grid">
      <figure class="portrait" data-reveal>
        <div class="portrait__arch"></div>
        <div class="portrait__arch portrait__arch--b"></div>
        <img src="${asset('img/portrait.webp')}" width="900" height="1200" alt="${person.name.en}" decoding="async" />
        <figcaption>${bi(person.location)}</figcaption>
      </figure>
      <div class="about__text">
        <p class="kicker" data-reveal>${bi(a.kicker)}</p>
        <h2 class="h2" data-reveal>${bi(a.title)}</h2>
        <p class="about__born" data-reveal>${bi(a.born)}</p>
        ${a.paragraphs.map((p) => `<p class="lead" data-reveal>${bi(p)}</p>`).join('')}
        <ul class="pillars" data-reveal>${a.pillars.map((p) => `<li>${bi(p)}</li>`).join('')}</ul>
        <ul class="stats" data-reveal>${stats}</ul>
      </div>
    </div>
  </section>`;
}

function processHTML() {
  const p = ui.process;
  const steps = p.steps
    .map(
      (s, i) => `
      <li class="step" data-step="${i}">
        <span class="step__n">0${i + 1}</span>
        <h3>${bi(s.t)}</h3>
        <p>${bi(s.d)}</p>
      </li>`,
    )
    .join('');
  const dots = p.steps.map((s, i) => `<i data-dot="${i}"></i>`).join('');
  return `
  <section class="process" id="process">
    <div class="process__sticky">
      <div class="wrap process__inner">
        <div class="process__panel">
          <p class="kicker">${bi(p.kicker)}</p>
          <h2 class="h2">${bi(p.title)}</h2>
          <ol class="steps">${steps}</ol>
          <div class="rail" aria-hidden="true"><div class="rail__bar"><b id="rail-fill"></b></div><div class="rail__dots">${dots}</div></div>
        </div>
      </div>
    </div>
  </section>`;
}

function cardHTML(p, i) {
  const cover = coverSrc(p);
  const m = mediaOf(p);
  const img = cover
    ? `<img src="${asset(cover.src)}" width="${cover.w}" height="${cover.h}" alt="${p.title.en}" loading="lazy" decoding="async" />`
    : `<div class="card__ph" aria-hidden="true"><span>${p.n}</span></div>`;
  const counts = m
    ? `<span class="chip">${icon('image')}${m.images.length}</span>${m.videos.length ? `<span class="chip">${icon('play')}${m.videos.length}</span>` : ''}`
    : '';
  return `
    <a class="card card--${i + 1}" href="#/project/${p.id}" data-project="${p.id}" style="--accent:${p.color}" data-reveal>
      <div class="card__media"><div class="card__img">${img}</div></div>
      <div class="card__shade"></div>
      <span class="card__n">${p.n}</span>
      <div class="card__body">
        <div class="card__meta">${bi(p.location)} · ${bi(p.year)}</div>
        <h3>${bi(p.title)}</h3>
        <p>${bi(p.topic)}</p>
        <div class="card__foot">${counts}<span class="card__open">${bi(ui.projects.open)}${icon('arrow')}</span></div>
      </div>
    </a>`;
}

function projectsHTML() {
  const t = ui.projects;
  return `
  <section class="projects" id="projects">
    <div class="wrap">
      <div class="head">
        <p class="kicker" data-reveal>${bi(t.kicker)}</p>
        <h2 class="h2" data-reveal>${bi(t.title)}</h2>
        <p class="sub" data-reveal>${bi(t.intro)}</p>
      </div>
      <div class="cards">${projects.map(cardHTML).join('')}</div>
    </div>
  </section>`;
}

function servicesHTML() {
  const t = ui.services;
  const cards = services
    .map(
      (s, i) => `
      <article class="svc" data-reveal style="--d:${(i % 4) * 70}ms">
        <div class="svc__icon">${icon(s.icon)}</div>
        <h3>${bi(s.t)}</h3>
        <ul>${s.items.map((it) => `<li>${bi(it)}</li>`).join('')}</ul>
      </article>`,
    )
    .join('');
  const wood = media.woodwork?.images ?? [];
  const shots = wood
    .map(
      (im, i) =>
        `<button type="button" class="shot" data-wood="${i}" aria-label="Open photo ${i + 1}"><img src="${asset(im.src)}" width="${im.w}" height="${im.h}" alt="" loading="lazy" decoding="async" /></button>`,
    )
    .join('');
  return `
  <section class="services paper" id="services">
    <div class="wrap">
      <div class="head">
        <p class="kicker" data-reveal>${bi(t.kicker)}</p>
        <h2 class="h2" data-reveal>${bi(t.title)}</h2>
      </div>
      <div class="svc-grid">${cards}</div>

      <div class="workshop">
        <div class="workshop__text" data-reveal>
          <h3 class="h3">${bi(t.workshopTitle)}</h3>
          <p>${bi(t.workshopText)}</p>
          <h4 class="tools__title">${bi(t.toolsTitle)}</h4>
          <ul class="tools">${t.tools.map((x) => `<li>${bi(x)}</li>`).join('')}</ul>
        </div>
        <div class="shots" data-reveal>${shots}</div>
      </div>
    </div>
  </section>`;
}

function approachHTML() {
  const a = ui.approach;
  return `
  <section class="approach" id="approach">
    <div class="wrap approach__inner">
      <p class="kicker" data-reveal>${bi(a.kicker)}</p>
      <blockquote class="quote" data-reveal>${bi(a.quote)}</blockquote>
      <p class="approach__body" data-reveal>${bi(a.body)}</p>
      <ul class="principles" data-reveal>${a.principles.map((p) => `<li>${bi(p)}</li>`).join('')}</ul>
    </div>
  </section>`;
}

function contactHTML() {
  const c = ui.contact;
  const links = [];
  if (contact.phone) links.push(`<a class="btn btn--primary" href="tel:${contact.phone}">${icon('phone')}<span dir="ltr">${contact.phone}</span></a>`);
  if (contact.whatsapp) links.push(`<a class="btn btn--ghost" href="https://wa.me/${contact.whatsapp}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>`);
  if (contact.telegram) links.push(`<a class="btn btn--ghost" href="https://t.me/${contact.telegram}" target="_blank" rel="noopener">${icon('send')}Telegram</a>`);
  if (contact.instagram) links.push(`<a class="btn btn--ghost" href="https://instagram.com/${contact.instagram}" target="_blank" rel="noopener">${icon('insta')}Instagram</a>`);
  if (contact.email) links.push(`<a class="btn btn--ghost" href="mailto:${contact.email}">${icon('mail')}${contact.email}</a>`);
  return `
  <section class="contact" id="contact">
    <div class="wrap contact__inner">
      <p class="kicker" data-reveal>${bi(c.kicker)}</p>
      <h2 class="contact__title" data-reveal>${bi(c.title)}</h2>
      <p class="sub" data-reveal>${bi(c.text)}</p>
      ${links.length ? `<div class="contact__links" data-reveal>${links.join('')}</div>` : ''}
      <p class="contact__loc" data-reveal>${icon('pin')}${bi(person.location)}</p>
    </div>
    <footer class="foot wrap">
      <span>© <span data-l="fa">${toFA(new Date().getFullYear() - 621)}</span><span data-l="en">${new Date().getFullYear()}</span> ${bi(person.name)} · ${bi(c.rights)}</span>
      <a href="#top">${bi(c.backTop)}${icon('up')}</a>
    </footer>
  </section>`;
}

/* ───────────── project modal & viewer ───────────── */
const modal = document.getElementById('project');
const viewer = document.getElementById('viewer');
let lenis = null;
let viewerItems = [];
let viewerIdx = 0;
let lastFocus = null;

function modalHTML(p) {
  const t = ui.projects;
  const m = mediaOf(p);
  const acts = p.activities.length
    ? `<h3 class="m-h">${bi(t.activities)}</h3><ul class="acts">${p.activities.map((a) => `<li>${bi(a)}</li>`).join('')}</ul>`
    : '';
  const res = p.result ? `<aside class="result"><b>${bi(t.result)}</b><p>${bi(p.result)}</p></aside>` : '';
  const vids = m?.videos.length
    ? `<h3 class="m-h">${bi(t.videos)}</h3>
       <div class="vids">${m.videos
         .map(
           (v, i) => `
         <button type="button" class="vid" data-open="${i}" style="aspect-ratio:${v.w}/${v.h}" data-aria data-aria-fa="${t.play.fa}" data-aria-en="${t.play.en}">
           <img src="${asset(v.poster)}" width="${v.w}" height="${v.h}" alt="" loading="lazy" decoding="async" />
           <span class="vid__play">${icon('play')}</span>
         </button>`,
         )
         .join('')}</div>`
    : '';
  const imgs = m?.images.length
    ? `<h3 class="m-h">${bi(t.photos)}</h3>
       <div class="masonry">${m.images
         .map(
           (im, i) => `
         <button type="button" class="shot" data-open="${(m.videos.length || 0) + i}" aria-label="Photo ${i + 1}">
           <img src="${asset(im.src)}" width="${im.w}" height="${im.h}" alt="" loading="lazy" decoding="async" />
         </button>`,
         )
         .join('')}</div>`
    : `<p class="nomedia">${bi(t.noMedia)}</p>`;
  return `
    <div class="modal__scroll" data-lenis-prevent>
      <button class="modal__close" type="button" data-close data-aria data-aria-fa="${t.close.fa}" data-aria-en="${t.close.en}">${icon('x')}</button>
      <div class="modal__inner" style="--accent:${p.color}">
        <header class="modal__head">
          <span class="modal__n">${p.n}</span>
          <h2 id="project-title" class="modal__title">${bi(p.title)}</h2>
          <p class="modal__sub">${bi(p.sub)}</p>
          <dl class="facts">
            <div><dt>${bi(t.labels.location)}</dt><dd>${bi(p.location)}</dd></div>
            <div><dt>${bi(t.labels.year)}</dt><dd>${bi(p.year)}</dd></div>
          </dl>
          <p class="modal__topic">${bi(p.topic)}</p>
        </header>
        <div class="modal__cols">
          <div class="modal__copy"><p class="lead">${bi(p.summary)}</p>${res}</div>
          <div class="modal__acts">${acts}</div>
        </div>
        ${vids}
        ${imgs}
      </div>
    </div>`;
}

function openProject(id, { fromHash = false } = {}) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  if (modal.open && modal.dataset.id === id) return;
  lastFocus = document.activeElement;
  modal.dataset.id = id;
  modal.innerHTML = modalHTML(p);
  applyAriaLabels(modal);
  modal.style.setProperty('--accent', p.color);
  if (!modal.open) modal.showModal();
  modal.querySelector('.modal__scroll').scrollTop = 0;
  lenis?.stop();
  document.documentElement.classList.add('is-locked');
  if (!fromHash) location.hash = `#/project/${id}`;
  const m = mediaOf(p);
  viewerItems = [
    ...(m?.videos ?? []).map((v) => ({ type: 'video', src: v.src, poster: v.poster, w: v.w, h: v.h })),
    ...(m?.images ?? []).map((im) => ({ type: 'image', src: im.src, w: im.w, h: im.h })),
  ];
}

function closeProject() {
  if (viewer.open) viewer.close();
  if (modal.open) modal.close();
}

modal.addEventListener('close', () => {
  lenis?.start();
  document.documentElement.classList.remove('is-locked');
  delete modal.dataset.id;
  if (location.hash.startsWith('#/project/')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  lastFocus?.focus?.({ preventScroll: true });
});

modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) return closeProject();
  const b = e.target.closest('[data-open]');
  if (b) openViewer(viewerItems, Number(b.dataset.open));
});

function viewerHTML() {
  const t = ui.projects;
  const it = viewerItems[viewerIdx];
  const total = viewerItems.length;
  const counter = `${viewerIdx + 1} / ${total}`;
  const mediaEl =
    it.type === 'video'
      ? `<video class="viewer__media" src="${asset(it.src)}" poster="${asset(it.poster)}" controls autoplay playsinline preload="auto"></video>`
      : `<img class="viewer__media" src="${asset(it.src)}" width="${it.w}" height="${it.h}" alt="" decoding="async" />`;
  return `
    <button class="viewer__btn viewer__close" type="button" data-vclose data-aria data-aria-fa="${t.close.fa}" data-aria-en="${t.close.en}">${icon('x')}</button>
    <button class="viewer__btn viewer__nav viewer__prev" type="button" data-vprev data-aria data-aria-fa="${t.prev.fa}" data-aria-en="${t.prev.en}">${icon('chev')}</button>
    <button class="viewer__btn viewer__nav viewer__next" type="button" data-vnext data-aria data-aria-fa="${t.next.fa}" data-aria-en="${t.next.en}">${icon('chev')}</button>
    <div class="viewer__stage">${mediaEl}</div>
    <div class="viewer__count" dir="ltr">${counter}</div>`;
}

function renderViewer() {
  viewer.innerHTML = viewerHTML();
  applyAriaLabels(viewer);
  const multi = viewerItems.length > 1;
  viewer.classList.toggle('is-single', !multi);
  // warm the neighbours
  [viewerIdx - 1, viewerIdx + 1].forEach((i) => {
    const n = viewerItems[(i + viewerItems.length) % viewerItems.length];
    if (n?.type === 'image') new Image().src = asset(n.src);
  });
}

function openViewer(items, idx) {
  viewerItems = items;
  viewerIdx = idx;
  renderViewer();
  if (!viewer.open) viewer.showModal();
}

function stepViewer(d) {
  if (viewerItems.length < 2) return;
  viewerIdx = (viewerIdx + d + viewerItems.length) % viewerItems.length;
  renderViewer();
}

viewer.addEventListener('click', (e) => {
  if (e.target.closest('[data-vclose]') || e.target === viewer || e.target.classList.contains('viewer__stage')) return viewer.close();
  if (e.target.closest('[data-vprev]')) return stepViewer(-1);
  if (e.target.closest('[data-vnext]')) return stepViewer(1);
});
viewer.addEventListener('keydown', (e) => {
  const rtl = document.documentElement.dir === 'rtl';
  if (e.key === 'ArrowRight') stepViewer(rtl ? -1 : 1);
  if (e.key === 'ArrowLeft') stepViewer(rtl ? 1 : -1);
});
viewer.addEventListener('close', () => {
  viewer.innerHTML = '';
  if (!modal.open) {
    lenis?.start();
    document.documentElement.classList.remove('is-locked');
  }
});
// swipe
{
  let sx = 0;
  let sy = 0;
  viewer.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
  });
  viewer.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4 && e.target.tagName !== 'VIDEO') {
      // the next item lives on the inline-end side; drag away from it to reveal it
      const rtl = document.documentElement.dir === 'rtl';
      stepViewer((dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
    }
  });
}

function applyAriaLabels(root) {
  const lang = getLang();
  root.querySelectorAll('[data-aria]').forEach((el) => {
    el.setAttribute('aria-label', el.dataset[`aria${lang === 'fa' ? 'Fa' : 'En'}`]);
  });
}

function routeFromHash() {
  const m = location.hash.match(/^#\/project\/([\w-]+)/);
  if (m) openProject(m[1], { fromHash: true });
  else if (modal.open) closeProject();
}

/* ───────────── 3D stage + scroll choreography ───────────── */
let stage = null;
let processTrigger = null;
let aboutTop = 0;
let introBuild = 0;
let processProgress = 0;

function layoutScene() {
  if (!stage) return;
  const s = stage.state;
  const inProcess = scrollY > aboutTop;
  if (isDesktop()) {
    // text sits at the inline-start, so the model goes to the inline-end side
    s.sx = getLang() === 'fa' ? -0.22 : 0.22;
    s.sy = 0;
  } else {
    s.sx = 0;
    s.sy = inProcess ? -0.2 : 0.26; // phone: model above the process text, below the hero text
  }
  s.zoom = isDesktop() ? (inProcess ? 0.82 : 1) : 0.95;
}

function initStage() {
  const canvas = document.getElementById('stage');
  try {
    stage = createScene(canvas);
  } catch (err) {
    console.warn('WebGL unavailable, 3D stage disabled', err);
    canvas.remove();
    return;
  }
  const s = stage.state;
  layoutScene();

  // render only while the hero or the process section is on screen
  const visible = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      const on = visible.size > 0 && !document.hidden;
      on ? stage.start() : stage.stop();
    },
    { rootMargin: '10% 0px' },
  );
  io.observe(document.getElementById('top'));
  io.observe(document.getElementById('process'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stage.stop();
    else if (visible.size) stage.start();
  });

  // intro: the model is "built" from blueprint to finished object
  if (reduceMotion) {
    introBuild = 1;
  } else {
    gsap.to(
      { v: 0 },
      {
        v: 1,
        duration: 3.6,
        delay: 0.5,
        ease: 'power2.inOut',
        onUpdate() {
          introBuild = this.targets()[0].v;
        },
      },
    );
  }

  // hero: slow auto-orbit + mouse parallax
  const t0 = performance.now();
  gsap.ticker.add(() => {
    const t = (performance.now() - t0) / 1000;
    const inProcess = scrollY > aboutTop;
    s.build = inProcess ? processProgress : introBuild;
    s.orbit = inProcess ? -0.55 + processProgress * 1.5 : 0.35 + Math.sin(t * 0.25) * 0.28 + scrollY * 0.0006;
    layoutScene();
  });

  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      s.mouseX = (e.clientX / innerWidth - 0.5) * 2;
      s.mouseY = (e.clientY / innerHeight - 0.5) * 2;
    });
  }
  addEventListener('resize', () => {
    stage.resize();
    layoutScene();
  });
}

function initProcess() {
  const section = document.getElementById('process');
  const steps = [...section.querySelectorAll('.step')];
  const dots = [...section.querySelectorAll('[data-dot]')];
  const fill = document.getElementById('rail-fill');
  const n = steps.length;
  let cur = -1;
  const setStep = (i) => {
    if (i === cur) return;
    cur = i;
    steps.forEach((el, k) => el.classList.toggle('is-on', k === i));
    dots.forEach((el, k) => el.classList.toggle('is-on', k <= i));
  };
  setStep(0);

  processTrigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      processProgress = self.progress;
      setStep(Math.min(n - 1, Math.floor(self.progress * n * 0.999)));
      fill.style.transform = `scaleX(${self.progress})`;
    },
    onRefresh(self) {
      processProgress = self.progress;
    },
  });
}

function initScrollFx() {
  const aboutEl = document.getElementById('about');
  const measure = () => {
    aboutTop = aboutEl.getBoundingClientRect().top + scrollY - innerHeight * 0.55;
  };
  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  // reveal on scroll
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  // counters
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const fa = el.querySelector('[data-l="fa"]');
    const en = el.querySelector('[data-l="en"]');
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter() {
        if (reduceMotion) return;
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate() {
            const v = Math.round(obj.v);
            fa.textContent = toFA(v);
            en.textContent = String(v);
          },
        });
      },
    });
  });

  // project image parallax
  if (!reduceMotion) {
    document.querySelectorAll('.card__img').forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: { trigger: el.closest('.card'), start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
  }

  // hero entrance
  if (!reduceMotion) {
    gsap.from('[data-hero]', { y: 26, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.09, delay: 0.15 });
  }

  // nav state + active link
  const nav = document.getElementById('nav');
  const links = [...document.querySelectorAll('[data-nav]')];
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  ['about', 'process', 'projects', 'services', 'contact'].forEach((id) => {
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === id));
      },
    });
  });

  // 3D tilt on project cards (fine pointers only)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    document.querySelectorAll('.card').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 7);
        rx(-py * 7);
      });
      card.addEventListener('pointerleave', () => {
        rx(0);
        ry(0);
      });
    });
  }
}

function initSmooth() {
  if (reduceMotion) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initNav() {
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  const closeMenu = () => {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.getElementById('nav').classList.remove('menu-open');
  };
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.getElementById('nav').classList.toggle('menu-open', open);
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.project) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#/')) return;
    const target = href === '#top' ? document.body : document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(href === '#top' ? 0 : target, { offset: href === '#top' ? 0 : -10, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  document.getElementById('lang').addEventListener('click', () => {
    applyLang(getLang() === 'fa' ? 'en' : 'fa');
  });

  // project cards open the modal without leaving the page position
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project]');
    if (!card) return;
    e.preventDefault();
    openProject(card.dataset.project);
  });

  // workshop photos -> viewer
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wood]');
    if (!b) return;
    const items = (media.woodwork?.images ?? []).map((im) => ({ type: 'image', src: im.src, w: im.w, h: im.h }));
    openViewer(items, Number(b.dataset.wood));
  });
}

/* ───────────── boot ───────────── */
const lang0 = initialLang();
document.documentElement.lang = lang0;
document.documentElement.dir = lang0 === 'fa' ? 'rtl' : 'ltr';

document.getElementById('app').innerHTML = [
  navHTML(),
  `<main>`,
  heroHTML(),
  aboutHTML(),
  processHTML(),
  projectsHTML(),
  servicesHTML(),
  approachHTML(),
  contactHTML(),
  `</main>`,
].join('');

applyLang(lang0, { persist: false });
initSmooth();
initNav();
initScrollFx();
initProcess();
initStage();
routeFromHash();
addEventListener('hashchange', routeFromHash);
addEventListener('load', () => ScrollTrigger.refresh());
