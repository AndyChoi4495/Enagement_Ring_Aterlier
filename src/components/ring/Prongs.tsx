// 거들을 따라 놓인 프롱(튜브 + 구형 팁)을 그리는 컴포넌트
// Renders prongs (tube + ball tip) placed around the girdle
import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import type { GemGeometry } from "@/lib/ring/geometry/gem";
import { prongSamples } from "@/lib/ring/geometry/setting";
import type { MetalId } from "@/lib/ring/materials";
import type { StoneCut } from "@/lib/ring/sizing";
import { MetalMaterial } from "./MetalMaterial";

interface ProngsProps {
  cut: StoneCut;
  count: 4 | 6;
  stone: GemGeometry;
  /** Prong wire radius in mm. */
  radius: number;
  girdleY: number;
  bandOuterRadius: number;
  bandWidth: number;
  metal: MetalId;
}

export function Prongs({ cut, count, stone, radius: r, girdleY, bandOuterRadius, bandWidth, metal }: ProngsProps) {
  // Coordinates are local to the stone: girdle middle at y = 0.
  const prongs = useMemo(
    () =>
      prongSamples(cut, count, stone.length, stone.width).map(({ p: [x, z], n: [nx, nz] }) => {
        const out = (k: number, y: number, s = 1) => new Vector3(x * s + nx * r * k, y, z * s + nz * r * k);
        // Base converges toward the band and sinks into it.
        const bx = x * 0.45;
        const bz = Math.max(-(bandWidth / 2 - r), Math.min(bandWidth / 2 - r, z * 0.45));
        const by = Math.sqrt(bandOuterRadius ** 2 - bx ** 2) - 0.25 - girdleY;
        const tip = out(0.35, stone.girdleHeight / 2 + stone.crownHeight * 0.3);
        const curve = new CatmullRomCurve3([
          new Vector3(bx, by, bz),
          out(1, -stone.pavilionDepth * 0.5, 0.75),
          out(0.9, 0),
          tip,
        ]);
        return { curve, tip };
      }),
    [cut, count, stone, r, girdleY, bandOuterRadius, bandWidth],
  );

  return (
    <group position-y={girdleY}>
      {prongs.map(({ curve, tip }, i) => (
        <group key={i}>
          <mesh>
            <tubeGeometry args={[curve, 32, r, 12, false]} />
            <MetalMaterial metal={metal} />
          </mesh>
          <mesh position={tip}>
            <sphereGeometry args={[r * 1.12, 16, 12]} />
            <MetalMaterial metal={metal} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
