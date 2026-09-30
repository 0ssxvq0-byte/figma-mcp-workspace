// Voxel icon models for Build a Terrarium.
// Each model returns { voxels: Map("x,y,z" -> "#rrggbb"), view: { rx, ry } }.
// x = right, y = up, z = toward the camera. Colours are sRGB hex.

function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const parse = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = parse(a), B = parse(b); return hex(...A.map((v, i) => v + (B[i] - v) * t)); };
const shade = (c, k) => hex(...parse(c).map(v => v * k));
function hsl(h, s, l) {
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return hex(f(0) * 255, f(8) * 255, f(4) * 255);
}

class Grid {
  constructor(seed = 1) { this.v = new Map(); this.r = rng(seed); }
  set(x, y, z, c) { this.v.set(`${x},${y},${z}`, c); }
  has(x, y, z) { return this.v.has(`${x},${y},${z}`); }
  jitter(c, amt = .05) { return shade(c, 1 - amt / 2 + this.r() * amt); }
}

// ---------------------------------------------------------------- clovers (server luck tiers)
function clover(tier) {
  const g = new Grid(7 + tier), N = 24, cx = 12, cy = 11;
  const leaves = [45, 135, 225, 315].map(a => { const t = a * Math.PI / 180; return { d: [Math.cos(t), Math.sin(t)], p: [-Math.sin(t), Math.cos(t)], a }; });
  const inLeaf = (px, py) => {
    for (const L of leaves) {
      for (const s of [-1, 1]) {
        const ox = cx + L.d[0] * 6.4 + L.p[0] * 2.8 * s, oy = cy + L.d[1] * 6.4 + L.p[1] * 2.8 * s;
        if ((px - ox) ** 2 + (py - oy) ** 2 <= 3.35 ** 2) return L;
      }
      const t = (px - cx) * L.d[0] + (py - cy) * L.d[1], q = Math.abs((px - cx) * L.p[0] + (py - cy) * L.p[1]);
      if (t > -0.8 && t < 6 && q < 0.9 + t * 0.62) return L;
    }
    return null;
  };
  const inLeafRaw = inLeaf;
  const inLeafGap = (px, py) => {                 // notches between neighbouring leaves
    const dx = Math.abs(px - cx), dy = Math.abs(py - cy);
    if (Math.hypot(dx, dy) > 2.6 && (dx < 0.75 || dy < 0.75)) return null;
    return inLeafRaw(px, py);
  };
  const isStem = (px, py) => py > cy + 1 && py <= cy + 12 && Math.abs(px - (cx + (py - cy) * 0.28)) < 1.1;
  const pal = [
    { c: '#d2ff6e', t: '#35d21c', vein: '#3cb91e', edge: '#1f8e12', stem: '#2f9e1a' },
    { c: '#fff27a', t: '#ff8f12', vein: '#f59a1a', edge: '#d9560c', stem: '#d97a12' },
    null][tier];
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    const L = inLeafGap(px + .5, py + .5), stem = !L && isStem(px + .5, py + .5);
    if (!L && !stem) continue;
    const dist = Math.hypot(px + .5 - cx, py + .5 - cy) / 10;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inLeafGap(px + .5 + dx, py + .5 + dy) && !isStem(px + .5 + dx, py + .5 + dy));
    let col;
    if (stem) col = pal ? pal.stem : hsl(140, .7, .38);
    else {
      const q = Math.abs((px + .5 - cx) * L.p[0] + (py + .5 - cy) * L.p[1]);
      const vein = q < .6 && dist > .08 && dist < .5;
      if (pal) col = edge ? pal.edge : vein ? pal.vein : mix(pal.c, pal.t, Math.min(1, dist * 1.05));
      else {
        const hue = Math.max(0, Math.min(1, (px + py - 9) / 26)) * 285;
        const base = hsl(hue, 1, .6 - dist * .08);
        col = edge ? shade(base, .72) : vein ? shade(base, .82) : base;
      }
    }
    const y = N - 1 - py, depth = stem ? 2 : dist < .25 ? 4 : dist > .9 ? 2 : 3;
    for (let z = 0; z < depth; z++) g.set(px, y, z - (stem ? 0 : (depth - 3 > 0 ? 1 : 0)), g.jitter(col, .06));
  }
  return { voxels: g.v, view: { rx: .28, ry: -.42 } };
}

// ---------------------------------------------------------------- cash stacks (currency packs)
function bill(g, ox, oy, oz, rot, layer, top) {
  const W = rot ? 6 : 12, D = rot ? 12 : 6;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const u = rot ? z : x, v = rot ? x : z;
    const border = u === 0 || u === 11 || v === 0 || v === 5;
    const emblem = (u - 5.5) ** 2 + (v - 2.5) ** 2 < 2.6;
    let c;
    if (!top && border) c = layer % 2 ? '#dff7c4' : '#9ad873';             // paper edges down the side
    else c = border ? '#34a826' : emblem ? '#c4f79a' : '#62d93c';
    g.set(ox + x, oy, oz + z, g.jitter(c, .04));
  }
}
function stack(g, ox, oy, oz, n, band, rot = 0) {
  for (let i = 0; i < n; i++) {
    const jx = Math.round((g.r() - .5) * 1.2), jz = Math.round((g.r() - .5) * 1.2);
    bill(g, ox + (i ? jx : 0), oy + i, oz + (i ? jz : 0), rot, i, i === n - 1);
  }
  if (band) {
    // a gold paper band wrapped around the middle of the stack: two side walls plus a strip over the top
    const L = rot ? 6 : 6;                       // the band always crosses the bill's short side
    for (let k = -1; k <= L; k++) for (let b = 0; b < 2; b++) {
      const at = (y) => { const x = ox + (rot ? k : 5 + b), z = oz + (rot ? 5 + b : k); g.set(x, y, z, b ? '#f2b21e' : '#ffe06a'); };
      if (k === -1 || k === L) for (let i = 0; i <= n; i++) at(oy + i);
      else at(oy + n);
    }
  }
}
function cash(tier) {
  const g = new Grid(20 + tier);
  if (tier === 0) stack(g, 0, 0, 0, 3, false);
  if (tier === 1) stack(g, 0, 0, 0, 6, true);
  if (tier === 2) { stack(g, 0, 0, 0, 7, true); stack(g, 13, 0, 1, 5, true); }
  if (tier === 3) {
    stack(g, 0, 0, 0, 6, true); stack(g, 13, 0, 0, 6, true); stack(g, 0, 0, 7, 6, true); stack(g, 13, 0, 7, 6, true);
    stack(g, 6, 7, 3, 5, true);
  }
  return { voxels: g.v, view: { rx: .55, ry: -.5 } };
}

// ---------------------------------------------------------------- bioactivity seedling
function seedling() {
  const g = new Grid(31);
  for (let x = 0; x < 13; x++) for (let z = 0; z < 13; z++) for (let y = 0; y < 5; y++) {
    if ((x - 6) ** 2 / 40 + (z - 6) ** 2 / 40 + (y + .5) ** 2 / 25 > 1) continue;
    const top = !((x - 6) ** 2 / 40 + (z - 6) ** 2 / 40 + (y + 1.5) ** 2 / 25 <= 1);
    g.set(x, y, z, g.jitter(top ? (g.r() < .25 ? '#5a3a1e' : '#7a5230') : '#8f6038', .12));
  }
  for (let y = 4; y < 11; y++) g.set(6, y, 6, g.jitter('#4fbf2a', .06));
  const leaf = (cx, cy, dir) => {
    for (let x = -5; x <= 5; x++) for (let y = -3; y <= 3; y++) {
      const lx = x * dir, t = (lx + 1) / 6;
      if (lx < 0 || y * y > (3.2 * Math.sin(Math.PI * Math.min(1, t))) ** 2 * .45) continue;
      for (let z = 5; z <= 7; z++) {
        if (z !== 6 && (y * y > 1 || lx > 4)) continue;
        g.set(cx + x, cy + y + Math.round(lx * .35), z, g.jitter(y === 0 ? '#58c92e' : mix('#9cf05a', '#3fb022', t), .05));
      }
    }
  };
  leaf(6, 11, -1); leaf(6, 12, 1);
  return { voxels: g.v, view: { rx: .32, ry: -.5 } };
}

// ---------------------------------------------------------------- event icons
function blob(g, spheres, colorAt) {
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const [x, y, z, r] of spheres) { mn = [Math.min(mn[0], x - r), Math.min(mn[1], y - r), Math.min(mn[2], z - r)]; mx = [Math.max(mx[0], x + r), Math.max(mx[1], y + r), Math.max(mx[2], z + r)]; }
  for (let x = Math.floor(mn[0]); x <= mx[0]; x++) for (let y = Math.floor(mn[1]); y <= mx[1]; y++) for (let z = Math.floor(mn[2]); z <= mx[2]; z++)
    if (spheres.some(([sx, sy, sz, r]) => (x + .5 - sx) ** 2 + (y + .5 - sy) ** 2 + (z + .5 - sz) ** 2 <= r * r)) g.set(x, y, z, colorAt(x, y, z));
}
function toxicRain() {
  const g = new Grid(41);
  blob(g, [[6, 9, 4, 4], [11.5, 10, 4, 4.6], [16.5, 9, 4, 3.8], [9, 12.5, 4, 3.6], [13.5, 13, 4, 3.3]],
    (x, y) => g.jitter(mix('#3d8a26', '#b4f266', Math.min(1, Math.max(0, (y - 6) / 10))), .08));
  for (const [x, y, z] of [[4, 1, 6], [10, -1, 6], [16, 1, 5], [7, -5, 6], [13, -6, 6]]) {
    for (const zz of [z, z + 1]) {
      g.set(x, y, zz, '#8fe010'); g.set(x + 1, y, zz, '#8fe010');
      g.set(x, y + 1, zz, '#b4ff1e'); g.set(x + 1, y + 1, zz, '#a8f418');
      g.set(x, y + 2, zz, '#d2ff5e');
      g.set(x, y + 3, zz, '#ecffb0');
    }
  }
  return { voxels: g.v, view: { rx: .22, ry: -.45 } };
}
function nightTime() {
  const g = new Grid(51);
  for (let x = 0; x < 18; x++) for (let y = 0; y < 20; y++) {
    const inA = (x + .5 - 8) ** 2 + (y + .5 - 11) ** 2 <= 7.6 ** 2, inB = (x + .5 - 11.5) ** 2 + (y + .5 - 13) ** 2 <= 6.6 ** 2;
    if (!inA || inB) continue;
    for (let z = 0; z < 4; z++) g.set(x, y, z, g.jitter(mix('#fff27a', '#ffb81e', Math.min(1, (x + 20 - y) / 30)), .05));
  }
  blob(g, [[11, 4, 6, 3.2], [15, 5, 6, 3.8], [19, 4, 6, 2.8]], (x, y) => g.jitter(mix('#3a4a92', '#7488d8', Math.min(1, Math.max(0, (y - 1) / 7))), .06));
  for (const [sx, sy] of [[19, 16], [3, 19]]) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) g.set(sx + dx, sy + dy, 1, '#fff27a');
  return { voxels: g.v, view: { rx: .22, ry: -.4 } };
}


// ---------------------------------------------------------------- helpers for chunky shapes
function ball(g, cx, cy, cz, r, colorAt) {
  for (let x = Math.floor(cx - r); x <= cx + r; x++) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++)
    if ((x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 + (z + .5 - cz) ** 2 <= r * r) g.set(x, y, z, colorAt(x, y, z));
}
function mask(g, rows, colors, depth = 3, z0 = 0) {
  const H = rows.length;
  rows.forEach((row, py) => [...row].forEach((ch, px) => {
    if (ch === '.' || ch === ' ') return;
    const d = typeof depth === 'function' ? depth(ch) : depth;
    for (let z = 0; z < d; z++) g.set(px, H - 1 - py, z0 + z, g.jitter(colors[ch], .05));
  }));
}

// ---------------------------------------------------------------- Shillings coin (embossed leaf)
function shilling() {
  const g = new Grid(61), R = 9.2;
  for (let x = -10; x <= 10; x++) for (let y = -10; y <= 10; y++) {
    const d = Math.hypot(x + .5, y + .5);
    if (d > R) continue;
    const rim = d > R - 1.6;
    for (let z = 0; z < 3; z++) g.set(x, y, z, g.jitter(rim ? mix('#ffd84a', '#d98c12', (y + 10) / -20 + .5) : mix('#ffe46a', '#f2a91e', Math.min(1, Math.max(0, (d + y * .4) / 12))), .04));
  }
  // raised leaf emblem on the face
  for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) {
    const u = (x + y) / Math.SQRT2, v = (x - y) / Math.SQRT2;        // leaf axis on the diagonal
    const inLeaf = Math.abs(v) <= 3.1 * Math.sin(Math.PI * Math.min(1, Math.max(0, (u + 6) / 12)));
    if (!inLeaf || Math.abs(u) > 6) continue;
    g.set(x, y, 3, Math.abs(v) < .8 ? '#e39a18' : g.jitter('#fff1a8', .04));
  }
  return { voxels: g.v, view: { rx: .18, ry: -.5 } };
}
function coinFlat(g, cx, cy, cz, layer) {
  for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
    const d = Math.hypot(x + .5, z + .5);
    if (d > 4.9) continue;
    g.set(cx + x, cy, cz + z, g.jitter(d > 3.7 ? (layer % 2 ? '#e8a81e' : '#f5bf2a') : '#ffd84a', .04));
  }
}
function coinStack(g, cx, cy, cz, n) { for (let i = 0; i < n; i++) coinFlat(g, cx + Math.round((g.r() - .5) * .9), cy + i, cz + Math.round((g.r() - .5) * .9), i); }
function coins(tier) {
  const g = new Grid(70 + tier);
  if (tier === 0) { coinStack(g, 0, 0, 0, 3); }
  if (tier === 1) { coinStack(g, 0, 0, 0, 6); coinStack(g, 11, 0, 2, 3); }
  if (tier === 2) { coinStack(g, 0, 0, 0, 8); coinStack(g, 11, 0, -1, 5); coinStack(g, 5, 0, 10, 4); }
  if (tier === 3) {
    coinStack(g, 0, 0, 0, 10); coinStack(g, 11, 0, 0, 8); coinStack(g, 0, 0, 11, 6); coinStack(g, 11, 0, 11, 7); coinStack(g, 22, 0, 5, 5);
    coinStack(g, 5, 10, 5, 3);
  }
  return { voxels: g.v, view: { rx: .5, ry: -.55 } };
}

// ---------------------------------------------------------------- VIP crown, egg, terrarium tank
function crown() {
  const g = new Grid(81);
  mask(g, [
    '..X.......X.......X..',
    '.XXX.....XXX.....XXX.',
    '.XXXX...XXXXX...XXXX.',
    '.XXXXX.XXXXXXX.XXXXX.',
    '.XXXXXXXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXXXXXXX.',
    '.HHHHHHHHHHHHHHHHHHH.',
    '.HHRRHHHHHBBHHHHHGGH.',
    '.HHRRHHHHHBBHHHHHGGH.',
    '.HHHHHHHHHHHHHHHHHHH.',
    '..LLLLLLLLLLLLLLLLL..',
  ], { X: '#ffd23a', H: '#f2a91e', L: '#c9780f', R: '#ff4a5e', B: '#4ab8ff', G: '#5fe04a' }, ch => 'RBG'.includes(ch) ? 4 : 3);
  for (const x of [2, 10, 18]) g.set(x, 11, 1, '#fff6c8');   // bright tips
  return { voxels: g.v, view: { rx: .22, ry: -.4 } };
}
function egg() {
  const g = new Grid(91);
  ball(g, 0, 0, 0, 1, () => '#000'); g.v.clear();
  for (let x = -7; x <= 7; x++) for (let y = -9; y <= 11; y++) for (let z = -7; z <= 7; z++) {
    const yy = y > 0 ? y / 10.5 : y / 8.5;
    if ((x + .5) ** 2 / 42 + yy * yy + (z + .5) ** 2 / 42 > 1) continue;
    const speck = g.r() < .07;
    g.set(x, y, z, speck ? g.jitter('#7fb865', .1) : g.jitter(mix('#fff8e6', '#e6d7b4', (1 - y / 11) / 2), .03));
  }
  return { voxels: g.v, view: { rx: .2, ry: -.5 } };
}
function tank() {
  const g = new Grid(101), W = 18, D = 12, H = 14;
  const glass = (x, y, z) => g.set(x, y, z, g.jitter(y === H - 1 ? '#e6f8ff' : '#a9ddf2', .03));
  for (let x = 0; x < W; x++) for (const [y, z] of [[0, 0], [0, D - 1], [H - 1, 0], [H - 1, D - 1]]) glass(x, y, z);
  for (let z = 0; z < D; z++) for (const [x, y] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]) glass(x, y, z);
  for (let y = 0; y < H; y++) for (const [x, z] of [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]]) glass(x, y, z);
  const layers = [['#d4733a', '#b85a28'], ['#9aa0a6', '#c2c6ca'], ['#3a3f46', '#3a3f46'], ['#6b4526', '#5a3a1f'], ['#6b4526', '#7a4f2c'], ['#5fbf2e', '#7fd83e']];
  layers.forEach(([a, b], y) => { for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) g.set(x, y + 1, z, g.r() < .5 ? a : b); });
  for (let y = 7; y < 11; y++) g.set(6, y, 5, '#3f9a1f');                         // a little plant
  for (const [x, y] of [[5, 10], [7, 10], [4, 9], [8, 9], [6, 11]]) g.set(x, y, 5, '#7fd83e');
  ball(g, 12.5, 7.6, 7, 2.2, () => g.jitter('#8d949a', .1));                       // mossy rock
  for (let x = 11; x < 15; x++) for (let z = 6; z < 9; z++) g.set(x, 9, z, '#5fbf2e');
  return { voxels: g.v, view: { rx: .38, ry: -.55 } };
}

// ---------------------------------------------------------------- terrarium building layers (all the same slab size)
function slab(type) {
  const g = new Grid(200 + type.length * 7), N = 10;
  const fill = (h, colorAt) => { for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) for (let y = 0; y < h; y++) g.set(x, y, z, colorAt(x, y, z)); };
  const pick = arr => arr[Math.floor(g.r() * arr.length)];
  if (type === 'clay') {
    fill(1, () => '#7a3a18');
    const clayBall = (cx, cy, cz, r) => { const base = pick(['#e0803f', '#d4733a', '#ea8f4a', '#c86a32']);
      ball(g, cx, cy, cz, r, (x, y, z) => (y + .5 - cy) > r * .45 && (x + .5 - cx) < 0 ? mix(base, '#ffd0a0', .45) : (y + .5 - cy) < -r * .3 ? shade(base, .82) : base); };
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) clayBall(1.8 + i * 3.4, 2.5, 1.8 + j * 3.4, 1.5);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) clayBall(3.5 + i * 3.4, 5.2, 3.5 + j * 3.4, 1.5);
  }
  if (type === 'pebbles') {
    fill(2, () => g.jitter('#7d8388', .08));
    for (let k = 0; k < 11; k++) ball(g, 1 + g.r() * 8, 2.6, 1 + g.r() * 8, 1.1 + g.r() * .9, () => g.jitter(pick(['#9aa0a6', '#c2c6ca', '#b8a58a', '#8d949a']), .04));
  }
  if (type === 'filter') {
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) g.set(x, Math.round(Math.sin(x * .7) * .4 + .4), z, (x + z) % 2 ? '#454b54' : '#5f6670');
    for (let y = 1; y < 4; y++) for (let x = 7; x < N; x++) g.set(x, y, N - 1 - (y - 1), (x + y) % 2 ? '#454b54' : '#5f6670');   // folded corner
  }
  if (type === 'charcoal') {
    fill(2, () => g.jitter('#26262b', .1));
    for (let k = 0; k < 14; k++) { const x = Math.floor(g.r() * 9), z = Math.floor(g.r() * 9); for (const [dx, dz] of [[0, 0], [1, 0], [0, 1]]) g.set(x + dx, 2 + (g.r() < .4 ? 1 : 0), z + dz, g.jitter(pick(['#3a3a40', '#2e2e34', '#4a4a52']), .06)); }
  }
  if (type === 'soil') {
    fill(4, (x, y) => g.jitter(g.r() < .14 ? '#8a5a32' : y === 3 ? '#5e3c20' : '#6b4526', .1));
    for (let k = 0; k < 8; k++) g.set(Math.floor(g.r() * N), 4, Math.floor(g.r() * N), '#5a3a1f');
  }
  if (type === 'litter') {
    fill(2, () => g.jitter('#5e3c20', .08));
    for (let k = 0; k < 16; k++) {
      const x = Math.floor(g.r() * 8), z = Math.floor(g.r() * 8), c = pick(['#c8742a', '#9a5a22', '#d8a23a', '#b0461e']);
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]]) if (g.r() < .85) g.set(x + dx, 2 + (k % 3 === 0 ? 1 : 0), z + dz, g.jitter(c, .05));
    }
  }
  if (type === 'moss') {
    fill(2, () => g.jitter('#5e3c20', .08));
    for (let k = 0; k < 10; k++) ball(g, 1 + g.r() * 8, 2.2, 1 + g.r() * 8, 1.4 + g.r() * 1.1, () => g.jitter(pick(['#5fbf2e', '#7fd83e', '#4aa826', '#8fe34a']), .05));
  }
  return { voxels: g.v, view: { rx: .5, ry: -.62 } };
}

// ---------------------------------------------------------------- decor
function fern() {
  const g = new Grid(301);
  ball(g, 6, 0, 6, 3.4, (x, y) => g.jitter(y > 0 ? '#5a3a1f' : '#6b4526', .1));
  const frond = (ang, len, lift) => {
    for (let i = 0; i < len; i++) {
      const t = i / len, x = 6 + Math.cos(ang) * i, z = 6 + Math.sin(ang) * i, y = 2 + Math.sin(t * Math.PI * .8) * lift;
      g.set(Math.round(x), Math.round(y), Math.round(z), '#3f9a1f');
      const w = Math.round(2.2 * (1 - t));
      for (let s = 1; s <= w; s++) for (const sg of [-1, 1]) g.set(Math.round(x - Math.sin(ang) * s * sg), Math.round(y - s * .3), Math.round(z + Math.cos(ang) * s * sg), g.jitter(mix('#8fe34a', '#4aa826', t), .05));
    }
  };
  [0, 1.3, 2.5, 3.8, 5.0].forEach((a, i) => frond(a, 7 + (i % 2) * 2, 6 + (i % 3)));
  return { voxels: g.v, view: { rx: .35, ry: -.5 } };
}
function mossyRock() {
  const g = new Grid(311);
  blob(g, [[6, 3, 6, 4.4], [9.5, 2.4, 7, 3.2], [3.5, 2, 5, 2.8]], (x, y) => g.jitter(mix('#6e757c', '#a7aeb4', Math.min(1, y / 7)), .08));
  const top = new Map();
  for (const k of g.v.keys()) { const [x, y, z] = k.split(',').map(Number); if (!top.has(x + ',' + z) || top.get(x + ',' + z) < y) top.set(x + ',' + z, y); }
  for (const [k, y] of top) { const [x, z] = k.split(',').map(Number); if (y > 4 || g.r() < .35) g.set(x, y, z, g.jitter(g.r() < .5 ? '#5fbf2e' : '#7fd83e', .05)); }
  return { voxels: g.v, view: { rx: .35, ry: -.5 } };
}
function branch() {
  const g = new Grid(321);
  for (let i = 0; i < 20; i++) { const x = i, y = Math.round(2 + Math.sin(i / 4) * 1.5 + i * .18); ball(g, x, y, 4, 1.7 - i * .03, () => g.jitter(g.r() < .2 ? '#6a4222' : '#8a5a32', .08)); }
  for (let i = 0; i < 6; i++) g.set(12 + Math.round(i * .5), 5 + i, 4, '#7a4f2c');                  // twig
  for (const [x, y] of [[14, 11], [15, 11], [14, 12], [16, 10]]) g.set(x, y, 4, '#7fd83e');
  for (let i = 2; i < 9; i++) g.set(i, Math.round(2 + Math.sin(i / 4) * 1.5 + i * .18) + 2, 4 - (i % 2), '#5fbf2e'); // moss strip
  return { voxels: g.v, view: { rx: .3, ry: -.45 } };
}
function mushroom() {
  const g = new Grid(331);
  for (let y = 0; y < 6; y++) for (const [x, z] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + 5, y, z + 5, g.jitter('#f3ead6', .04));
  for (let x = -1; x <= 12; x++) for (let z = -1; z <= 12; z++) for (let y = 5; y <= 10; y++) {
    const dx = x + .5 - 6, dz = z + .5 - 6, dy = y - 5;
    if ((dx * dx + dz * dz) / 36 + (dy * dy) / 25 > 1 || dy < 0) continue;
    g.set(x, y, z, g.r() < .1 && dy > 1 ? '#fff6ea' : g.jitter(mix('#ff5a4a', '#c8281e', 1 - dy / 5), .04));
  }
  for (let y = 0; y < 3; y++) for (const [x, z] of [[10, 9], [10, 10]]) g.set(x, y, z, '#f3ead6');       // small second mushroom
  ball(g, 10.5, 3.5, 9.5, 1.9, (x, y) => y >= 3 ? '#ff6a4a' : '#e2402e');
  return { voxels: g.v, view: { rx: .3, ry: -.5 } };
}


function satchel() {
  const g = new Grid(341), W = 14, H = 10, D = 6;
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) {
    const corner = (x === 0 || x === W - 1) && (y === 0 || y === H - 1);
    if (corner) continue;
    g.set(x, y, z, g.jitter(y < 2 ? '#8a5a2e' : '#b0773c', .06));
  }
  for (let x = 1; x < W - 1; x++) for (let y = 5; y < H + 1; y++) g.set(x, y, D, g.jitter(y === 5 ? '#6e4420' : '#9a6632', .05));    // flap
  for (const [x, y] of [[6, 6], [7, 6], [6, 5], [7, 5]]) g.set(x, y, D + 1, '#ffd23a');                                          // buckle
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = Math.round(1 + t * 11), y = Math.round(H + 1 + Math.sin(t * Math.PI) * 6); g.set(x, y, 2, '#6e4420'); g.set(x, y, 3, '#6e4420'); } // strap
  for (const [x, y] of [[2, 3], [3, 3], [2, 4]]) g.set(x, y, D, '#7fd83e');                                                     // leaf patch
  return { voxels: g.v, view: { rx: .28, ry: -.5 } };
}

export const MODELS = {
  'Clover_Tier1': () => clover(0),
  'Clover_Tier2': () => clover(1),
  'Clover_Tier3': () => clover(2),
  'Cash_Tier1': () => cash(0),
  'Cash_Tier2': () => cash(1),
  'Cash_Tier3': () => cash(2),
  'Cash_Tier4': () => cash(3),
  'Seedling': seedling,
  'Event_ToxicRain': toxicRain,
  'Event_NightTime': nightTime,
  'Shilling': shilling,
  'Shillings_Tier1': () => coins(0),
  'Shillings_Tier2': () => coins(1),
  'Shillings_Tier3': () => coins(2),
  'Shillings_Tier4': () => coins(3),
  'VIP_Crown': crown,
  'Egg': egg,
  'Terrarium': tank,
  'Layer_ClayBalls': () => slab('clay'),
  'Layer_Pebbles': () => slab('pebbles'),
  'Layer_Filter': () => slab('filter'),
  'Layer_Charcoal': () => slab('charcoal'),
  'Layer_Soil': () => slab('soil'),
  'Layer_LeafLitter': () => slab('litter'),
  'Layer_Moss': () => slab('moss'),
  'Decor_Fern': fern,
  'Decor_MossyRock': mossyRock,
  'Decor_Branch': branch,
  'Decor_Mushroom': mushroom,
  'Satchel': satchel,
};
