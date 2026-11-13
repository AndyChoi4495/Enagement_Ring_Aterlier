// 밴드 단면 프로파일(컴포트 핏, 플랫, 나이프 엣지) 좌표를 생성하는 순수 함수
// Pure builder for band cross-section profiles (comfort fit, flat, knife edge)

export type BandProfile = "comfort" | "flat" | "knife";

export interface BandDimensions {
  /** Radius of the finger hole in mm (the band's narrowest inner point). */
  innerRadius: number;
  /** Band width along the ring axis in mm. */
  width: number;
  /** Radial metal thickness in mm. */
  thickness: number;
}

/** [radius from ring axis, height along ring axis], in mm. */
export type ProfilePoint = [x: number, y: number];

// Superellipse exponents per half of the cross-section.
// High n = squarish (flat face, eased corners), 2 = elliptical dome, < 2 = pointed ridge.
const EXPONENTS: Record<BandProfile, { outer: number; inner: number }> = {
  comfort: { outer: 4, inner: 2.5 },
  flat: { outer: 10, inner: 10 },
  knife: { outer: 1.4, inner: 8 },
};

function signedPow(v: number, p: number): number {
  return Math.sign(v) * Math.abs(v) ** p;
}

/**
 * Closed, counter-clockwise cross-section for LatheGeometry (which revolves around Y).
 * Starts and ends at the bottom-center point so the loop closes exactly.
 * Min x is exactly innerRadius, so ring sizing stays correct for every profile.
 */
export function bandProfilePoints(
  profile: BandProfile,
  { innerRadius, width, thickness }: BandDimensions,
  samples = 96,
): ProfilePoint[] {
  const { outer, inner } = EXPONENTS[profile];
  const cx = innerRadius + thickness / 2;
  const a = thickness / 2;
  const b = width / 2;

  const points: ProfilePoint[] = [];
  for (let i = 0; i < samples; i++) {
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / samples;
    const c = Math.cos(theta);
    const n = c >= 0 ? outer : inner;
    points.push([cx + a * signedPow(c, 2 / n), b * signedPow(Math.sin(theta), 2 / n)]);
  }
  points.push([points[0][0], points[0][1]]);
  return points;
}
