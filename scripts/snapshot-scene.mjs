// Captures the 3D playhouse from the running site as transparent PNGs for the PDF.
// usage: node scripts/snapshot-scene.mjs [baseUrl]
import { chromium } from 'playwright-core';
import os from 'node:os';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:4173/';
const exe = path.join(os.homedir(), '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome');
const out = path.resolve(import.meta.dirname, '../pdf/assets');

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 820 }, deviceScaleFactor: 2 });
await page.goto(base + '?lang=en', { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: `html,body{background:transparent!important}
  .nav,.hero__text,.hero__caption,.hero__scroll,.hero__grid,.skip{display:none!important}
  .process__panel,.process .h2{visibility:hidden!important}
  .about,.projects,.services,.approach,.contact{visibility:hidden!important}
  .stage canvas{position:fixed;inset:0}`,
});

// 1) finished model in the hero (wait for the intro build animation)
await page.evaluate(() => (window.__stage.grid.visible = false));
await page.waitForTimeout(7500);
await page.screenshot({ path: `${out}/scene-built.png`, omitBackground: true });

// 2) three stages from the process section
await page.evaluate(() => document.getElementById('process').scrollIntoView());
await page.waitForTimeout(800);
await page.addStyleTag({ content: '.process__sticky{min-height:100svh}' });
for (const [i, name] of [[0, 'stage1'], [2, 'stage3'], [4, 'stage5']]) {
  await page.evaluate((k) => document.querySelector(`[data-tab="${k}"]`).click(), i);
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `${out}/scene-${name}.png`, omitBackground: true });
}
await browser.close();

// trim the transparent margins
import sharp from 'sharp';
for (const n of ['built', 'stage1', 'stage3', 'stage5']) {
  const f = `${out}/scene-${n}.png`;
  const buf = await sharp(f).trim({ threshold: 2 }).toBuffer();
  await sharp(buf).png({ compressionLevel: 9 }).toFile(f + '.tmp');
  (await import('node:fs')).renameSync(f + '.tmp', f);
}
console.log('saved to', out);
