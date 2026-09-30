// Renders every model in models.js to a transparent 512x512 PNG.
// Usage: node tools/voxel/render.js [outDir]   (default: tools/hud/assets/voxel)
const path = require('path');
const fs = require('fs');
const http = require('http');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'hud', 'assets', 'voxel'));
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const file = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/voxel.html`);
  await page.waitForFunction(() => window.ready === true);
  const images = await page.evaluate(() => window.renderAll());
  fs.mkdirSync(out, { recursive: true });
  for (const [name, url] of Object.entries(images)) {
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log('rendered', name);
  }
  await browser.close();
  server.close();
});
