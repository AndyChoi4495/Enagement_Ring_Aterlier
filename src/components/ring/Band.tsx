// 숄더 스타일에 맞는 밴드 가닥들을 단면 스윕 메시로 그리는 컴포넌트
// Renders the band as swept strands shaped by the shoulder style
import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import type { BandProfile } from "@/lib/ring/bandProfile";
import { strandGeometry, type Strand } from "@/lib/ring/geometry/band";
import type { MetalId } from "@/lib/ring/materials";
import { MetalMaterial } from "./MetalMaterial";

interface BandProps {
  metal: MetalId;
  profile: BandProfile;
  innerRadius: number;
  strands: Strand[];
}

export function Band({ metal, profile, innerRadius, strands }: BandProps) {
  const geometries = useMemo(
    () =>
      strands.map((strand) => {
        const { positions, indices } = strandGeometry(profile, innerRadius, strand);
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(positions, 3));
        g.setIndex(new BufferAttribute(indices, 1));
        g.computeVertexNormals();
        return g;
      }),
    [profile, innerRadius, strands],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  return (
    <>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <MetalMaterial metal={metal} />
        </mesh>
      ))}
    </>
  );
}
