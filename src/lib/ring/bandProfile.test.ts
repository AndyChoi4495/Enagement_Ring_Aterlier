// 밴드 단면 프로파일 치수 테스트
// Tests for band cross-section profile dimensions
import { describe, expect, it } from "vitest";
import { bandProfilePoints, type BandProfile, type ProfilePoint } from "./bandProfile";

const dims = { innerRadius: 8.5, width: 2.5, thickness: 1.7 };
const profiles: BandProfile[] = ["comfort", "flat", "knife"];

// Shoelace formula; positive means counter-clockwise.
function signedArea(points: ProfilePoint[]): number {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

describe.each(profiles)("bandProfilePoints(%s)", (profile) => {
  const points = bandProfilePoints(profile, dims);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  it("keeps the inner radius, thickness, and width exact", () => {
    expect(Math.min(...xs)).toBeCloseTo(dims.innerRadius, 6);
    expect(Math.max(...xs)).toBeCloseTo(dims.innerRadius + dims.thickness, 6);
    expect(Math.min(...ys)).toBeCloseTo(-dims.width / 2, 6);
    expect(Math.max(...ys)).toBeCloseTo(dims.width / 2, 6);
  });

  it("is a closed, finite, counter-clockwise loop", () => {
    expect(points.at(-1)).toEqual(points[0]);
    expect(points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(signedArea(points)).toBeGreaterThan(0);
  });
});

describe("profile shapes", () => {
  const area = (p: BandProfile) => signedArea(bandProfilePoints(p, dims));

  it("flat is the fullest section; comfort and knife remove metal", () => {
    expect(area("comfort")).toBeLessThan(area("flat"));
    expect(area("knife")).toBeLessThan(area("comfort"));
  });
});
