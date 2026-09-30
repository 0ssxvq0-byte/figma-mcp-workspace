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
};
