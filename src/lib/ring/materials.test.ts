// 보석 재질 프리셋 변환 테스트
// Tests for gem material preset conversion
import { describe, expect, it } from "vitest";
import { GEMS, aberrationStrength } from "./materials";

describe("aberrationStrength", () => {
  it("reproduces each gem's physical blue-red spread", () => {
    for (const gem of Object.values(GEMS)) {
      const a = aberrationStrength(gem);
      expect(gem.ior * (1 + a) - gem.ior * (1 - a)).toBeCloseTo(gem.dispersion, 9);
    }
  });

  it("gives moissanite more fire than diamond", () => {
    expect(aberrationStrength(GEMS.moissanite)).toBeGreaterThan(aberrationStrength(GEMS.diamond));
  });
});
