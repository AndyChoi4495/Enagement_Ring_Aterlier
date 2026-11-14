// 디자인 제목과 요약 문구 테스트
// Tests for design titles and summary rows
import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, PRESETS } from "./config";
import { designSummary, designTitle, effectiveHalo, effectivePave } from "./labels";

describe("design labels", () => {
  it("titles the presets", () => {
    expect(PRESETS.map((p) => designTitle(p.design))).toEqual([
      "1.00 ct Round Diamond Solitaire Ring",
      "1.00 ct Round Diamond Hidden Halo Pavé Ring",
      "1.20 ct Cushion Diamond Halo Pavé Ring",
      "1.50 ct Emerald Diamond Bezel Ring",
      "1.30 ct Pear Sapphire Halo Ring",
    ]);
  });

  it("names a hidden halo, except under a bezel where it is not shown", () => {
    expect(designTitle({ ...DEFAULT_DESIGN, halo: "hidden" })).toBe("1.00 ct Round Diamond Hidden Halo Ring");
    const bezel = { ...DEFAULT_DESIGN, halo: "hidden" as const, setting: "bezel" as const };
    expect(effectiveHalo(bezel)).toBe("none");
    expect(designTitle(bezel)).toBe("1.00 ct Round Diamond Bezel Ring");
    expect(designTitle({ ...bezel, halo: "halo" })).toBe("1.00 ct Round Diamond Halo Bezel Ring");
  });

  it("drops side stones on a twisted band, in the title and the summary", () => {
    const twist = { ...DEFAULT_DESIGN, shoulder: "twist" as const, pave: "ucut" as const };
    expect(effectivePave(twist)).toBe("none");
    expect(designTitle(twist)).toBe("1.00 ct Round Diamond Solitaire Ring");
    expect(designSummary(twist)[2]).toEqual(["Shoulders", "Twist, Plain"]);
    expect(designSummary({ ...twist, shoulder: "split" })[2]).toEqual(["Shoulders", "Split Shank, U-Cut Pavé"]);
    expect(designTitle({ ...twist, shoulder: "split", pave: "channel" })).toBe("1.00 ct Round Diamond Solitaire Channel Ring");
  });

  it("lists the engraving only when there is one", () => {
    expect(designSummary(DEFAULT_DESIGN).map(([k]) => k)).toEqual(["Stone", "Setting", "Shoulders", "Metal", "Band", "Ring size"]);
    expect(designSummary({ ...DEFAULT_DESIGN, engraving: " Always " }).at(-1)).toEqual(["Engraving", "“Always”"]);
  });
});
