// Builds a Roblox Studio import package from hud.html.
// Usage: node tools/hud/roblox.js [outDir]   (default: Roblox)
//
// For every [data-export] component it writes:
//   <Name>.png         the whole component, flattened
//   <Name>__Base.png   the component without its text and icons (the button / card / panel body)
//   <Name>__Text.png   only the text          (only when the component has text and something else)
//   <Name>__Icon.png   only the icons         (only when the component has icons and something else)
// All layers share one canvas, so in Studio they stack as ImageLabels of the same size.
// Images are 2x unless that would exceed Roblox's 1024 px upload limit, then 1x, or smaller still for full panels.
// layout.json records where every component sits on a 1920x1080 screen (offset and scale) and every text
// it contains (content, size, colours), so text can be rebuilt as TextLabels.
const path = require('path');
const fs = require('fs');
const http = require('http');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..', '..');
const out = path.resolve(root, process.argv[2] || 'Roblox');
const MARGIN = 12;
const MAX = 1024;
const types = { '.html': 'text/html', '.png': 'image/png', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
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
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const names = (await page.$$eval('[data-export]', els => els.map(e => e.dataset.export))).filter(n => !n.startsWith('Vines/'));
  const layout = {};
  for (const name of names) {
    const info = await page.evaluate(([name, m]) => {
      document.querySelectorAll('.solo').forEach(e => e.classList.remove('solo'));
      document.body.classList.add('isolate');
      document.body.classList.remove('l-base', 'l-text', 'l-icon');
      const el = document.querySelector(`[data-export="${name}"]`);
      el.classList.add('solo');
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const e of [el, ...el.querySelectorAll('*')]) {
        if (e.closest('.state-alt') && !e.closest('.state-alt').contains(el) && e.closest('.state-alt') !== el) continue;
        let r = e.getBoundingClientRect();
        for (let a = e.parentElement; a && a !== el.parentElement; a = a.parentElement) {
          if (getComputedStyle(a).overflow !== 'hidden') continue;
          const c = a.getBoundingClientRect();
          r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
          r.width = r.right - r.left; r.height = r.bottom - r.top;
        }
        if (r.width <= 0 || r.height <= 0) continue;
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      if (getComputedStyle(el).overflow === 'hidden') { const r = el.getBoundingClientRect(); x0 = r.left; y0 = r.top; x1 = r.right; y1 = r.bottom; }
      if (el.dataset.nomargin) m = 0;
      x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m));
      x1 = Math.min(1920, Math.ceil(x1 + m)); y1 = Math.min(1080, Math.ceil(y1 + m));
      const clip = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
      // texts inside, relative to the image, with their fill colours
      const texts = [...el.querySelectorAll('.t')].filter(t => !t.closest('.state-alt') || t.closest('.state-alt') === el || el.closest('.state-alt'))
        .map(t => {
          const r = t.getBoundingClientRect(), cs = getComputedStyle(t);
          const tf = cs.getPropertyValue('--tf') || cs.getPropertyValue('--tf-white');
          return { text: t.querySelector('.tm').innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/&amp;/g, '&').replace(/<[^>]+>/g, ''),
            x: Math.round(r.left - x0), y: Math.round(r.top - y0), w: Math.round(r.width), h: Math.round(r.height),
            size: Math.round(parseFloat(cs.fontSize)), fill: [...tf.matchAll(/#[0-9a-fA-F]{6}/g)].map(q => q[0]) };
        }).filter(t => t.w > 0);
      const hasText = texts.length > 0;
      const hasIcon = el.querySelectorAll('img, .svgi').length > 0;
      const hasBase = el.matches('.skin, .panel, .bar, .toast, .inc, .dlg') || el.querySelector('.skin, .panel, .bar, .facets, .box, .tab, .pill, .chip, .badge') !== null;
      return { clip, texts, hasText, hasIcon, hasBase };
    }, [name, MARGIN]);
    const { clip } = info;
    const big = Math.max(clip.width, clip.height);
    const scale = big * 2 <= MAX ? 2 : big <= MAX ? 1 : +(MAX / big).toFixed(3);
    const file = path.join(out, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const shot = async (suffix, layer) => {
      await page.evaluate(l => { document.body.classList.remove('l-base', 'l-text', 'l-icon'); if (l) document.body.classList.add(l); }, layer);
      const buf = await page.screenshot({ clip, omitBackground: true, scale: scale === 2 ? 'device' : 'css' });
      if (scale >= 1) return fs.writeFileSync(file + suffix + '.png', buf);
      // wider than Roblox's 1024 px limit even at 1x: shrink in the browser so nothing gets cut or re-scaled by Roblox
      const url = await page.evaluate(async ([b64, k]) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
      }, [buf.toString('base64'), scale]);
      fs.writeFileSync(file + suffix + '.png', Buffer.from(url.split(',')[1], 'base64'));
    };
    const layers = [];
    await shot('', null);
    const parts = [info.hasBase, info.hasText, info.hasIcon].filter(Boolean).length;
    if (parts >= 2) {
      await shot('__Base', 'l-base'); layers.push('Base');
      if (info.hasText) { await shot('__Text', 'l-text'); layers.push('Text'); }
      if (info.hasIcon) { await shot('__Icon', 'l-icon'); layers.push('Icon'); }
    }
    layout[name] = {
      image: name + '.png', layers, scale,
      offset: { x: clip.x, y: clip.y, w: clip.width, h: clip.height },
      udim2: { position: [+(clip.x / 1920).toFixed(4), +(clip.y / 1080).toFixed(4)], size: [+(clip.width / 1920).toFixed(4), +(clip.height / 1080).toFixed(4)] },
      texts: info.texts,
    };
    console.log('roblox', name, `${clip.width}x${clip.height}@${scale}x`, layers.join(' '));
  }
  await page.evaluate(() => document.body.classList.remove('isolate', 'l-base', 'l-text', 'l-icon'));
  fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify(layout, null, 1));
  fs.copyFileSync(path.join(__dirname, '..', 'ROBLOX_IMPORT.md'), path.join(out, 'README.md'));

  // every voxel icon, straight from the renderer
  const icons = path.join(__dirname, 'assets', 'voxel');
  fs.mkdirSync(path.join(out, 'Icons'), { recursive: true });
  for (const f of fs.readdirSync(icons)) fs.copyFileSync(path.join(icons, f), path.join(out, 'Icons', f));
  await browser.close();
  server.close();
});
