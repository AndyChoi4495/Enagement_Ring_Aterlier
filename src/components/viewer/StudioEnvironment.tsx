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
  ShaderMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLCubeRenderTarget,
  type Texture,
} from "three";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

const DOME_VERTEX = /* glsl */ `
  varying float vHeight;
  void main() {
    vHeight = normalize(position).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const DOME_FRAGMENT = /* glsl */ `
  varying float vHeight;
  void main() {
    // High-key, as on a white product-photo sweep: white overhead, barely gray at the horizon and floor.
    float up = smoothstep(-0.15, 0.9, vHeight);
    float down = smoothstep(-0.9, -0.05, vHeight);
    gl_FragColor = vec4(vec3(mix(0.5, mix(0.8, 1.15, up), down)), 1.0);
  }
`;

const GEM_DOME_FRAGMENT = /* glsl */ `
  varying float vHeight;
  void main() {
    float cap = smoothstep(0.86, 0.98, vHeight);                                   // camera overhead
    float band = smoothstep(-0.25, 0.0, vHeight) * (1.0 - smoothstep(0.12, 0.4, vHeight)); // horizon
    float v = 1.0 - 0.45 * cap - 0.55 * band;
    gl_FragColor = vec4(vec3(v), 1.0);
  }
`;

const EnvMapContext = createContext<Texture | null>(null);

/** The cube map that gems refract and reflect. */
export function useStudioEnvMap() {
  return useContext(EnvMapContext);
}

/**
 * A facet looks bright or dark depending on which patch of the surroundings its light path ends on.
 * Product photos of diamonds are high-key: mostly white, with pale gray facets arranged in the
 * cut's own symmetric pattern. That pattern comes from smooth zones by elevation (a dim cap overhead
 * where the camera blocks the light, a gray band near the horizon), not from random clutter, so the
 * room is a zoned white dome plus a few soft gray discs to break perfect symmetry. Seeded.
 */
function useGemEnvMap(): Texture {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => {
    const target = new WebGLCubeRenderTarget(512, { generateMipmaps: true, minFilter: LinearMipmapLinearFilter });
    const scene = new Scene();
    const room = new Mesh(
      new SphereGeometry(50, 48, 24),
      new ShaderMaterial({ side: BackSide, vertexShader: DOME_VERTEX, fragmentShader: GEM_DOME_FRAGMENT }),
    );
    scene.add(room);

    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const disc = new CircleGeometry(1, 24);
    const materials = ["#141414", "#333333", "#555555", "#777777", "#999999", "#b4b4b4"].map((color) => new MeshBasicMaterial({ color }));
    const origin = new Vector3();
    for (let i = 0; i < 130; i++) {
      const y = 2 * random() - 1;
      const phi = 2 * Math.PI * random();
      const r = Math.sqrt(1 - y * y);
      const mesh = new Mesh(disc, materials[Math.floor(random() * materials.length)]);
      mesh.position.set(r * Math.cos(phi), y, r * Math.sin(phi)).multiplyScalar(20);
      mesh.scale.setScalar(0.8 + 2.7 * random() ** 2); // mostly small, a few large
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
      {/*
        Procedural photo studio for metal, no HDR download. Polished metal only shows what it reflects,
        so the room is built for contrast: a dome that falls from white overhead to dark at the floor,
        hot strip lights for crisp streaks, and black cards whose reflections draw the dark edge lines
        that give jewelry its shape in product photography.
      */}
      <Environment resolution={512}>
        <mesh scale={60}>
          <sphereGeometry args={[1, 48, 24]} />
          <shaderMaterial side={BackSide} vertexShader={DOME_VERTEX} fragmentShader={DOME_FRAGMENT} />
        </mesh>
        <Lightformer form="rect" intensity={2.2} position={[0, 14, 2]} rotation-x={Math.PI / 2} scale={[14, 10, 1]} />
        <Lightformer form="rect" intensity={5} position={[-12, 5, 6]} rotation-y={Math.PI / 2.4} scale={[1.6, 16, 1]} />
        <Lightformer form="rect" intensity={5} position={[12, 6, 3]} rotation-y={-Math.PI / 2.2} scale={[1.2, 16, 1]} />
        <Lightformer form="rect" intensity={2} position={[0, 4, 14]} rotation-y={Math.PI} scale={[16, 5, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[4, 3, -14]} scale={[10, 8, 1]} />
        {[-2.6, -1.2, 0.5, 1.9, 2.9].map((a, i) => (
          <Lightformer
            key={i}
            form="rect"
            color="#1c1c1c"
            position={[11 * Math.sin(a), 1 + (i % 2) * 3, 11 * Math.cos(a)]}
            rotation-y={a + Math.PI}
            scale={[i % 2 ? 1 : 1.8, 12, 1]}
          />
        ))}
      </Environment>
      <EnvMapContext value={gemEnvMap}>{children}</EnvMapContext>
    </>
  );
}
