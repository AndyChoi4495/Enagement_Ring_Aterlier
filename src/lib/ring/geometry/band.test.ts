// 숄더 스타일별 밴드 가닥, 스윕 지오메트리, 파베 배치 테스트
// Tests for band strands per shoulder style, their swept geometry, and pavé layout
import { describe, expect, it } from "vitest";
import { SHOULDERS } from "../config";
import { bandStrands, groovedStrand, paveRow, strandGeometry } from "./band";

const dims = { innerRadius: 8.25, width: 2, thickness: 1.6 };
const head = { armEndX: 2.3, armTopY: 12, spread: 1.3 };
const outer = dims.innerRadius + dims.thickness;

describe.each(SHOULDERS)("bandStrands(%s)", (shoulder) => {
  const strands = bandStrands(shoulder, dims, head);

  it("is the plain band at the bottom of the ring", () => {
    for (const s of strands.filter((s) => s.to - s.from > 6)) {
      const { width, thickness, z } = s.section(Math.PI);
      expect([width, thickness, z]).toEqual([dims.width, dims.thickness, 0]);
    }
  });

  it("never gets thinner than a wearable band or wider than the chosen width", () => {
    for (const s of strands) {
      for (let phi = s.from; phi <= s.to; phi += 0.01) {
        const { width, thickness } = s.section(phi);
        expect(width).toBeGreaterThanOrEqual(dims.width * 0.5);
        expect(width).toBeLessThanOrEqual(dims.width + 1e-9);
        expect(thickness).toBeGreaterThanOrEqual(dims.thickness * 0.9);
      }
    }
  });

  it("keeps the finger hole exact and faces outward", () => {
    for (const s of strands) {
      const { positions, indices } = strandGeometry("comfort", dims.innerRadius, s, 240, 32);
      let minR = Infinity;
      for (let i = 0; i < positions.length; i += 3) minR = Math.min(minR, Math.hypot(positions[i], positions[i + 1]));
      expect(minR).toBeCloseTo(dims.innerRadius, 5);
      if (s.to - s.from < 6) continue; // open arcs are not closed solids
      // Signed volume of a closed mesh is positive when its triangles face outward.
      let volume = 0;
      for (let i = 0; i < indices.length; i += 3) {
        const [a, b, c] = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
        volume +=
          positions[a] * (positions[b + 1] * positions[c + 2] - positions[b + 2] * positions[c + 1]) +
          positions[a + 1] * (positions[b + 2] * positions[c] - positions[b] * positions[c + 2]) +
          positions[a + 2] * (positions[b] * positions[c + 1] - positions[b + 1] * positions[c]);
      }
      expect(volume).toBeGreaterThan(0);
    }
  });
});

describe("shoulder shapes", () => {
  it("tapers toward the stone", () => {
    const [s] = bandStrands("tapered", dims, head);
    expect(s.section(0).width).toBeLessThan(dims.width * 0.7);
  });

  it("raises cathedral arms to the head and drops back under the stone", () => {
    const [s] = bandStrands("cathedral", dims, head);
    const tip = Math.atan2(head.armEndX, head.armTopY);
    expect(dims.innerRadius + s.section(tip).thickness).toBeCloseTo(Math.hypot(head.armEndX, head.armTopY), 6);
    expect(s.section(0).thickness).toBe(dims.thickness);
  });

  it("splits into two strands with a gap between them at the top", () => {
    const [a, b] = bandStrands("split", dims, head).map((s) => s.section(0));
    expect(a.z).toBe(head.spread);
    expect(b.z).toBe(-head.spread);
    expect(a.z - b.z).toBeGreaterThan(a.width);
  });

  it("weaves the twisted strands across each other", () => {
    const [a, b] = bandStrands("twist", dims, head);
    const zs = Array.from({ length: 200 }, (_, i) => a.section(i / 100).z - b.section(i / 100).z);
    expect(zs.filter((z, i) => i > 0 && Math.sign(z) !== Math.sign(zs[i - 1])).length).toBeGreaterThan(4);
  });
});

describe("paveRow", () => {
  it.each(["straight", "tapered", "cathedral"] as const)("sits on the %s band without overlapping", (shoulder) => {
    const [strand] = bandStrands(shoulder, dims, head);
    const stones = paveRow(strand, dims.innerRadius, 0.3, Math.PI / 4, 1);
    expect(stones.length).toBeGreaterThan(3);
    for (let i = 1; i < stones.length; i++) {
      const [p, q] = [stones[i - 1], stones[i]];
      expect(Math.hypot(q.x - p.x, q.y - p.y)).toBeGreaterThanOrEqual(Math.max(p.diameter, q.diameter));
      expect(q.x).toBeGreaterThan(0);
      expect(Math.hypot(q.x, q.y)).toBeGreaterThan(outer - 0.25);
    }
  });

  it("mirrors to the other shoulder", () => {
    const [strand] = bandStrands("straight", dims, head);
    const right = paveRow(strand, dims.innerRadius, 0.3, 0.5, 1);
    const left = paveRow(strand, dims.innerRadius, 0.3, 0.5, -1);
    expect(left.map((s) => [s.x, s.y, s.rotationZ])).toEqual(right.map((s) => [-s.x, s.y, -s.rotationZ]));
  });
});

describe("groovedStrand", () => {
  it("lowers the band only under the rows", () => {
    const [strand] = bandStrands("straight", dims, head);
    const rows = ([1, -1] as const).map((side) => paveRow(strand, dims.innerRadius, 0.3, 0.5, side, 0.8));
    const grooved = groovedStrand(strand, rows, 0.8, 0.5);
    const diameter = rows[0][0].diameter;
    for (const phi of [0.3, 0.5, 0.7, -0.3, -0.7]) {
      expect(grooved.section(phi).thickness).toBeCloseTo(dims.thickness - 0.5 * diameter);
    }
    // Under the head, past the ends of the rows, and at the back, the band is untouched.
    for (const phi of [0, 0.15, -0.15, 1, -1, Math.PI]) expect(grooved.section(phi)).toEqual(strand.section(phi));
  });

  it("leaves a strand without stones as it is", () => {
    const [strand] = bandStrands("tapered", dims, head);
    const grooved = groovedStrand(strand, [[], []], 0.8, 0.5);
    for (const phi of [0, 0.5, -2]) expect(grooved.section(phi)).toEqual(strand.section(phi));
  });
});
