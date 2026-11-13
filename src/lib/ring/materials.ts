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

export interface GemPreset {
  label: string;
  /** sRGB hex body color. */
  color: string;
  ior: number;
  /** Physical dispersion (B–G line refractive index spread). */
  dispersion: number;
  /** g/cm³, used to size the stone from its carat weight. */
  density: number;
}

export const GEMS = {
  diamond: { label: "Diamond", color: "#ffffff", ior: 2.42, dispersion: 0.044, density: 3.52 },
  sapphire: { label: "Sapphire", color: "#2a54c8", ior: 1.77, dispersion: 0.018, density: 4.0 },
  ruby: { label: "Ruby", color: "#c0163f", ior: 1.77, dispersion: 0.018, density: 4.0 },
  emerald: { label: "Emerald", color: "#1f9a55", ior: 1.58, dispersion: 0.014, density: 2.72 },
  moissanite: { label: "Moissanite", color: "#ffffff", ior: 2.65, dispersion: 0.104, density: 3.21 },
} as const satisfies Record<string, GemPreset>;

export type GemId = keyof typeof GEMS;

/**
 * drei's MeshRefractionMaterial traces red and blue with ior × (1 ∓ strength),
 * so a blue−red spread equal to the gem's dispersion needs strength = dispersion / (2 × ior).
 */
export function aberrationStrength({ ior, dispersion }: Pick<GemPreset, "ior" | "dispersion">): number {
  return dispersion / (2 * ior);
}
