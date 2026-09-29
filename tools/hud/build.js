// Renders hud.html to a full-screen preview plus one transparent PNG per [data-export] element.
// Usage: node tools/hud/build.js [outDir]   (default: Concepts/HUD)
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..', '..');
const out = path.resolve(root, process.argv[2] || 'Concepts/HUD');
const page_url = 'file://' + path.join(__dirname, 'hud.html');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page.goto(page_url);
  await page.evaluate(() => document.fonts.ready);

  fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: path.join(out, '_Preview.png'), scale: 'css' });

  await page.evaluate(() => document.body.classList.add('export'));
  const els = await page.$$('[data-export]');
  for (const el of els) {
    const name = await el.getAttribute('data-export');
    const file = path.join(out, name + '.png');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await el.screenshot({ path: file, omitBackground: true });
    console.log('exported', path.relative(root, file));
  }
  await browser.close();
})();
