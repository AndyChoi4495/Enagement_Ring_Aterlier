// 디자인 설정으로 밴드, 센터 스톤, 세팅(프롱/베젤/헤일로/파베)의 치수를 계산해 조립하는 컴포넌트
// Computes dimensions from the design and assembles band, center stone, and setting (prongs/bezel/halo/pavé)
import { useMemo } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { RingDesign } from "@/lib/ring/config";
import { buildGem } from "@/lib/ring/geometry/gem";
import { bandStrands, groovedStrand, paveRow } from "@/lib/ring/geometry/band";
import { haloLayout, meleeRing, type SweepPoint } from "@/lib/ring/geometry/setting";
import { effectiveHalo, effectivePave, isHiddenHalo } from "@/lib/ring/labels";
import { GEMS } from "@/lib/ring/materials";
import { innerDiameterMm, stoneSizeMm } from "@/lib/ring/sizing";
import { Band } from "./Band";
import { CenterStone } from "./CenterStone";
import { Engraving } from "./Engraving";
import { Melee } from "./Melee";
import { MetalInstances, PAVE_LAYOUT, PaveMetal, beadGeometry } from "./PaveMetal";
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
/** Hidden halo over the prongs: height of its center, as a fraction of the pavilion depth below the girdle. */
const HIDDEN_OVER_DEPTH = 0.5;
const UP = new Vector3(0, 1, 0);

/** Gallery rail: a thin wire joining the prongs partway down the pavilion, as in a basket head. */
const RAIL_DEPTH = 0.55; // fraction of the pavilion depth below the girdle
const RAIL_SCALE = 0.72; // outline scale of the prong centers at that height


const matrix = (position: Vector3, rotationZ = 0) =>
  new Matrix4().compose(position, new Quaternion().setFromEuler(new Euler(0, 0, rotationZ)), new Vector3(1, 1, 1));

export function Ring({ design }: { design: RingDesign }) {
  const { metal, cut, carat, gem, setting, shoulder } = design;
  const pave = effectivePave(design);
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
  const prongRadius = clamp(0.05 * W, 0.3, 0.5);
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

  // Prongs pass through the rail on their way from the band to the girdle.
  const rail = useMemo(
    () => ({ y: -stone.girdleHeight / 2 - RAIL_DEPTH * stone.pavilionDepth, scale: RAIL_SCALE, offset: 0.5 * prongRadius }),
    [stone.girdleHeight, stone.pavilionDepth, prongRadius],
  );
  const railProfile = useMemo<SweepPoint[]>(() => {
    const rr = 0.7 * prongRadius;
    return Array.from({ length: 10 }, (_, i): SweepPoint => {
      const a = (i / 10) * 2 * Math.PI;
      return [rail.offset + rr * Math.cos(a), rail.y + rr * Math.sin(a), rail.scale];
    });
  }, [rail, prongRadius]);

  // Hidden halo: melee set into a thin collar under the girdle, tables facing sideways.
  // (effectiveHalo drops it under a bezel, which would cover it completely.)
  const hidden = isHiddenHalo(halo);
  // Over the prongs: a slim micro-pavé ring partway down the pavilion, wrapped around the outside
  // of the prongs. That low, the prongs are well inside the girdle, so it stays hidden from above.
  const over = halo === "hiddenOver";
  const hiddenMelee = over ? clamp(0.1 * W, 0.6, 0.85) : clamp(0.14 * W, 0.8, 1.1);
  // Stone-local center height.
  const hiddenY = over ? -stone.girdleHeight / 2 - HIDDEN_OVER_DEPTH * stone.pavilionDepth : -stone.girdleHeight / 2 - 0.2 - hiddenMelee / 2;
  const hiddenHalf = hiddenMelee / 2 + (over ? 0.08 : 0.12);
  // The collar's outer face: [offset, scale] of the girdle outline. Over the prongs it is the
  // prongs' outer edge at the collar's top, where they are farthest out (taking a prong as straight
  // between the rail and the girdle), so the whole height of the collar covers them.
  const [hiddenOffset, hiddenScale] = useMemo((): [number, number] => {
    if (!over) return [0, HIDDEN_SCALE];
    const t = 1 - (hiddenY + hiddenHalf) / rail.y;
    return [rail.offset + (prongRadius - rail.offset) * t + prongRadius, rail.scale + (1 - rail.scale) * t];
  }, [over, hiddenY, hiddenHalf, rail, prongRadius]);
  const hiddenProfile = useMemo<SweepPoint[]>(() => {
    const wall = over ? 0.45 : 0.4;
    return [
      [hiddenOffset - wall, hiddenY - hiddenHalf, hiddenScale],
      [hiddenOffset, hiddenY - hiddenHalf, hiddenScale],
      [hiddenOffset, hiddenY + hiddenHalf, hiddenScale],
      [hiddenOffset - wall, hiddenY + hiddenHalf, hiddenScale],
    ];
  }, [over, hiddenY, hiddenHalf, hiddenOffset, hiddenScale]);
  // Melee on the collar's face, and for the pavé look over the prongs, a pair of beads between
  // each two neighbors.
  const { hiddenMatrices, hiddenBeadMatrices } = useMemo(() => {
    if (!hidden) return { hiddenMatrices: [], hiddenBeadMatrices: [] };
    const ring = meleeRing(cut, stone.length * hiddenScale, W * hiddenScale, hiddenMelee, hiddenOffset - hiddenMelee / 2);
    const beadScale = new Vector3().setScalar(0.1 * hiddenMelee);
    return {
      hiddenMatrices: ring.map(({ p: [x, z], n: [nx, nz] }) =>
        new Matrix4().compose(
          new Vector3(x, girdleY + hiddenY, z),
          new Quaternion().setFromUnitVectors(UP, new Vector3(nx, 0, nz).normalize()),
          new Vector3(1, 1, 1),
        ),
      ),
      hiddenBeadMatrices: over
        ? ring.flatMap(({ p: [x, z], n: [nx, nz] }, i) => {
            const [x2, z2] = ring[(i + 1) % ring.length].p;
            return [-0.4, 0.4].map((k) =>
              new Matrix4().compose(
                new Vector3((x + x2) / 2 + nx * 0.04, girdleY + hiddenY + k * hiddenMelee, (z + z2) / 2 + nz * 0.04),
                new Quaternion(),
                beadScale,
              ),
            );
          })
        : [],
    };
  }, [hidden, over, cut, stone.length, W, hiddenMelee, girdleY, hiddenY, hiddenOffset, hiddenScale]);

  // Band: the shoulders are shaped to meet this head.
  const strands = useMemo(() => {
    const spread = Math.max(0.2 * stone.length, 0.275 * design.width + 0.25);
    return bandStrands(
      shoulder,
      { innerRadius, width: design.width, thickness: design.thickness },
      { armEndX: (RAIL_SCALE * W) / 2, armTopY: girdleY + rail.y + 0.1, spread },
    );
  }, [shoulder, innerRadius, design.width, design.thickness, stone.length, W, girdleY, rail.y]);
  // Band width right under the stone, where the prong feet must land.
  const top = strands[0].section(0);
  const footZ = useMemo(() => {
    if (shoulder === "split") return (z: number) => (z < 0 ? -1 : 1) * Math.abs(top.z);
    const limit = Math.max(0, top.width / 2 - prongRadius);
    return (z: number) => clamp(z * 0.45, -limit, limit);
  }, [shoulder, top.z, top.width, prongRadius]);

  // Halo beads: a pair between each two neighboring melee, the tiny prongs that hold them.
  const haloBeads = useMemo(() => beadGeometry(), []);
  const haloBeadMatrices = useMemo(() => {
    if (halo !== "halo") return [];
    const ring = meleeRing(cut, stone.length, W, haloMelee, haloGap);
    const scale = new Vector3().setScalar(0.11 * haloMelee);
    return ring.flatMap(({ p: [x, z], n: [nx, nz] }, i) => {
      const [x2, z2] = ring[(i + 1) % ring.length].p;
      return [-0.36, 0.36].map((k) =>
        new Matrix4().compose(
          new Vector3((x + x2) / 2 + nx * k * haloMelee, girdleY + HALO_TOP + 0.08 * haloMelee, (z + z2) / 2 + nz * k * haloMelee),
          new Quaternion(),
          scale,
        ),
      );
    });
  }, [halo, cut, stone.length, W, haloMelee, haloGap, girdleY]);

  // Side stones: one row along the top of each strand, starting just outside the head on both sides.
  const paveRows = useMemo(() => {
    if (pave === "none") return [];
    const { fill, pitch } = PAVE_LAYOUT[pave];
    const headHalfX =
      shoulder === "cathedral" ? (RAIL_SCALE * W) / 2 : halo === "halo" || setting === "bezel" ? 0.38 * W : 0.225 * W + prongRadius;
    // Coverage is the share of the circumference, centered on the stone, that the rows reach.
    const end = (design.coverage / 100) * Math.PI;
    const start = Math.asin(Math.min(0.9, (headHalfX + 0.7) / outerRadius));
    return strands.map((strand) =>
      ([1, -1] as const).map((side) =>
        paveRow(strand, innerRadius, start, end - start, side, fill, pitch)
          // Where split strands merge, their two rows would run into each other.
          .filter(({ z, diameter }) => shoulder !== "split" || 2 * Math.abs(z) > (diameter / fill) * 0.85),
      ),
    );
  }, [pave, design.coverage, strands, innerRadius, outerRadius, shoulder, halo, setting, W, prongRadius]);
  // Each matrix is a stone's frame: origin at its girdle center, y outward, scaled by its diameter.
  const paveMatrices = useMemo(() => {
    if (pave === "none") return [];
    const { lift } = PAVE_LAYOUT[pave];
    return paveRows.flat(2).map(({ x, y, z, diameter, rotationZ }) => {
      const up = lift * diameter;
      return new Matrix4().compose(
        new Vector3(x - Math.sin(rotationZ) * up, y + Math.cos(rotationZ) * up, z),
        new Quaternion().setFromEuler(new Euler(0, 0, rotationZ)),
        new Vector3().setScalar(diameter),
      );
    });
  }, [pave, paveRows]);
  // Inset styles cut their seats into the band: the band is lowered under each row.
  const bandStrandsCut = useMemo(() => {
    if (pave === "none") return strands;
    const { fill, sink } = PAVE_LAYOUT[pave];
    return sink ? strands.map((strand, i) => groovedStrand(strand, paveRows[i], fill, sink)) : strands;
  }, [pave, strands, paveRows]);

  return (
    <group>
      <Band metal={metal} profile={design.profile} innerRadius={innerRadius} strands={bandStrandsCut} />
      <CenterStone stone={stone} gem={gem} girdleY={girdleY} />
      {setting === "bezel" ? (
        <Sweep cut={cut} stone={stone} profile={bezelProfile} girdleY={girdleY} metal={metal} />
      ) : (
        <>
          <Prongs
            cut={cut}
            count={setting === "prong4" ? 4 : 6}
            stone={stone}
            radius={prongRadius}
            girdleY={girdleY}
            bandOuterRadius={outerRadius}
            footZ={footZ}
            rail={rail}
            metal={metal}
          />
          <Sweep cut={cut} stone={stone} profile={railProfile} girdleY={girdleY} metal={metal} />
        </>
      )}
      {hidden && (
        <>
          <Sweep cut={cut} stone={stone} profile={hiddenProfile} girdleY={girdleY} metal={metal} />
          <Melee diameter={hiddenMelee} matrices={hiddenMatrices} />
          <MetalInstances geometry={haloBeads} matrices={hiddenBeadMatrices} metal={metal} />
        </>
      )}
      {halo === "halo" && (
        <>
          <Sweep cut={cut} stone={stone} profile={haloProfile} girdleY={girdleY} metal={metal} />
          <Melee diameter={haloMelee} matrices={haloMatrices} />
          <MetalInstances geometry={haloBeads} matrices={haloBeadMatrices} metal={metal} />
        </>
      )}
      {pave !== "none" && (
        <>
          <Melee diameter={1} matrices={paveMatrices} />
          <PaveMetal style={pave} matrices={paveMatrices} metal={metal} />
        </>
      )}
      {design.engraving.trim() && (
        <Engraving text={design.engraving.trim()} innerRadius={innerRadius} bandWidth={design.width} metal={metal} />
      )}
    </group>
  );
}
