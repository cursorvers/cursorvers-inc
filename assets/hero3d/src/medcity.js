import * as THREE from 'three';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeMedCity(scene, { mobile = false, style = 'solid', ids = false } = {}) {
  const rand = mulberry32(20261008);
  const solid = style !== 'wire' || ids;

  // ---- tone buckets (line vertex arrays) + face arrays ----
  const T = { hero: [], equip: [], mid: [], far: [], accent: [] };
  const F = { pos: [], nrm: [], col: [] };

  const ROOM_COLORS = {
    C0: [1, 0, 0],
    C1: [0, 1, 0],
    C2: [0, 0, 1],
    C3: [1, 1, 0],
    C4: [1, 0, 1]
  };

  const seg = (a, x0, y0, z0, x1, y1, z1) => a.push(x0, y0, z0, x1, y1, z1);

  function quad(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz, room) {
    F.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz);
    let v;
    if (ids) {
      const c = room ? ROOM_COLORS[room] || [1, 1, 1] : [1, 1, 1];
      for (let i = 0; i < 6; i++) {
        F.nrm.push(nx, ny, nz);
        F.col.push(c[0], c[1], c[2]);
      }
      return;
    }
    if (ny > 0.5) v = 1.0;
    else if (Math.abs(nx) > 0.5) v = 0.955;
    else if (Math.abs(nz) > 0.5) v = 0.925;
    else v = 0.88;
    for (let i = 0; i < 6; i++) {
      F.nrm.push(nx, ny, nz);
      F.col.push(v, v, v);
    }
  }

  // B0: 同じ箱の中で重複する辺は 1 回だけ描く (座標を丸めたキーで判定)
  function edgeDedup() {
    const seen = new Set();
    const K = (x, y, z) => Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100);
    return function eseg(a, x0, y0, z0, x1, y1, z1) {
      const k1 = K(x0, y0, z0), k2 = K(x1, y1, z1);
      const key = k1 <= k2 ? k1 + '|' + k2 : k2 + '|' + k1;
      if (seen.has(key)) return;
      seen.add(key);
      seg(a, x0, y0, z0, x1, y1, z1);
    };
  }

  // box with per-face edge/face skipping (skip = { px, nx, py, ny, pz, nz }), opt.room = 'C0'..'C4'
  function box(x0, y0, z0, x1, y1, z1, tone, opt) {
    opt = opt || {};
    const a = T[tone];
    const sk = opt.skip || {};
    const wf = !!opt.face && solid;
    const room = opt.room;
    const eseg = edgeDedup();
    // ny (bottom)
    if (!sk.ny) {
      eseg(a, x0, y0, z0, x1, y0, z0); eseg(a, x1, y0, z0, x1, y0, z1);
      eseg(a, x1, y0, z1, x0, y0, z1); eseg(a, x0, y0, z1, x0, y0, z0);
      if (wf) quad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1, 0, -1, 0, room);
    }
    // py (top)
    if (!sk.py) {
      eseg(a, x0, y1, z0, x1, y1, z0); eseg(a, x1, y1, z0, x1, y1, z1);
      eseg(a, x1, y1, z1, x0, y1, z1); eseg(a, x0, y1, z1, x0, y1, z0);
      if (wf) quad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0, 0, 1, 0, room);
    }
    // nz
    if (!sk.nz) {
      eseg(a, x0, y0, z0, x1, y0, z0); eseg(a, x0, y1, z0, x1, y1, z0);
      eseg(a, x0, y0, z0, x0, y1, z0); eseg(a, x1, y0, z0, x1, y1, z0);
      if (wf) quad(x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0, 0, 0, -1, room);
    }
    // pz
    if (!sk.pz) {
      eseg(a, x0, y0, z1, x1, y0, z1); eseg(a, x0, y1, z1, x1, y1, z1);
      eseg(a, x0, y0, z1, x0, y1, z1); eseg(a, x1, y0, z1, x1, y1, z1);
      if (wf) quad(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, 0, 0, 1, room);
    }
    // nx
    if (!sk.nx) {
      eseg(a, x0, y0, z0, x0, y0, z1); eseg(a, x0, y1, z0, x0, y1, z1);
      eseg(a, x0, y0, z0, x0, y1, z0); eseg(a, x0, y0, z1, x0, y1, z1);
      if (wf) quad(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0, -1, 0, 0, room);
    }
    // px
    if (!sk.px) {
      eseg(a, x1, y0, z0, x1, y0, z1); eseg(a, x1, y1, z0, x1, y1, z1);
      eseg(a, x1, y0, z0, x1, y1, z0); eseg(a, x1, y0, z1, x1, y1, z1);
      if (wf) quad(x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1, 1, 0, 0, room);
    }
  }

  function ring(a, cx, cy, cz, r, div, axis) {
    div = div || 48;
    let px = 0, py = 0, pz = 0;
    for (let s = 0; s <= div; s++) {
      const t = (s / div) * Math.PI * 2;
      const c = Math.cos(t) * r, sn = Math.sin(t) * r;
      let x, y, z;
      if (axis === 'y') { x = cx + c; y = cy; z = cz + sn; }
      else if (axis === 'z') { x = cx + c; y = cy + sn; z = cz; }
      else { x = cx; y = cy + c; z = cz + sn; } // axis 'x'
      if (s > 0) seg(a, px, py, pz, x, y, z);
      px = x; py = y; pz = z;
    }
  }

  // open cylinder: two rings + verticals
  function cyl(cx, y0, cz, r, h, tone, div) {
    div = div || 24;
    const a = T[tone];
    ring(a, cx, y0, cz, r, div, 'y');
    ring(a, cx, y0 + h, cz, r, div, 'y');
    for (let s = 0; s < 6; s++) {
      const t = (s / 6) * Math.PI * 2;
      const x = cx + Math.cos(t) * r, z = cz + Math.sin(t) * r;
      seg(a, x, y0, z, x, y0 + h, z);
    }
  }

  function line(tone, ax, ay, az, bx, by, bz) { seg(T[tone], ax, ay, az, bx, by, bz); }

  // ================= ground =================
  {
    const E = 640;
    quad(-E, 0, -E, E, 0, -E, E, 0, E, -E, 0, E, 0, 1, 0); // ground face (solid only)
    const step = 32;
    for (let v = -E; v <= E + 0.01; v += step) {
      seg(T.far, v, 0, -E, v, 0, E);
      seg(T.far, -E, 0, v, E, 0, v);
    }
  }

  // ================= hospital tower (cross plan) =================
  // arms: half-width 11, extend 40 from center
  const HW = 11;
  const arms = [
    { x0: -HW, z0: -40, x1: HW, z1: -HW, h: 68, name: 'north' },
    { x0: -HW, z0: HW, x1: HW, z1: 40, h: 48, name: 'south' }, // C0 stepped cutaway
    { x0: -40, z0: -HW, x1: -HW, z1: HW, h: 88, name: 'west' }, // helipad
    { x0: HW, z0: -HW, x1: 40, z1: HW, h: 60, name: 'east' },
  ];
  for (const a of arms) {
    if (a.name === 'south') {
      // ---- C0: stepped notch on the south face, east part x=-2..11 ----
      // notch depth by floor: y4 -> z38, y8 -> z36, y12 -> z34, y16 -> z32
      // west part (x=-11..-2): plain shell
      box(a.x0, 0, a.z0, -2, a.h, a.z1, 'hero', { face: true, room: 'C0' });
      // east part (x=-2..11): below notch (0..4) and above notch (20..48) plain
      box(-2, 0, a.z0, a.x1, 4, a.z1, 'hero', { face: true, room: 'C0' });
      box(-2, 20, a.z0, a.x1, a.h, a.z1, 'hero', { face: true, room: 'C0' });
      // stepped bands: y=4..8 (z=36..40), y=8..12 (z=34..40), y=12..16 (z=32..40), y=16..20 (z=32..40)
      // floor 4 band: cut z=38..40
      box(-2, 4, a.z0, a.x1, 8, 38, 'hero', { face: true, room: 'C0' });
      // floor 8 band: cut z=36..40
      box(-2, 8, a.z0, a.x1, 12, 36, 'hero', { face: true, room: 'C0' });
      // floor 12 band: cut z=34..40
      box(-2, 12, a.z0, a.x1, 16, 34, 'hero', { face: true, room: 'C0' });
      // floor 16 band: cut z=32..40
      box(-2, 16, a.z0, a.x1, 20, 32, 'hero', { face: true, room: 'C0' });
      // cut edges: floor slab top surfaces at each notch step (hero)
      // slab top at y=4, z edge x=-2..38
      box(-2, 3.7, a.z0, a.x1, 4, 38, 'hero', { face: true, room: 'C0' });
      // slab top at y=8, z edge 36
      box(-2, 7.7, a.z0, a.x1, 8, 36, 'hero', { face: true, room: 'C0' });
      // slab top at y=12, z edge 34
      box(-2, 11.7, a.z0, a.x1, 12, 34, 'hero', { face: true, room: 'C0' });
      // slab top at y=16, z edge 32
      box(-2, 15.7, a.z0, a.x1, 16, 32, 'hero', { face: true, room: 'C0' });
      // vertical cut edges (hero lines)
      // notch corner verticals at z=38,36,34,32
      for (const [yy, zz] of [[4, 38], [8, 36], [12, 34], [16, 32]]) {
        seg(T.hero, a.x1, yy, zz, a.x1, yy + 4, zz); // east face vertical edge
        seg(T.hero, -2, yy, zz, -2, yy + 4, zz);     // step inner corner
        seg(T.hero, -2, yy + 4, zz, a.x1, yy + 4, zz); // horizontal step edge
      }
      // east face opening z=32..40, y=4..20: frame lines
      seg(T.hero, a.x1, 4, 32, a.x1, 4, 40);
      seg(T.hero, a.x1, 20, 32, a.x1, 20, 40);
      seg(T.hero, a.x1, 4, 32, a.x1, 20, 32);
      // (z=40 edge is the existing outer corner)
    } else {
      box(a.x0, 0, a.z0, a.x1, a.h, a.z1, 'hero', { face: true });
    }
    // floor lines (interior rhythm) on non-cut faces
    for (let y = 4; y < a.h - 0.1; y += 4) {
      if (a.name === 'south' && y >= 4 && y < 20) continue; // notch band: no mullion rhythm on cut faces
      if (a.name !== 'north') seg(T.equip, a.x0, y, a.z1, a.x1, y, a.z1);
      if (a.name !== 'south') seg(T.equip, a.x0, y, a.z0, a.x1, y, a.z0);
      if (a.name !== 'west') seg(T.equip, a.x0, y, a.z0, a.x0, y, a.z1);
      if (a.name !== 'east') seg(T.equip, a.x1, y, a.z0, a.x1, y, a.z1);
    }
    // mullions (sparser on mobile)
    const mstep = mobile ? 5.5 : 3.7;
    if (a.name !== 'north') {
      for (let x = a.x0 + mstep; x < a.x1 - 0.1; x += mstep)
        seg(T.equip, x, 0, a.z1, x, a.h, a.z1);
    }
    if (a.name !== 'west') {
      for (let z = a.z0 + mstep; z < a.z1 - 0.1; z += mstep)
        seg(T.equip, a.x0, 0, z, a.x0, a.h, z);
    }
    if (a.name !== 'east') {
      for (let z = a.z0 + mstep; z < a.z1 - 0.1; z += mstep)
        seg(T.equip, a.x1, 0, z, a.x1, a.h, z);
    }
  }

  // ---- central core (x=-11..11, z=-11..11, y=0..68) ----
  {
    box(-HW, 0, -HW, HW, 68, HW, 'hero', { face: true });
    // vertical circulation shaft x=4..10, z=4..10 as line box
    box(4, 0, 4, 10, 68, 10, 'hero');
  }

  // ---- C0 cutaway interior: beds, rails, IV, nurse station ----
  {
    const floors = [4, 8, 12, 16];
    const bedXs = mobile ? [-6, 0, 6] : [-8, -4, 0, 4, 8];
    for (const fy of floors) {
      for (const bx of bedXs) {
        const bz = 34; // bed center z, head toward +z (south outer wall)
        // bed: 1.1 wide (x) x 0.5 high x 2.6 long (z), bottom at fy+0.4
        box(bx - 0.55, fy + 0.4, bz - 1.3, bx + 0.55, fy + 0.9, bz + 1.3, 'equip', { room: 'C0' });
        // legs (4 short lines)
        for (const [lx, lz] of [[-0.45, -1.2], [0.45, -1.2], [-0.45, 1.2], [0.45, 1.2]]) {
          seg(T.equip, bx + lx, fy, bz + lz, bx + lx, fy + 0.4, bz + lz);
        }
        // pillow at head end (+z)
        box(bx - 0.3, fy + 0.9, bz + 0.7, bx + 0.3, fy + 1.05, bz + 1.25, 'equip', { room: 'C0' });
        // head board: 0.15 x 0.6 x 1.15 at head end
        box(bx - 0.075, fy + 0.4, bz + 1.3, bx + 0.075, fy + 1.0, bz + 1.15, 'equip', { room: 'C0' });
        // IV stand: pole height 2.1 + top cross 2 lines + 2 legs, corridor side z=31.8
        const ix = bx - 0.9, iz = 31.8;
        seg(T.equip, ix, fy, iz, ix, fy + 2.1, iz);
        seg(T.equip, ix, fy + 2.1, iz, ix - 0.3, fy + 2.1, iz);
        seg(T.equip, ix, fy + 2.1, iz, ix + 0.3, fy + 2.1, iz);
        seg(T.equip, ix, fy, iz - 0.3, ix, fy, iz + 0.3);
      }
      // curtain rails at fy+2.6, two lines per floor
      seg(T.equip, -10, fy + 2.6, 31.5, 10.5, fy + 2.6, 31.5);
      seg(T.equip, -10, fy + 2.6, 36.5, 10.5, fy + 2.6, 36.5);
      // nurse / record counter 10 x 1.1 x 3 at z=26..29, x=-6..4
      box(-6, fy, 26, 4, fy + 1.1, 29, 'equip', { face: true, room: 'C0' });
      seg(T.equip, -6, fy + 1.4, 26, 4, fy + 1.4, 26);
      seg(T.equip, -6, fy + 1.4, 29, 4, fy + 1.4, 29);
      // record terminal on floor-8 counter east end, near (0, 9.4, 27)
      if (fy === 8) {
        box(-0.6, 9.0, 26.6, 0.6, 9.8, 27.8, 'equip', { room: 'C0' });
        box(-0.6, 9.4, 27.72, 0.6, 10.2, 27.84, 'equip', { room: 'C0' });
      }
    }
    // east wall penetration x=11, z=29.4..30.6, y=9.4..10.6 (frame lines)
    seg(T.equip, HW, 9.4, 29.4, HW, 9.4, 30.6);
    seg(T.equip, HW, 10.6, 29.4, HW, 10.6, 30.6);
    seg(T.equip, HW, 9.4, 29.4, HW, 10.6, 29.4);
    seg(T.equip, HW, 9.4, 30.6, HW, 10.6, 30.6);
    // floor-0 entrance: east wall x=11, z=24..28, y=0..4 (frame lines)
    seg(T.hero, HW, 0, 24, HW, 0, 28);
    seg(T.hero, HW, 4, 24, HW, 4, 28);
    seg(T.hero, HW, 0, 24, HW, 4, 24);
    seg(T.hero, HW, 0, 28, HW, 4, 28);
  }

  // ---- helipad on west arm (top y = 88) ----
  const HELI = { x: -25.5, y: 88 };
  {
    ring(T.hero, HELI.x, HELI.y + 0.2, 0, 13, 64, 'y');
    // deck cross (two flat bands)
    box(HELI.x - 8, HELI.y, -1.5, HELI.x + 8, HELI.y + 0.2, 1.5, 'hero', { skip: { py: true, ny: true } });
    box(HELI.x - 1.5, HELI.y, -8, HELI.x + 1.5, HELI.y + 0.2, 8, 'hero', { skip: { py: true, ny: true } });
  }

  // ---- rooftop equipment ----
  {
    // cooling towers on north arm roof (y=68)
    cyl(-5, 68, -25, 3, 5, 'equip');
    cyl(4, 68, -25, 3, 5, 'equip');
    box(-8, 68, -18, 8, 69.5, -14, 'equip');
    // O2 tanks (horizontal cylinders) on east arm roof (y=60)
    const tanks = mobile ? 2 : 3;
    for (let k = 0; k < tanks; k++) {
      const x = 18 + k * 8;
      ring(T.equip, x, 61.6, -5, 1.8, 20, 'z');
      ring(T.equip, x, 61.6, -1, 1.8, 20, 'z');
      seg(T.equip, x, 59.8, -5, x, 59.8, -1);
      seg(T.equip, x, 63.4, -5, x, 63.4, -1);
      seg(T.equip, x, 61.6, -6.8, x, 61.6, -5);
      seg(T.equip, x, 61.6, -1, x, 61.6, 0.8);
    }
  }

  // ================= imaging department C1 (CT / MRI) =================
  {
    // --- shell: walls / floor / roof built separately, south-east corner notched in L ---
    // floor
    box(50, 0, -11, 94, 0.2, 11, 'hero', { face: true, room: 'C1' });
    // north wall
    box(50, 0, -11, 94, 12, -10.4, 'hero', { face: true, room: 'C1' });
    // west wall (x=50) with entrance z=-2..2, y=0..4
    box(50, 0, -11, 50.6, 12, -2, 'hero', { face: true, room: 'C1' });
    box(50, 0, 2, 50.6, 12, 11, 'hero', { face: true, room: 'C1' });
    box(50, 4, -2, 50.6, 12, 2, 'hero', { face: true, room: 'C1' });
    // south wall (z=11): L notch x=82..93.4, y=1.2..10
    box(50, 0, 10.4, 82, 12, 11, 'hero', { face: true, room: 'C1' });
    box(82, 0, 10.4, 93.4, 1.2, 11, 'hero', { face: true, room: 'C1' }); // 腰壁
    box(82, 10, 10.4, 93.4, 12, 11, 'hero', { face: true, room: 'C1' }); // 上の梁
    // east wall (x=94): L notch z=1..10.4, y=1.2..10
    box(93.4, 0, -11, 94, 12, 1, 'hero', { face: true, room: 'C1' });
    box(93.4, 0, 1, 94, 1.2, 10.4, 'hero', { face: true, room: 'C1' });
    box(93.4, 10, 1, 94, 12, 10.4, 'hero', { face: true, room: 'C1' });
    // corner column 0.6 square (x=93.4..94, z=10.4..11)
    box(93.4, 0, 10.4, 94, 12, 11, 'hero', { face: true, room: 'C1' });
    // east wall penetration frame (z=-5.6..-4.4, y=2.2..3.4) — 線で枠だけ
    seg(T.equip, 94, 2.2, -5.6, 94, 2.2, -4.4);
    seg(T.equip, 94, 3.4, -5.6, 94, 3.4, -4.4);
    seg(T.equip, 94, 2.2, -5.6, 94, 3.4, -5.6);
    seg(T.equip, 94, 2.2, -4.4, 94, 3.4, -4.4);
    // lift shaft x=50..54, z=5..9, y=0..16 (joins east skybridge y=12..16)
    box(50, 0, 5, 54, 16, 9, 'hero', { face: true, room: 'C1' });

    // --- CT: short donut, axis z, center (60, 5.5, 0), z=-1.1..1.1 ---
    const ctRout = 4, ctRin = 1.5;
    const ctDivO = mobile ? 24 : 32, ctDivI = mobile ? 16 : 24;
    ring(T.hero, 60, 5.5, -1.1, ctRout, ctDivO, 'z');
    ring(T.equip, 60, 5.5, -1.1, ctRin, ctDivI, 'z');
    ring(T.hero, 60, 5.5, 1.1, ctRout, ctDivO, 'z');
    ring(T.equip, 60, 5.5, 1.1, ctRin, ctDivI, 'z');
    for (let s = 0; s < 8; s++) {
      const t = (s / 8) * Math.PI * 2;
      const co = Math.cos(t), sn = Math.sin(t);
      seg(T.hero, 60 + co * ctRout, 5.5 + sn * ctRout, -1.1, 60 + co * ctRout, 5.5 + sn * ctRout, 1.1);
      seg(T.equip, 60 + co * ctRin, 5.5 + sn * ctRin, -1.1, 60 + co * ctRin, 5.5 + sn * ctRin, 1.1);
    }
    // CT base
    box(56, 0, -1, 64, 1.3, 1, 'equip', { face: true, room: 'C1' });
    // CT table (passes through the hole)
    box(59, 3.6, -5, 61, 4.1, 3, 'equip', { face: true, room: 'C1' });
    box(59.4, 0, -5, 60.6, 3.4, -3, 'equip', { face: true, room: 'C1' });

    // --- MRI: long closed tube, axis x, x=76.8..87.2, closed at x=87.2 end ---
    const mrX0 = 76.8, mrX1 = 87.2, mrY = 5.5, mrZ = 0;
    const mrRout = 4, mrRin = 1.4, mrDivO = mobile ? 24 : 32;
    ring(T.hero, mrX0, mrY, mrZ, mrRout, mrDivO, 'x');
    ring(T.equip, mrX0, mrY, mrZ, mrRin, mrDivO, 'x');
    ring(T.hero, mrX1, mrY, mrZ, mrRout, mrDivO, 'x');
    for (let s = 0; s < 8; s++) {
      const t = (s / 8) * Math.PI * 2;
      const co = Math.cos(t), sn = Math.sin(t);
      seg(T.hero, mrX0, mrY + co * mrRout, mrZ + sn * mrRout, mrX1, mrY + co * mrRout, mrZ + sn * mrRout);
    }
    // end disc at x=87.2 (solid: filled face; wire: outer ring only, already drawn)
    if (solid) {
      const divD = 16;
      for (let s = 0; s < divD; s++) {
        const t0 = (s / divD) * Math.PI * 2, t1 = ((s + 1) / divD) * Math.PI * 2;
        quad(
          mrX1, mrY + Math.cos(t0) * mrRout, mrZ + Math.sin(t0) * mrRout,
          mrX1, mrY + Math.cos(t1) * mrRout, mrZ + Math.sin(t1) * mrRout,
          mrX1, mrY, mrZ,
          mrX1, mrY, mrZ,
          1, 0, 0, 'C1'
        );
      }
    }
    // MRI base
    box(78, 0, -1, 86, 1.3, 1, 'equip', { face: true, room: 'C1' });
    // MRI table (enters 4.8 from x=76.8 end, bore closed beyond)
    box(72, 3.6, -1, 81.6, 4.1, 1, 'equip', { face: true, room: 'C1' });
    box(72.4, 0, -0.6, 73.6, 3.4, 0.6, 'equip', { face: true, room: 'C1' });

    // --- operator consoles + glass line rects ---
    for (const cx of [62, 84]) {
      box(cx - 1.5, 0, -8.7, cx + 1.5, 1.2, -7.3, 'equip', { face: true, room: 'C1' });
      // two screens (thin tilted-ish plates)
      box(cx - 1.1, 1.2, -8.5, cx - 0.2, 2.1, -8.35, 'equip', { room: 'C1' });
      box(cx + 0.2, 1.2, -8.5, cx + 1.1, 2.1, -8.35, 'equip', { room: 'C1' });
      // glass line rectangle y=0..5.2, length 6.4 at z=-6.5
      const gx0 = cx - 3.2, gx1 = cx + 3.2, gz = -6.5;
      seg(T.mid, gx0, 0, gz, gx1, 0, gz);
      seg(T.mid, gx0, 5.2, gz, gx1, 5.2, gz);
      seg(T.mid, gx0, 0, gz, gx0, 5.2, gz);
      seg(T.mid, gx1, 0, gz, gx1, 5.2, gz);
    }
    // bay floor lines
    seg(T.equip, 50, 0.2, -9, 94, 0.2, -9);
    seg(T.equip, 50, 0.2, 9, 94, 0.2, 9);
  }

  // ================= operating department C2 (moved east) =================
  {
    // --- shell: floor / walls / roof separately, south 30% of roof kept as frame ---
    // floor
    box(50, 0, 22, 78, 0.1, 46, 'hero', { face: true, room: 'C2' });
    // roof: south side only (z=38.8..46); north edge reads as foreground frame
    box(50, 8.8, 38.8, 78, 9, 46, 'hero', { face: true, room: 'C2' });
    // north wall (z=22) full height
    box(50, 0, 22, 78, 9, 22.6, 'hero', { face: true, room: 'C2' });
    // east wall (x=78) full height
    box(77.4, 0, 22, 78, 9, 46, 'hero', { face: true, room: 'C2' });
    // west wall (x=50) full height with entrance z=32..36, y=0..4
    box(50, 0, 22, 50.6, 9, 32, 'hero', { face: true, room: 'C2' });
    box(50, 0, 36, 50.6, 9, 46, 'hero', { face: true, room: 'C2' });
    box(50, 4, 32, 50.6, 9, 36, 'hero', { face: true, room: 'C2' });
    // south wall (z=46): spandrel to y=1.2
    box(50, 0, 45.4, 78, 1.2, 46, 'hero', { face: true, room: 'C2' });

    // --- surgical table (long in z, head at +z) ---
    box(63.1, 1.0, 31.6, 64.9, 1.5, 36.4, 'equip', { face: true, room: 'C2' });
    box(63.5, 0.2, 33.3, 64.5, 1.0, 34.7, 'equip', { face: true, room: 'C2' });

    // --- shadowless lamps: main (r 2.2/1.2) + 3 child lamps (r 0.8), y=4.4 ---
    const lampY = 4.4, lampDivO = mobile ? 24 : 32, lampDivI = mobile ? 16 : 24;
    ring(T.hero, 64, lampY, 34, 2.2, lampDivO, 'y');
    ring(T.hero, 64, lampY, 34, 1.2, lampDivI, 'y');
    for (let s = 0; s < 3; s++) {
      const t = (s / 3) * Math.PI * 2;
      seg(T.hero, 64 + Math.cos(t) * 1.2, lampY, 34 + Math.sin(t) * 1.2,
              64 + Math.cos(t) * 2.2, lampY, 34 + Math.sin(t) * 2.2);
    }
    // main lamp: 3 support lines to roof frame (y=9)
    for (let s = 0; s < 3; s++) {
      const t = (s / 3) * Math.PI * 2 + Math.PI / 6;
      seg(T.equip, 64 + Math.cos(t) * 1.7, lampY, 34 + Math.sin(t) * 1.7, 64, 9, 34);
    }
    // child lamps at radius 1.6, angles 90/210/330 deg, 1 support line each
    const childDiv = mobile ? 12 : 16;
    for (const deg of [90, 210, 330]) {
      const t = (deg * Math.PI) / 180;
      const cx = 64 + Math.cos(t) * 1.6, cz = 34 + Math.sin(t) * 1.6;
      ring(T.hero, cx, lampY, cz, 0.8, childDiv, 'y');
      seg(T.equip, cx, lampY, cz, cx, 9, cz);
    }

    // --- anesthesia machine: body + 2 cylinders + arm over the head + monitor ---
    box(65.7, 0, 37.3, 67.9, 2.4, 39.1, 'equip', { face: true, room: 'C2' });
    box(68.2, 0, 37.65, 68.7, 1.7, 38.15, 'equip', { face: true, room: 'C2' });
    box(68.2, 0, 38.25, 68.7, 1.7, 38.75, 'equip', { face: true, room: 'C2' });
    seg(T.equip, 66.2, 2.4, 38.2, 64.6, 2.4, 38.2);
    seg(T.equip, 64.6, 2.4, 38.2, 64.6, 2.6, 36.6);
    box(65.9, 2.4, 38.11, 67.7, 3.6, 38.29, 'equip', { face: true, room: 'C2' });

    // --- instrument tables at the foot side (mobile: 1) ---
    const tables = mobile ? [[58, 31]] : [[58, 31], [60, 29.5]];
    for (const [tx, tz] of tables) {
      box(tx - 1, 0.9, tz - 0.8, tx + 1, 1.1, tz + 0.8, 'equip', { face: true, room: 'C2' });
      for (const [lx, lz] of [[-0.85, -0.65], [0.85, -0.65], [-0.85, 0.65], [0.85, 0.65]]) {
        seg(T.equip, tx + lx, 0, tz + lz, tx + lx, 0.9, tz + lz);
      }
    }

    // --- aux cart (desktop only) ---
    if (!mobile) {
      box(73.2, 0, 25.4, 74.8, 1.8, 26.6, 'equip', { face: true, room: 'C2' });
    }
  }

  // ================= emergency entrance (south) =================
  {
    const cz = 100;
    // canopy: roof + columns (ambulances, ramp, bays removed)
    box(-20, 6, cz - 9, 20, 6.7, cz + 9, 'hero', { face: true });
    for (const cx of [-17, -8.5, 0, 8.5, 17]) {
      seg(T.hero, cx, 0, cz - 7, cx, 6, cz - 7);
      seg(T.hero, cx, 0, cz + 7, cx, 6, cz + 7);
    }
  }

  // ================= atrium + skybridge =================
  {
    // atrium between south arm (z=40) and ER (z=91): open frame, tall glass hall
    const z0 = 44, z1 = 88;
    for (const cx of [-13, -4.5, 4.5, 13]) {
      for (const cz of [z0 + 2, (z0 + z1) / 2, z1 - 2]) {
        seg(T.mid, cx, 0, cz, cx, 14, cz);
      }
    }
    box(-14, 14, z0, 14, 15, z1, 'mid', { face: true });
    // interior tree lines (thin)
    for (const [tx, tz] of [[-9, 60], [9, 66], [-7, 76]]) {
      seg(T.mid, tx, 0, tz, tx, 4, tz);
      ring(T.mid, tx, 4, tz, 2, 12, 'y');
    }
    // skybridge: tower east arm (x=40) -> imaging (x=50) at y 12..16
    box(40, 12, -4, 50, 16, 4, 'hero', { face: true });
    // west skybridge extended: x=-100..-40, z=-1..5, y=20..24
    box(-100, 20, -1, -40, 24, 5, 'hero', { face: true });
    // entrance frames at both ends of the west skybridge
    seg(T.hero, -100, 20, -1, -100, 24, -1);
    seg(T.hero, -100, 20, 5, -100, 24, 5);
    seg(T.hero, -40, 20, -1, -40, 24, -1);
    seg(T.hero, -40, 20, 5, -40, 24, 5);
    // emergency treatment / reception at atrium south end (x=-12..12, z=76..88, floor 0)
    // reception counter 3.6 x 1.1 x 0.8 at x=-2..1.6, z=84..84.8
    box(-2, 0, 84, 1.6, 1.1, 84.8, 'hero', { face: true });
    seg(T.hero, -2, 1.4, 84, 1.6, 1.4, 84);
    seg(T.hero, -2, 1.4, 84.8, 1.6, 1.4, 84.8);
    // stretchers: 0.65 wide x 0.9 high x 2.0 long + 4 wheel boxes, near z=79
    for (const sx of [-8, -4]) {
      box(sx - 0.325, 0.7, 78, sx + 0.325, 0.9, 80, 'hero', { face: true });
      for (const [wx, wz] of [[-0.25, -0.8], [0.25, -0.8], [-0.25, 0.8], [0.25, 0.8]]) {
        box(sx + wx - 0.12, 0, 79 + wz - 0.12, sx + wx + 0.12, 0.24, 79 + wz + 0.12, 'hero', { face: true });
        seg(T.hero, sx + wx, 0.24, 79 + wz, sx + wx, 0.7, 79 + wz);
      }
    }
    // record terminal near (6, 2.8, 82)
    box(5.3, 0, 81.4, 6.7, 0.9, 82.6, 'hero', { face: true });
    box(5.4, 2.4, 81.94, 6.6, 3.2, 82.06, 'hero', { face: true });
    seg(T.hero, 6, 0.9, 82, 6, 2.4, 82);
  }

  // ================= corridors (floor 0) =================
  {
    // floor slabs: width 4, y=0..0.15, mid tone, with face
    const paths = [
      [[10, 82], [30, 82], [30, 52], [46, 52], [46, 0], [50, 0]], // ER -> imaging
      [[46, 34], [50, 34]],                                       // main -> surgery
      [[46, 26], [11, 26]],                                       // main -> ward
      [[30, 82], [76, 82]],                                       // main -> outpatient
    ];
    for (const pts of paths) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
        // horizontal run
        if (ax !== bx) {
          const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
          box(x0, 0, az - 2, x1, 0.15, az + 2, 'mid', { face: true });
          // columns every 8 units on one side
          for (let x = x0; x <= x1 + 0.01; x += 8) {
            seg(T.mid, x, 0.15, az + 2, x, 4, az + 2);
          }
        } else {
          const z0 = Math.min(az, bz), z1 = Math.max(az, bz);
          box(ax - 2, 0, z0, ax + 2, 0.15, z1, 'mid', { face: true });
          for (let z = z0; z <= z1 + 0.01; z += 8) {
            seg(T.mid, ax + 2, 0.15, z, ax + 2, 4, z);
          }
        }
      }
    }
    // no center lines, no lanes, no curbs: road must not read as a road
  }

  // ================= server room (mid) =================
  {
    // shell x=-88..-72, z=-70..-54, y=0..8, roofless
    // floor
    box(-88, 0, -70, -72, 0.15, -54, 'mid', { face: true, room: 'C3' });
    // north wall (z=-70): y=0..1 spandrel only
    box(-88, 0, -70, -72, 1, -69.4, 'mid', { face: true, room: 'C3' });
    // west wall (x=-88): y=0..1 spandrel only
    box(-88, 0, -70, -87.4, 1, -54, 'mid', { face: true, room: 'C3' });
    // south wall (z=-54): full height with penetration x=-80.6..-79.4, y=2.4..4.8
    box(-88, 0, -54.6, -80.6, 8, -54, 'mid', { face: true, room: 'C3' });
    box(-79.4, 0, -54.6, -72, 8, -54, 'mid', { face: true, room: 'C3' });
    box(-80.6, 0, -54.6, -79.4, 2.4, -54, 'mid', { face: true, room: 'C3' });
    box(-80.6, 4.8, -54.6, -79.4, 8, -54, 'mid', { face: true, room: 'C3' });
    // east wall (x=-72): full height
    box(-72.6, 0, -70, -72, 8, -54, 'mid', { face: true, room: 'C3' });
    // south penetration frame lines
    seg(T.equip, -80.6, 2.4, -54, -79.4, 2.4, -54);
    seg(T.equip, -80.6, 4.8, -54, -79.4, 4.8, -54);
    seg(T.equip, -80.6, 2.4, -54, -80.6, 4.8, -54);
    seg(T.equip, -79.4, 2.4, -54, -79.4, 4.8, -54);

    // racks 2 x 5 x 2.2, bottom y=0.2, x=-84,-77 x z=-66,-62,-58 (mobile skips z=-62)
    const rackZs = mobile ? [-66, -58] : [-66, -62, -58];
    const rackRows = mobile ? 4 : 6;
    for (const rx of [-84, -77]) {
      for (const rz of rackZs) {
        box(rx - 1, 0.2, rz - 1.1, rx + 1, 5.2, rz + 1.1, 'equip', { face: true, room: 'C3' });
        // front face (north, smaller z side): horizontal lines, 8 (desktop) / 4 (mobile)
        const hl = mobile ? 4 : 8;
        for (let k = 1; k <= hl; k++) {
          const y = 0.2 + (5.0 / (hl + 1)) * k;
          seg(T.equip, rx - 1, y, rz - 1.1, rx + 1, y, rz - 1.1);
        }
        // vertical line rack top -> cable tray (tray at y=6.2)
        seg(T.equip, rx, 5.2, rz, rx, 6.2, rz);
      }
      // cable tray: width 0.8, length 12, height 0.3 frame at y=6.2
      box(rx - 0.4, 6.2, rz0Of(rackZs), rx + 0.4, 6.5, rz1Of(rackZs), 'equip', { room: 'C3' });
    }
    function rz0Of(zs) { return Math.min.apply(null, zs) - 0.4; }
    function rz1Of(zs) { return Math.max.apply(null, zs) + 6 + 0.4; }

    // record terminal desk 3 x 1.2 x 1.5 + screen near (-80, 0, -56)
    box(-81.5, 0, -56.75, -78.5, 1.1, -55.25, 'equip', { face: true, room: 'C3' });
    box(-80.7, 1.1, -55.31, -79.3, 2.0, -55.19, 'equip', { room: 'C3' });
    // record cabinet 2.8 x 2.7 x 1.2 with 6 drawer lines near (-86, 0, -56)
    box(-87.4, 0, -56.6, -84.6, 2.7, -55.4, 'equip', { face: true, room: 'C3' });
    for (let k = 1; k <= 6; k++) {
      const y = (2.7 / 6) * k;
      seg(T.equip, -87.4, y, -56.6, -84.6, y, -56.6);
    }
    // wiring panel 1 x 3.2 x 0.6
    box(-75, 0, -54.6, -74, 3.2, -54, 'equip', { face: true, room: 'C3' });
  }

  // ================= outpatient clinic (mid) =================
  {
    // shell x=76..106, z=66..96, y=0..10, southwest corner notched
    // floor
    box(76, 0, 66, 106, 0.15, 96, 'mid', { face: true, room: 'C4' });
    // north wall (z=66) full height
    box(76, 0, 66, 106, 10, 66.6, 'mid', { face: true, room: 'C4' });
    // east wall (x=106) full height
    box(105.4, 0, 66, 106, 10, 96, 'mid', { face: true, room: 'C4' });
    // west wall (x=76): south part z=82..96 opened y=1.2..10; entrance z=80..84, y=0..4
    box(76, 0, 66, 76.6, 10, 80, 'mid', { face: true, room: 'C4' });   // north of entrance
    box(76, 0, 84, 76.6, 10, 96, 'mid', { face: true, room: 'C4' });   // south of entrance (below notch: only y<1.2 remains solid above is open)
    box(76, 0, 66, 76.6, 1.2, 96, 'mid', { face: true, room: 'C4' });  // spandrel to y=1.2 full length
    // south wall (z=96): x=76..92 opened y=1.2..10
    box(76, 0, 95.4, 92, 1.2, 96, 'mid', { face: true, room: 'C4' });
    box(92, 0, 95.4, 106, 10, 96, 'mid', { face: true, room: 'C4' });
    // roof: exclude x=76..94, z=80..96
    box(76, 10, 66, 106, 10.2, 80, 'mid', { face: true, room: 'C4' }); // north strip (z=66..80)
    box(94, 10, 80, 106, 10.2, 96, 'mid', { face: true, room: 'C4' }); // east strip (x=94..106)
    // rooftop top-light box x=96..102, z=70..76, y=10..12
    box(96, 10, 70, 102, 12, 76, 'mid', { face: true, room: 'C4' });
    // west entrance frame (z=80..84, y=0..4)
    seg(T.mid, 76, 0, 80, 76, 0, 84);
    seg(T.mid, 76, 4, 80, 76, 4, 84);
    seg(T.mid, 76, 0, 80, 76, 4, 80);
    seg(T.mid, 76, 0, 84, 76, 4, 84);
    // notch edge frames (west face z=82..96 opened per brief; south face x=76..92)
    seg(T.mid, 76, 1.2, 96, 76, 10, 96);
    seg(T.mid, 76, 10, 96, 92, 10, 96);
    seg(T.mid, 92, 1.2, 96, 92, 10, 96);
    seg(T.mid, 76, 1.2, 96, 92, 1.2, 96);

    // exam desk 2.8 x 0.2 x 1.6 (top 0.75), center (88, 85) + legs
    box(86.6, 0.55, 84.2, 89.4, 0.75, 85.8, 'equip', { face: true, room: 'C4' });
    for (const [lx, lz] of [[-1.3, -0.7], [1.3, -0.7], [-1.3, 0.7], [1.3, 0.7]]) {
      seg(T.equip, 88 + lx, 0, 85 + lz, 88 + lx, 0.55, 85 + lz);
    }
    // terminal 1.4 x 0.9 x 0.12 on the desk
    box(87.3, 0.75, 84.94, 88.7, 1.65, 85.06, 'equip', { room: 'C4' });
    // exam table 4 x 0.5 x 1.4 (top 0.7), center (84, 91) + legs + pillow
    box(82, 0.2, 90.3, 86, 0.7, 91.7, 'equip', { face: true, room: 'C4' });
    for (const [lx, lz] of [[-1.8, -0.6], [1.8, -0.6], [-1.8, 0.6], [1.8, 0.6]]) {
      seg(T.equip, 84 + lx, 0, 91 + lz, 84 + lx, 0.2, 91 + lz);
    }
    box(84.9, 0.7, 90.6, 85.8, 0.85, 91.4, 'equip', { room: 'C4' });
    // 2 chairs: seat 0.9 x 0.15 x 0.9 + back 0.9 x 1 x 0.15
    for (const cx of [90, 92]) {
      box(cx - 0.45, 0.4, 84.55, cx + 0.45, 0.55, 85.45, 'equip', { face: true, room: 'C4' });
      box(cx - 0.45, 0.55, 85.3, cx + 0.45, 1.55, 85.45, 'equip', { face: true, room: 'C4' });
      for (const [lx, lz] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
        seg(T.equip, cx + lx, 0, 85 + lz, cx + lx, 0.4, 85 + lz);
      }
    }
    // waiting bench 4 x 0.4 x 1.2 near (80, 0, 93)
    box(78, 0.4, 92.4, 82, 0.8, 93.6, 'equip', { face: true, room: 'C4' });
    for (const [lx, lz] of [[-1.8, -0.5], [1.8, -0.5], [-1.8, 0.5], [1.8, 0.5]]) {
      seg(T.equip, 80 + lx, 0, 93 + lz, 80 + lx, 0.4, 93 + lz);
    }
  }

  // ================= mid wings =================
  {
    const wings = [
      { x: 0, z: -130, h: 42 },
      { x: -130, z: 10, h: 36 },
      { x: 120, z: -60, h: 30 },
    ];
    for (const w of wings) {
      box(w.x - 30, 0, w.z - 11, w.x + 30, w.h, w.z + 11, 'mid', { face: true });
      for (let y = 4; y < w.h; y += 4) seg(T.mid, w.x - 30, y, w.z + 11, w.x + 30, y, w.z + 11);
      const ms = mobile ? 8 : 5;
      for (let x = w.x - 30 + ms; x < w.x + 30; x += ms) seg(T.mid, x, 0, w.z + 11, x, w.h, w.z + 11);
    }
  }

  // ================= far city =================
  {
    const BLOCK = 44, ROAD = 12, PITCH = BLOCK + ROAD;
    const EXT = mobile ? 400 : 560; // B0: desktop 640 -> 560
    for (let gx = -EXT; gx <= EXT; gx += PITCH) for (let gz = -EXT; gz <= EXT; gz += PITCH) {
      if (Math.abs(gx) < 200 && Math.abs(gz) < 200) continue;          // キャンパスの敷地は空ける
      const d = Math.hypot(gx, gz);
      if (rand() > (mobile ? 0.55 : (d < 460 ? 0.95 : 0.7))) continue;
      const nx = 1 + Math.floor(rand() * 3), nz = 1 + Math.floor(rand() * 2); // 区画を割る
      const lw = BLOCK / nx, ld = BLOCK / nz;
      for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
        const x0 = gx + i * lw + 1.2, x1 = gx + (i + 1) * lw - 1.2;
        const z0 = gz + k * ld + 1.2, z1 = gz + (k + 1) * ld - 1.2;
        const near = d < 330;
        const h = 5 + rand() * rand() * (near ? 64 : 34);
        const tone = near ? 'mid' : 'far';
        box(x0, 0, z0, x1, h, z1, tone, { face: near });
        if (!mobile && d < 300 && h > 12) {                               // 窓の格子 (近い棟の +x と +z の面だけ)
          for (let y = 4; y < h; y += 4) { seg(T[tone], x1, y, z0, x1, y, z1); seg(T[tone], x0, y, z1, x1, y, z1); }
          for (let x = x0 + 3; x < x1; x += 3) seg(T[tone], x, 0, z1, x, h, z1);
          for (let z = z0 + 3; z < z1; z += 3) seg(T[tone], x1, 0, z, x1, h, z);
        }
      }
      seg(T.far, gx - ROAD / 2, 0.05, gz - ROAD / 2, gx + BLOCK + ROAD / 2, 0.05, gz - ROAD / 2); // 道路の縁
      seg(T.far, gx - ROAD / 2, 0.05, gz - ROAD / 2, gx - ROAD / 2, 0.05, gz + BLOCK + ROAD / 2);
    }
  }

  // ================= data flow (accent) =================
  // 八角形の輪・RING_Y / RING_R・CatmullRom 曲線は撤去 (spec §4)。折点間は直線のみ。
  const DW = 0.6; // 門 G での停止秒数

  function v3key(x, y, z) {
    return Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100);
  }
  const accentSeen = new Set();
  function aseg(x0, y0, z0, x1, y1, z1) {
    const k1 = v3key(x0, y0, z0), k2 = v3key(x1, y1, z1);
    const key = k1 <= k2 ? k1 + '|' + k2 : k2 + '|' + k1;
    if (accentSeen.has(key)) return;
    accentSeen.add(key);
    seg(T.accent, x0, y0, z0, x1, y1, z1);
  }

  // 折れ線パス: 点の配列 + 区間長の累積 + pointAt(dist, out)
  function makePath(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(
        pts[i][0] - pts[i - 1][0],
        pts[i][1] - pts[i - 1][1],
        pts[i][2] - pts[i - 1][2]
      ));
    }
    const total = cum[cum.length - 1];
    return {
      pts, cum, total,
      pointAt(dist, out) {
        const d = Math.max(0, Math.min(dist, total));
        let i = 1;
        while (i < cum.length - 1 && cum[i] < d) i++;
        const L = cum[i] - cum[i - 1] || 1;
        const f = (d - cum[i - 1]) / L;
        const a = pts[i - 1], b = pts[i];
        out.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
        return out;
      },
    };
  }

  // 起点・門・記録 (spec §4)
  const P = {
    E: [6, 2.8, 82], I: [86, 2.8, -5], O: [68, 2.8, 38], W: [0, 9.4, 27],
    J: [14, 10, 30], G: [8, 10, 30], H: [4, 10, 30], S: [-80, 3, -60], D: [88, 2.8, 86],
  };

  // 往路 (門まで)
  const fwdE = [P.E, [30, 2.8, 82], [30, 2.8, 52], [46, 2.8, 52], [46, 2.8, 30], [14, 2.8, 30], P.J, P.G];
  const fwdI = [P.I, [96, 2.8, -5], [96, 2.8, 18], [46, 2.8, 18], [46, 2.8, 30], [14, 2.8, 30], P.J, P.G];
  const fwdO = [P.O, [68, 2.8, 48], [46, 2.8, 48], [46, 2.8, 30], [14, 2.8, 30], P.J, P.G];
  const fwdW = [P.W, [0, 10, 27], [10, 10, 27], [10, 10, 30], P.G];

  // 共通 (門 → 記録)
  const common = [P.G, P.H, [4, 10, 41], [-14, 10, 41], [-14, 10, 14], [-44, 10, 14], [-44, 10, -46], [-80, 10, -46], [-80, 10, -50], [-80, 3, -50], [-80, 3, -54], P.S];

  // 戻り (記録 → 門の外 J' まで、共通の y+1.2 を逆向き)
  const retCommon = [P.S, [-80, 3, -54], [-80, 4.2, -50], [-80, 11.2, -50], [-80, 11.2, -46], [-44, 11.2, -46], [-44, 11.2, 14], [-14, 11.2, 14], [-14, 11.2, 41], [4, 11.2, 41], [4, 11.2, 33], [14, 11.2, 33], [14, 11.2, 30]];

  // 各現場への戻り
  const backE = [[14, 11.2, 30], [46, 11.2, 30], [46, 11.2, 52], [30, 11.2, 52], [30, 11.2, 82], [6, 11.2, 82], P.E];
  const backO = [[14, 11.2, 30], [46, 11.2, 30], [46, 11.2, 48], [68, 11.2, 48], [68, 2.8, 38]];
  const backW = [[14, 11.2, 30], [14, 11.2, 33], [10, 11.2, 33], [10, 11.2, 27], [0, 11.2, 27], P.W];
  const backD = [[14, 11.2, 30], [46, 11.2, 30], [46, 11.2, 52], [30, 11.2, 82], [30, 4, 82], [74, 4, 82], [74, 4, 86], [88, 4, 86], P.D];

  // 意味上の 4 本の巡回 (往路 + 共通 + 戻り)。gateDist = 門 G までの累積長
  function makeLoop(fwd, back) {
    const pts = fwd.concat(common.slice(1), retCommon.slice(1), back.slice(1));
    return { pts, gateDist: makePath(fwd).total, path: null };
  }
  const loops = [
    makeLoop(fwdE, backE), // E→G→S→E
    makeLoop(fwdI, backO), // I→G→S→O
    makeLoop(fwdO, backW), // O→G→S→W
    makeLoop(fwdW, backD), // W→G→S→D
  ];
  for (const lp of loops) lp.path = makePath(lp.pts);

  // 静的な青い線 (重複は座標キーで 1 回だけ)
  for (const pts of [fwdE, fwdI, fwdO, fwdW, common, retCommon, backE, backO, backW, backD]) {
    for (let i = 1; i < pts.length; i++) {
      aseg(pts[i - 1][0], pts[i - 1][1], pts[i - 1][2], pts[i][0], pts[i][1], pts[i][2]);
    }
  }

  // 門 G: x=8 の面内の矩形 4 線 + 足元 2 線
  aseg(8, 8.4, 28.4, 8, 8.4, 31.6);
  aseg(8, 11.6, 28.4, 8, 11.6, 31.6);
  aseg(8, 8.4, 28.4, 8, 11.6, 28.4);
  aseg(8, 8.4, 31.6, 8, 11.6, 31.6);
  aseg(8, 8, 28.4, 8, 8.4, 28.4);
  aseg(8, 8, 31.6, 8, 8.4, 31.6);

  // 支持: 共通と戻りの y=10 / y=11.2 の水平区間 (x<-11 または z>40) にケーブルトレー (幅 0.8 の平行 2 線, mid) と 16 以下間隔の架台
  function supports(pts) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (a[1] !== b[1] || (a[1] !== 10 && a[1] !== 11.2)) continue;
      const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
      if (!(mx < -11 || mz > 40)) continue;
      const y = a[1];
      if (a[0] !== b[0]) { // x 方向
        seg(T.mid, a[0], y, a[2] - 0.4, b[0], y, a[2] - 0.4);
        seg(T.mid, a[0], y, a[2] + 0.4, b[0], y, a[2] + 0.4);
        const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]);
        for (let x = x0; x <= x1 + 0.01; x += 16) {
          seg(T.mid, x, 0, a[2] - 0.4, x, y, a[2] - 0.4);
          seg(T.mid, x, 0, a[2] + 0.4, x, y, a[2] + 0.4);
        }
      } else { // z 方向
        seg(T.mid, a[0] - 0.4, y, a[2], a[0] - 0.4, y, b[2]);
        seg(T.mid, a[0] + 0.4, y, a[2], a[0] + 0.4, y, b[2]);
        const z0 = Math.min(a[2], b[2]), z1 = Math.max(a[2], b[2]);
        for (let z = z0; z <= z1 + 0.01; z += 16) {
          seg(T.mid, a[0] - 0.4, 0, z, a[0] - 0.4, y, z);
          seg(T.mid, a[0] + 0.4, 0, z, a[0] + 0.4, y, z);
        }
      }
    }
  }
  supports(common);
  supports(retCommon);

  // ================= assemble render objects =================
  function lineObj(arr, color, opacity) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(arr), 3));
    const mat = new THREE.LineBasicMaterial({ color, opacity, transparent: opacity < 1, depthWrite: false, fog: !ids });
    const obj = new THREE.LineSegments(geo, mat);
    if (ids) obj.visible = false;
    return obj;
  }

  const group = new THREE.Group();

  let facesMesh = null;
  if (solid && F.pos.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(F.pos), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(F.nrm), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(F.col), 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      fog: false,
    });
    facesMesh = new THREE.Mesh(geo, mat);
    group.add(facesMesh);
  }

  // B0: 重ね描き除去の分、不透明度を 1-(1-a)^2 に上げて見た目の濃さを保つ (accent は重複なし・変更なし)
  const heroLines = lineObj(T.hero, 0x1b1f24, 0.99);     // was 0.90
  const equipLines = lineObj(T.equip, 0x3a3f46, 0.8775); // was 0.65
  const midLines = lineObj(T.mid, 0x8a9099, 0.7975);     // was 0.55
  const farLines = lineObj(T.far, 0xc9cdd3, 0.75);       // was 0.50
  const accentLines = lineObj(T.accent, 0x3e6fa8, 0.9);
  group.add(heroLines, equipLines, midLines, farLines, accentLines);

  // landing lights (fixed size, 点滅なし)
  const lightPos = [];
  for (let s = 0; s < 12; s++) {
    const t = (s / 12) * Math.PI * 2;
    lightPos.push(HELI.x + Math.cos(t) * 13, HELI.y + 0.4, Math.sin(t) * 13);
  }
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(lightPos), 3));
  const lightMat = new THREE.PointsMaterial({ color: 0x5f6368, size: 0.9, sizeAttenuation: true, fog: !ids });
  const landingLights = new THREE.Points(lightGeo, lightMat);
  if (ids) landingLights.visible = false;
  group.add(landingLights);

  // flowing particles: 4 巡回 × 各 desktop 2 / mobile 1 = 同時 8 / 4、1 個の InstancedMesh
  const PER = mobile ? 1 : 2;
  const N = loops.length;
  const particles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x3e6fa8, fog: !ids }),
    PER * N
  );
  if (ids) particles.visible = false;
  group.add(particles);

  scene.add(group);

  // lights / fog / background owned by medcity
  if (ids) {
    scene.fog = null;
    scene.background = new THREE.Color(0xffffff);
  } else {
    const hemi = new THREE.HemisphereLight(0xffffff, 0xe9ecef, 1.0);
    const dir = new THREE.DirectionalLight(0xffffff, 0.35);
    dir.position.set(1, 1.6, 0.8);
    scene.add(hemi, dir);
    scene.fog = new THREE.Fog(0xffffff, mobile ? 320 : 420, 1500);
    scene.background = new THREE.Color(0xffffff);
  }

  // ================= keyframes (closed loop, spec §3) =================
  const keyframes = [
    { pos: [250, 155, 290], look: [10, 25, 25], fov: 38, hold: 1, still: true },   // 0 街区全体
    { pos: [155, 62, 190], look: [10, 8, 82], fov: 48 },                           // 1 救急の庇
    { pos: [58, 12, 124], look: [-10, 6, 94], fov: 55 },                           // 2 庇の柱と救急入口
    { pos: [26, 16, 66], look: [0, 11, 33], fov: 50 },                             // 3 病棟 2〜5 階
    { pos: [120, 55, 145], look: [4, 12, 36], fov: 44, hold: 1, still: true },     // 4 C0 階段欠き + 庇
    { pos: [98, 52, 32], look: [72, 4, 0], fov: 46 },                              // 5 画像診断を見下ろす
    { pos: [175, 125, 120], look: [66, 3, 28], fov: 44, hold: 1, still: true },    // 6 画像診断と手術
    { pos: [130, 65, 5], look: [66, 4, 34], fov: 46 },                             // 7 手術室を東から
    { pos: [-25, 138, 16], look: [-25.5, 88, -3], fov: 40 },                       // 8 塔の屋上
    { pos: [-135, 90, -125], look: [-75, 4, -60], fov: 42, hold: 1, still: true }, // 9 サーバ室
    { pos: [320, 205, 360], look: [10, 30, 15], fov: 38 },                         // 10 全体へ戻り 0 へ
  ];

  if (mobile) {
    keyframes.forEach((k, n) => {
      // key4 は注視点を [40,8,60] に置換して病棟の欠きと外来を縦画面に収める / key9・10 は key9→10 区間で西翼の屋上の縁をかすめるのを避けるため少し引く
      if (n === 4) for (let i = 0; i < 3; i++) k.look[i] = [40, 8, 60][i];
      const f = n === 0 ? 0.64 : n === 4 ? 1.0 : n === 9 ? 0.8 : n === 10 ? 0.9 : 0.72;
      for (let i = 0; i < 3; i++) k.pos[i] = k.look[i] + (k.pos[i] - k.look[i]) * f;
    });
  }

  // ================= update =================
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  const SPEED = 14; // 単位/秒

  function update(t) {
    if (ids) return;
    // particles: 各巡回を 14 単位/秒で進み、門 G (累積長 gateDist) で 0.6 秒止まる。状態を持たない (t のみで決まる)
    let idx = 0;
    for (let k = 0; k < N; k++) {
      const lp = loops[k];
      const phaseSpan = lp.path.total + DW * SPEED; // 1 周の位相長 (移動 + 停止)
      const dur = phaseSpan / SPEED;                // 1 周の秒数 = 全長/14 + 0.6
      for (let p = 0; p < PER; p++) {
        const u = ((t / dur) + p / PER) % 1;        // 2 個の粒は半周ずらす
        const phase = u * phaseSpan;
        let d;
        if (phase <= lp.gateDist) d = phase;                               // 門まで移動
        else if (phase <= lp.gateDist + DW * SPEED) d = lp.gateDist;       // 門で 0.6 秒停止
        else d = phase - DW * SPEED;                                       // 門から終点 (起点) まで移動
        lp.path.pointAt(Math.min(d, lp.path.total), tmp);
        dummy.position.copy(tmp);
        dummy.updateMatrix();
        particles.setMatrixAt(idx++, dummy.matrix);
      }
    }
    particles.instanceMatrix.needsUpdate = true;
  }

  const segments = Object.values(T).reduce((sum, a) => sum + a.length / 6, 0);

  return { update, keyframes, segments };
}

