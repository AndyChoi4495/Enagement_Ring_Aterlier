// 사이드 스톤을 잡는 금속(비드, V컷·U컷 받침, 채널 벽)을 InstancedMesh로 그리는 컴포넌트
// Renders the metal that holds side stones (beads, V/U-cut seats, channel walls) as instanced meshes
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ExtrudeGeometry, Matrix4, Shape, SphereGeometry, type BufferGeometry, type InstancedMesh } from "three";
import type { PaveStyle } from "@/lib/ring/config";
import type { MetalId } from "@/lib/ring/materials";
import { MetalMaterial } from "./MetalMaterial";

type Style = Exclude<PaveStyle, "none">;

/**
 * Layout per style, in stone diameters. `fill` = stone diameter / band width, `pitch` = center
 * spacing, `lift` = height of the stone's girdle above the band surface, `sink` = how far the band's
 * top is lowered under the row so the seats are cut into the band rather than standing on it.
 */
export const PAVE_LAYOUT: Record<Style, { fill: number; pitch: number; lift: number; sink?: number }> = {
  pave: { fill: 0.66, pitch: 1.12, lift: -0.05 },
  french: { fill: 0.82, pitch: 1.08, lift: 0.34 },
  ucut: { fill: 0.82, pitch: 1.08, lift: 0.34 },
  channel: { fill: 0.58, pitch: 1.03, lift: 0.2 },
  inset: { fill: 0.82, pitch: 1.08, lift: -0.05, sink: 0.5 },
};

// Unit geometries for a stone of diameter 1, in the stone's frame: x along the band, y up
// (0 at the girdle), z across the band. Each instance is scaled by its stone's diameter.

/** A block across the band with a V or U notch cut through it; the stone sits in the notch. `bottom` is how far down it reaches. */
function seatGeometry(notch: "v" | "u", pitch: number, bottom = -0.85): BufferGeometry {
  // Slightly longer than the pitch so neighbors overlap and leave no gaps on the curve of the band.
  const half = (pitch / 2) * 1.05;
  const top = 0.05;
  const a = pitch / 2 - 0.07; // leaves a narrow post between neighboring stones
  const shape = new Shape();
  shape.moveTo(-half, bottom);
  shape.lineTo(half, bottom);
  shape.lineTo(half, top);
  shape.lineTo(a, top);
  if (notch === "v") shape.lineTo(0, top - 0.44);
  else for (let i = 1; i < 16; i++) shape.lineTo(a * Math.cos((i / 16) * Math.PI), top - 0.46 * Math.sin((i / 16) * Math.PI) ** 0.75);
  shape.lineTo(-a, top);
  shape.lineTo(-half, top);
  // Narrower than the stone, so from above only the stone and its beads show.
  const g = new ExtrudeGeometry(shape, { depth: 0.92, bevelEnabled: false });
  g.translate(0, 0, -0.46);
  return g;
}

/** Two walls joined by a floor, running along the band; stones sit between the walls. */
function channelGeometry(pitch: number): BufferGeometry {
  const shape = new Shape();
  const points: [number, number][] = [
    [-0.7, -0.6],
    [0.7, -0.6],
    [0.7, 0.06],
    [0.5, 0.06],
    [0.5, -0.35],
    [-0.5, -0.35],
    [-0.5, 0.06],
    [-0.7, 0.06],
  ];
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const g = new ExtrudeGeometry(shape, { depth: pitch * 1.04, bevelEnabled: false });
  g.translate(0, 0, (-pitch * 1.04) / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

const BEAD_RADIUS = 0.11;
/** Bead centers per stone: shared with the neighbor on each side, one near each edge of the row. */
function beadOffsets(style: Style): [number, number, number][] {
  if (style === "channel") return [];
  const { pitch } = PAVE_LAYOUT[style];
  const y = style === "pave" ? 0.1 : 0.09;
  return [-1, 1].flatMap((sx) => [-1, 1].map((sz): [number, number, number] => [(sx * pitch) / 2, y, sz * (style === "pave" ? 0.31 : 0.36)]));
}

/** One instanced metal mesh. Takes ownership of `geometry` and disposes it. */
export function MetalInstances({ geometry, matrices, metal }: { geometry: BufferGeometry; matrices: Matrix4[]; metal: MetalId }) {
  const ref = useRef<InstancedMesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, geometry]);
  if (matrices.length === 0) return null;
  return (
    <instancedMesh key={`${geometry.uuid}-${matrices.length}`} ref={ref} args={[geometry, undefined, matrices.length]} castShadow>
      <MetalMaterial metal={metal} />
    </instancedMesh>
  );
}

export function beadGeometry(): BufferGeometry {
  return new SphereGeometry(1, 12, 8);
}

/** `matrices` place each stone's frame (origin at its girdle center, scaled by its diameter). */
export function PaveMetal({ style, matrices, metal }: { style: Style; matrices: Matrix4[]; metal: MetalId }) {
  const holder = useMemo(() => {
    const { pitch } = PAVE_LAYOUT[style];
    if (style === "french") return seatGeometry("v", pitch);
    if (style === "ucut") return seatGeometry("u", pitch);
    // Shallower than the raised seat: this one starts at the band's top, and must stay inside a thin band.
    if (style === "inset") return seatGeometry("u", pitch, -0.65);
    return style === "channel" ? channelGeometry(pitch) : null;
  }, [style]);
  const beads = useMemo(() => beadGeometry(), []);
  const beadMatrices = useMemo(() => {
    const local = beadOffsets(style).map(([x, y, z]) => new Matrix4().makeTranslation(x, y, z).multiply(new Matrix4().makeScale(BEAD_RADIUS, BEAD_RADIUS, BEAD_RADIUS)));
    return matrices.flatMap((m) => local.map((l) => m.clone().multiply(l)));
  }, [style, matrices]);
  return (
    <>
      {holder && <MetalInstances geometry={holder} matrices={matrices} metal={metal} />}
      <MetalInstances geometry={beads} matrices={beadMatrices} metal={metal} />
    </>
  );
}
