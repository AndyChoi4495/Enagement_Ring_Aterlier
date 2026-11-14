"use client";
// 3D 캔버스, 스튜디오 환경, 카메라 컨트롤, 바닥 그림자를 구성하는 뷰어
// Viewer that sets up the 3D canvas, studio environment, camera controls, and floor shadow
import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Ring } from "@/components/ring/Ring";
import { StudioEnvironment } from "@/components/viewer/StudioEnvironment";
import { registerCapture } from "@/components/viewer/capture";
import { innerDiameterMm } from "@/lib/ring/sizing";
import { useRingStore } from "@/store/ringStore";

/** Registers a capture function. Renders a fresh frame first: without preserveDrawingBuffer the
 * buffer is cleared after compositing, but toBlob copies it synchronously within this task. */
function CaptureBridge() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    registerCapture(() => {
      gl.render(scene, camera);
      return new Promise((resolve) => gl.domElement.toBlob(resolve, "image/png"));
    });
    return () => registerCapture(null);
  }, [gl, scene, camera]);
  return null;
}

export function RingViewer() {
  const design = useRingStore((s) => s.design);
  const outerRadius = innerDiameterMm(design.usSize) / 2 + design.thickness;

  return (
    <Canvas camera={{ position: [28, 16, 44], fov: 35, near: 1, far: 500 }} dpr={[1, 2]}>
      <color attach="background" args={["#f4f4f5"]} />
      <StudioEnvironment>
        <Ring design={design} />
      </StudioEnvironment>
      <ContactShadows
        position={[0, -outerRadius - 0.05, 0]}
        scale={60}
        blur={2.5}
        far={30}
        opacity={0.45}
      />
      <CaptureBridge />
      <OrbitControls makeDefault target={[0, 4, 0]} enablePan={false} minDistance={25} maxDistance={120} />
    </Canvas>
  );
}
