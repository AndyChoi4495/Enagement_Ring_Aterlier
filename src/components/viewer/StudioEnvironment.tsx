// 금속용 스튜디오 환경맵을 장면에 적용하고, 보석 굴절 재질용 고대비 환경맵을 따로 만들어 공유하는 컴포넌트
// Applies the studio environment for metal and shares a separate high-contrast cube map for gem refraction
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  BackSide,
  CircleGeometry,
  CubeCamera,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLCubeRenderTarget,
  type Texture,
} from "three";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

const EnvMapContext = createContext<Texture | null>(null);

/** The cube map that gems refract and reflect. */
export function useStudioEnvMap() {
  return useContext(EnvMapContext);
}

/**
 * Gems need contrast, not soft light: a facet looks bright or dark depending on which patch of the
 * surroundings its light path ends on. This is a white room scattered with dark discs of mixed
 * sizes, which gives the crisp light/dark facet pattern of a cut stone. Deterministic (seeded).
 */
function useGemEnvMap(): Texture {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => {
    const target = new WebGLCubeRenderTarget(512, { generateMipmaps: true, minFilter: LinearMipmapLinearFilter });
    const scene = new Scene();
    const room = new Mesh(new SphereGeometry(50, 32, 16), new MeshBasicMaterial({ color: "#ffffff", side: BackSide }));
    scene.add(room);

    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const disc = new CircleGeometry(1, 24);
    const materials = ["#000000", "#000000", "#3a3a3a", "#8a8a8a"].map((color) => new MeshBasicMaterial({ color }));
    const origin = new Vector3();
    for (let i = 0; i < 70; i++) {
      const y = 2 * random() - 1;
      const phi = 2 * Math.PI * random();
      const r = Math.sqrt(1 - y * y);
      const mesh = new Mesh(disc, materials[Math.floor(random() * materials.length)]);
      mesh.position.set(r * Math.cos(phi), y, r * Math.sin(phi)).multiplyScalar(20);
      mesh.scale.setScalar(1.2 + 3.8 * random() ** 2); // mostly small, a few large
      mesh.lookAt(origin);
      scene.add(mesh);
    }

    new CubeCamera(0.1, 100, target).update(gl, scene);
    room.geometry.dispose();
    room.material.dispose();
    disc.dispose();
    materials.forEach((m) => m.dispose());
    return target;
  }, [gl]);
  useEffect(() => () => target.dispose(), [target]);
  return target.texture;
}

export function StudioEnvironment({ children }: { children: ReactNode }) {
  const gemEnvMap = useGemEnvMap();
  return (
    <>
      {/* Procedural softbox studio for metal: no HDR download, and crisp highlights. */}
      <Environment resolution={256}>
        <color attach="background" args={["#c9c9c9"]} />
        <Lightformer form="rect" intensity={3} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={2} position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={2} position={[8, 2, 4]} rotation-y={-Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 2, 10]} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={1} position={[0, -6, -6]} scale={6} />
        {/* Black cards, as in jewelry photography: dark edges give polished metal its shape. */}
        <Lightformer form="rect" color="black" intensity={1} position={[-6, -3, -6]} rotation-y={Math.PI / 4} scale={[8, 6, 1]} />
        <Lightformer form="rect" color="black" intensity={1} position={[6, -3, -6]} rotation-y={-Math.PI / 4} scale={[8, 6, 1]} />
      </Environment>
      <EnvMapContext value={gemEnvMap}>{children}</EnvMapContext>
    </>
  );
}
