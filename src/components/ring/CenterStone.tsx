// 컷·캐럿·보석 종류에 따라 패싯 센터 스톤 메시를 그리는 컴포넌트
// Renders the faceted center stone for the chosen cut, carat, and gem type
import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, ShaderChunk } from "three";
import { MeshRefractionMaterial } from "@react-three/drei";
import { useStudioEnvMap } from "@/components/viewer/StudioEnvironment";
import { buildGem } from "@/lib/ring/geometry/gem";
import { GEMS, aberrationStrength, type GemId } from "@/lib/ring/materials";
import { stoneSizeMm, type StoneCut } from "@/lib/ring/sizing";

// three r187 removed this chunk, but drei 10.7.9's MeshRefractionMaterial still #includes it.
// Its only function (textureCubeUV) is unused with a cube env map, so an empty chunk is safe.
(ShaderChunk as Record<string, string>).cube_uv_reflection_fragment ??= "";

interface CenterStoneProps {
  cut: StoneCut;
  carat: number;
  gem: GemId;
  /** World y of the culet (the stone's lowest point). */
  culetY: number;
}

export function CenterStone({ cut, carat, gem, culetY }: CenterStoneProps) {
  const preset = GEMS[gem];
  const envMap = useStudioEnvMap();
  const { geometry, stone } = useMemo(() => {
    const { length, width } = stoneSizeMm(cut, carat, preset.density);
    const stone = buildGem(cut, length, width);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(stone.positions, 3));
    // Non-indexed triangles, so each facet gets its own flat normal.
    geometry.computeVertexNormals();
    return { geometry, stone };
  }, [cut, carat, preset.density]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!envMap) return null;

  // Ray-traces internal reflections against a BVH of the stone, which a transmissive
  // MeshPhysicalMaterial cannot do. The BVH is built once on mount, so remount per geometry.
  return (
    <mesh
      key={geometry.uuid}
      geometry={geometry}
      position-y={culetY + stone.girdleHeight / 2 + stone.pavilionDepth}
    >
      <MeshRefractionMaterial
        envMap={envMap}
        bounces={3}
        ior={preset.ior}
        aberrationStrength={aberrationStrength(preset)}
        fresnel={1}
        color={preset.color}
        toneMapped={false}
      />
    </mesh>
  );
}
