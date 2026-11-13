// 보석 지오메트리 치수와 면 방향 테스트
// Tests for gem geometry dimensions and face orientation
import { describe, expect, it } from "vitest";
import type { StoneCut } from "../sizing";
import { stoneSizeMm } from "../sizing";
import { buildGem } from "./gem";

const cuts: StoneCut[] = ["round", "princess", "oval", "cushion", "emerald", "pear"];

function triangles(positions: Float32Array) {
  const tris: [number, number, number][][] = [];
  for (let i = 0; i < positions.length; i += 9) {
    tris.push([0, 3, 6].map((o) => [positions[i + o], positions[i + o + 1], positions[i + o + 2]]) as [number, number, number][]);
  }
  return tris;
}

const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Divergence theorem: positive when faces wind counter-clockwise seen from outside.
function signedVolume(positions: Float32Array): number {
  return triangles(positions).reduce((v, [a, b, c]) => v + dot(a, cross(b, c)) / 6, 0);
}

describe.each(cuts)("buildGem(%s)", (cut) => {
  const { length, width } = stoneSizeMm(cut, 1);
  const gem = buildGem(cut, length, width);
  const { positions } = gem;
  const axis = (k: number) => Array.from(positions.filter((_, i) => i % 3 === k));

  it("matches the requested face-up size", () => {
    const xs = axis(0);
    const zs = axis(2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(width, 1);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(length, 1);
  });

  it("puts the table and culet at the reported heights", () => {
    const ys = axis(1);
    expect(Math.max(...ys)).toBeCloseTo(gem.girdleHeight / 2 + gem.crownHeight, 5);
    expect(Math.min(...ys)).toBeCloseTo(-gem.girdleHeight / 2 - gem.pavilionDepth, 5);
  });

  it("is made of finite triangles that all face outward", () => {
    expect(positions.length % 9).toBe(0);
    expect(positions.every(Number.isFinite)).toBe(true);
    expect(signedVolume(positions)).toBeGreaterThan(0);
    const center = [0, (Math.max(...axis(1)) + Math.min(...axis(1))) / 2, 0];
    for (const [a, b, c] of triangles(positions)) {
      const normal = cross(sub(b, a), sub(c, a));
      const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      expect(dot(normal, sub(centroid, center))).toBeGreaterThan(0);
    }
  });
});

describe("round brilliant proportions", () => {
  it("weighs about 1 ct as a diamond at the 1 ct size", () => {
    const { length, width } = stoneSizeMm("round", 1);
    const volumeMm3 = signedVolume(buildGem("round", length, width).positions);
    const carats = (volumeMm3 / 1000) * 3.52 * 5; // mm³ → cm³ → g → ct
    expect(carats).toBeGreaterThan(0.85);
    expect(carats).toBeLessThan(1.15);
  });
});
