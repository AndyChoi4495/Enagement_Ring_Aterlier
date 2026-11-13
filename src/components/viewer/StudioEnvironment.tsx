// Lightformer로 만든 스튜디오 환경맵을 장면에 적용하고 보석 굴절 재질에 공유하는 컴포넌트
// Applies the Lightformer studio environment to the scene and shares it with gem refraction materials
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Texture } from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

const EnvMapContext = createContext<Texture | null>(null);

/** The studio cube map, or null on the first frame before it has been rendered. */
export function useStudioEnvMap() {
  return useContext(EnvMapContext);
}

export function StudioEnvironment({ children }: { children: ReactNode }) {
  const [envMap, setEnvMap] = useState<Texture | null>(null);

  // drei's Environment does not expose its texture; it only assigns it to scene.environment.
  // Pick it up from there (a pointer comparison per frame; re-renders only when it changes).
  useFrame(({ scene }) => {
    if (scene.environment !== envMap) setEnvMap(scene.environment);
  });

  return (
    <>
      {/* Procedural softbox studio: no HDR download, and crisp highlights on metal and gems. */}
      <Environment resolution={256}>
        <color attach="background" args={["#a3a3a3"]} />
        <Lightformer form="rect" intensity={3} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={2} position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={2} position={[8, 2, 4]} rotation-y={-Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 2, 10]} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={1} position={[0, -6, -6]} scale={6} />
        {/* Black cards, as in jewelry photography: dark facets give stones contrast. */}
        <Lightformer form="rect" color="black" intensity={1} position={[-6, -3, -6]} rotation-y={Math.PI / 4} scale={[8, 6, 1]} />
        <Lightformer form="rect" color="black" intensity={1} position={[6, -3, -6]} rotation-y={-Math.PI / 4} scale={[8, 6, 1]} />
      </Environment>
      <EnvMapContext value={envMap}>{children}</EnvMapContext>
    </>
  );
}
