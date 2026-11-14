// 단면 프로파일을 회전(LatheGeometry)시켜 반지 밴드 메시를 그리는 컴포넌트
// Renders the ring band by revolving its cross-section with LatheGeometry
import { useMemo } from "react";
import { Vector2 } from "three";
import { bandProfilePoints, type BandProfile } from "@/lib/ring/bandProfile";
import type { MetalId } from "@/lib/ring/materials";
import { innerDiameterMm } from "@/lib/ring/sizing";
import { MetalMaterial } from "./MetalMaterial";

interface BandProps {
  metal: MetalId;
  profile: BandProfile;
  usSize: number;
  width: number;
  thickness: number;
}

const RADIAL_SEGMENTS = 160;

export function Band({ metal, profile, usSize, width, thickness }: BandProps) {
  const points = useMemo(
    () =>
      bandProfilePoints(profile, {
        innerRadius: innerDiameterMm(usSize) / 2,
        width,
        thickness,
      }).map(([x, y]) => new Vector2(x, y)),
    [profile, usSize, width, thickness],
  );

  // Lathe revolves around Y; tip it so the ring stands upright facing the camera.
  return (
    <mesh rotation-x={Math.PI / 2}>
      <latheGeometry args={[points, RADIAL_SEGMENTS]} />
      <MetalMaterial metal={metal} />
    </mesh>
  );
}
