// 보석 지오메트리 변환 훅과 굴절 재질 (센터 스톤과 멜리가 공유)
// Gem geometry hook and refraction material, shared by the center stone and melee
import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, ShaderChunk, type Texture } from "three";
import { MeshRefractionMaterial } from "@react-three/drei";
import { GEMS, aberrationStrength, type GemId } from "@/lib/ring/materials";

// three r187 removed this chunk, but drei 10.7.9's MeshRefractionMaterial still #includes it.
// Its only function (textureCubeUV) is unused with a cube env map, so an empty chunk is safe.
(ShaderChunk as Record<string, string>).cube_uv_reflection_fragment ??= "";

/** BufferGeometry from non-indexed gem triangles; each facet gets its own flat normal. */
export function useGemGeometry(positions: Float32Array): BufferGeometry {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/**
 * Ray-traces internal reflections against a BVH of the parent mesh, which a transmissive
 * MeshPhysicalMaterial cannot do. The BVH is built once on mount, so callers key the mesh
 * on its geometry to remount when it changes.
 */
export function GemMaterial({ gem, envMap, bounces = 3 }: { gem: GemId; envMap: Texture; bounces?: number }) {
  const preset = GEMS[gem];
  return (
    <MeshRefractionMaterial
      envMap={envMap}
      bounces={bounces}
      ior={preset.ior}
      aberrationStrength={aberrationStrength(preset)}
      fresnel={1}
      color={preset.color}
      toneMapped={false}
    />
  );
}
