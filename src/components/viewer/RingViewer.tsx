"use client";
// 3D 캔버스, 스튜디오 조명 환경맵, 카메라 컨트롤, 바닥 그림자를 구성하는 뷰어
// Viewer that sets up the 3D canvas, studio environment map, camera controls, and floor shadow
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Band } from "@/components/ring/Band";
import type { BandProfile } from "@/lib/ring/bandProfile";
import type { MetalId } from "@/lib/ring/materials";
import { innerDiameterMm } from "@/lib/ring/sizing";

// Fixed design until the zustand store arrives in Phase 4.
const DEMO = {
  metal: "yellowGold" as MetalId,
  profile: "comfort" as BandProfile,
  usSize: 6,
  width: 2.5,
  thickness: 1.7,
};

export function RingViewer() {
  const outerRadius = innerDiameterMm(DEMO.usSize) / 2 + DEMO.thickness;

  return (
    <Canvas camera={{ position: [28, 16, 44], fov: 35, near: 1, far: 500 }} dpr={[1, 2]}>
      <color attach="background" args={["#f4f4f5"]} />
      <Band {...DEMO} />
      <ContactShadows
        position={[0, -outerRadius - 0.05, 0]}
        scale={60}
        blur={2.5}
        far={30}
        opacity={0.45}
      />
      {/* Procedural softbox studio: no HDR download, and crisp highlights on metal and gems. */}
      <Environment resolution={256}>
        <color attach="background" args={["#a3a3a3"]} />
        <Lightformer form="rect" intensity={3} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={2} position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={2} position={[8, 2, 4]} rotation-y={-Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 2, 10]} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={1} position={[0, -6, -6]} scale={6} />
      </Environment>
      <OrbitControls makeDefault enablePan={false} minDistance={25} maxDistance={120} />
    </Canvas>
  );
}
