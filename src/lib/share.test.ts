// 공유 URL 인코딩/디코딩 왕복과 잘못된 입력 처리 테스트
// Tests for share URL round trips and bad-input handling
import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, PAVES, PRESETS, SHOULDERS, type RingDesign } from "@/lib/ring/config";
import { SHARE_PARAM, decodeDesign, designFromSearch, encodeDesign } from "./share";

const b64 = (s: string) => Buffer.from(s, "utf-8").toString("base64url");

describe("share encoding", () => {
  it("round-trips every preset", () => {
    for (const p of PRESETS) expect(decodeDesign(encodeDesign(p.design)), p.id).toEqual(p.design);
  });

  it("round-trips fractional values and a Hangul engraving", () => {
    const d = { ...DEFAULT_DESIGN, usSize: 7.25, carat: 1.35, width: 3.1, engraving: "사랑해 ♥ 2026.11.13" };
    expect(decodeDesign(encodeDesign(d))).toEqual(d);
  });

  it("round-trips a hidden halo and still reads halo 0/1 from older links", () => {
    const d = { ...DEFAULT_DESIGN, halo: "hidden" as const };
    expect(decodeDesign(encodeDesign(d))).toEqual(d);
    expect(decodeDesign(b64('[1,0,0,6,2.5,1.7,0,1,0,0,1,0,""]'))?.halo).toBe("halo");
    expect(decodeDesign(b64('[1,0,0,6,2.5,1.7,0,1,0,0,0,0,""]'))?.halo).toBe("none");
  });

  it("round-trips every shoulder style and reads links made before it as a straight band", () => {
    for (const shoulder of SHOULDERS) {
      const d: RingDesign = { ...DEFAULT_DESIGN, shoulder };
      expect(decodeDesign(encodeDesign(d))).toEqual(d);
    }
    expect(decodeDesign(b64('[1,0,0,6,2.5,1.7,0,1,0,0,0,1,""]'))?.shoulder).toBe("straight");
    expect(decodeDesign(b64('[1,0,0,6,2.5,1.7,0,1,0,0,0,1,"",9]'))).toBeNull();
  });

  it("round-trips every side-stone style and still reads pavé 0/1 from older links", () => {
    for (const pave of PAVES) {
      const d: RingDesign = { ...DEFAULT_DESIGN, pave };
      expect(decodeDesign(encodeDesign(d))).toEqual(d);
    }
    expect(decodeDesign(b64('[1,0,0,6,2.5,1.7,0,1,0,0,0,1,""]'))?.pave).toBe("pave");
    expect(decodeDesign(b64('[1,0,0,6,2.5,1.7,0,1,0,0,0,0,""]'))?.pave).toBe("none");
  });

  it("produces a short URL-safe string", () => {
    const s = encodeDesign(PRESETS[3].design);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(s.length).toBeLessThan(80);
  });

  it("rejects malformed, outdated, and out-of-range input", () => {
    const valid = JSON.parse(Buffer.from(encodeDesign(DEFAULT_DESIGN), "base64url").toString());
    const variant = (i: number, v: unknown) => b64(JSON.stringify(valid.map((x: unknown, j: number) => (j === i ? v : x))));
    const bad = [
      "",
      "!!!",
      "bm90IGpzb24", // "not json"
      b64("{}"),
      b64("[1,2,3]"),
      variant(0, 99), // unknown version
      variant(1, 9), // metal index out of range
      variant(1, "0"), // index as string
      variant(3, 20), // ring size too large
      variant(7, 0.1), // carat too small
      variant(10, 3), // halo index out of range
      variant(11, 5), // side-stone index out of range
      variant(12, "x".repeat(40)), // engraving too long
    ];
    for (const s of bad) expect(decodeDesign(s), s).toBeNull();
  });

  it("falls back to the default design when the param is missing or invalid", () => {
    expect(designFromSearch("")).toEqual(DEFAULT_DESIGN);
    expect(designFromSearch(`?${SHARE_PARAM}=garbage`)).toEqual(DEFAULT_DESIGN);
    const d = PRESETS[2].design;
    expect(designFromSearch(`?${SHARE_PARAM}=${encodeDesign(d)}`)).toEqual(d);
  });
});
