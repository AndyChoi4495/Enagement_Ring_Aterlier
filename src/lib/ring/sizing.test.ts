// 반지 사이즈 → 밀리미터 변환 테스트
// Tests for ring size to millimeter conversion
import { describe, expect, it } from "vitest";
import { innerDiameterMm } from "./sizing";

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
