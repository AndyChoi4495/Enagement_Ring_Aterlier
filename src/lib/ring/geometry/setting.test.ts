// 세팅 배치(프롱, 헤일로, 파베)와 스윕 지오메트리 테스트
// Tests for setting layout (prongs, halo, pavé) and sweep geometry
import { describe, expect, it } from "vitest";
import { stoneSizeMm, type StoneCut } from "../sizing";
import { girdlePoint } from "./gem";
import { haloLayout, meleeRing, outlineLoop, paveAngles, prongSamples, sweepGeometry, type SweepPoint, type Vec2 } from "./setting";

const cuts: StoneCut[] = ["round", "princess", "oval", "cushion", "emerald", "pear"];
const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe.each(cuts)("%s setting layout", (cut) => {
  const { length, width } = stoneSizeMm(cut, 1);

  it("places 4 or 6 distinct prongs on the girdle with outward normals", () => {
    for (const count of [4, 6] as const) {
      const prongs = prongSamples(cut, count, length, width);
      expect(prongs).toHaveLength(count);
      for (const { p, n } of prongs) {
        expect(Math.hypot(...n)).toBeCloseTo(1, 6);
        expect(p[0] * n[0] + p[1] * n[1]).toBeGreaterThan(0); // outward from the stone center
      }
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) expect(dist(prongs[i].p, prongs[j].p)).toBeGreaterThan(1);
      }
    }
  });

  it("lays out halo melee that touch neither each other nor the center stone", () => {
    const d = 1.2;
    const gap = 0.3;
    const centers = haloLayout(cut, length, width, d, gap);
    expect(centers.length).toBeGreaterThan(10);
    for (let i = 0; i < centers.length; i++) {
      expect(dist(centers[i], centers[(i + 1) % centers.length])).toBeGreaterThanOrEqual(d);
    }
    const girdle = Array.from({ length: 512 }, (_, i) => girdlePoint(cut, length, width, i / 512));
    for (const c of centers) {
      const nearest = Math.min(...girdle.map((g) => dist(c, g)));
      expect(nearest).toBeGreaterThan(d / 2 + gap * 0.9);
    }
  });
});

describe("paveAngles", () => {
  it("spaces stones at least one diameter apart along the band", () => {
    const radius = 10;
    const d = 1.3;
    const angles = paveAngles(radius, d, 0.4, 0.8);
    expect(angles[0]).toBe(0.4);
    expect(angles.at(-1)!).toBeLessThanOrEqual(1.2 + 1e-9);
    for (let i = 1; i < angles.length; i++) {
      const chord = 2 * radius * Math.sin((angles[i] - angles[i - 1]) / 2);
      expect(chord).toBeGreaterThanOrEqual(d);
    }
  });
});

describe("sweepGeometry", () => {
  const { length, width } = stoneSizeMm("oval", 1);
  // A tapered collar like the bezel: counter-clockwise in the (offset, y) plane, scaled bottom.
  const profile: SweepPoint[] = [[0, -3, 0.4], [0, -3, 0.75], [0.6, 0.3], [-0.1, 0.3]];
  const { positions, indices } = sweepGeometry(outlineLoop("oval", length, width, 64), profile);

  it("produces valid indices and finite positions", () => {
    expect(indices.length % 3).toBe(0);
    expect(Math.max(...indices)).toBeLessThan(positions.length / 3);
    expect(positions.every(Number.isFinite)).toBe(true);
  });

  it("winds faces outward (positive signed volume)", () => {
    let volume = 0;
    const v = (i: number) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = [v(indices[i]), v(indices[i + 1]), v(indices[i + 2])];
      volume += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
    expect(volume).toBeGreaterThan(0);
  });

  it("places a hidden-halo ring on the outline, facing outward, without overlap", () => {
    for (const cut of ["round", "princess", "oval", "cushion", "emerald", "pear"] as const) {
      const d = 0.9;
      const ring = meleeRing(cut, 6, cut === "round" || cut === "princess" ? 6 : 4.4, d, -d / 2);
      expect(ring.length, cut).toBeGreaterThan(8);
      ring.forEach(({ p, n }, i) => {
        expect(Math.hypot(n[0], n[1])).toBeCloseTo(1, 5);
        expect(p[0] * n[0] + p[1] * n[1], cut).toBeGreaterThan(0); // normal points away from the center
        const next = ring[(i + 1) % ring.length].p;
        expect(Math.hypot(next[0] - p[0], next[1] - p[1]), cut).toBeGreaterThanOrEqual(d);
      });
    }
  });
});
