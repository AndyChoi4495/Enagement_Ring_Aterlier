// 디자인 설정을 짧은 URL 파라미터(?d=)로 인코딩하고, 검증해 디코딩하는 모듈
// Encodes the design into a short URL param (?d=) and decodes it with validation
import {
  CUTS,
  DEFAULT_DESIGN,
  GEM_IDS,
  METAL_IDS,
  PROFILES,
  SETTINGS,
  ringDesignSchema,
  type RingDesign,
} from "@/lib/ring/config";

export const SHARE_PARAM = "d";

/** Bump when the positional layout changes; old links then fall back to the default. */
const VERSION = 1;

// Positional layout: enums as indices, booleans as 0/1. Keeps links short without a compression library.
type Packed = [number, number, number, number, number, number, number, number, number, number, number, number, string];

// Slider steps can leave float noise (1.3500000000000003); two decimals cover every step.
const round2 = (x: number) => Math.round(x * 100) / 100;

function pack(d: RingDesign): Packed {
  return [
    VERSION,
    METAL_IDS.indexOf(d.metal),
    PROFILES.indexOf(d.profile),
    round2(d.usSize),
    round2(d.width),
    round2(d.thickness),
    CUTS.indexOf(d.cut),
    round2(d.carat),
    GEM_IDS.indexOf(d.gem),
    SETTINGS.indexOf(d.setting),
    +d.halo,
    +d.pave,
    d.engraving,
  ];
}

function unpack(v: unknown): unknown {
  if (!Array.isArray(v) || v.length !== 13 || v[0] !== VERSION) return null;
  const [, metal, profile, usSize, width, thickness, cut, carat, gem, setting, halo, pave, engraving] = v;
  // Only real integer indices; JS would also accept "0" as an array index.
  const pick = <T,>(list: readonly T[], i: unknown) => (Number.isInteger(i) ? list[i as number] : undefined);
  const bool = (x: unknown) => (x === 0 ? false : x === 1 ? true : x); // anything else fails the schema
  return {
    metal: pick(METAL_IDS, metal),
    profile: pick(PROFILES, profile),
    usSize,
    width,
    thickness,
    cut: pick(CUTS, cut),
    carat,
    gem: pick(GEM_IDS, gem),
    setting: pick(SETTINGS, setting),
    halo: bool(halo),
    pave: bool(pave),
    engraving,
  };
}

// base64url over UTF-8, so Hangul engravings survive.
function toBase64Url(text: string): string {
  let bin = "";
  for (const byte of new TextEncoder().encode(text)) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeDesign(design: RingDesign): string {
  return toBase64Url(JSON.stringify(pack(design)));
}

/** Returns the decoded design, or null if the string is malformed, outdated, or out of range. */
export function decodeDesign(encoded: string): RingDesign | null {
  try {
    const result = ringDesignSchema.safeParse(unpack(JSON.parse(fromBase64Url(encoded))));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Design from a URL query string; falls back to the default when missing or invalid. */
export function designFromSearch(search: string): RingDesign {
  const encoded = new URLSearchParams(search).get(SHARE_PARAM);
  return (encoded && decodeDesign(encoded)) || DEFAULT_DESIGN;
}
