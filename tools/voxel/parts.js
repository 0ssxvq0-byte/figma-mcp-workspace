// Part-based 3D icon models for Build a Terrarium.
// Built from smooth Roblox-style parts (bevelled blocks, cylinders, spheres, tubes, extrusions) so they stay
// blocky in spirit without the stair-stepped pixel look of fine voxels.
// Each model is fn(P) -> { view: { rx, ry }, fov? } and adds its parts through the P helper.
import * as THREE from './lib/three.module.min.js';
import { RoundedBoxGeometry } from './lib/addons/RoundedBoxGeometry.js';

function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hex = c => new THREE.Color(c);
const mixc = (a, b, t) => hex(a).lerp(hex(b), t);

export function makeP(group) {
  const mats = new Map();
  const mat = (color, o = {}) => {
    const key = JSON.stringify([color instanceof THREE.Color ? color.getHexString() : color, o]);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: .58, metalness: 0, ...o }));
    return mats.get(key);
  };
  const place = (mesh, pos, rot, scale) => {
    mesh.position.set(...(Array.isArray(pos) ? pos : [0, 0, 0])); mesh.rotation.set(...(Array.isArray(rot) ? rot : [0, 0, 0]));
    if (scale) mesh.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
    group.add(mesh); return mesh;
  };
  const P = {
    THREE, rng, mixc, mat, group,
    box: (w, h, d, c, pos, rot, bevel = .12, o) =>
      place(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(bevel, w / 2 - .001, h / 2 - .001, d / 2 - .001)), mat(c, o)), pos, rot),
    cyl: (rt, rb, h, c, pos, rot, seg = 28, o) => place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, o)), pos, rot),
    sph: (r, c, pos, scale, seg = 24, o) => place(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .75)), mat(c, o)), pos, [0, 0, 0], scale),
    ico: (r, c, pos, rot, scale, detail = 0, o) => place(new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat(c, { flatShading: true, ...o })), pos, rot, scale),
    torus: (R, r, c, pos, rot, arc = Math.PI * 2, o) => place(new THREE.Mesh(new THREE.TorusGeometry(R, r, 14, 40, arc), mat(c, o)), pos, rot),
    tube: (pts, r, c, o, seg = 48) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 12, false), mat(c, o));
      group.add(m);
      for (const end of [pts[0], pts[pts.length - 1]]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mat(c, o)); cap.position.set(...end); group.add(cap); }
      return m;
    },
    lathe: (profile, c, pos, rot, o, seg = 48) => place(new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat(c, o)), pos, rot),
    extrude: (shape, depth, c, pos, rot, bevel = .06, o, scale) => place(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16 }), mat(c, o)), pos, rot, scale),
    leafShape(len, wid) {
      const s = new THREE.Shape(); s.moveTo(0, 0);
      s.quadraticCurveTo(wid, len * .35, 0, len); s.quadraticCurveTo(-wid, len * .35, 0, 0); return s;
    },
    mesh: (geo, c, pos, rot, scale, o) => place(new THREE.Mesh(geo, mat(c, o)), pos, rot, scale),
    instanced(geo, material, list) {                 // list: [{pos, rot, scale, color}]
      const im = new THREE.InstancedMesh(geo, material, list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      list.forEach((it, i) => {
        q.setFromEuler(e.set(...(it.rot || [0, 0, 0])));
        m.compose(new THREE.Vector3(...it.pos), q, new THREE.Vector3(...(it.scale ? (Array.isArray(it.scale) ? it.scale : [it.scale, it.scale, it.scale]) : [1, 1, 1])));
        im.setMatrixAt(i, m); im.setColorAt(i, hex(it.color));
      });
      group.add(im); return im;
    },
  };
  return P;
}

// ============================================================================================ shared bits
function mossClump(P, x, y, z, r, seed, cols = ['#6fbf32', '#86cf3e', '#5aa82a', '#9ada4e']) {
  const R = rng(seed);
  for (let i = 0; i < 5; i++) {
    const a = R() * 6.28, d = R() * r * .6;
    P.sph(r * (.45 + R() * .3), cols[i % cols.length], [x + Math.cos(a) * d, y + R() * r * .15, z + Math.sin(a) * d], [1, .55, 1], 16);
  }
}
function mushroom(P, x, y, z, s, cap = '#d9b48a', stem = '#f1e6d2', spots = null, tilt = 0) {
  P.cyl(.28 * s, .36 * s, 1.1 * s, stem, [x, y + .55 * s, z], [tilt * .5, 0, tilt]);
  P.sph(.85 * s, cap, [x + tilt * -.5 * s, y + 1.15 * s, z], [1, .55, 1], 24);
  P.cyl(.8 * s, .8 * s, .08 * s, '#b89770', [x + tilt * -.5 * s, y + 1.12 * s, z], [0, 0, 0], 24);
  if (spots) for (const [a, h] of [[0, .9], [2.1, .8], [4.2, .85], [1, .35]]) P.sph(.14 * s, spots, [x + Math.cos(a) * .55 * s * h, y + 1.4 * s + (h < .5 ? .1 * s : 0), z + Math.sin(a) * .55 * s * h], [1, .45, 1], 10);
}
function leafSprig(P, x, y, z, s, rotY, col = '#7fd83e', seed = 1) {
  const R = rng(seed);
  for (let i = 0; i < 3; i++) {
    const a = rotY + (i - 1) * .7;
    P.extrude(P.leafShape(1.6 * s, .55 * s), .04 * s, i === 1 ? col : '#5fbf2e', [x, y, z], [-.5 - R() * .3, a, 0], .02);
  }
}

// ============================================================================================ TERRARIUM (from the in-game tank)
function terrarium(P) {
  const W = 10, D = 7, H = 13, frame = '#23262f', frameHi = '#2e323d';
  // base + footer
  P.box(W + 1.1, .5, D + 1.1, '#191b22', [0, .25, 0], 0, .22);
  P.box(W + .8, 1.0, D + .8, frame, [0, .95, 0], 0, .2);
  // top frame + lid
  P.box(W + .7, .75, D + .7, frame, [0, H, 0], 0, .2);
  P.box(W - .2, .12, D - .2, '#cfe9f7', [0, H + .42, 0], 0, .05, { transparent: true, opacity: .55, roughness: .15 });
  P.box(W - .2, .16, .5, frameHi, [0, H + .46, -D / 2 + 2.6], 0, .06);                 // lid crossbar
  P.box(W - .6, .14, 2.4, '#8a95a3', [0, H + .44, -D / 2 + 1.25], 0, .05, { roughness: .8 }); // mesh vent
  // corner posts
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(.42, H - 1, .42, frame, [sx * W / 2, H / 2 + .2, sz * D / 2], 0, .1);
  // substrate layers (visible through the glass)
  const inW = W - .35, inD = D - .35;
  P.box(inW, 1.1, inD, '#8d949c', [0, 1.95, 0], 0, .05);          // drainage pebbles
  P.box(inW, .25, inD, '#3b3f47', [0, 2.62, 0], 0, .03);          // filter
  P.box(inW, 2.2, inD, '#5e412a', [0, 3.85, 0], 0, .05);          // soil
  // soil slope rising to the back
  const g = new THREE.PlaneGeometry(inW, inD, 24, 16); g.rotateX(-Math.PI / 2);
  const R = rng(5), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i), t = (inD / 2 - z) / inD; pos.setY(i, 4.95 + t * t * 2.1 + (R() - .5) * .16); }
  g.computeVertexNormals();
  P.mesh(g, '#6b4a2e', [0, 0, 0], 0, 1, { flatShading: false, roughness: .9 });
  // rocky back wall
  const rw = new THREE.PlaneGeometry(inW, 7.2, 22, 18), rp = rw.attributes.position, R2 = rng(9);
  for (let i = 0; i < rp.count; i++) { const x = rp.getX(i), y = rp.getY(i); rp.setZ(i, (Math.sin(x * 1.3 + y * .7) * .22 + (R2() - .5) * .38) * (1 - Math.abs(x) / inW)); }
  rw.computeVertexNormals();
  P.mesh(rw, '#8b7466', [0, 9.3, -inD / 2 + .15], 0, 1, { flatShading: true, roughness: .95 });
  // greenery so it reads as a living terrarium
  mossClump(P, -2.6, 5.4, 1.4, 1.5, 11); mossClump(P, 2.9, 5.6, .6, 1.3, 12); mossClump(P, .2, 6.2, -1.6, 1.2, 13);
  P.ico(1.05, '#9aa1a8', [2.4, 5.8, -1.5], [.3, .5, 0], [1.2, .8, 1], 0);
  mossClump(P, 2.3, 6.35, -1.5, .8, 14);
  for (let i = 0; i < 5; i++) P.extrude(P.leafShape(2.4, .7), .05, i % 2 ? '#5fbf2e' : '#7fd83e', [-1.4, 5.5, -.6], [-.25, i * 1.25, .35], .03);
  mushroom(P, 3.4, 5.1, 2.1, .7);
  // front vent strip with the centre lock bump
  P.box(W + .1, 1.05, .32, '#15171d', [0, 4.35, D / 2 + .08], 0, .08);
  P.box(.32, 1.05, D + .1, '#15171d', [W / 2 + .08, 4.35, 0], 0, .08);
  P.box(2.3, 1.45, .44, '#1c1f27', [0, 4.55, D / 2 + .12], 0, .22);
  for (let i = 0; i < 14; i++) { const x = -W / 2 + .6 + i * ((W - 1.2) / 13); if (Math.abs(x) < 1.3) continue; P.box(.16, .5, .1, '#6c7480', [x, 4.35, D / 2 + .26], [0, 0, -.55], .03); }
  // glass
  const glass = { transparent: true, opacity: .2, roughness: .08, depthWrite: false };
  P.box(W, H - 1, .08, '#d6f1ff', [0, H / 2 + .2, D / 2], 0, .02, glass);
  P.box(.08, H - 1, D, '#d6f1ff', [W / 2, H / 2 + .2, 0], 0, .02, glass);
  P.box(W, H - 1, .08, '#d6f1ff', [0, H / 2 + .2, -D / 2], 0, .02, glass);
  P.box(.08, H - 1, D, '#d6f1ff', [-W / 2, H / 2 + .2, 0], 0, .02, glass);
  // glass glints
  const glint = { transparent: true, opacity: .45, roughness: .1, depthWrite: false };
  P.box(.35, 9, .02, '#ffffff', [-2.2, 8.5, D / 2 + .06], [0, 0, -.5], .01, glint);
  P.box(.15, 7.5, .02, '#ffffff', [-1.3, 8.8, D / 2 + .06], [0, 0, -.5], .01, glint);
  P.box(.02, 6, .25, '#ffffff', [W / 2 + .06, 9, -.8], [-.5, 0, 0], .01, glint);
  return { view: { rx: .2, ry: -.5 } };
}

// ============================================================================================ MOSS EGG (stone blocks, moss, mushrooms)
function mossEgg(P) {
  const R = rng(17), blocks = [], s = 1;
  const inside = (x, y, z) => { const yy = y > 0 ? y / 6.8 : y / 5.0; return x * x / 20 + yy * yy + z * z / 20 <= 1; };
  const stone = ['#6d665c', '#7f776b', '#5a5650', '#8f8373', '#4b4f4a', '#9d8b72', '#72695e', '#63605a'];
  const moss = ['#5f8a32', '#6f9a3a', '#56802d', '#7ca444', '#4e7a2e'];
  const tops = [];
  for (let x = -5; x <= 5; x++) for (let y = -5; y <= 8; y++) for (let z = -5; z <= 5; z++) {
    if (!inside(x, y, z)) continue;
    const hidden = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([a, b, c]) => inside(x + a, y + b, z + c));
    if (hidden) continue;
    const up = !inside(x, y + 1, z);
    const mossy = (up && R() < .6) || (!up && R() < .16 + Math.max(0, y) * .045);
    const c = mossy ? moss[Math.floor(R() * moss.length)] : stone[Math.floor(R() * stone.length)];
    const out = [x, y, z].map(v => v * (1 + (R() - .5) * .05));
    blocks.push({ pos: out.map(v => v * s), rot: [(R() - .5) * .06, (R() - .5) * .06, (R() - .5) * .06], scale: .93 + R() * .05, color: c });
    if (up) tops.push([x, y, z]);
  }
  P.instanced(new RoundedBoxGeometry(1, 1, 1, 2, .14), P.mat('#ffffff', { roughness: .72 }), blocks);
  // leafy moss cushions spilling over some of the top blocks
  for (const [x, y, z] of tops) {
    if (R() > .3) continue;
    mossClump(P, x, y + .45, z, .9 + R() * .4, 100 + x * 17 + z * 5 + y, ['#6f9a3a', '#7ea846', '#5f8a32', '#8db552']);
    if (R() < .45) leafSprig(P, x, y + .5, z, .5, R() * 6, '#8db552', x + z);
  }
  // mushrooms
  mushroom(P, 2.0, 5.6, 2.5, .75, '#dcc3a0', '#efe4d0', null, -.3);
  mushroom(P, -3.9, 1.4, 2.4, .6, '#d4b58c', '#efe4d0', null, .45);
  mushroom(P, .8, -1.8, 4.6, .55, '#dcc3a0', '#efe4d0', null, 0);
  return { view: { rx: .14, ry: -.5 } };
}

// ============================================================================================ SATCHEL
function satchel(P) {
  const leather = '#b07a42', dark = '#8a5a2e', strap = '#6e4420', gold = '#f5c23a';
  P.box(7.2, 5.4, 2.8, leather, [0, 2.7, 0], 0, .7);
  P.box(7.0, .9, 2.6, dark, [0, .55, 0], 0, .4);                                   // darker base
  // flap with a rounded bottom
  const fs = new THREE.Shape(); fs.moveTo(-3.6, 0); fs.lineTo(3.6, 0); fs.lineTo(3.6, -2.2);
  fs.quadraticCurveTo(3.6, -3.4, 2.4, -3.4); fs.lineTo(-2.4, -3.4); fs.quadraticCurveTo(-3.6, -3.4, -3.6, -2.2); fs.closePath();
  P.extrude(fs, .35, dark, [0, 5.45, 1.25], [.08, 0, 0], .12);
  // stitching along the flap edge
  for (let i = 0; i < 13; i++) P.box(.32, .07, .05, '#e6be8a', [-3.05 + i * .51, 2.55, 1.86], 0, .02);
  // strap + buckle
  P.box(1.1, 2.6, .18, strap, [0, 3.2, 1.78], [.08, 0, 0], .06);
  P.box(1.6, 1.25, .16, gold, [0, 2.75, 1.9], 0, .12, { metalness: .45, roughness: .3 });
  P.box(1.05, .7, .2, strap, [0, 2.75, 1.93], 0, .1);
  P.box(.16, 1.0, .1, '#fff2b0', [0, 2.75, 2.05], 0, .04, { metalness: .4, roughness: .3 });
  // handle
  P.tube([[-3.1, 5.2, 0], [-2.4, 7.8, 0], [0, 8.8, 0], [2.4, 7.8, 0], [3.1, 5.2, 0]], .32, strap);
  for (const sx of [-1, 1]) P.torus(.42, .12, gold, [sx * 3.1, 5.3, 0], [0, Math.PI / 2, 0], Math.PI * 2, { metalness: .45, roughness: .3 });
  // a leaf patch sewn on the front
  P.extrude(P.leafShape(1.5, .6), .06, '#6fbf32', [-2.5, .95, 1.42], [0, 0, -.6], .03);
  return { view: { rx: .18, ry: -.42 } };
}

// ============================================================================================ SHILLING coin + stacks
const GOLD = { metalness: .35, roughness: .32 };
function coinGeo(r, t) {
  const pts = [[0, -t / 2], [r - .35, -t / 2], [r - .1, -t / 2 + .08], [r, -t / 2 + .3], [r, t / 2 - .3], [r - .1, t / 2 - .08], [r - .35, t / 2], [r - .55, t / 2],
    [r - .65, t / 2 - .14], [0, t / 2 - .14]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 56);
}
function coinLeaf(P, r, t, pos, rot) {
  const g = new THREE.Group();
  const add = m => { g.add(m); return m; };
  const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(P.leafShape(r * 1.15, r * .5), { depth: .12, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2, curveSegments: 18 }), P.mat('#ffe27a', GOLD));
  leaf.position.set(0, -r * .58, 0); leaf.rotation.z = 0; add(leaf);
  const vein = new THREE.Mesh(new RoundedBoxGeometry(.12, r * .95, .08, 1, .04), P.mat('#d98f14', GOLD)); vein.position.set(0, -r * .05, .2); add(vein);
  g.position.set(...pos); g.rotation.set(...rot); g.rotateZ(-.6);
  P.group.add(g);
}
function shilling(P) {
  const r = 5, t = 1.1;
  P.mesh(coinGeo(r, t), '#f2b425', [0, 0, 0], [Math.PI / 2, 0, 0], 1, GOLD);
  coinLeaf(P, r, t, [0, 0, t / 2 - .16], [0, 0, 0]);
  return { view: { rx: .16, ry: -.5 } };
}
function coinStacks(tier) {
  return P => {
    const R = rng(40 + tier), r = 2.4, t = .55, geo = coinGeo(r, t);
    const stack = (x, z, n) => {
      for (let i = 0; i < n; i++) P.mesh(geo, i % 2 ? '#f2b425' : '#f7c238', [x + (R() - .5) * .25, t / 2 + i * t * .96, z + (R() - .5) * .25], [0, R() * 6, 0], 1, GOLD);
      coinLeaf(P, r, t, [x, n * t * .96 - .12, z], [-Math.PI / 2, 0, 0]);
    };
    if (tier === 1) stack(0, 0, 3);
    if (tier === 2) { stack(0, 0, 6); stack(5.2, 1.2, 3); }
    if (tier === 3) { stack(0, 0, 8); stack(5.2, -.6, 5); stack(2.4, 4.6, 3); }
    if (tier === 4) {
      stack(0, 0, 10); stack(5.2, -.4, 8); stack(-.6, 5, 6); stack(4.8, 4.8, 7); stack(9.6, 2.4, 4);
      P.mesh(geo, '#f7c238', [-3.4, 2.2, 3.6], [1.1, .3, .4], 1, GOLD);
    }
    return { view: { rx: .42, ry: -.55 } };
  };
}

// ============================================================================================ FIELD GUIDE journal (leaf-stamped, with a magnifying glass)
function fieldGuide(P) {
  const cover = '#3f9a4a', coverDk = '#2c7336';
  P.box(6.4, 8.2, 1.5, cover, [0, 4.1, 0], 0, .35);                       // closed journal
  P.box(5.9, 7.7, 1.35, '#fbf3df', [.3, 4.1, 0], 0, .12);                 // page block
  P.box(6.4, 8.2, .32, cover, [0, 4.1, .6], 0, .16);                      // front cover
  P.box(6.4, 8.2, .32, cover, [0, 4.1, -.6], 0, .16);                     // back cover
  P.box(.7, 8.25, 1.55, coverDk, [-2.95, 4.1, 0], 0, .3);                  // spine
  for (let i = 0; i < 5; i++) P.box(5.7, .03, 1.2, '#e2d3b0', [.35, 1.2 + i * .7, 0], 0, .01);   // page lines on the side
  // stamped leaf on the cover
  P.extrude(P.leafShape(4.2, 1.8), .12, '#8fe04a', [.3, 1.9, .8], [0, 0, -.35], .08);
  P.box(.14, 3.4, .1, '#4fae2a', [.62, 3.9, .98], [0, 0, -.35], .04);
  // elastic strap + ribbon bookmark
  P.box(.45, 8.3, .2, '#1f5a28', [2.3, 4.1, .8], 0, .08);
  P.box(.45, 8.3, .2, '#1f5a28', [2.3, 4.1, -.8], 0, .08);
  P.box(.55, 2.2, .1, '#e8433a', [-1.2, -.6, .1], [0, 0, .12], .05);
  // magnifying glass leaning on the front
  P.torus(1.55, .32, '#e6b544', [3.5, 2.6, 2.3], [0, -.25, .5], Math.PI * 2, { metalness: .5, roughness: .3 });
  P.cyl(1.45, 1.45, .12, '#bfe8ff', [3.5, 2.6, 2.3], [Math.PI / 2, -.25, .5], 32, { transparent: true, opacity: .45, roughness: .05 });
  P.cyl(.32, .38, 2.6, '#7a4a24', [5.1, .2, 2.7], [0, 0, .5], 16);
  P.box(.25, .9, .06, '#ffffff', [3.0, 3.1, 2.5], [0, -.25, .1], .02, { transparent: true, opacity: .8 });
  return { view: { rx: .16, ry: -.72 } };
}

// ============================================================================================ VIP crown
function crown(P) {
  const gold = '#f5c23a', o = { metalness: .45, roughness: .3 };
  P.sph(3.6, '#c0283a', [0, 1.6, 0], [1, .75, 1], 32, { roughness: .8 });                 // velvet cap
  P.lathe([[4.1, 0], [4.35, .2], [4.35, 2.2], [4.1, 2.45], [3.75, 2.45], [3.75, 0]], gold, [0, 0, 0], 0, o);
  P.lathe([[4.38, .1], [4.55, .35], [4.55, .75], [4.38, 1.0]], '#e0a21e', [0, 0, 0], 0, o);
  const tri = new THREE.Shape(); tri.moveTo(-1.5, 0); tri.lineTo(1.5, 0); tri.lineTo(0, 3.2); tri.closePath();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + .25, x = Math.cos(a) * 3.95, z = Math.sin(a) * 3.95;
    P.extrude(tri, .3, gold, [x, 2.2, z], [0, -a + Math.PI / 2, 0], .1, o);
    P.sph(.42, '#fff0a8', [Math.cos(a) * 4.1, 5.55, Math.sin(a) * 4.1], 1, 16, o);
  }
  const gems = ['#ff4a5e', '#4ab8ff', '#5fe04a', '#b45cff', '#ff9a2a', '#4ab8ff'];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .25 + Math.PI / 6, x = Math.cos(a) * 4.5, z = Math.sin(a) * 4.5;
    P.ico(.7, gems[i], [x, 1.25, z], [0, -a + Math.PI / 2, 0], [1, 1, .55], 0, { roughness: .15 }); }
  P.sph(.55, '#fff0a8', [0, 4.4, 0], 1, 16, o);
  return { view: { rx: .38, ry: -.3 } };
}

// ============================================================================================ SEEDLING (bioactivity)
function seedling(P) {
  P.sph(3.2, '#6b4526', [0, 0, 0], [1, .55, 1], 28, { roughness: .9 });
  P.cyl(3.0, 3.0, .1, '#5a3a1f', [0, 1.55, 0], 0, 28);
  for (const [x, z] of [[-1.6, .8], [1.2, 1.4], [.4, -1.8], [-.6, 1.9]]) P.ico(.32, '#8a5a32', [x, 1.6, z], [x, z, 0], 1, 0);
  P.tube([[0, 1.5, 0], [.15, 3, 0], [-.1, 4.6, 0], [0, 5.6, 0]], .28, '#4fbf2a');
  P.extrude(P.leafShape(3.1, 1.3), .12, '#7fd83e', [0, 5.4, 0], [0, 0, 1.05], .08);
  P.extrude(P.leafShape(3.6, 1.45), .12, '#5fbf2e', [0, 5.6, 0], [0, 0, -1.0], .08);
  P.box(.12, 2.4, .08, '#4aa826', [-.9, 6.1, .2], [0, 0, 1.05], .03);
  return { view: { rx: .22, ry: -.4 } };
}

// ============================================================================================ STAG BEETLE (hatch reveal showcase)
function stagBeetle(P) {
  const shell = '#3a2418', shellHi = '#5a3624', jaw = '#9a3c22', leg = '#2a1a12', o = { roughness: .28 };
  P.sph(3.2, shell, [0, 1.8, -1.2], [1, .62, 1.45], 32, o);                    // elytra
  P.box(.12, 1.6, 8.6, '#1d120c', [0, 3.0, -1.2], 0, .05);                      // wing seam
  P.sph(2.2, shellHi, [0, 2.0, 3.4], [1.25, .6, .85], 28, o);                   // pronotum
  P.sph(1.6, shell, [0, 1.8, 5.4], [1.35, .55, .8], 24, o);                     // head
  for (const sx of [-1, 1]) {
    P.tube([[sx * 1.2, 1.9, 6.0], [sx * 2.3, 2.5, 7.6], [sx * 1.8, 2.8, 9.6], [sx * .6, 2.6, 10.4]], .42, jaw, o);   // mandibles
    P.tube([[sx * 1.9, 2.55, 7.9], [sx * 2.9, 2.9, 8.5]], .2, jaw, o);                                            // tooth
    P.tube([[sx * 1.4, 2.1, 5.9], [sx * 2.4, 3.2, 6.5], [sx * 3.2, 3.4, 6.2]], .12, leg);                          // antennae
    for (const [z, sp] of [[3.2, 1.2], [.6, 1.0], [-2.2, .8]]) {
      P.tube([[sx * 1.9, 1.3, z], [sx * 3.8, 1.7, z + sp * .6], [sx * 5.0, .1, z + sp * 1.6]], .22, leg);           // legs
    }
    P.sph(.3, '#0e0a08', [sx * 1.3, 2.2, 5.9], 1, 12, { roughness: .1 });                                          // eyes
  }
  P.sph(.9, '#ffffff', [-1.2, 3.1, -1.8], [1, .3, 1.6], 16, { transparent: true, opacity: .28 });                  // gloss
  return { view: { rx: .42, ry: -.62 } };
}

// ============================================================================================ TERRARIUM LAYERS (edit tank items)
function layerBase(P, c, h = 1) { P.box(6.4, h, 6.4, c, [0, h / 2, 0], 0, .25, { roughness: .9 }); return h; }
function layer(type) {
  return P => {
    const R = rng(type.length * 31);
    if (type === 'clay') {
      const h = layerBase(P, '#8a3e18', .8), cols = ['#e0803f', '#d4733a', '#ea8f4a', '#c86a32'];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) P.sph(.78, cols[(i + j * 3) % 4], [-2.3 + i * 1.53 + (R() - .5) * .2, h + .7, -2.3 + j * 1.53 + (R() - .5) * .2], 1, 20, { roughness: .8 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (R() < .7) P.sph(.76, cols[(i * 2 + j) % 4], [-1.55 + i * 1.53, h + 1.8, -1.55 + j * 1.53], 1, 20, { roughness: .8 });
    }
    if (type === 'pebbles') {
      const h = layerBase(P, '#6d737a', .7), cols = ['#9aa0a6', '#c2c6ca', '#b8a58a', '#8d949a', '#d6d2c8'];
      for (let k = 0; k < 20; k++) P.sph(.55 + R() * .45, cols[k % 5], [(R() - .5) * 5.2, h + .35 + (k > 12 ? .5 : 0), (R() - .5) * 5.2], [1, .55 + R() * .2, .8 + R() * .3], 14, { roughness: .6 });
    }
    if (type === 'filter') {
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
      x.fillStyle = '#4b525c'; x.fillRect(0, 0, 64, 64); x.strokeStyle = '#6c7580'; x.lineWidth = 3;
      for (let i = 0; i < 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
      const m = new THREE.MeshStandardMaterial({ map: t, roughness: .9, side: THREE.DoubleSide });
      const g = new THREE.PlaneGeometry(6.4, 6.4, 16, 16); g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const X = p.getX(i), Z = p.getZ(i); p.setY(i, .25 + Math.sin(X * 1.1) * .08 + (X > 1.8 && Z > 1.8 ? (X - 1.8 + Z - 1.8) * .55 : 0)); }
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, m); P.group.add(mesh);
      const thick = mesh.clone(); thick.position.y = -.12; thick.material = new THREE.MeshStandardMaterial({ color: '#2f343b', side: THREE.DoubleSide }); P.group.add(thick);
    }
    if (type === 'charcoal') {
      const h = layerBase(P, '#1c1c21', .7);
      for (let k = 0; k < 16; k++) P.ico(.55 + R() * .45, ['#2a2a30', '#34343b', '#222227'][k % 3], [(R() - .5) * 5.2, h + .3 + (k > 10 ? .45 : 0), (R() - .5) * 5.2], [R() * 3, R() * 3, R() * 3], [1.2, .8, 1], 0, { roughness: .45, metalness: .15 });
    }
    if (type === 'soil') {
      layerBase(P, '#5e3c20', 1.6);
      const g = new THREE.PlaneGeometry(6.0, 6.0, 18, 18); g.rotateX(-Math.PI / 2);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, 1.62 + (R() - .3) * .22);
      g.computeVertexNormals(); P.mesh(g, '#6b4526', 0, 0, 1, { roughness: .95 });
      for (let k = 0; k < 10; k++) P.ico(.18 + R() * .12, '#8a5a32', [(R() - .5) * 5, 1.72, (R() - .5) * 5], [R(), R(), 0], 1, 0);
    }
    if (type === 'litter') {
      const h = layerBase(P, '#5e3c20', .8), cols = ['#d8842a', '#b0461e', '#d8a23a', '#9a5a22', '#c8642a'];
      for (let k = 0; k < 14; k++) P.extrude(P.leafShape(1.9, .8), .05, cols[k % 5], [(R() - .5) * 4.6, h + .08 + k * .03, (R() - .5) * 4.6], [-Math.PI / 2 + (R() - .5) * .3, 0, R() * 6.28], .03);
    }
    if (type === 'moss') {
      const h = layerBase(P, '#5e3c20', .8);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) mossClump(P, -2 + i * 2 + (R() - .5) * .4, h + .2, -2 + j * 2 + (R() - .5) * .4, 1.35, i * 3 + j + 5);
    }
    return { view: { rx: .52, ry: -.62 } };
  };
}

// ============================================================================================ DECOR
function mossyRock(P) {
  const g = new THREE.IcosahedronGeometry(3, 1), p = g.attributes.position, R = rng(3);
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.multiplyScalar(1 + (Math.sin(v.x * 2.1) + Math.cos(v.z * 1.7)) * .06); v.y *= .72; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  P.mesh(g, '#8d949b', [0, 2, 0], [0, .4, 0], 1, { flatShading: true, roughness: .85 });
  P.ico(1.6, '#7a8188', [3, 1.1, 1], [.4, .2, .1], [1.1, .75, 1], 0, { roughness: .85 });
  mossClump(P, -.4, 3.6, .2, 2.2, 21); mossClump(P, 1.3, 3.3, 1.2, 1.4, 22); mossClump(P, 3.1, 2.0, 1.1, .9, 23);
  return { view: { rx: .3, ry: -.5 } };
}
function mushroomDecor(P) {
  mushroom(P, 0, 0, 0, 2.6, '#e8443a', '#f3ead6', '#fff6ea', 0);
  mushroom(P, 3.2, 0, 1.4, 1.4, '#e8443a', '#f3ead6', '#fff6ea', -.25);
  mossClump(P, .8, 0, 1.2, 1.4, 31);
  return { view: { rx: .25, ry: -.5 } };
}
function branch(P) {
  P.tube([[-6, .8, 0], [-2.5, 1.6, .4], [1, 1.3, -.2], [4, 2.4, .2], [6.2, 2.1, 0]], .75, '#8a5a32', { roughness: .9 });
  P.tube([[1.5, 1.5, 0], [2.4, 3.4, .3], [2.2, 5.0, .2]], .28, '#7a4f2c', { roughness: .9 });
  leafSprig(P, 2.2, 5, .2, 1, 0, '#7fd83e', 2);
  mossClump(P, -2.8, 2.3, .4, 1.2, 41); mossClump(P, .2, 2.1, .1, .9, 42);
  mushroom(P, 4.4, 2.6, .5, .55, '#dcc3a0', '#efe4d0');
  return { view: { rx: .28, ry: -.35 } };
}
function fernDecor(P) {
  P.sph(2.2, '#6b4526', [0, 0, 0], [1, .5, 1], 24, { roughness: .9 });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, tilt = .55 + (i % 2) * .25;
    P.extrude(P.leafShape(5.2 - (i % 2) * 1.2, 1.25), .08, i % 2 ? '#5fbf2e' : '#7fd83e', [0, .9, 0], [0, a, tilt], .05);
  }
  P.extrude(P.leafShape(5.6, 1.1), .08, '#8fe04a', [0, .9, 0], [0, 1.1, .12], .05);
  return { view: { rx: .3, ry: -.4 } };
}

export const PART_MODELS = {
  Terrarium: terrarium,
  Egg_Moss: mossEgg,
  Satchel: satchel,
  Shilling: shilling,
  Shillings_Tier1: coinStacks(1), Shillings_Tier2: coinStacks(2), Shillings_Tier3: coinStacks(3), Shillings_Tier4: coinStacks(4),
  FieldGuide: fieldGuide,
  VIP_Crown: crown,
  Seedling: seedling,
  Creature_StagBeetle: stagBeetle,
  Layer_ClayBalls: layer('clay'), Layer_Pebbles: layer('pebbles'), Layer_Filter: layer('filter'), Layer_Charcoal: layer('charcoal'),
  Layer_Soil: layer('soil'), Layer_LeafLitter: layer('litter'), Layer_Moss: layer('moss'),
  Decor_MossyRock: mossyRock, Decor_Mushroom: mushroomDecor, Decor_Branch: branch, Decor_Fern: fernDecor,
};
