"use client";
// 3D 캔버스, 스튜디오 환경, 카메라 컨트롤, 바닥 그림자, 시점 초기화 버튼을 구성하는 뷰어
// Viewer that sets up the 3D canvas, studio environment, camera controls, floor shadow, and view reset
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Move3d, RotateCcw } from "lucide-react";
import { Ring } from "@/components/ring/Ring";
import { StudioEnvironment } from "@/components/viewer/StudioEnvironment";
import { registerCapture } from "@/components/viewer/capture";
import { innerDiameterMm } from "@/lib/ring/sizing";
import { useRingStore } from "@/store/ringStore";

// Hero view: from the front and well above, so the stone's table faces the viewer
// and the band recedes behind it, as in jewelry product photos.
const CAMERA_POSITION: [number, number, number] = [10, 40, 36];
const CAMERA_TARGET: [number, number, number] = [0, 5, 0];
const BACKGROUND = "#efefef";

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
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const [touched, setTouched] = useState(false);

  return (
    <div className="relative size-full" style={{ background: BACKGROUND }}>
      <Canvas frameloop="demand" camera={{ position: CAMERA_POSITION, fov: 30, near: 1, far: 500 }} dpr={[1, 2]}>
        <color attach="background" args={[BACKGROUND]} />
        <StudioEnvironment>
          <Ring design={design} />
        </StudioEnvironment>
        <ContactShadows
          position={[0, -outerRadius - 0.05, 0]}
          scale={60}
          blur={2.5}
          far={30}
          opacity={0.35}
        />
        <CaptureBridge />
        <OrbitControls
          ref={controls}
          makeDefault
          target={CAMERA_TARGET}
          enablePan={false}
          minDistance={14}
          maxDistance={90}
          onStart={() => setTouched(true)}
        />
      </Canvas>

      <button
        type="button"
        onClick={() => controls.current?.reset()}
        className="absolute top-3 right-3 flex flex-col items-center gap-1 rounded-md p-2 text-[11px] font-medium text-neutral-700 hover:bg-black/5"
      >
        <RotateCcw className="size-5" strokeWidth={1.5} />
        Reset
      </button>

      {/* Fades out after the first drag. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 text-[11px] tracking-[0.12em] text-neutral-500 uppercase transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-100"}`}
      >
        <Move3d className="size-4" strokeWidth={1.5} />
        Drag to rotate · Scroll or pinch to zoom
      </div>
    </div>
  );
}
