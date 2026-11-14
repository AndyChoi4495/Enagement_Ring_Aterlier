// 금속 프리셋으로 PBR 재질을 만드는 컴포넌트 (밴드와 세팅이 공유)
// PBR material from a metal preset, shared by the band and the setting
import { METALS, type MetalId } from "@/lib/ring/materials";

export function MetalMaterial({ metal }: { metal: MetalId }) {
  const { color, roughness } = METALS[metal];
  return <meshStandardMaterial color={color} metalness={1} roughness={roughness} />;
}
