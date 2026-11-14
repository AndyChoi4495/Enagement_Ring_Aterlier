// 패싯 센터 스톤 메시를 그리는 컴포넌트
// Renders the faceted center stone
import type { GemGeometry } from "@/lib/ring/geometry/gem";
import type { GemId } from "@/lib/ring/materials";
import { useStudioEnvMap } from "@/components/viewer/StudioEnvironment";
import { GemMaterial, useGemGeometry } from "./gem";

interface CenterStoneProps {
  stone: GemGeometry;
  gem: GemId;
  /** World y of the girdle middle. */
  girdleY: number;
}

export function CenterStone({ stone, gem, girdleY }: CenterStoneProps) {
  const envMap = useStudioEnvMap();
  const geometry = useGemGeometry(stone.positions);
  if (!envMap) return null;
  return (
    <mesh key={geometry.uuid} geometry={geometry} position-y={girdleY} castShadow>
      <GemMaterial gem={gem} envMap={envMap} />
    </mesh>
  );
}
