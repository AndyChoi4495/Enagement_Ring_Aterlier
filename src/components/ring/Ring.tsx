// 디자인 설정으로 밴드, 센터 스톤, 세팅(프롱/베젤/헤일로/파베)의 치수를 계산해 조립하는 컴포넌트
// Computes dimensions from the design and assembles band, center stone, and setting (prongs/bezel/halo/pavé)
import { useMemo } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { RingDesign } from "@/lib/ring/config";
import { buildGem } from "@/lib/ring/geometry/gem";
import { haloLayout, meleeRing, paveAngles, type SweepPoint } from "@/lib/ring/geometry/setting";
import { effectiveHalo } from "@/lib/ring/labels";
import { GEMS } from "@/lib/ring/materials";
import { innerDiameterMm, stoneSizeMm } from "@/lib/ring/sizing";
import { Band } from "./Band";
import { CenterStone } from "./CenterStone";
import { Engraving } from "./Engraving";
import { Melee } from "./Melee";
import { Prongs } from "./Prongs";
import { Sweep } from "./Sweep";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Culet height above the band top. */
const STONE_LIFT = 0.6;
/** How far head metal sinks into the band, so it never floats. */
const SEAT_SINK = 0.3;
const BEZEL_WALL = 0.55;
/** Halo melee girdle, relative to the center girdle (slightly below it). */
const HALO_TOP = -0.2;
/** Height of the halo tray; covers the melee pavilions (~0.45 × their diameter). */
const HALO_DEPTH = 0.9;

/** Hidden halo: outline scale of its collar, a little inside the girdle so it tucks under the stone. */
const HIDDEN_SCALE = 0.86;
const UP = new Vector3(0, 1, 0);

const matrix = (position: Vector3, rotationZ = 0) =>
  new Matrix4().compose(position, new Quaternion().setFromEuler(new Euler(0, 0, rotationZ)), new Vector3(1, 1, 1));

export function Ring({ design }: { design: RingDesign }) {
  const { metal, cut, carat, gem, setting, pave } = design;
  const halo = effectiveHalo(design);
  const innerRadius = innerDiameterMm(design.usSize) / 2;
  const outerRadius = innerRadius + design.thickness;

  const stone = useMemo(() => {
    const { length, width } = stoneSizeMm(cut, carat, GEMS[gem].density);
    return buildGem(cut, length, width);
  }, [cut, carat, gem]);

  const W = stone.width;
  const girdleY = outerRadius + STONE_LIFT + stone.girdleHeight / 2 + stone.pavilionDepth;
  const seatY = outerRadius - SEAT_SINK - girdleY; // stone-local y where head metal ends
  const prongRadius = clamp(0.06 * W, 0.35, 0.6);
  const haloMelee = clamp(0.17 * W, 0.9, 1.5);
  const haloGap = setting === "bezel" ? BEZEL_WALL + 0.1 : 2 * prongRadius;

  // Cross-sections swept around the girdle, counter-clockwise from inner-bottom.
  // Bezel: a cup that follows the pavilion down to a narrow stem sunk into the band.
  const bezelProfile = useMemo<SweepPoint[]>(() => {
    const top = stone.girdleHeight / 2 + 0.2;
    return [
      [0, seatY, 0.12],
      [0.25, seatY, 0.3],
      [0.3, -stone.girdleHeight / 2 - stone.pavilionDepth, 0.3],
      [BEZEL_WALL * 0.9, -stone.girdleHeight / 2 - stone.pavilionDepth * 0.5, 0.64],
      [BEZEL_WALL, -stone.girdleHeight / 2 - 0.3],
      [BEZEL_WALL, top],
      [-0.12, top],
    ];
  }, [seatY, stone.girdleHeight, stone.pavilionDepth]);
  // Halo: a shallow tray just deep enough for the melee, carried by the prongs or the bezel wall.
  const haloProfile = useMemo<SweepPoint[]>(() => {
    const top = HALO_TOP - 0.05;
    const bottom = top - HALO_DEPTH;
    return [
      [haloGap - 0.1, bottom],
      [haloGap + haloMelee * 0.7, bottom],
      [haloGap + haloMelee + 0.12, top],
      [haloGap - 0.1, top],
    ];
  }, [haloGap, haloMelee]);

  const haloMatrices = useMemo(
    () =>
      halo === "halo"
        ? haloLayout(cut, stone.length, W, haloMelee, haloGap).map(([x, z]) => matrix(new Vector3(x, girdleY + HALO_TOP, z)))
        : [],
    [halo, cut, stone.length, W, haloMelee, haloGap, girdleY],
  );

  // Hidden halo: melee set into a thin collar under the girdle, tables facing sideways.
  // (effectiveHalo drops it under a bezel, which would cover it completely.)
  const hidden = halo === "hidden";
  const hiddenMelee = clamp(0.14 * W, 0.8, 1.1);
  const hiddenY = -stone.girdleHeight / 2 - 0.2 - hiddenMelee / 2; // stone-local center height
  const hiddenProfile = useMemo<SweepPoint[]>(() => {
    const half = hiddenMelee / 2 + 0.12;
    return [
      [-0.4, hiddenY - half, HIDDEN_SCALE],
      [0, hiddenY - half, HIDDEN_SCALE],
      [0, hiddenY + half, HIDDEN_SCALE],
      [-0.4, hiddenY + half, HIDDEN_SCALE],
    ];
  }, [hiddenMelee, hiddenY]);
  const hiddenMatrices = useMemo(
    () =>
      hidden
        ? meleeRing(cut, stone.length * HIDDEN_SCALE, W * HIDDEN_SCALE, hiddenMelee, -hiddenMelee / 2).map(
            ({ p: [x, z], n: [nx, nz] }) =>
              new Matrix4().compose(
                new Vector3(x, girdleY + hiddenY, z),
                new Quaternion().setFromUnitVectors(UP, new Vector3(nx, 0, nz).normalize()),
                new Vector3(1, 1, 1),
              ),
          )
        : [],
    [hidden, cut, stone.length, W, hiddenMelee, girdleY, hiddenY],
  );

  // Shoulder pavé: one row along the band top, starting just outside the head on both sides.
  const paveMelee = Math.min(1.3, design.width * 0.55);
  const paveMatrices = useMemo(() => {
    if (!pave) return [];
    const r = outerRadius - 0.05; // girdle just under the surface, table just above it
    const headHalfX = halo === "halo" || setting === "bezel" ? 0.38 * W : 0.225 * W + prongRadius;
    const start = Math.asin(Math.min(0.9, (headHalfX + paveMelee / 2 + 0.1) / r));
    return paveAngles(r, paveMelee, start, Math.PI / 4).flatMap((a) =>
      [a, -a].map((phi) => matrix(new Vector3(r * Math.sin(phi), r * Math.cos(phi), 0), -phi)),
    );
  }, [pave, outerRadius, halo, setting, W, prongRadius, paveMelee]);

  return (
    <group>
      <Band metal={metal} profile={design.profile} usSize={design.usSize} width={design.width} thickness={design.thickness} />
      <CenterStone stone={stone} gem={gem} girdleY={girdleY} />
      {setting === "bezel" ? (
        <Sweep cut={cut} stone={stone} profile={bezelProfile} girdleY={girdleY} metal={metal} />
      ) : (
        <Prongs
          cut={cut}
          count={setting === "prong4" ? 4 : 6}
          stone={stone}
          radius={prongRadius}
          girdleY={girdleY}
          bandOuterRadius={outerRadius}
          bandWidth={design.width}
          metal={metal}
        />
      )}
      {hidden && (
        <>
          <Sweep cut={cut} stone={stone} profile={hiddenProfile} girdleY={girdleY} metal={metal} />
          <Melee diameter={hiddenMelee} matrices={hiddenMatrices} />
        </>
      )}
      {halo === "halo" && (
        <>
          <Sweep cut={cut} stone={stone} profile={haloProfile} girdleY={girdleY} metal={metal} />
          <Melee diameter={haloMelee} matrices={haloMatrices} />
        </>
      )}
      {pave && <Melee diameter={paveMelee} matrices={paveMatrices} />}
      {design.engraving.trim() && (
        <Engraving text={design.engraving.trim()} innerRadius={innerRadius} bandWidth={design.width} metal={metal} />
      )}
    </group>
  );
}
