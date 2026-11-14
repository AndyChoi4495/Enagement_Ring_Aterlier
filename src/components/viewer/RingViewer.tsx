"use client";
// 3D 캔버스, 스튜디오 환경, 카메라 컨트롤, 바닥 그림자를 구성하는 뷰어
// Viewer that sets up the 3D canvas, studio environment, camera controls, and floor shadow
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Ring } from "@/components/ring/Ring";
import { StudioEnvironment } from "@/components/viewer/StudioEnvironment";
import type { RingDesign } from "@/lib/ring/config";
import { innerDiameterMm } from "@/lib/ring/sizing";

// Fixed design until the zustand store arrives in Phase 4.
const DEMO: RingDesign = {
  metal: "yellowGold",
  profile: "comfort",
  usSize: 6,
  width: 2.5,
  thickness: 1.7,
  cut: "round",
  carat: 1,
  gem: "diamond",
  setting: "prong4",
  halo: false,
  pave: false,
};

export function RingViewer() {
  const outerRadius = innerDiameterMm(DEMO.usSize) / 2 + DEMO.thickness;

  return (
    <Canvas camera={{ position: [28, 16, 44], fov: 35, near: 1, far: 500 }} dpr={[1, 2]}>
      <color attach="background" args={["#f4f4f5"]} />
      <StudioEnvironment>
        <Ring design={DEMO} />
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
