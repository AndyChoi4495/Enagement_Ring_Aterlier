// 옵션 표시 이름과 디자인을 한 줄 제목·요약으로 풀어 쓰는 함수
// Display names for options, plus the one-line title and summary rows for a design
import type { RingDesign } from "./config";
import { GEMS } from "./materials";
import { innerDiameterMm, stoneSizeMm } from "./sizing";

export const METAL_LABELS: Record<RingDesign["metal"], string> = {
  platinum: "Platinum",
  yellowGold: "Yellow Gold",
  whiteGold: "White Gold",
  roseGold: "Rose Gold",
};
export const GEM_LABELS: Record<RingDesign["gem"], string> = {
  diamond: "Diamond",
  sapphire: "Sapphire",
  ruby: "Ruby",
  emerald: "Emerald",
  moissanite: "Moissanite",
};
export const CUT_LABELS: Record<RingDesign["cut"], string> = {
  round: "Round",
  princess: "Princess",
  oval: "Oval",
  cushion: "Cushion",
  emerald: "Emerald",
  pear: "Pear",
};
export const SETTING_LABELS: Record<RingDesign["setting"], string> = {
  prong4: "Classic 4 Prong",
  prong6: "Classic 6 Prong",
  bezel: "Bezel",
};
export const HALO_LABELS: Record<RingDesign["halo"], string> = {
  none: "No Halo",
  halo: "Single Halo",
  hidden: "Hidden Halo",
};
export const SHOULDER_LABELS: Record<RingDesign["shoulder"], string> = {
  straight: "Straight",
  tapered: "Tapered",
  cathedral: "Cathedral",
  split: "Split Shank",
  twist: "Twist",
};
export const PAVE_LABELS: Record<RingDesign["pave"], string> = {
  none: "Plain",
  pave: "Pavé",
  french: "French Pavé",
  ucut: "U-Cut Pavé",
  channel: "Channel Set",
};
export const PROFILE_LABELS: Record<RingDesign["profile"], string> = {
  comfort: "Comfort Fit",
  flat: "Flat",
  knife: "Knife Edge",
};

/** A bezel covers the area under the girdle, so a hidden halo is not shown with it. */
export function effectiveHalo(d: Pick<RingDesign, "halo" | "setting">): RingDesign["halo"] {
  return d.halo === "hidden" && d.setting === "bezel" ? "none" : d.halo;
}

/** The woven strands of a twisted band leave no flat top for a row of stones. */
export function effectivePave(d: Pick<RingDesign, "pave" | "shoulder">): RingDesign["pave"] {
  return d.shoulder === "twist" ? "none" : d.pave;
}

/** Stone face-up size, e.g. "6.5 mm" or "7.7 × 5.7 mm". */
export function stoneSizeLabel(d: Pick<RingDesign, "cut" | "carat" | "gem">): string {
  const { length, width } = stoneSizeMm(d.cut, d.carat, GEMS[d.gem].density);
  return d.cut === "round" ? `${length.toFixed(1)} mm` : `${length.toFixed(1)} × ${width.toFixed(1)} mm`;
}

/** e.g. "1.20 ct Cushion Diamond Halo Pavé Ring". */
export function designTitle(d: RingDesign): string {
  const halo = effectiveHalo(d);
  const style =
    halo === "halo" ? "Halo" : halo === "hidden" ? "Hidden Halo" : d.setting === "bezel" ? "Bezel" : "Solitaire";
  const parts = [`${d.carat.toFixed(2)} ct`, CUT_LABELS[d.cut], GEM_LABELS[d.gem], style];
  if (halo !== "none" && d.setting === "bezel") parts.push("Bezel");
  const pave = effectivePave(d);
  if (pave !== "none") parts.push(pave === "channel" ? "Channel" : "Pavé");
  return `${parts.join(" ")} Ring`;
}

export function designSummary(d: RingDesign): [label: string, value: string][] {
  const rows: [string, string][] = [
    ["Stone", `${d.carat.toFixed(2)} ct ${CUT_LABELS[d.cut]} ${GEM_LABELS[d.gem]} (${stoneSizeLabel(d)})`],
    ["Setting", [SETTING_LABELS[d.setting], HALO_LABELS[effectiveHalo(d)]].join(", ")],
    ["Shoulders", `${SHOULDER_LABELS[d.shoulder]}, ${PAVE_LABELS[effectivePave(d)]}`],
    ["Metal", METAL_LABELS[d.metal]],
    ["Band", `${PROFILE_LABELS[d.profile]}, ${d.width.toFixed(1)} mm wide, ${d.thickness.toFixed(1)} mm thick`],
    ["Ring size", `US ${d.usSize} (inner ⌀ ${innerDiameterMm(d.usSize).toFixed(1)} mm)`],
  ];
  if (d.engraving.trim()) rows.push(["Engraving", `“${d.engraving.trim()}”`]);
  return rows;
}
