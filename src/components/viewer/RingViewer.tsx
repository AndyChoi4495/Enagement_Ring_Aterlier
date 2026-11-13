"use client";
// 3D 캔버스, 스튜디오 조명 환경맵, 카메라 컨트롤, 바닥 그림자를 구성하는 뷰어
// Viewer that sets up the 3D canvas, studio environment map, camera controls, and floor shadow
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Band } from "@/components/ring/Band";
import { CenterStone } from "@/components/ring/CenterStone";
import { StudioEnvironment } from "@/components/viewer/StudioEnvironment";
import type { BandProfile } from "@/lib/ring/bandProfile";
import type { GemId, MetalId } from "@/lib/ring/materials";
import { innerDiameterMm, type StoneCut } from "@/lib/ring/sizing";

// Fixed design until the zustand store arrives in Phase 4.
const DEMO = {
  metal: "yellowGold" as MetalId,
  profile: "comfort" as BandProfile,
  usSize: 6,
  width: 2.5,
  thickness: 1.7,
  cut: "round" as StoneCut,
  carat: 1,
  gem: "diamond" as GemId,
};

// Gap between band top and culet; Phase 3's setting head will fill it.
const STONE_LIFT = 0.6;

export function RingViewer() {
  const outerRadius = innerDiameterMm(DEMO.usSize) / 2 + DEMO.thickness;

  return (
    <Canvas camera={{ position: [28, 16, 44], fov: 35, near: 1, far: 500 }} dpr={[1, 2]}>
      <color attach="background" args={["#f4f4f5"]} />
      <StudioEnvironment>
        <Band {...DEMO} />
        <CenterStone cut={DEMO.cut} carat={DEMO.carat} gem={DEMO.gem} culetY={outerRadius + STONE_LIFT} />
      </StudioEnvironment>
      <ContactShadows
        position={[0, -outerRadius - 0.05, 0]}
        scale={60}
        blur={2.5}
        far={30}
        opacity={0.45}
      />
      <OrbitControls makeDefault target={[0, 4, 0]} enablePan={false} minDistance={25} maxDistance={120} />
    </Canvas>
  );
}
