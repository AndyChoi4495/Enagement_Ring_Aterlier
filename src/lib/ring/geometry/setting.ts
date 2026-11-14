// 세팅(프롱, 베젤, 헤일로, 파베)의 배치와 스윕 지오메트리를 계산하는 순수 함수
// Pure layout and sweep geometry for the setting (prongs, bezel, halo, pavé)
import type { StoneCut } from "../sizing";
import { girdlePoint } from "./gem";

export type Vec2 = [number, number];

/** A point on (or offset from) the girdle outline with its outward unit normal, in the x–z plane. */
export interface OutlineSample {
  p: Vec2;
  n: Vec2;
}

function sampleAt(cut: StoneCut, length: number, width: number, t: number): OutlineSample {
  const e = 1e-4;
  const [x0, z0] = girdlePoint(cut, length, width, t - e);
  const [x1, z1] = girdlePoint(cut, length, width, t + e);
  // Outline runs counter-clockwise from +x toward +z, so (dz, −dx) points outward.
  const nx = z1 - z0;
  const nz = -(x1 - x0);
  const len = Math.hypot(nx, nz);
  return { p: girdlePoint(cut, length, width, t), n: [nx / len, nz / len] };
}

export function outlineLoop(cut: StoneCut, length: number, width: number, samples = 128): OutlineSample[] {
  return Array.from({ length: samples }, (_, i) => sampleAt(cut, length, width, i / samples));
}

// Outline positions (t) of the prongs: on the diagonals for rounded cuts, the corners for square
// and step cuts, and one prong guarding the pear's point.
const PRONG_T: Record<StoneCut, Record<4 | 6, number[]>> = {
  round: { 4: [1, 3, 5, 7].map((k) => k / 8), 6: [1, 3, 5, 7, 9, 11].map((k) => k / 12) },
  oval: { 4: [1, 3, 5, 7].map((k) => k / 8), 6: [1, 3, 5, 7, 9, 11].map((k) => k / 12) },
  cushion: { 4: [1, 3, 5, 7].map((k) => k / 8), 6: [1, 3, 5, 7, 9, 11].map((k) => k / 12) },
  princess: { 4: [0, 0.25, 0.5, 0.75], 6: [0, 0.125, 0.25, 0.5, 0.625, 0.75] },
  emerald: { 4: [1.5, 3.5, 5.5, 7.5].map((k) => k / 8), 6: [0.5, 1.5, 3.5, 4.5, 5.5, 7.5].map((k) => k / 8) },
  pear: { 4: [0, 0.3, 0.5, 0.7], 6: [0, 0.2, 0.37, 0.5, 0.63, 0.8] },
};

export function prongSamples(cut: StoneCut, count: 4 | 6, length: number, width: number): OutlineSample[] {
  return PRONG_T[cut][count].map((t) => sampleAt(cut, length, width, t));
}

/**
 * Melee centers on the outline offset by gap + d/2, evenly spaced by arc length. Where the offset
 * curve bends tightly (the pear's point) chords get shorter than arcs, so the count drops until
 * no two neighbors touch.
 */
export function haloLayout(cut: StoneCut, length: number, width: number, meleeDiameter: number, gap: number): Vec2[] {
  return meleeRing(cut, length, width, meleeDiameter, gap).map((s) => s.p);
}

/**
 * Melee centers evenly spaced around the outline, with the outward normal at each one.
 * `gap` is the clearance between the outline and the melee edge; −diameter/2 puts the
 * centers on the outline itself (hidden halo).
 */
export function meleeRing(
  cut: StoneCut,
  length: number,
  width: number,
  meleeDiameter: number,
  gap: number,
): OutlineSample[] {
  const offset = gap + meleeDiameter / 2;
  const samples = outlineLoop(cut, length, width, 1024);
  const loop = samples.map(({ p, n }): Vec2 => [p[0] + n[0] * offset, p[1] + n[1] * offset]);
  const cumulative = [0];
  for (let i = 1; i <= loop.length; i++) {
    const [ax, az] = loop[i - 1];
    const [bx, bz] = loop[i % loop.length];
    cumulative.push(cumulative[i - 1] + Math.hypot(bx - ax, bz - az));
  }
  const perimeter = cumulative[loop.length];

  const place = (count: number): OutlineSample[] => {
    const step = perimeter / count;
    const centers: OutlineSample[] = [];
    let seg = 0;
    for (let k = 0; k < count; k++) {
      const target = k * step;
      while (cumulative[seg + 1] < target) seg++;
      const f = (target - cumulative[seg]) / (cumulative[seg + 1] - cumulative[seg]);
      const [ax, az] = loop[seg];
      const [bx, bz] = loop[(seg + 1) % loop.length];
      centers.push({ p: [ax + (bx - ax) * f, az + (bz - az) * f], n: samples[seg % samples.length].n });
    }
    return centers;
  };
  const touching = (c: OutlineSample[]) =>
    c.some(({ p: [x, z] }, i) => {
      const [nx, nz] = c[(i + 1) % c.length].p;
      return Math.hypot(nx - x, nz - z) < meleeDiameter;
    });

  let count = Math.floor(perimeter / (meleeDiameter * 1.12));
  let centers = place(count);
  while (touching(centers) && count > 3) centers = place(--count);
  return centers;
}

/**
 * Cross-section point: [offset along the outward normal, y, scale of the outline (default 1)].
 * Use scale, not a negative offset, to pull a ring far inward: at polygon corners the normal is
 * a diagonal average, so large inward offsets leave the corners sticking out as spikes.
 */
export type SweepPoint = [offset: number, y: number, scale?: number];

/**
 * Sweeps a closed cross-section around an outline loop. Every profile edge gets its own vertex
 * rings, so edges between profile faces stay sharp while the surface stays smooth along the outline.
 */
export function sweepGeometry(loop: OutlineSample[], profile: SweepPoint[]): { positions: Float32Array; indices: Uint32Array } {
  const n = loop.length;
  const positions: number[] = [];
  const indices: number[] = [];
  const ring = ([offset, y, scale = 1]: SweepPoint) => {
    for (const { p, n: nn } of loop) positions.push(p[0] * scale + nn[0] * offset, y, p[1] * scale + nn[1] * offset);
  };
  for (let e = 0; e < profile.length; e++) {
    const base = positions.length / 3;
    ring(profile[e]);
    ring(profile[(e + 1) % profile.length]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [a0, a1, b0, b1] = [base + i, base + j, base + n + i, base + n + j];
      indices.push(a0, b0, a1, a1, b0, b1);
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}
