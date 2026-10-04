// Builds Christmas_Presentation_base.pptx (slides, images, text) + anim.json (transitions/animations applied by post.py)
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const sizes = JSON.parse(fs.readFileSync('sizes.json'));
const { applyTheme } = require('/root/.claude/skills/synced/9d78122a-41d1-447f-9e79-6cbe9750dfa2_5ee32f46-84fb-4a24-bfe8-b4a3abfaa7be/pptx/scripts/apply_theme.js');

const THEME = { name: 'Christmas Chaos', headFontFace: 'Impact', bodyFontFace: 'Comic Sans MS',
  colors: { dk1: '111111', lt1: 'FFFFFF', dk2: '0B6B3A', lt2: 'FFF3C4', accent1: 'C8102E', accent2: '0B6B3A', accent3: 'FFC107', accent4: '1E6FFF', accent5: '7C3AED', accent6: 'FF6FB5', hlink: '1E6FFF', folHlink: '7C3AED' } };
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Why You Should Buy Me Stuff For Christmas';
pres.author = 'Your Favourite Child';
const HEAD = 'Impact', BODY = 'Comic Sans MS';
const RED = 'C8102E', GREEN = '0B6B3A', GOLD = 'FFC107', BLUE = '1E6FFF', PURPLE = '7C3AED', INK = '111111';
const anim = {}; let cur = 0;
const A = (name, type, delay = 0, dur = 600) => { (anim[cur] = anim[cur] || []).push({ name, type, delay, dur }); };

let uid = 0;
function img(s, key, x, y, w, o = {}) {
  const sz = sizes[key]; const h = w * sz[1] / sz[0];
  const name = o.name || `${key}_${++uid}`;
  s.addImage({ path: `assets/${key}.png`, x, y, w, h, rotate: o.rot || 0, objectName: name, altText: o.alt || key.replace(/_/g, ' ') });
  if (o.anim) A(name, o.anim, o.delay || 0, o.dur || 600);
  return { name, h };
}
function txt(s, text, x, y, w, h, o = {}) {
  const name = o.name || `text_${++uid}`;
  const opt = { x, y, w, h, isTextBox: true, objectName: name, fontFace: o.font || BODY, fontSize: o.size || 28, color: o.color || INK, bold: o.bold !== false, align: o.align || 'left', valign: o.valign || 'middle', margin: o.margin ?? 6, rotate: o.rot || 0, fit: 'none' };
  if (o.fill) opt.fill = { color: o.fill };
  if (o.shape) opt.shape = o.shape;
  if (o.rectRadius) opt.rectRadius = o.rectRadius;
  if (o.line) opt.line = o.line;
  if (o.outline) opt.outline = { size: o.outline, color: o.outlineColor || '000000' };
  if (o.italic) opt.italic = true;
  if (o.paraSpaceAfter) opt.paraSpaceAfter = o.paraSpaceAfter;
  if (o.link) opt.hyperlink = o.link;
  s.addText(text, opt);
  if (o.anim) A(name, o.anim, o.delay || 0, o.dur || 600);
  return name;
}
function box(s, x, y, w, h, fill, o = {}) {
  const name = o.name || `box_${++uid}`;
  s.addShape(o.round === false ? pres.ShapeType.rect : pres.ShapeType.roundRect, { x, y, w, h, rectRadius: o.r ?? 0.25, fill: { color: fill }, line: o.line || { color: 'FFFFFF', width: 0 }, rotate: o.rot || 0, objectName: name, shadow: o.shadow ? { type: 'outer', color: '000000', opacity: 0.35, blur: 8, offset: 4, angle: 45 } : undefined });
  if (o.anim) A(name, o.anim, o.delay || 0, o.dur || 600);
  return name;
}
const bg = (s, f) => { s.background = { path: `bg/${f}.png` }; };
const memeTitle = (s, text, y = 0.3, size = 60, h = 1.4) => txt(s, text, 0.5, y, 12.33, h, { font: HEAD, size, color: 'FFFFFF', align: 'center', outline: 3, bold: false });
function slide(notes) { const s = pres.addSlide(); cur++; s.addNotes(notes); return s; }

// 1. TITLE ----------------------------------------------------------------------------------------------------
let s = slide('Open with a big dramatic pause. Cube spin. Then: "Mum, Dad, sit down. This is important."');
s.background = { color: 'FFFFFF' };
txt(s, '(we starting off small)', 0.5, 0.3, 5, 0.5, { size: 16, color: '9AA0A6', bold: false });
txt(s, [{ text: 'WHY YOU SHOULD', options: { color: RED, breakLine: true } }, { text: 'BUY ME STUFF', options: { color: GREEN, breakLine: true } }, { text: 'FOR CHRISTMAS', options: { color: BLUE } }], 0.5, 1.0, 7.8, 3.9, { font: HEAD, size: 70, bold: false, align: 'left', margin: 0 });
txt(s, 'A presentation by Your Favourite Child 😇', 0.5, 5.4, 7.6, 0.7, { size: 24 });
txt(s, '(the other one is also fine)', 0.5, 6.0, 7.6, 0.5, { size: 16, color: '9AA0A6', bold: false });
img(s, 'blue_heart', 8.0, 0.9, 4.6, { anim: 'spinIn', dur: 1200, alt: 'Blue heart-eyes emoji' });
img(s, 'obj_santa', 10.4, 4.4, 2.4, { anim: 'flyR', delay: 900, alt: 'Santa' });
img(s, 'obj_tree', 8.2, 4.9, 2.0, { anim: 'zoomIn', delay: 1300, alt: 'Christmas tree' });

// 2. GOOD BEHAVIOUR ----------------------------------------------------------------------------------------------
s = slide('Fake statistics are the whole point. Say "Source: trust me" with a straight face.');
bg(s, 'sunburst');
memeTitle(s, "FIRST: HOW GOOD I'VE BEEN");
s.addChart(pres.charts.PIE, [{ name: 'Behaviour', labels: ['Good behaviour', 'That one incident'], values: [99.9, 0.1] }], { x: 0.7, y: 1.75, w: 6.6, h: 5.2, chartColors: [GREEN, RED], showLegend: true, legendPos: 'b', legendFontSize: 18, legendFontFace: BODY, showPercent: false, showValue: true, dataLabelColor: 'FFFFFF', dataLabelFontSize: 20, dataLabelFontBold: true, dataLabelFormatCode: '0.0"%"', showTitle: true, title: 'My behaviour this year', titleFontSize: 22, titleFontFace: BODY, titleColor: INK, plotArea: { fill: { color: 'FFFFFF' } } });
img(s, 'blue_halo', 8.4, 1.8, 3.9, { anim: 'pulse', alt: 'Blue angel emoji' });
txt(s, 'Source: trust me 📊', 7.9, 5.8, 4.9, 0.9, { size: 28, fill: 'FFFFFF', shape: pres.ShapeType.roundRect, rectRadius: 0.2, align: 'center', rot: -4, anim: 'zoomIn', delay: 800 });

// 3. THE LIST ---------------------------------------------------------------------------------------------------
s = slide('Quick overview. Keep it light: "It is honestly not that long."');
bg(s, 'stripes');
memeTitle(s, 'THE LIST', 0.15, 66, 1.2);
txt(s, "(it's honestly not that long)", 0.5, 1.2, 12.33, 0.6, { size: 24, color: 'FFFFFF', align: 'center', outline: 1.5 });
const items = [['svg_watch', 'Apple Watch Series 8 (used)', '£80–£100'], ['svg_airpods', 'AirPods Pro, 1st gen (used)', '£40–£50'], ['svg_magsafe', 'MagSafe Charger (used)', '~£20–£25'],
  ['svg_buffer', 'Nail buffer', '~£3'], ['svg_razor', 'Eyebrow razor', '£3–£5'], ['svg_mousepad', 'Mouse pad', '£5–£15']];
items.forEach((it, i) => {
  const cx = 0.82 + (i % 3) * 4.0, cy = 1.95 + Math.floor(i / 3) * 2.6;
  box(s, cx, cy, 3.7, 2.4, 'FFFFFF', { shadow: true, anim: 'zoomIn', delay: i * 250, dur: 400 });
  img(s, it[0], cx + 0.1, cy + 0.35, 1.5, { anim: 'zoomIn', delay: i * 250 + 100, dur: 400 });
  txt(s, it[1], cx + 1.6, cy + 0.2, 2.05, 1.2, { size: 17 });
  txt(s, it[2], cx + 1.6, cy + 1.35, 2.05, 0.8, { size: 24, color: RED, font: HEAD, bold: false });
});

// 4. APPLE WATCH --------------------------------------------------------------------------------------------------
s = slide('Reason #1: the watch. Keep it silly but sincere.');
s.background = { color: 'FFFFFF' };
txt(s, 'Item #1: Apple Watch Series 8 (used, £80–£100)', 0.5, 0.3, 9, 0.5, { size: 16, color: '9AA0A6', bold: false });
txt(s, 'THE APPLE WATCH', 0.5, 0.9, 8.4, 1.3, { font: HEAD, size: 66, color: BLUE, bold: false });
txt(s, [
  { text: '✅ Tells the time (revolutionary)', options: { breakLine: true } },
  { text: '✅ Counts my steps. Fitness era. 🏃', options: { breakLine: true } },
  { text: '✅ Makes me 14% cooler*', options: { breakLine: true } },
  { text: '✅ I will take SO much care of it', options: {} }], 0.5, 2.4, 8.3, 3.7, { size: 28, paraSpaceAfter: 12, valign: 'top' });
txt(s, '*scientifically proven by me', 0.5, 6.5, 6, 0.5, { size: 14, color: '9AA0A6', bold: false });
img(s, 'svg_watch', 9.0, 0.9, 3.5, { anim: 'pulse', alt: 'Smartwatch' });
img(s, 'blue_cool', 10.6, 4.9, 2.3, { anim: 'spinIn', delay: 600, dur: 900, alt: 'Cool blue emoji' });

// 5. AIRPODS ------------------------------------------------------------------------------------------------------
s = slide('Reason #2: AirPods. The one-tap pairing is the real reason, remember it for later.');
bg(s, 'snow');
box(s, 0.5, 0.4, 7.9, 6.7, 'FFFFFF', { shadow: true });
txt(s, 'Item #2: AirPods Pro (used, £40–£50)', 0.8, 0.55, 7.3, 0.5, { size: 16, color: '9AA0A6', bold: false });
txt(s, 'THE AIRPODS', 0.8, 1.05, 7.3, 1.2, { font: HEAD, size: 64, color: PURPLE, bold: false });
txt(s, [
  { text: '🎵 Pair with an iPhone in ONE TAP. Like magic.', options: { breakLine: true } },
  { text: '🔊 "Dinner\'s ready" but in 3D surround sound', options: { breakLine: true } },
  { text: '🚗 Car journey playlist (I will be a great DJ)', options: { breakLine: true } },
  { text: '🧘 Peace and quiet. For everyone. Honestly.', options: {} }], 0.8, 2.3, 7.3, 4.5, { size: 24, paraSpaceAfter: 12, valign: 'top' });
img(s, 'svg_airpods', 8.9, 0.6, 3.9, { anim: 'zoomIn', alt: 'Wireless earbuds' });
img(s, 'blue_heart', 9.5, 4.3, 2.8, { anim: 'pulse', alt: 'Blue heart-eyes emoji' });

// 6. BUT WAIT ----------------------------------------------------------------------------------------------------
s = slide('Slam the energy up. The siren is the point. Say the stat like a news reporter.');
s.background = { color: RED };
txt(s, 'BUT WAIT!!!', 0.5, 0.2, 12.33, 1.9, { font: HEAD, size: 110, color: 'FFFFFF', align: 'center', outline: 3, bold: false, anim: 'zoomIn', dur: 500 });
txt(s, '🚨 FAKE AIRPODS ARE EVERYWHERE 🚨', 0.5, 2.15, 12.33, 0.9, { size: 36, color: 'FFFFFF', align: 'center', outline: 1.5 });
txt(s, '9 out of 10 fake AirPods are fake*', 3.5, 3.5, 6.33, 1.9, { font: HEAD, size: 40, bold: false, fill: GOLD, shape: pres.ShapeType.roundRect, rectRadius: 0.2, align: 'center', anim: 'zoomIn', delay: 700 });
txt(s, '*I did the maths', 3.5, 5.5, 6.33, 0.5, { size: 16, color: 'FFFFFF', align: 'center', bold: false });
img(s, 'blue_scream', 0.5, 3.4, 2.9, { anim: 'wobble', alt: 'Screaming blue emoji' });
img(s, 'obj_siren', 10.0, 3.4, 2.7, { anim: 'pulse', alt: 'Siren' });
img(s, 'obj_siren', 5.4, 6.0, 1.3, { anim: 'pulse', delay: 200, alt: 'Siren' });

// 7. REAL VS FAKE ---------------------------------------------------------------------------------------------------
s = slide('This is why she needs to be there in person when they are bought.');
bg(s, 'space');
memeTitle(s, 'HOW TO SPOT A FAKE', 0.2, 56, 1.3);
box(s, 0.6, 1.7, 5.6, 3.8, 'E8FBEF', { shadow: true, anim: 'flyL' });
txt(s, 'REAL ✅', 0.8, 1.8, 5.2, 0.9, { font: HEAD, size: 44, color: GREEN, bold: false });
txt(s, [{ text: 'A serial number you can check', options: { breakLine: true } }, { text: 'Pop-up on an iPhone', options: { breakLine: true } }, { text: 'Sounds like music', options: {} }], 0.8, 2.7, 5.2, 2.6, { size: 24, paraSpaceAfter: 10, valign: 'top' });
box(s, 7.1, 1.7, 5.6, 3.8, 'FFE8E8', { shadow: true, anim: 'flyR' });
txt(s, 'FAKE ❌', 7.3, 1.8, 5.2, 0.9, { font: HEAD, size: 44, color: RED, bold: false });
txt(s, [{ text: 'Serial number: "trust me bro"', options: { breakLine: true } }, { text: 'Sounds like a bin', options: { breakLine: true } }, { text: 'Arrives in a sandwich bag', options: {} }], 7.3, 2.7, 5.2, 2.6, { size: 24, paraSpaceAfter: 10, valign: 'top' });
img(s, 'obj_magnify', 11.3, 0.15, 1.5, { anim: 'spin', dur: 4000, alt: 'Magnifying glass' });
txt(s, "That's why I need to be THERE when we buy them 👀", 0.8, 5.8, 11.7, 1.0, { size: 30, color: GOLD, align: 'center', outline: 1 });

// 8. THE PLAN ----------------------------------------------------------------------------------------------------
s = slide('The big idea: money instead of the actual items, for the watch and AirPods only.');
s.background = { color: 'FFFFFF' };
txt(s, 'THE PLAN', 0.5, 0.2, 12.33, 1.3, { font: HEAD, size: 72, color: RED, align: 'center', bold: false });
txt(s, 'Money, not merch', 0.5, 1.4, 12.33, 0.7, { size: 30, align: 'center', color: GREEN });
const steps = [['obj_pound', 'You give me the MONEY', 'FFF3C4'], ['obj_cart', 'Later, we go shopping TOGETHER', 'D6F5E3'], ['obj_magnify', 'We pick the REAL ones', 'DCE9FF'], ['obj_phone', 'I set them up on my iPhone', 'F0DFFF']];
steps.forEach((st, i) => {
  const x = 0.55 + i * 3.2;
  box(s, x, 2.4, 2.6, 3.2, st[2], { shadow: true, anim: 'zoomIn', delay: i * 500, dur: 400 });
  img(s, st[0], x + 0.5, 2.55, 1.6, { anim: 'zoomIn', delay: i * 500 + 150, dur: 400, alt: st[1] });
  txt(s, st[1], x + 0.1, 4.2, 2.4, 1.3, { size: 20, align: 'center' });
  if (i < 3) { s.addShape(pres.ShapeType.rightArrow, { x: x + 2.65, y: 3.7, w: 0.5, h: 0.5, fill: { color: RED }, line: { color: RED, width: 0 }, objectName: `arrow_${i}` }); A(`arrow_${i}`, 'flyL', i * 500 + 300, 300); }
});
txt(s, '(Apple Watch + AirPods only. Everything else on the list can just be wrapped. Please wrap.)', 0.8, 6.0, 11.7, 0.9, { size: 20, align: 'center', color: '555555' });

// 9. THE IPHONE PROBLEM ------------------------------------------------------------------------------------------
s = slide('Keep this one quick and factual-but-funny. The Watch literally needs an iPhone to set up.');
bg(s, 'snow');
memeTitle(s, 'THE iPHONE PROBLEM', 0.2, 60, 1.3);
const rows = [['obj_watch', 'An Apple Watch has to be set up with an iPhone.', 'FFF3C4'], ['obj_headphones', 'AirPods work BEST with an iPhone (one tap, done).', 'D6F5E3'], ['obj_phone', 'iPhones owned by Mum & Dad: 0.   Owned by me: 1.', 'F0DFFF']];
rows.forEach((r, i) => {
  const y = 1.75 + i * 1.75;
  box(s, 0.9, y, 11.5, 1.55, r[2], { shadow: true, anim: 'flyL', delay: i * 700, dur: 500 });
  img(s, r[0], 1.1, y + 0.1, 1.35, { anim: 'flyL', delay: i * 700 + 100, dur: 500, alt: r[1] });
  txt(s, r[1], 2.7, y + 0.1, 9.5, 1.35, { size: 28 });
});

// 10. BIG BRO -----------------------------------------------------------------------------------------------------
s = slide('Nothing against Big Bro: he is just busy. Say it with dramatic sadness.');
bg(s, 'space');
memeTitle(s, 'WHY NOT ASK BIG BRO?', 0.2, 60, 1.3);
box(s, 0.9, 1.8, 11.5, 3.4, 'FFFFFF', { shadow: true });
txt(s, [{ text: 'He DOES own an iPhone. 📱', options: { breakLine: true } }, { text: "But he's BOOKED and BUSY all holiday 📅", options: { breakLine: true } }, { text: '(He said sorry. I said it\'s fine. It is not fine.)', options: { color: '777777', fontSize: 20, bold: false } }], 1.2, 1.95, 8.0, 3.1, { size: 30, paraSpaceAfter: 14 });
img(s, 'obj_calendar', 9.3, 2.0, 2.4, { anim: 'pulse', alt: 'Calendar' });
img(s, 'blue_sob', 4.8, 5.15, 2.2, { anim: 'wobble', delay: 400, alt: 'Crying blue emoji' });
txt(s, 'Calendar status: FULL', 7.2, 5.55, 5.3, 0.8, { size: 28, color: 'FFFFFF', outline: 1, rot: -3 });

// 11. SHOPPING TRIP -----------------------------------------------------------------------------------------------
s = slide('Reassure them: they stay in control and can come along.');
s.background = { color: 'FFFFFF' };
txt(s, 'HOW THE SHOPPING TRIP WORKS', 0.5, 0.25, 12.33, 1.2, { font: HEAD, size: 54, color: GREEN, align: 'center', bold: false });
const trip = [['1', 'We go together (you can carry the bags 🛍️)'], ['2', 'We check the serial number is REAL 🔍'], ['3', 'You pay. I say THANK YOU. Loudly.'], ['4', 'I set it up on my iPhone. Done. ✨']];
trip.forEach((t, i) => {
  const y = 1.7 + i * 1.3;
  txt(s, t[0], 0.7, y, 1.0, 1.0, { font: HEAD, size: 40, color: 'FFFFFF', fill: [RED, GREEN, BLUE, PURPLE][i], shape: pres.ShapeType.ellipse, align: 'center', bold: false, anim: 'zoomIn', delay: i * 600, dur: 400 });
  txt(s, t[1], 1.9, y, 7.2, 1.0, { size: 26, anim: 'flyL', delay: i * 600 + 100, dur: 400 });
});
img(s, 'blue_party', 9.4, 1.5, 3.4, { anim: 'spin', dur: 5000, alt: 'Party blue emoji' });
img(s, 'obj_shopping', 9.7, 4.9, 2.2, { anim: 'pulse', alt: 'Shopping bags' });

// 12. SMALL STUFF -------------------------------------------------------------------------------------------------
s = slide('Quickfire round: one joke each.');
bg(s, 'space');
memeTitle(s, 'THE SMALL STUFF', 0.15, 56, 1.3);
const small = [['svg_magsafe', 'MagSafe Charger', '~£20–£25', 'Wires are so last decade.'], ['svg_buffer', 'Nail buffer', '~£3', 'Three pounds. Basically free.'], ['svg_razor', 'Eyebrow razor', '£3–£5', 'Eyebrows: tidy. Confidence: 100%.'], ['svg_mousepad', 'Mouse pad', '£5–£15', 'Every mouse deserves a home.']];
small.forEach((m, i) => {
  const cx = 0.6 + (i % 2) * 6.25, cy = 1.65 + Math.floor(i / 2) * 2.65;
  box(s, cx, cy, 5.95, 2.4, 'FFFFFF', { shadow: true, anim: 'zoomIn', delay: i * 300, dur: 400 });
  img(s, m[0], cx + 0.15, cy + 0.35, 1.9, { anim: 'zoomIn', delay: i * 300 + 100, dur: 400 });
  txt(s, m[1], cx + 2.2, cy + 0.15, 3.6, 0.6, { size: 24 });
  txt(s, m[2], cx + 2.2, cy + 0.75, 3.6, 0.6, { size: 26, color: RED, font: HEAD, bold: false });
  txt(s, m[3], cx + 2.2, cy + 1.4, 3.6, 0.8, { size: 17, color: '555555', bold: false });
});

// 13. PRICE CHECK -------------------------------------------------------------------------------------------------
s = slide('Do the maths out loud: 198 divided by 365 is about 54p.');
bg(s, 'sunburst');
memeTitle(s, 'TOTAL COST', 0.15, 56, 1.2);
txt(s, '£151 – £198', 0.5, 1.4, 12.33, 2.4, { font: HEAD, size: 120, color: RED, align: 'center', outline: 4, outlineColor: 'FFFFFF', bold: false, anim: 'zoomIn', dur: 500 });
txt(s, "That's less than 55p a day for a whole year*", 1.0, 4.0, 11.33, 1.0, { size: 32, align: 'center', fill: 'FFFFFF', shape: pres.ShapeType.roundRect, rectRadius: 0.2, anim: 'zoomIn', delay: 800 });
txt(s, '*£198 ÷ 365 days = 54p. I did the maths. Twice.', 1.0, 5.2, 11.33, 0.6, { size: 16, align: 'center', bold: false });
img(s, 'blue_money', 0.5, 4.8, 2.6, { anim: 'wobble', alt: 'Money-eyes blue emoji' });
img(s, 'obj_pig', 10.4, 4.9, 2.4, { anim: 'pulse', alt: 'Piggy bank' });

// 14. REVIEWS --------------------------------------------------------------------------------------------------------
s = slide('Read these in a posh voice.');
bg(s, 'snow');
memeTitle(s, 'WHAT PEOPLE ARE SAYING', 0.15, 54, 1.2);
const reviews = [['Best child ever. Would buy presents for again.', '— Mum (probably)', 'blue_halo'], ['Very responsible. Super polite. Great hair.', '— Dad (hopefully)', 'blue_cool'], ['Terms & conditions: includes extra hugs and thank-yous in 3 languages.', '— Me, the child', 'blue_wink']];
reviews.forEach((r, i) => {
  const x = 0.7 + i * 4.1;
  box(s, x, 1.7, 3.8, 5.1, 'FFFFFF', { shadow: true, anim: 'flyB', delay: i * 500, dur: 500 });
  txt(s, '⭐⭐⭐⭐⭐', x + 0.1, 1.8, 3.6, 0.7, { size: 24, align: 'center' });
  txt(s, '"' + r[0] + '"', x + 0.2, 2.5, 3.4, 2.2, { size: 22, align: 'center' });
  txt(s, r[1], x + 0.2, 4.6, 3.4, 0.6, { size: 18, color: '555555', align: 'center', bold: false });
  img(s, r[2], x + 0.9, 5.2, 1.6, { anim: 'pulse', delay: i * 500 + 600, alt: 'Blue emoji' });
});

// 15. THE ASK ------------------------------------------------------------------------------------------------------------
s = slide('Pause. Make eye contact. Click YES (or NO, if you want to see what happens).');
bg(s, 'rainbow');
txt(s, 'SO... IS THAT A YES?', 0.5, 0.2, 12.33, 1.6, { font: HEAD, size: 80, color: 'FFFFFF', align: 'center', outline: 4, bold: false, anim: 'zoomIn', dur: 500 });
img(s, 'blue_plead', 4.9, 1.85, 3.7, { anim: 'pulse', alt: 'Pleading blue emoji' });
txt(s, 'YES', 1.2, 5.3, 4.2, 1.5, { font: HEAD, size: 72, color: 'FFFFFF', fill: GREEN, shape: pres.ShapeType.roundRect, rectRadius: 0.3, align: 'center', bold: false, outline: 2, link: { slide: 16, tooltip: 'Yes!' }, anim: 'zoomIn', delay: 900 });
txt(s, 'NO', 7.9, 5.3, 4.2, 1.5, { font: HEAD, size: 72, color: 'FFFFFF', fill: RED, shape: pres.ShapeType.roundRect, rectRadius: 0.3, align: 'center', bold: false, outline: 2, link: { slide: 17, tooltip: 'No' }, anim: 'zoomIn', delay: 1100 });

// 16. THANK YOU ------------------------------------------------------------------------------------------------------------
s = slide('Big finish. Hug time.');
bg(s, 'stripes');
txt(s, 'THANK YOU!!!', 0.5, 0.3, 12.33, 2.2, { font: HEAD, size: 120, color: 'FFFFFF', align: 'center', outline: 4, bold: false, anim: 'zoomIn', dur: 600 });
txt(s, "You're the best parents ever. (And I mean it.) ❤️", 0.8, 2.6, 11.7, 1.0, { size: 34, color: 'FFFFFF', align: 'center', outline: 1.5 });
img(s, 'blue_party', 0.6, 3.6, 3.3, { anim: 'spin', dur: 3000, alt: 'Party blue emoji' });
img(s, 'yel_party', 9.4, 3.6, 3.3, { anim: 'spin', dur: 3000, alt: 'Party emoji' });
img(s, 'obj_santa', 4.4, 3.7, 2.2, { anim: 'pulse', alt: 'Santa' });
img(s, 'obj_gift', 6.8, 3.9, 2.0, { anim: 'wobble', alt: 'Present' });
txt(s, 'Thank you for coming to my TED Talk 🎤', 1.5, 6.4, 10.33, 0.8, { size: 26, color: 'FFFFFF', align: 'center', outline: 1 });

// 17. WRONG BUTTON (hidden; reached only by clicking NO) -----------------------------------------------------------------
s = slide('Only shows up if someone clicks NO.');
bg(s, 'space');
txt(s, 'WRONG BUTTON 😭', 0.5, 0.5, 12.33, 1.8, { font: HEAD, size: 90, color: 'FFFFFF', align: 'center', outline: 3, bold: false });
img(s, 'blue_sob', 4.9, 2.2, 3.5, { anim: 'wobble', alt: 'Crying blue emoji' });
txt(s, 'TRY AGAIN', 3.9, 5.8, 5.5, 1.2, { font: HEAD, size: 56, color: 'FFFFFF', fill: GREEN, shape: pres.ShapeType.roundRect, rectRadius: 0.3, align: 'center', bold: false, link: { slide: 15, tooltip: 'Back to the question' } });

fs.writeFileSync('anim.json', JSON.stringify(anim));
(async () => { await pres.writeFile({ fileName: 'base.pptx' }); await applyTheme('base.pptx', THEME); console.log('built', cur, 'slides'); })();
