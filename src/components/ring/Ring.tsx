// 디자인 설정으로 밴드, 센터 스톤, 세팅(프롱/베젤/헤일로/파베)의 치수를 계산해 조립하는 컴포넌트
// Computes dimensions from the design and assembles band, center stone, and setting (prongs/bezel/halo/pavé)
import { useMemo } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { RingDesign } from "@/lib/ring/config";
import { buildGem } from "@/lib/ring/geometry/gem";
import { haloLayout, paveAngles, type SweepPoint } from "@/lib/ring/geometry/setting";
import { GEMS } from "@/lib/ring/materials";
import { innerDiameterMm, stoneSizeMm } from "@/lib/ring/sizing";
import { Band } from "./Band";
import { CenterStone } from "./CenterStone";
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

const matrix = (position: Vector3, rotationZ = 0) =>
  new Matrix4().compose(position, new Quaternion().setFromEuler(new Euler(0, 0, rotationZ)), new Vector3(1, 1, 1));

export function Ring({ design }: { design: RingDesign }) {
  const { metal, cut, carat, gem, setting, halo, pave } = design;
  const outerRadius = innerDiameterMm(design.usSize) / 2 + design.thickness;

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

  // Collar profiles, counter-clockwise from inner-bottom. Both taper to a scaled-down outline
  // where they sink into the band.
  const bezelProfile = useMemo<SweepPoint[]>(
    () => [[0, seatY, 0.4], [0, seatY, 0.75], [BEZEL_WALL, stone.girdleHeight / 2 + 0.2], [-0.12, stone.girdleHeight / 2 + 0.2]],
    [seatY, stone.girdleHeight],
  );
  const haloProfile = useMemo<SweepPoint[]>(
    () => [[0, seatY, 0.4], [0, seatY, 0.75], [haloGap + haloMelee + 0.1, HALO_TOP - 0.05], [haloGap - 0.1, HALO_TOP - 0.05]],
    [seatY, haloGap, haloMelee],
  );

  const haloMatrices = useMemo(
    () =>
      halo
        ? haloLayout(cut, stone.length, W, haloMelee, haloGap).map(([x, z]) => matrix(new Vector3(x, girdleY + HALO_TOP, z)))
        : [],
    [halo, cut, stone.length, W, haloMelee, haloGap, girdleY],
  );

  // Shoulder pavé: one row along the band top, starting just outside the head on both sides.
  const paveMelee = Math.min(1.3, design.width * 0.55);
  const paveMatrices = useMemo(() => {
    if (!pave) return [];
    const r = outerRadius - 0.05; // girdle just under the surface, table just above it
    const headHalfX = halo || setting === "bezel" ? 0.38 * W : 0.225 * W + prongRadius;
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
      {halo && (
        <>
          <Sweep cut={cut} stone={stone} profile={haloProfile} girdleY={girdleY} metal={metal} />
          <Melee diameter={haloMelee} matrices={haloMatrices} />
        </>
      )}
      {pave && <Melee diameter={paveMelee} matrices={paveMatrices} />}
    </group>
  );
}
