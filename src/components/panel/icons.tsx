// 옵션 타일에 쓰는 선 그림 아이콘 (스톤 모양, 세팅, 헤일로, 숄더, 파베, 밴드 단면)
// Line-art icons for option tiles (stone shapes, settings, halos, shoulders, pavé, band cross-sections)
import { bandProfilePoints, type BandProfile } from "@/lib/ring/bandProfile";
import type { HaloStyle, PaveStyle, SettingStyle } from "@/lib/ring/config";
import type { ShoulderStyle } from "@/lib/ring/geometry/band";
import { girdlePoint } from "@/lib/ring/geometry/gem";
import type { StoneCut } from "@/lib/ring/sizing";

const SVG = { viewBox: "-12 -12 24 24", fill: "none", stroke: "currentColor", strokeWidth: 0.7, strokeLinejoin: "round" } as const;
const ICON = "size-11";

/** Length/width used for icons: elongated cuts drawn taller than wide, as stones are shown face-up. */
const ICON_RATIO: Record<StoneCut, number> = { round: 1, princess: 1, oval: 1.35, cushion: 1.05, emerald: 1.4, pear: 1.5 };

/** Girdle outline as SVG points; the same outline function the 3D stone is built from. */
function outline(cut: StoneCut, scale = 1, samples = 96): [number, number][] {
  const length = 18 * scale;
  const width = length / ICON_RATIO[cut];
  return Array.from({ length: samples }, (_, i) => {
    const [x, z] = girdlePoint(cut, length, width, i / samples);
    return [x, -z]; // stone length runs up the icon
  });
}
const path = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;

export function ShapeIcon({ cut }: { cut: StoneCut }) {
  const outer = outline(cut);
  const table = outline(cut, 0.52);
  // Facet lines from the table to the girdle, at the 8 main directions.
  const spokes = Array.from({ length: 8 }, (_, k) => {
    const i = Math.round(((k + 0.5) / 8) * outer.length) % outer.length;
    return `M${table[i][0].toFixed(2)},${table[i][1].toFixed(2)}L${outer[i][0].toFixed(2)},${outer[i][1].toFixed(2)}`;
  }).join("");
  return (
    <svg {...SVG} className={ICON} aria-hidden>
      <path d={path(outer)} />
      <path d={path(table)} strokeWidth={0.45} />
      <path d={spokes} strokeWidth={0.45} />
    </svg>
  );
}

const dots = (count: number, radius: number, r: number, phase = 0) =>
  Array.from({ length: count }, (_, i) => {
    const a = phase + (i / count) * 2 * Math.PI;
    return <circle key={i} cx={radius * Math.cos(a)} cy={radius * Math.sin(a)} r={r} />;
  });

export function SettingIcon({ setting }: { setting: SettingStyle }) {
  return (
    <svg {...SVG} className={ICON} aria-hidden>
      <circle r={7} />
      <circle r={3.6} strokeWidth={0.45} />
      {setting === "bezel" ? (
        <circle r={8.6} strokeWidth={1.5} />
      ) : (
        <g fill="currentColor" stroke="none">
          {dots(setting === "prong4" ? 4 : 6, 7.6, 1.5, setting === "prong4" ? Math.PI / 4 : Math.PI / 2)}
        </g>
      )}
    </svg>
  );
}

export function HaloIcon({ halo }: { halo: HaloStyle }) {
  if (halo === "hidden") {
    // Side view: the row of small stones sits under the girdle.
    return (
      <svg {...SVG} className={ICON} aria-hidden>
        <path d="M-5,-7H5L9,-3.5H-9ZM-9,-3.5L0,8L9,-3.5" />
        <g strokeWidth={0.45}>{[-5.4, -2.7, 0, 2.7, 5.4].map((x) => <circle key={x} cx={x} cy={-1.4} r={1.15} fill="var(--background)" />)}</g>
      </svg>
    );
  }
  return (
    <svg {...SVG} className={ICON} aria-hidden>
      <circle r={halo === "halo" ? 5.6 : 7} />
      <circle r={halo === "halo" ? 2.9 : 3.6} strokeWidth={0.45} />
      {halo === "halo" && <g strokeWidth={0.45}>{dots(14, 7.9, 1.25)}</g>}
    </svg>
  );
}

// Top view of the band on either side of the head, except cathedral (side view: arms rising to the stone).
const SHOULDER_PATHS: Record<ShoulderStyle, string> = {
  straight: "M-11,-1.6H-3M-11,1.6H-3M3,-1.6H11M3,1.6H11",
  tapered: "M-11,-2.4L-3.2,-0.9M-11,2.4L-3.2,0.9M11,-2.4L3.2,-0.9M11,2.4L3.2,0.9",
  cathedral: "M-11,6C-7,6 -4.5,3 -3.6,-2.2M11,6C7,6 4.5,3 3.6,-2.2M-11,8.4H11M-5,-3.4H5L0,3.4Z",
  split: "M-11,0H-9C-6,0 -5,-3 -2.6,-3.2M-9,0C-6,0 -5,3 -2.6,3.2M11,0H9C6,0 5,-3 2.6,-3.2M9,0C6,0 5,3 2.6,3.2",
  twist:
    "M-11,-1.6C-9,-1.6 -9,1.6 -7,1.6S-5,-1.6 -3.2,-1.6M-11,1.6C-9,1.6 -9,-1.6 -7,-1.6S-5,1.6 -3.2,1.6" +
    "M11,-1.6C9,-1.6 9,1.6 7,1.6S5,-1.6 3.2,-1.6M11,1.6C9,1.6 9,-1.6 7,-1.6S5,1.6 3.2,1.6",
};

export function ShoulderIcon({ shoulder }: { shoulder: ShoulderStyle }) {
  return (
    <svg {...SVG} className={ICON} aria-hidden>
      {shoulder !== "cathedral" && <circle r={3.4} />}
      <path d={SHOULDER_PATHS[shoulder]} />
    </svg>
  );
}

export function PaveIcon({ pave }: { pave: PaveStyle }) {
  const xs = [-8, -4, 0, 4, 8];
  // Side view for the cut styles, which differ in the notch under each stone: V or U.
  if (pave === "french" || pave === "ucut" || pave === "inset") {
    // Inset: a shorter row sunk between two plain stretches of band, stones level with its top.
    const row = pave === "inset" ? [-4, 0, 4] : xs;
    const notch = (x: number) => (pave === "french" ? `L${x},2.6L${x + 1.8},-1.6` : `C${x - 1.8},3 ${x + 1.8},3 ${x + 1.8},-1.6`);
    return (
      <svg {...SVG} className={ICON} aria-hidden>
        <path d={`M-10.5,5.5V-1.6H${row[0] - 1.8}${row.map((x) => `${notch(x)}H${x + 2.2}`).join("")}H10.5V5.5Z`} />
        <g strokeWidth={0.45} transform={pave === "inset" ? "translate(0,1.3)" : undefined}>
          {row.map((x) => (
            <path key={x} d={`M${x - 1.9},-2.6H${x + 1.9}L${x + 1.2},-3.8H${x - 1.2}Z`} />
          ))}
        </g>
      </svg>
    );
  }
  // Top view of the band for the rest.
  return (
    <svg {...SVG} className={ICON} aria-hidden>
      <path d="M-11,-2.6H11M-11,2.6H11" strokeWidth={pave === "channel" ? 1.3 : 0.7} />
      {pave !== "none" && (
        <g strokeWidth={0.45}>
          {xs.map((x) => (
            <circle key={x} cx={x} cy={0} r={pave === "channel" ? 1.95 : 1.45} />
          ))}
          {pave === "pave" && (
            <g fill="currentColor" stroke="none">
              {[-10, -6, -2, 2, 6, 10].flatMap((x) => [-1.5, 1.5].map((y) => <circle key={`${x},${y}`} cx={x} cy={y} r={0.42} />))}
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

export function ProfileIcon({ profile }: { profile: BandProfile }) {
  // Real cross-section, finger side down.
  const pts = bandProfilePoints(profile, { innerRadius: 0, width: 16, thickness: 9 }, 64).map(
    ([x, y]): [number, number] => [y, 4.5 - x],
  );
  return (
    <svg {...SVG} className={ICON} aria-hidden>
      <path d={path(pts)} fill="currentColor" fillOpacity={0.08} />
    </svg>
  );
}
