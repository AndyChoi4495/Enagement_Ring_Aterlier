// 금속 재질 프리셋(색상, 거칠기) 데이터
// Metal material presets (color, roughness)

export interface MetalPreset {
  label: string;
  /** sRGB hex, close to each metal's measured reflectance (F0). */
  color: string;
  roughness: number;
}

export const METALS = {
  platinum: { label: "Platinum", color: "#d7d2ca", roughness: 0.14 },
  yellowGold: { label: "Yellow gold", color: "#f2cf8a", roughness: 0.12 },
  whiteGold: { label: "White gold", color: "#e2e0dc", roughness: 0.1 },
  roseGold: { label: "Rose gold", color: "#ecbca6", roughness: 0.12 },
} as const satisfies Record<string, MetalPreset>;

export type MetalId = keyof typeof METALS;
