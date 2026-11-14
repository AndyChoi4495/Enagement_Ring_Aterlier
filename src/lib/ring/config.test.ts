// 디자인 스키마, 기본값, 프리셋 검증 테스트
// Tests for the design schema, defaults, and presets
import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, PRESETS, ringDesignSchema } from "./config";

describe("ringDesignSchema", () => {
  it("accepts the default design and every preset", () => {
    expect(ringDesignSchema.safeParse(DEFAULT_DESIGN).success).toBe(true);
    for (const p of PRESETS) expect(ringDesignSchema.safeParse(p.design).success, p.id).toBe(true);
  });

  it("rejects out-of-range numbers and unknown options", () => {
    const bad = [
      { usSize: 2 },
      { carat: 3.5 },
      { width: 1 },
      { thickness: 3 },
      { metal: "silver" },
      { cut: "marquise" },
      { setting: "tension" },
    ];
    for (const patch of bad) expect(ringDesignSchema.safeParse({ ...DEFAULT_DESIGN, ...patch }).success).toBe(false);
  });

  it("limits engraving to one short printable line", () => {
    const parse = (engraving: string) => ringDesignSchema.safeParse({ ...DEFAULT_DESIGN, engraving }).success;
    expect(parse("Forever ♥ 2026.11.13")).toBe(true);
    expect(parse("사랑해")).toBe(true);
    expect(parse("a".repeat(25))).toBe(false);
    expect(parse("line1\nline2")).toBe(false);
  });

  it("has unique preset ids", () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
  });
});
