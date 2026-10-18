// Minimal stroke icon set (24×24, currentColor). No emoji, no external requests.
const P = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A15 15 0 014 5a1 1 0 011-1z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  send: '<path d="M21 4L3 11l6 2.5L11 20l3-5 5 3z"/>',
  insta: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7.5l8 6 8-6"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>',
  house: '<path d="M3.5 11L12 4l8.5 7"/><path d="M6 10v9.5h12V10"/><path d="M10 19.500v-5h4v5"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c3-4 6-6.500 10-8"/>',
  wood: '<rect x="3.500" y="5" width="17" height="14" rx="1.500"/><path d="M3.500 10h17M3.500 14.500h17M9 5v5M15 10v4.500M9 14.500V19"/>',
  frame: '<path d="M4 20V8l8-4 8 4v12"/><path d="M4 13l8-4 8 4M4 20l8-4 8 4M12 9v7"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.500 10.900c.6.5 1 1.200 1 2V16h5v-.1c0-.8.400-1.500 1-2A6 6 0 0012 3z"/>',
  ruler: '<path d="M4 16L16 4l4 4L8 20z"/><path d="M7 13l2 2M10 10l1.500 1.500M13 7l2 2"/>',
  type: '<path d="M5 6V4.500h14V6M12 4.500V19M9 19h6"/>',
  cabinet: '<rect x="4" y="3.500" width="16" height="17" rx="1.500"/><path d="M12 3.500v17M4 12h16M9.500 8v1.500M14.500 8v1.500M9.500 15.500V17M14.500 15.500V17"/>',
};

const DIRECTIONAL = new Set(['arrow', 'chev']); // mirrored automatically in RTL

export function icon(name) {
  return `<svg class="ico${DIRECTIONAL.has(name) ? ' ico--dir' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] ?? ''}</svg>`;
}
