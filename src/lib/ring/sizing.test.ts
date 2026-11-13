// 반지 사이즈 → 밀리미터 변환 테스트
// Tests for ring size to millimeter conversion
import { describe, expect, it } from "vitest";
import { innerDiameterMm, stoneSizeMm } from "./sizing";

describe("innerDiameterMm", () => {
  it("matches standard US size chart values", () => {
    expect(innerDiameterMm(3)).toBeCloseTo(14.07, 2);
    expect(innerDiameterMm(6)).toBeCloseTo(16.51, 2);
    expect(innerDiameterMm(7)).toBeCloseTo(17.32, 2);
    expect(innerDiameterMm(13)).toBeCloseTo(22.2, 1);
  });

  it("grows by 0.8128 mm per full size", () => {
    expect(innerDiameterMm(6.5) - innerDiameterMm(5.5)).toBeCloseTo(0.8128, 6);
  });
});

describe("stoneSizeMm", () => {
  it("gives the classic 6.5 mm round at 1 ct", () => {
    const { length, width } = stoneSizeMm("round", 1);
    expect(length).toBeCloseTo(6.5, 6);
    expect(width).toBeCloseTo(6.5, 6);
  });

  it("scales with the cube root of carat", () => {
    expect(stoneSizeMm("oval", 2).length / stoneSizeMm("oval", 1).length).toBeCloseTo(Math.cbrt(2), 6);
  });

  it("keeps each cut's length/width ratio", () => {
    const { length, width } = stoneSizeMm("emerald", 1.5);
    expect(length / width).toBeCloseTo(1.4, 6);
  });

  it("makes denser gems smaller at the same carat", () => {
    expect(stoneSizeMm("round", 1, 4.0).length).toBeLessThan(6.5);
    expect(stoneSizeMm("round", 1, 2.72).length).toBeGreaterThan(6.5);
  });
});
