// 거들을 따라 놓인 클로 프롱(끝으로 갈수록 가늘어지는 튜브)을 그리는 컴포넌트
// Renders claw prongs (tubes that taper toward the tip) placed around the girdle
import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Vector3 } from "three";
import type { GemGeometry } from "@/lib/ring/geometry/gem";
import { prongSamples } from "@/lib/ring/geometry/setting";
import type { MetalId } from "@/lib/ring/materials";
import type { StoneCut } from "@/lib/ring/sizing";
import { MetalMaterial } from "./MetalMaterial";

interface ProngsProps {
  cut: StoneCut;
  count: 4 | 6;
  stone: GemGeometry;
  /** Prong wire radius at the girdle, in mm. */
  radius: number;
  girdleY: number;
  bandOuterRadius: number;
  /** Axial position of a prong's foot on the band, given the prong's z at the girdle. */
  footZ: (z: number) => number;
  /** Where the prongs pass the gallery rail: stone-local y, outline scale, and outward offset. */
  rail: { y: number; scale: number; offset: number };
  metal: MetalId;
}

const TUBE_SEGMENTS = 40;
const RADIAL_SEGMENTS = 12;
/** Tip radius relative to the prong radius. */
const TIP = 0.55;

/** Thickest at the foot, slightly slimmer at the girdle, then tapering into the claw. */
function radiusAt(t: number): number {
  if (t < 0.8) return 1.2 - 0.3 * (t / 0.8);
  const s = (t - 0.8) / 0.2;
  return 0.9 - (0.9 - TIP) * s * s;
}

function taperedTube(curve: CatmullRomCurve3, r: number): BufferGeometry {
  const frames = curve.computeFrenetFrames(TUBE_SEGMENTS, false);
  const positions: number[] = [];
  const indices: number[] = [];
  const p = new Vector3();
  for (let i = 0; i <= TUBE_SEGMENTS; i++) {
    const t = i / TUBE_SEGMENTS;
    curve.getPointAt(t, p);
    const rr = r * radiusAt(t);
    for (let k = 0; k < RADIAL_SEGMENTS; k++) {
      const a = (k / RADIAL_SEGMENTS) * 2 * Math.PI;
      const c = Math.cos(a) * rr;
      const s = Math.sin(a) * rr;
      const n = frames.normals[i];
      const b = frames.binormals[i];
      positions.push(p.x + n.x * c + b.x * s, p.y + n.y * c + b.y * s, p.z + n.z * c + b.z * s);
    }
  }
  for (let i = 0; i < TUBE_SEGMENTS; i++) {
    for (let k = 0; k < RADIAL_SEGMENTS; k++) {
      const k1 = (k + 1) % RADIAL_SEGMENTS;
      const [a, b, c, d] = [i * RADIAL_SEGMENTS + k, i * RADIAL_SEGMENTS + k1, (i + 1) * RADIAL_SEGMENTS + k, (i + 1) * RADIAL_SEGMENTS + k1];
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function Prongs({ cut, count, stone, radius: r, girdleY, bandOuterRadius, footZ, rail, metal }: ProngsProps) {
  // Coordinates are local to the stone: girdle middle at y = 0.
  const prongs = useMemo(
    () =>
      prongSamples(cut, count, stone.length, stone.width).map(({ p: [x, z], n: [nx, nz] }) => {
        const out = (offset: number, y: number, s = 1) => new Vector3(x * s + nx * offset, y, z * s + nz * offset);
        // The foot converges toward the band and sinks into it.
        const bx = x * 0.45;
        const by = Math.sqrt(bandOuterRadius ** 2 - bx ** 2) - 0.25 - girdleY;
        const top = stone.girdleHeight / 2;
        // The claw bends over the crown and rests on it.
        const tip = out(-0.9 * r, top + 1.05 * r);
        const curve = new CatmullRomCurve3([
          new Vector3(bx, by, footZ(z)),
          out(rail.offset, rail.y, rail.scale),
          out(r, 0),
          out(0.6 * r, top + 0.75 * r),
          tip,
        ]);
        return { geometry: taperedTube(curve, r), tip };
      }),
    [cut, count, stone, r, girdleY, bandOuterRadius, footZ, rail],
  );
  useEffect(() => () => prongs.forEach((p) => p.geometry.dispose()), [prongs]);

  return (
    <group position-y={girdleY}>
      {prongs.map(({ geometry, tip }, i) => (
        <group key={i}>
          <mesh geometry={geometry} castShadow>
            <MetalMaterial metal={metal} />
          </mesh>
          <mesh position={tip} castShadow>
            <sphereGeometry args={[r * TIP, 12, 8]} />
            <MetalMaterial metal={metal} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
