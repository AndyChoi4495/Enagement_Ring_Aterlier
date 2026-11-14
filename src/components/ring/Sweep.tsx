// 거들 윤곽을 따라 단면을 스윕한 금속 메시 (베젤, 헤일로 프레임)
// Metal mesh swept around the girdle outline (bezel, halo frame)
import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import type { GemGeometry } from "@/lib/ring/geometry/gem";
import { outlineLoop, sweepGeometry, type SweepPoint } from "@/lib/ring/geometry/setting";
import type { MetalId } from "@/lib/ring/materials";
import type { StoneCut } from "@/lib/ring/sizing";
import { MetalMaterial } from "./MetalMaterial";

interface SweepProps {
  cut: StoneCut;
  stone: GemGeometry;
  /** Closed cross-section around the girdle; y is relative to the girdle middle. */
  profile: SweepPoint[];
  girdleY: number;
  metal: MetalId;
}

export function Sweep({ cut, stone, profile, girdleY, metal }: SweepProps) {
  const geometry = useMemo(() => {
    const { positions, indices } = sweepGeometry(outlineLoop(cut, stone.length, stone.width, 128), profile);
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setIndex(new BufferAttribute(indices, 1));
    g.computeVertexNormals();
    return g;
  }, [cut, stone, profile]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} position-y={girdleY}>
      <MetalMaterial metal={metal} />
    </mesh>
  );
}
