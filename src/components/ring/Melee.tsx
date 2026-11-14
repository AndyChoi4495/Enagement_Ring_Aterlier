// 작은 라운드 다이아몬드(멜리)를 InstancedMesh 한 번의 드로우콜로 그리는 컴포넌트
// Renders small round diamonds (melee) as one InstancedMesh draw call
import { useLayoutEffect, useMemo, useRef } from "react";
import type { InstancedMesh, Matrix4 } from "three";
import { buildGem } from "@/lib/ring/geometry/gem";
import { useStudioEnvMap } from "@/components/viewer/StudioEnvironment";
import { GemMaterial, useGemGeometry } from "./gem";

export function Melee({ diameter, matrices }: { diameter: number; matrices: Matrix4[] }) {
  const envMap = useStudioEnvMap();
  const positions = useMemo(() => buildGem("round", diameter, diameter).positions, [diameter]);
  const geometry = useGemGeometry(positions);
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, geometry, envMap]);

  if (!envMap || matrices.length === 0) return null;
  return (
    <instancedMesh key={`${geometry.uuid}-${matrices.length}`} ref={ref} args={[geometry, undefined, matrices.length]} castShadow>
      {/* Two bounces are plenty at ~1 mm. */}
      <GemMaterial gem="diamond" envMap={envMap} bounces={2} />
    </instancedMesh>
  );
}
