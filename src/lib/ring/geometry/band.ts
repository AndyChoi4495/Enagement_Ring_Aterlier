// 숄더 스타일에 따라 둘레를 따라 단면이 변하는 밴드 가닥과 그 지오메트리, 파베 배치를 계산하는 순수 함수
// Pure builders for band strands whose cross-section varies around the ring by shoulder style, plus pavé layout
import { bandProfilePoints, type BandProfile } from "../bandProfile";

export type ShoulderStyle = "straight" | "tapered" | "cathedral" | "split" | "twist";

/** Local cross-section at one angle: axial width, radial thickness, and axial offset of its center. */
export interface BandSection {
  width: number;
  thickness: number;
  z: number;
}

/**
 * One swept piece of the band. Angles are measured from the top of the ring (where the stone sits),
 * positive toward +x. A strand covering −π…π is a closed ring; shorter ones are open arcs whose ends
 * are buried in another strand.
 */
export interface Strand {
  from: number;
  to: number;
  section: (phi: number) => BandSection;
}

export interface BandDims {
  innerRadius: number;
  width: number;
  thickness: number;
}

/** Where the head meets the band, in ring coordinates (x across the finger, y up, z along it). */
export interface HeadFit {
  /** Cathedral: x and y of the point on the head that the arms rise to. */
  armEndX: number;
  armTopY: number;
  /** Split shank: axial offset of each strand at the top. */
  spread: number;
}

const DEG = Math.PI / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (s: number) => s * s * (3 - 2 * s);

const TAPER_ARC = 110 * DEG;
const CATHEDRAL_ARC = 40 * DEG;
/** Angular width of the wall that drops from a cathedral arm's tip back to the band under the stone. */
const CATHEDRAL_WALL = 3.5 * DEG;
const SPLIT_ARC = 62 * DEG;
const TWIST_ARC = 125 * DEG;
const TWIST_CROSSINGS = 9;
/** Width of each strand of a split or twisted band, relative to the band width. */
const STRAND_WIDTH = 0.55;

export function bandStrands(shoulder: ShoulderStyle, { innerRadius, width, thickness }: BandDims, head: HeadFit): Strand[] {
  const full = { from: -Math.PI, to: Math.PI };
  switch (shoulder) {
    case "straight":
      return [{ ...full, section: () => ({ width, thickness, z: 0 }) }];
    case "tapered":
      // Narrows toward the stone, which makes the stone look larger.
      return [
        {
          ...full,
          section: (phi) => {
            const g = ease(clamp01(1 - Math.abs(phi) / TAPER_ARC));
            return { width: width * (1 - 0.4 * g), thickness: thickness * (1 - 0.08 * g), z: 0 };
          },
        },
      ];
    case "cathedral": {
      // Arms sweep up from the band to the head; between them, under the stone, the band stays low.
      const tipRadius = Math.hypot(head.armEndX, head.armTopY);
      const tip = Math.atan2(head.armEndX, head.armTopY);
      const rise = Math.max(0, tipRadius - innerRadius - thickness);
      return [
        {
          ...full,
          section: (phi) => {
            const u = Math.abs(phi);
            const s = clamp01(1 - (u - tip) / CATHEDRAL_ARC);
            const lift = u >= tip ? s * s : ease(clamp01((u - tip + CATHEDRAL_WALL) / CATHEDRAL_WALL));
            return { width: width * (1 - 0.3 * Math.min(1, s)), thickness: thickness + rise * lift, z: 0 };
          },
        },
      ];
    }
    case "split": {
      const strand = (sign: number) => (phi: number) => {
        const g = ease(clamp01(1 - Math.abs(phi) / SPLIT_ARC));
        return { width: width * (1 - (1 - STRAND_WIDTH) * g), thickness, z: sign * head.spread * g };
      };
      return [
        { ...full, section: strand(1) },
        { from: -SPLIT_ARC, to: SPLIT_ARC, section: strand(-1) },
      ];
    }
    case "twist": {
      // Two strands weave over and under each other; the one crossing on top is raised a little.
      const strand = (sign: number) => (phi: number) => {
        const m = ease(clamp01(1 - Math.abs(phi) / TWIST_ARC));
        const a = TWIST_CROSSINGS * phi;
        return {
          width: width * (1 - (1 - STRAND_WIDTH) * m),
          thickness: thickness * (1 + 0.22 * m * (0.5 + 0.5 * sign * Math.cos(a))),
          z: sign * 0.27 * width * m * Math.sin(a),
        };
      };
      return [
        { ...full, section: strand(1) },
        { from: -TWIST_ARC, to: TWIST_ARC, section: strand(-1) },
      ];
    }
  }
}

/**
 * Sweeps the band profile along a strand. Positions are in ring coordinates (ring axis = z, top = +y).
 * A full-circle strand shares its seam vertices so shading stays smooth across it.
 */
export function strandGeometry(
  profile: BandProfile,
  innerRadius: number,
  strand: Strand,
  segments = 480,
  samples = 64,
): { positions: Float32Array; indices: Uint32Array } {
  const closed = strand.to - strand.from >= 2 * Math.PI - 1e-9;
  const span = strand.to - strand.from;
  const rings = closed ? segments : Math.round((segments * span) / (2 * Math.PI)) + 1;
  const steps = closed ? rings : rings - 1;
  const positions = new Float32Array(rings * samples * 3);
  for (let i = 0; i < rings; i++) {
    const phi = strand.from + (span * i) / steps;
    const { width, thickness, z } = strand.section(phi);
    const sin = Math.sin(phi);
    const cos = Math.cos(phi);
    const points = bandProfilePoints(profile, { innerRadius, width, thickness }, samples);
    for (let k = 0; k < samples; k++) {
      const [r, a] = points[k];
      positions.set([r * sin, r * cos, a + z], (i * samples + k) * 3);
    }
  }
  const indices = new Uint32Array(steps * samples * 6);
  let o = 0;
  for (let i = 0; i < steps; i++) {
    const i1 = (i + 1) % rings;
    for (let k = 0; k < samples; k++) {
      const k1 = (k + 1) % samples;
      const [a, b, c, d] = [i * samples + k, i * samples + k1, i1 * samples + k, i1 * samples + k1];
      indices.set([a, b, c, b, d, c], o);
      o += 6;
    }
  }
  return { positions, indices };
}

/** One pavé stone: the point on the band's top surface under it, its diameter, and the rotation about z that points it outward. */
export interface PaveStone {
  x: number;
  y: number;
  z: number;
  diameter: number;
  rotationZ: number;
}

/**
 * One row of pavé along a strand's top surface, from `start` over `sweep` radians, on the side given
 * by `side` (±1). Stones follow the strand's rise and offset, and shrink where it narrows.
 * `fill` is the stone diameter relative to the local band width; `pitch` the center spacing in diameters.
 */
export function paveRow(
  strand: Strand,
  innerRadius: number,
  start: number,
  sweep: number,
  side: 1 | -1,
  fill = 0.6,
  pitch = 1.1,
): PaveStone[] {
  const at = (u: number) => {
    const s = strand.section(side * u);
    const r = innerRadius + s.thickness;
    return { x: side * r * Math.sin(u), y: r * Math.cos(u), z: s.z, width: s.width };
  };
  const stones: PaveStone[] = [];
  const e = 1e-3;
  for (let u = start; u <= start + sweep; ) {
    const p = at(u);
    const q = at(u + e);
    const tx = (q.x - p.x) / e;
    const ty = (q.y - p.y) / e;
    const speed = Math.hypot(tx, ty); // mm of surface per radian
    const diameter = Math.min(1.5, fill * p.width);
    // Outward normal of the surface curve.
    const nx = (-side * ty) / speed;
    const ny = (side * tx) / speed;
    stones.push({ x: p.x, y: p.y, z: p.z, diameter, rotationZ: -Math.atan2(nx, ny) });
    u += (diameter * pitch) / speed;
  }
  return stones;
}
