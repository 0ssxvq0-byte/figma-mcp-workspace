// Draws every picture used in the presentation (emoji faces, products, memes) as transparent PNGs.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const BLUE = 'hue-rotate(166deg) saturate(2.2) brightness(.88) drop-shadow(0 10px 8px rgba(0,0,60,.35))';
const faces = { heart:'😍', think:'🤔', laugh:'😂', smug:'😏', plead:'🥺', salute:'🫡', cool:'😎', money:'🤑', angry:'😠', sob:'😭',
  party:'🥳', nerd:'🤓', shush:'🤫', halo:'😇', melt:'🫠', grimace:'😬', holdback:'🥹', mind:'🤯', wink:'😉', cry:'😢', rolling:'🤣', sleep:'😴', scream:'😱', zany:'🤪', flushed:'😳', pray:'🙏' };
const yellow = { heart:'😍', smug:'😏', cool:'😎', plead:'🥺', party:'🥳', money:'🤑', think:'🤔', laugh:'🤣' };
const objs = { santa:'🎅', tree:'🎄', gift:'🎁', star:'⭐', bell:'🔔', bag:'💰', fly:'💸', siren:'🚨', check:'✅', cross:'❌', down:'📉', up:'📈',
  receipt:'🧾', trophy:'🏆', fire:'🔥', watch:'⌚', headphones:'🎧', mouse:'🖱️', nails:'💅', razor:'🪒', heartred:'❤️', shopping:'🛍️', phone:'📱',
  handshake:'🤝', brain:'🧠', eyes:'👀', no:'🚫', warn:'⚠️', calc:'🧮', hundred:'💯', clap:'👏', sparkle:'✨', cap:'🧢', crown:'👑', pig:'🐷', cart:'🛒', calendar:'📅', globe:'🌍', snow:'❄️', sock:'🧦', card:'💳', thumbs:'👍', salt:'🧂', lock:'🔒', magnify:'🔍', dizzy:'💫', megaphone:'📣', ticket:'🎟️', pound:'💷' };
const svg = {
 airpods: `<svg viewBox="0 0 300 300" width="300" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9dde3"/></linearGradient></defs>
  <rect x="50" y="150" width="200" height="120" rx="55" fill="url(#g)" stroke="#aab" stroke-width="4"/><rect x="50" y="195" width="200" height="6" fill="#b8bcc6"/>
  <g><rect x="85" y="20" width="36" height="140" rx="18" fill="#fff" stroke="#aab" stroke-width="4"/><ellipse cx="103" cy="45" rx="42" ry="38" fill="#fff" stroke="#aab" stroke-width="4"/><circle cx="85" cy="55" r="9" fill="#445"/></g>
  <g><rect x="179" y="20" width="36" height="140" rx="18" fill="#fff" stroke="#aab" stroke-width="4"/><ellipse cx="197" cy="45" rx="42" ry="38" fill="#fff" stroke="#aab" stroke-width="4"/><circle cx="215" cy="55" r="9" fill="#445"/></g></svg>`,
 watch: `<svg viewBox="0 0 300 360" width="300" height="360"><rect x="95" y="0" width="110" height="360" rx="30" fill="#ff5d73"/><rect x="95" y="0" width="110" height="360" rx="30" fill="none" stroke="#c23" stroke-width="5"/>
  <rect x="55" y="75" width="190" height="210" rx="52" fill="#1b1d22" stroke="#cfd3da" stroke-width="10"/><rect x="72" y="92" width="156" height="176" rx="40" fill="#0a0c10"/>
  <text x="150" y="178" font-family="Arial Black,Arial" font-size="58" font-weight="900" fill="#fff" text-anchor="middle">10:09</text><circle cx="150" cy="215" r="22" fill="none" stroke="#3ddc84" stroke-width="9" stroke-dasharray="100 40"/><circle cx="205" cy="215" r="0"/>
  <rect x="246" y="130" width="16" height="42" rx="7" fill="#cfd3da"/></svg>`,
 magsafe: `<svg viewBox="0 0 300 300" width="300" height="300"><path d="M150 150 C 150 270 250 290 290 270" fill="none" stroke="#f2f2f2" stroke-width="14" stroke-linecap="round"/><path d="M150 150 C 150 270 250 290 290 270" fill="none" stroke="#c9ccd3" stroke-width="3" stroke-linecap="round"/>
  <circle cx="130" cy="130" r="105" fill="#f7f8fa" stroke="#b9bdc7" stroke-width="6"/><circle cx="130" cy="130" r="78" fill="#fff" stroke="#d3d6dd" stroke-width="4"/><circle cx="130" cy="130" r="24" fill="#e6e8ee"/><path d="M118 112 l14 -0 l-6 18 h14 l-22 30 l6 -22 h-14z" fill="#f5b800"/></svg>`,
 mousepad: `<svg viewBox="0 0 340 260" width="340" height="260"><rect x="10" y="20" width="320" height="220" rx="28" fill="#7c3aed" stroke="#3b1c80" stroke-width="8"/><rect x="26" y="36" width="288" height="188" rx="18" fill="#a78bfa" opacity=".6"/>
  <ellipse cx="170" cy="130" rx="42" ry="60" fill="#fff" stroke="#222" stroke-width="7"/><line x1="170" y1="70" x2="170" y2="112" stroke="#222" stroke-width="7"/><line x1="128" y1="112" x2="212" y2="112" stroke="#222" stroke-width="7"/><path d="M170 190 q-10 40 40 50" fill="none" stroke="#222" stroke-width="6"/></svg>`,
 buffer: `<svg viewBox="0 0 340 140" width="340" height="140"><g transform="rotate(-14 170 70)"><rect x="20" y="40" width="300" height="60" rx="14" fill="#ff8ad8" stroke="#a21c7a" stroke-width="6"/><rect x="40" y="52" width="260" height="14" rx="6" fill="#fff" opacity=".6"/><rect x="40" y="76" width="260" height="14" rx="6" fill="#ffd1f1"/></g></svg>`,
 razor: `<svg viewBox="0 0 340 140" width="340" height="140"><g transform="rotate(-18 170 70)"><rect x="20" y="52" width="180" height="40" rx="18" fill="#2dd4bf" stroke="#0f766e" stroke-width="6"/><rect x="190" y="38" width="100" height="68" rx="12" fill="#e5e7eb" stroke="#6b7280" stroke-width="6"/><rect x="205" y="48" width="70" height="10" rx="4" fill="#9ca3af"/><rect x="205" y="82" width="70" height="10" rx="4" fill="#9ca3af"/></g></svg>`,
};
const html = `<html><body style="margin:0;background:transparent;font-family:'Noto Color Emoji'">
${Object.entries(faces).map(([k,v])=>`<div id="blue_${k}" style="display:inline-block;font-size:380px;line-height:1.15;filter:${BLUE};padding:14px">${v}</div>`).join('')}
${Object.entries(yellow).map(([k,v])=>`<div id="yel_${k}" style="display:inline-block;font-size:380px;line-height:1.15;filter:drop-shadow(0 10px 8px rgba(0,0,0,.3));padding:14px">${v}</div>`).join('')}
${Object.entries(objs).map(([k,v])=>`<div id="obj_${k}" style="display:inline-block;font-size:380px;line-height:1.15;filter:drop-shadow(0 8px 6px rgba(0,0,0,.3));padding:14px">${v}</div>`).join('')}
${Object.entries(svg).map(([k,v])=>`<div id="svg_${k}" style="display:inline-block;padding:20px;filter:drop-shadow(0 10px 8px rgba(0,0,0,.35))">${v.replace(/<svg /,'<svg style="width:100%;height:auto" ')}</div>`).join('')}
</body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(()=>chromium.launch());
  const p = await b.newPage({ viewport: { width: 2400, height: 1600 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(500);
  const ids = await p.$$eval('body > div', e => e.map(x => x.id));
  for (const id of ids) {
    await p.evaluate(i => { document.querySelectorAll('body > div').forEach(n => n.style.display = n.id === i ? 'inline-block' : 'none'); const n = document.getElementById(i); if (i.startsWith('svg_')) n.style.width = '420px'; }, id);
    const el = await p.$('#' + id);
    await el.screenshot({ path: `assets/${id}.png`, omitBackground: true, timeout: 60000 });
  }
  await b.close(); console.log(ids.length, 'images');
})();
