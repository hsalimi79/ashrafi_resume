import { person, ui, services, projects, contact } from './data/content.js';
import { icon } from './icons.js';

// Render the existing page during Vite's HTML transform, not after a browser download.
// Both languages stay in the HTML; the existing CSS chooses the visible language.
export function renderPage(media, { base = './', year = new Date().getFullYear() } = {}) {
  const asset = (p) => /^https?:\/\//.test(p) ? p : base + p;
  const bi = (o) => `<span data-l="fa">${o.fa}</span><span data-l="en">${o.en}</span>`;
  const toFA = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

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
        <img class="nav__mono" src="${asset('img/favicon.png')}" width="38" height="38" alt="Decomode" />
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
          <img class="hero__logo" data-hero src="${asset('img/logo.webp')}" width="1476" height="690" alt="Decomode — Interior Design & Decoration" decoding="async" />
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
    const tabs = p.steps
      .map(
        (s, i) => `
          <button class="tab" type="button" role="tab" id="tab-${i}" data-tab="${i}" aria-controls="step-${i}" aria-selected="false" tabindex="-1">
            <b>0${i + 1}</b><span>${bi(s.t)}</span>
          </button>`,
      )
      .join('');
    const steps = p.steps
      .map(
        (s, i) => `
        <li class="step" role="tabpanel" id="step-${i}" aria-labelledby="tab-${i}" data-step="${i}">
          <span class="step__n" aria-hidden="true">0${i + 1}</span>
          <h3>${bi(s.t)}</h3>
          <p>${bi(s.d)}</p>
        </li>`,
      )
      .join('');
    return `
    <section class="process" id="process">
      <div class="process__sticky">
        <div class="wrap process__inner">
          <div class="process__panel">
            <p class="kicker">${bi(p.kicker)}</p>
            <h2 class="h2">${bi(p.title)}</h2>
            <div class="tabs" role="tablist" data-aria data-aria-fa="${p.stepsLabel.fa}" data-aria-en="${p.stepsLabel.en}">${tabs}</div>
            <ol class="steps">${steps}</ol>
            <div class="step-nav">
              <button class="btn btn--ghost" type="button" data-step-prev><span class="back">${icon('arrow')}</span>${bi(p.prev)}</button>
              <button class="btn btn--primary" type="button" data-step-next>${bi(p.next)}${icon('arrow')}</button>
            </div>
            <p class="step-hint">${bi(p.hint)}</p>
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
    const links = [
      `<a class="btn btn--primary" data-l="fa" href="${asset('downloads/Mohammad-Javad-Ashrafi-Resume-FA.pdf')}" download>${icon('download')}دانلود رزومه (PDF)</a>`,
      `<a class="btn btn--primary" data-l="en" href="${asset('downloads/Mohammad-Javad-Ashrafi-Resume-EN.pdf')}" download>${icon('download')}Download resume (PDF)</a>`,
    ];
    if (contact.phone) links.push(`<a class="btn btn--ghost" href="tel:${contact.phone}">${icon('phone')}<span dir="ltr">${contact.phone}</span></a>`);
    if (contact.whatsapp) links.push(`<a class="btn btn--ghost" href="https://wa.me/${contact.whatsapp}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>`);
    if (contact.telegram) links.push(`<a class="btn btn--ghost" href="https://t.me/${contact.telegram}" target="_blank" rel="noopener">${icon('send')}Telegram</a>`);
    if (contact.instagram) links.push(`<a class="btn btn--ghost" href="https://instagram.com/${contact.instagram}" target="_blank" rel="noopener">${icon('insta')}Instagram</a>`);
    if (contact.email) links.push(`<a class="btn btn--ghost" href="mailto:${contact.email}">${icon('mail')}${contact.email}</a>`);
    return `
    <section class="contact" id="contact">
      <div class="wrap contact__inner">
        <img class="contact__logo" data-reveal src="${asset('img/logo.webp')}" width="1476" height="690" alt="Decomode — Interior Design & Decoration" loading="lazy" decoding="async" />
        <p class="kicker" data-reveal>${bi(c.kicker)}</p>
        <h2 class="contact__title" data-reveal>${bi(c.title)}</h2>
        <p class="sub" data-reveal>${bi(c.text)}</p>
        ${links.length ? `<div class="contact__links" data-reveal>${links.join('')}</div>` : ''}
        <p class="contact__loc" data-reveal>${icon('pin')}${bi(person.location)}</p>
      </div>
      <footer class="foot wrap">
        <span>© <span data-l="fa">${toFA(year - 621)}</span><span data-l="en">${year}</span> ${bi(person.name)} · ${bi(c.rights)}</span>
        <a href="#top">${bi(c.backTop)}${icon('up')}</a>
      </footer>
    </section>`;
  }


  return [navHTML(), '<main>', heroHTML(), aboutHTML(), processHTML(),
    projectsHTML(), servicesHTML(), approachHTML(), contactHTML(), '</main>'].join('');
}
