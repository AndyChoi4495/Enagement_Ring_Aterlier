// 컷별 패싯 보석 지오메트리(삼각형 정점 배열)를 계산하는 순수 함수
// Pure builder for faceted gem geometry per cut (flat triangle vertex array)
import type { StoneCut } from "../sizing";

/** Unit girdle outline: t ∈ [0, 1) → [x, z] with x, z ∈ [-1, 1], counter-clockwise from +x. */
type Outline = (t: number) => [x: number, z: number];

/** Equal t-span per edge, so a sample count that is a multiple of the edge count hits every corner. */
function polygon(vertices: [number, number][]): Outline {
  return (t) => {
    const f = (((t % 1) + 1) % 1) * vertices.length;
    const i = Math.floor(f);
    const [x0, z0] = vertices[i];
    const [x1, z1] = vertices[(i + 1) % vertices.length];
    const k = f - i;
    return [x0 + (x1 - x0) * k, z0 + (z1 - z0) * k];
  };
}

function superellipse(n: number): Outline {
  const p = (v: number) => Math.sign(v) * Math.abs(v) ** (2 / n);
  return (t) => [p(Math.cos(2 * Math.PI * t)), p(Math.sin(2 * Math.PI * t))];
}

// Teardrop with its point at +z; x is normalized so the widest point is exactly 1.
const pearRaw: Outline = (t) => {
  const th = 2 * Math.PI * t;
  return [-Math.sin(th) * ((1 - Math.cos(th)) / 2) ** 0.6, Math.cos(th)];
};
const PEAR_MAX_X = Math.max(...Array.from({ length: 2000 }, (_, i) => Math.abs(pearRaw(i / 2000)[0])));
const pear: Outline = (t) => {
  const [x, z] = pearRaw(t);
  return [x / PEAR_MAX_X, z];
};

const E = 0.3; // emerald-cut corner chamfer
const OUTLINES: Record<StoneCut, Outline> = {
  round: superellipse(2),
  oval: superellipse(2),
  cushion: superellipse(2.6),
  princess: polygon([[1, -1], [1, 1], [-1, 1], [-1, -1]]),
  emerald: polygon([
    [1, -1 + E], [1, 1 - E], [1 - E, 1], [-1 + E, 1],
    [-1, 1 - E], [-1, -1 + E], [-1 + E, -1], [1 - E, -1],
  ]),
  pear,
};

/** One horizontal ring of facet vertices: outline scaled by `scale` at height `y` (fractions, see below). */
interface Ring {
  scale: number;
  /** Height as a fraction of the crown (> 0) or pavilion (< 0) depth; 0 = girdle. */
  y: number;
  /** Shift samples by half a step, which turns quads into brilliant-style triangle facets. */
  twist: boolean;
}

interface CutSpec {
  samples: number;
  /** Proportions as fractions of the stone's width. */
  crown: number;
  pavilion: number;
  girdle: number;
  crownRings: Ring[]; // table first, down to just above the girdle
  pavilionRings: Ring[]; // just below the girdle, down to just above the culet
}

const BRILLIANT = (table: number, crown: number, pavilion: number, samples: number): CutSpec => ({
  samples,
  crown,
  pavilion,
  girdle: 0.025,
  crownRings: [
    { scale: table, y: 1, twist: false },
    { scale: (1 + table) / 2 + 0.02, y: 0.5, twist: true },
  ],
  pavilionRings: [{ scale: 0.5, y: -0.45, twist: true }],
});

const STEP: CutSpec = {
  samples: 16,
  crown: 0.11,
  pavilion: 0.48,
  girdle: 0.025,
  crownRings: [
    { scale: 0.66, y: 1, twist: false },
    { scale: 0.8, y: 0.62, twist: false },
    { scale: 0.91, y: 0.3, twist: false },
  ],
  pavilionRings: [
    { scale: 0.76, y: -0.35, twist: false },
    { scale: 0.5, y: -0.65, twist: false },
    { scale: 0.24, y: -0.88, twist: false },
  ],
};

const CUTS: Record<StoneCut, CutSpec> = {
  round: BRILLIANT(0.57, 0.162, 0.431, 32),
  oval: BRILLIANT(0.57, 0.15, 0.43, 32),
  cushion: BRILLIANT(0.6, 0.15, 0.45, 32),
  pear: BRILLIANT(0.55, 0.15, 0.43, 32),
  princess: BRILLIANT(0.68, 0.1, 0.6, 16),
  emerald: STEP,
};

export interface GemGeometry {
  /** Non-indexed triangles (x, y, z per vertex), wound counter-clockwise from outside. */
  positions: Float32Array;
  length: number;
  width: number;
  /** Heights in mm; y = 0 is the middle of the girdle. */
  crownHeight: number;
  girdleHeight: number;
  pavilionDepth: number;
}

type V3 = [number, number, number];

/** Gem lying table-up (+y), length along z. */
export function buildGem(cut: StoneCut, length: number, width: number): GemGeometry {
  const spec = CUTS[cut];
  const outline = OUTLINES[cut];
  const n = spec.samples;
  const crownHeight = spec.crown * width;
  const pavilionDepth = spec.pavilion * width;
  const girdleHeight = spec.girdle * width;
  const g = girdleHeight / 2;

  const ringYs = (r: Ring) => (r.y > 0 ? g + r.y * crownHeight : r.y < 0 ? -g + r.y * pavilionDepth : 0);
  const rings: { pts: V3[]; twist: boolean }[] = [
    ...spec.crownRings.map((r) => ({ ...r, y: ringYs(r) })),
    { scale: 1, y: g, twist: false },
    { scale: 1, y: -g, twist: false },
    ...spec.pavilionRings.map((r) => ({ ...r, y: ringYs(r) })),
  ].map(({ scale, y, twist }) => ({
    twist,
    pts: Array.from({ length: n }, (_, i): V3 => {
      const [ox, oz] = outline((i + (twist ? 0.5 : 0)) / n);
      return [(ox * scale * width) / 2, y, (oz * scale * length) / 2];
    }),
  }));

  const out: number[] = [];
  const tri = (a: V3, b: V3, c: V3) => out.push(...a, ...b, ...c);

  // Table: fan from its center.
  const top = rings[0].pts;
  const tableCenter: V3 = [0, top[0][1], 0];
  for (let i = 0; i < n; i++) tri(tableCenter, top[(i + 1) % n], top[i]);

  // Bands between consecutive rings. Every shared edge runs in opposite directions in its two
  // triangles, so the whole surface has one consistent winding.
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r];
    const B = rings[r + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [a0, a1, b0, b1] = [A.pts[i], A.pts[j], B.pts[i], B.pts[j]];
      if (B.twist && !A.twist) {
        // b0 sits between a0 and a1.
        tri(a0, a1, b0);
        tri(a1, b1, b0);
      } else {
        // Aligned rings, or a0 sits between b0 and b1: the same split works for both.
        tri(a0, b1, b0);
        tri(a0, a1, b1);
      }
    }
  }

  // Pavilion: fan down to the culet point.
  const bottom = rings.at(-1)!.pts;
  const culet: V3 = [0, -g - pavilionDepth, 0];
  for (let i = 0; i < n; i++) tri(culet, bottom[i], bottom[(i + 1) % n]);

  return { positions: new Float32Array(out), length, width, crownHeight, girdleHeight, pavilionDepth };
}
