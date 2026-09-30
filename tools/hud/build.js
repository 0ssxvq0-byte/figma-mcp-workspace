// Renders hud.html to a transparent full-screen preview plus one transparent PNG per [data-export] element.
// Usage: node tools/hud/build.js [outDir]   (default: Concepts)
const path = require('path');
const fs = require('fs');
const http = require('http');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..', '..');
const out = path.resolve(root, process.argv[2] || 'Concepts');
const MARGIN = 16;                       // transparent breathing room around each export (CSS px)
const types = { '.html': 'text/html', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };

// CSS masks need a real origin, so serve the folder over http instead of file://
const server = http.createServer((req, res) => {
  const file = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${server.address().port}/hud.html`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  fs.mkdirSync(path.join(out, 'Vines'), { recursive: true });
  // every screen, numbered in the order a player meets them
  const screens = { hud: '01_HUD', daily: '02_DailyRewards', store: '03_Store', guide: '04_FieldGuide', rebirth: '05_Rebirth',
    keeper: '06_KeepersShop', upgrades: '07_Upgrades', hub: '08_MyTerrarium_Creatures', holding: '09_MyTerrarium_Holding',
    stats: '10_MyTerrarium_Stats', build: '11_EditTank', backdrops: '12_Backdrops', eggs: '13_EggInventory', incubator: '14_Incubator',
    hatchcrack: '15_Hatch_Cracking', hatch: '16_Hatch_Reveal', release: '17_Release', notify: '18_Notifications', welcome: '19_WelcomeBack',
    settings: '20_Settings_Codes' };
  for (const [key, label] of Object.entries(screens)) {
    await page.evaluate(k => { document.body.dataset.screen = k; document.body.dataset.vines = '1'; }, key);
    await page.screenshot({ path: path.join(out, `_Preview_${label}.png`), omitBackground: true, scale: 'css' });
  }
  // the five vine variations (the game picks one at random each time the UI opens)
  for (const v of [1, 2, 3, 4, 5]) {
    for (const [key, label] of [['daily', 'DailyRewards'], ['build', 'EditTerrarium']]) {
      await page.evaluate(([k, v]) => { document.body.dataset.screen = k; document.body.dataset.vines = String(v); }, [key, v]);
      await page.screenshot({ path: path.join(out, 'Vines', `_Preview_${label}_V${v}.png`), omitBackground: true, scale: 'css' });
    }
  }
  await page.evaluate(() => { document.body.dataset.screen = 'daily'; document.body.dataset.vines = '1'; });

  const names = await page.$$eval('[data-export]', els => els.map(e => e.dataset.export));
  for (const name of names) {
    const vm = name.match(/^Vines\/V(\d)/);
    await page.evaluate(v => { document.body.dataset.vines = v; }, vm ? vm[1] : '1');
    const clip = await page.evaluate(([name, m]) => {
      document.querySelectorAll('.solo').forEach(e => e.classList.remove('solo'));
      document.body.classList.add('isolate');
      const el = document.querySelector(`[data-export="${name}"]`);
      el.classList.add('solo');
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const e of [el, ...el.querySelectorAll('*')]) {
        let r = e.getBoundingClientRect();
        // anything inside an overflow:hidden ancestor only counts as far as that ancestor's box
        for (let a = e.parentElement; a && a !== el.parentElement; a = a.parentElement) {
          if (getComputedStyle(a).overflow !== 'hidden') continue;
          const c = a.getBoundingClientRect();
          r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
          r.width = r.right - r.left; r.height = r.bottom - r.top;
        }
        if (r.width <= 0 || r.height <= 0) continue;
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      // clip to the element's own overflow box when it hides overflow (skins), so hidden decor doesn't pad the export
      if (getComputedStyle(el).overflow === 'hidden') {
        const r = el.getBoundingClientRect(); x0 = r.left; y0 = r.top; x1 = r.right; y1 = r.bottom;
      }
      x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m));
      x1 = Math.min(1920, Math.ceil(x1 + m)); y1 = Math.min(1080, Math.ceil(y1 + m));
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }, [name, MARGIN]);
    const file = path.join(out, name + '.png');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, clip, omitBackground: true });
    console.log('exported', path.relative(root, file), `${clip.width}x${clip.height}`);
  }
  await browser.close();
  server.close();
});
