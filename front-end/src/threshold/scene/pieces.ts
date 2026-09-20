import { Color, Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { mulberry32, range } from './random';

/**
 * The data center is generated procedurally as ~1,000 small pieces (racks, server faces, tiles,
 * trays, pipes, cabinets, walls). The same pieces double as the disintegration fragments: each one
 * has a home transform plus seeded scatter parameters generated ONCE. See DataCenter.tsx.
 */

export type Kind = 0 | 1 | 2; // 0 = box, 1 = cylinder, 2 = indicator light

export interface Piece {
  kind: Kind;
  index: number; // index inside its InstancedMesh
  home: Vector3;
  homeQ: Quaternion;
  scale: Vector3;
  homeMatrix: Matrix4;
  color: Color;
  // scatter (seeded, generated once)
  target: Vector3;
  swirl: number;
  spinAxis: Vector3;
  spinAmt: number;
  curl: number;
  fragColor: Color;
  bigness: number;
  oOut: number;
  oBack: number;
  ledPhase: number;
}

const STEEL = ['#1E2427', '#2B3337', '#39434A', '#14191C', '#4A555B', '#252D31'];

interface RawPiece {
  kind: Kind;
  home: Vector3;
  scale: Vector3;
  color: Color;
  rot: [number, number, number];
}

export interface DataCenterModel {
  pieces: Piece[];
  counts: [number, number, number];
}

export function buildDataCenter(seed = 7): DataCenterModel {
  const rand = mulberry32(seed);
  const raw: RawPiece[] = [];

  const add = (
    kind: Kind,
    x: number, y: number, z: number,
    sx: number, sy: number, sz: number,
    color: string,
    rot: [number, number, number] = [0, 0, 0],
  ) => {
    raw.push({ kind, home: new Vector3(x, y, z), scale: new Vector3(sx, sy, sz), color: new Color(color), rot });
  };
  const box = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string, rot?: [number, number, number]) =>
    add(0, x, y, z, sx, sy, sz, c, rot);
  // cylinder: diameter d, length len (axis = Y before rotation)
  const cyl = (x: number, y: number, z: number, d: number, len: number, c: string, rot?: [number, number, number]) =>
    add(1, x, y, z, d, len, d, c, rot);
  const led = (x: number, y: number, z: number, s: number) => add(2, x, y, z, s, s, s, '#ffffff');

  const FLOOR = 0.35; // top of raised floor

  /* ---- raised floor: underfloor slabs + tiles + ventilation grilles ---- */
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++)
      box(-4.2 + i * 2.8, 0.115, -2.65 + j * 2.65, 2.76, 0.23, 2.6, '#AEB9B5');
  const grilles = new Set<string>();
  for (const [gi, gj] of [[3, 3], [3, 6], [6, 3], [6, 6], [10, 3], [10, 6], [3, 8], [10, 8], [7, 1], [7, 8], [12, 5], [1, 5], [5, 4], [8, 5]])
    grilles.add(`${gi},${gj}`);
  for (let i = 0; i < 14; i++) {
    for (let j = 0; j < 10; j++) {
      const x = -5.2 + i * 0.8, z = -3.6 + j * 0.8;
      if (grilles.has(`${i},${j}`)) {
        box(x, FLOOR - 0.06, z, 0.77, 0.12, 0.77, '#B9C3BF');
        for (let s = -1; s <= 1; s++) box(x, FLOOR - 0.005, z + s * 0.22, 0.6, 0.02, 0.09, '#78847F');
      } else {
        box(x, FLOOR - 0.06, z, 0.77, 0.12, 0.77, (i + j) % 2 ? '#E9EDEA' : '#DFE5E1');
      }
    }
  }

  /* ---- server racks: three dense rows ---- */
  const rows: [number, number][] = [[-2.4, 1], [0, -1], [2.4, -1]]; // z, facing direction
  for (const [rz, face] of rows) {
    for (let i = 0; i < 9; i++) {
      const rx = (i - 4) * 0.72;
      box(rx, FLOOR + 1.05, rz, 0.62, 2.1, 1.0, '#2E3944');
      box(rx, FLOOR + 2.12, rz, 0.64, 0.05, 1.02, '#1F2830');
      for (let k = 0; k < 8; k++) {
        const uy = FLOOR + 0.24 + k * 0.245;
        const bay = (k + i) % 3 === 0;
        box(rx, uy, rz + face * 0.515, 0.54, 0.19, 0.04, bay ? '#98A7B1' : k % 2 ? '#5C6A76' : '#73828E');
        if ((k + i) % 3 !== 2) {
          led(rx + 0.19, uy, rz + face * 0.545, 0.035);
          if ((k * 3 + i) % 2 === 0) led(rx + 0.25, uy, rz + face * 0.545, 0.035);
        }
      }
    }
  }

  /* ---- cooling cabinets (east) + power cabinets (west) ---- */
  for (let c = 0; c < 3; c++) {
    const cz = -2.6 + c * 1.35;
    box(4.95, FLOOR + 1.15, cz, 0.95, 2.3, 1.15, '#F1F4F2');
    box(4.95, FLOOR + 2.32, cz, 0.97, 0.05, 1.17, '#C8D2CE');
    for (const fy of [0.75, 1.65]) cyl(4.44, FLOOR + fy, cz, 0.62, 0.05, '#56616B', [0, 0, Math.PI / 2]);
    for (let l = 0; l < 3; l++) box(4.45, FLOOR + 1.15 + (l - 1) * 0.13, cz, 0.03, 0.05, 0.9, '#B7C3BE');
  }
  for (let c = 0; c < 4; c++) {
    const cz = -3.0 + c * 1.05;
    box(-4.95, FLOOR + 1.1, cz, 0.9, 2.2, 0.95, '#2F4A38');
    box(-4.49, FLOOR + 1.1, cz, 0.03, 2.0, 0.02, '#7FA58B');
    box(-4.49, FLOOR + 1.65, cz + 0.2, 0.03, 0.02, 0.4, '#1B2B21');
    led(-4.47, FLOOR + 1.9, cz - 0.25, 0.045);
    led(-4.47, FLOOR + 1.9, cz - 0.15, 0.045);
    if (c % 2 === 0) led(-4.47, FLOOR + 1.9, cz - 0.05, 0.045);
  }

  /* ---- overhead cable trays (blue), rungs, cooling pipes, posts ---- */
  for (const tz of [-2.4, 0, 2.4]) {
    for (let s = 0; s < 5; s++) {
      const tx = -2.88 + s * 1.44;
      box(tx, 2.95, tz, 1.4, 0.05, 0.56, '#4C86C6');
      box(tx, 3.02, tz - 0.27, 1.4, 0.1, 0.03, '#3E74B0');
      box(tx, 3.02, tz + 0.27, 1.4, 0.1, 0.03, '#3E74B0');
    }
    for (let r = 0; r < 9; r++) box(-3.2 + r * 0.8, 2.985, tz, 0.05, 0.03, 0.54, '#7FAEDD');
  }
  for (const pz of [-1.2, 1.2]) {
    for (let s = 0; s < 6; s++) {
      const px = -3.55 + s * 1.5;
      cyl(px, 3.42, pz, 0.14, 1.42, '#A9CDE6', [0, 0, Math.PI / 2]);
      cyl(px + 0.72, 3.42, pz, 0.19, 0.08, '#F2F5F4', [0, 0, Math.PI / 2]);
    }
    for (const hx of [-3.2, 0, 3.2]) box(hx, 3.2, pz, 0.03, 0.4, 0.03, '#98A39E');
  }
  cyl(4.45, FLOOR + 1.9, -1.9, 0.14, 1.3, '#A9CDE6', [0, 0, 0]);
  cyl(4.45, 3.42, -1.2, 0.14, 1.0, '#A9CDE6', [Math.PI / 2, 0, 0]);
  for (const px of [-3.85, 3.85]) {
    for (const pz of [-3.6, -1.2, 1.2, 3.6]) box(px, FLOOR + 1.6, pz, 0.08, 3.2, 0.08, '#98A39E');
    box(px, 2.86, 0, 0.1, 0.06, 7.4, '#98A39E');
  }

  /* ---- partial perimeter walls (roofless cutaway) ---- */
  const backH = [2.8, 2.8, 2.8, 1.2, 2.8, 2.8, 2.8, 2.8];
  backH.forEach((h, i) => {
    const x = -4.9 + i * 1.4;
    box(x, FLOOR + h / 2, -3.92, 1.36, h, 0.14, '#ECEFEA');
    box(x, FLOOR + 0.13, -3.92, 1.38, 0.26, 0.16, '#C5CDC8');
  });
  const leftH = [2.8, 2.8, 0.9, 2.8, 2.8, 1.4];
  leftH.forEach((h, i) => {
    const z = -3.4 + i * 1.36;
    box(-5.72, FLOOR + h / 2, z, 0.14, h, 1.32, '#ECEFEA');
    box(-5.72, FLOOR + 0.13, z, 0.16, 0.26, 1.34, '#C5CDC8');
  });
  for (const z of [-3.4, 3.4]) {
    box(5.72, FLOOR + 0.5, z, 0.14, 1.0, 1.3, '#ECEFEA');
    box(5.72, FLOOR + 0.13, z, 0.16, 0.26, 1.32, '#C5CDC8');
  }
  for (const x of [-4.9, 4.9]) {
    box(x, FLOOR + 0.5, 3.92, 1.3, 1.0, 0.14, '#ECEFEA');
    box(x, FLOOR + 0.13, 3.92, 1.32, 0.26, 0.16, '#C5CDC8');
  }

  /* ---- seeded scatter parameters (generated once) ---- */
  let minY = Infinity, maxY = -Infinity;
  raw.forEach((r) => { minY = Math.min(minY, r.home.y); maxY = Math.max(maxY, r.home.y); });
  const counts: [number, number, number] = [0, 0, 0];
  const pieces: Piece[] = raw.map((r) => {
    const homeQ = new Quaternion().setFromEuler(new Euler(r.rot[0], r.rot[1], r.rot[2]));
    const homeMatrix = new Matrix4().compose(r.home, homeQ, r.scale);
    // scatter onto the same tilted elliptical orbit the particle cloud uses
    const ang = rand() * Math.PI * 2;
    const rr = range(rand, 0.8, 1.2);
    const ring = new Vector3(Math.cos(ang) * 9.5 * rr, range(rand, -1, 1), Math.sin(ang) * 6.8 * rr)
      .applyEuler(new Euler(0.5, 0, -0.28, 'ZXY'));
    const yn = (r.home.y - minY) / (maxY - minY);
    return {
      kind: r.kind,
      home: r.home,
      scale: r.scale,
      color: r.color,
      index: counts[r.kind]++,
      homeQ,
      homeMatrix,
      target: new Vector3(ring.x, ring.y + 3, ring.z),
      swirl: range(rand, 1.4, 3.6),
      spinAxis: new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      spinAmt: range(rand, 2, 8),
      curl: range(rand, -2.2, 2.2),
      fragColor: new Color(STEEL[Math.floor(rand() * STEEL.length)]),
      bigness: Math.min(1, Math.max(r.scale.x, r.scale.z) / 0.8),
      // peel from the top down; rebuild from the floor up
      oOut: Math.min(1, Math.max(0, (1 - yn) * 0.75 + rand() * 0.25)),
      oBack: Math.min(1, Math.max(0, yn * 0.7 + rand() * 0.3)),
      ledPhase: rand(),
    };
  });

  return { pieces, counts };
}
