"use client";
// 단계별(세팅 → 스톤 → 밴드·요약) 옵션 카드
// Stepped option card: setting → stone → band & summary
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  CUTS,
  ENGRAVING_MAX,
  GEM_IDS,
  HALOS,
  METAL_IDS,
  PAVES,
  PRESETS,
  PROFILES,
  SETTINGS,
  SHOULDERS,
  THICKNESS_MAX,
  THICKNESS_MIN,
  WIDTH_MAX,
  WIDTH_MIN,
  ringDesignSchema,
  type RingDesign,
} from "@/lib/ring/config";
import {
  CUT_LABELS,
  GEM_LABELS,
  HALO_LABELS,
  METAL_LABELS,
  PAVE_LABELS,
  PROFILE_LABELS,
  SETTING_LABELS,
  SHOULDER_LABELS,
  designSummary,
  effectiveHalo,
  effectivePave,
  stoneSizeLabel,
} from "@/lib/ring/labels";
import { GEMS, METALS } from "@/lib/ring/materials";
import { CARAT_MAX, CARAT_MIN, innerDiameterMm, US_SIZE_MAX, US_SIZE_MIN } from "@/lib/ring/sizing";
import { useRingStore } from "@/store/ringStore";
import { RangeRow, Row, Swatch, Tile, Tiles } from "./controls";
import { HaloIcon, PaveIcon, ProfileIcon, SettingIcon, ShapeIcon, ShoulderIcon } from "./icons";
import { ShareActions } from "./ShareActions";

export const STEPS = ["Setting", "Stone", "Band"] as const;

/** Common carat weights offered as one-tap chips; the slider under them covers everything between. */
const CARAT_CHIPS = [0.5, 0.75, 1, 1.5, 2, 2.5, 3];

// Presets ignore the engraving, so it is left out of the comparison too.
const matchesPreset = (a: RingDesign, b: RingDesign) =>
  (Object.keys(a) as (keyof RingDesign)[]).every((k) => k === "engraving" || a[k] === b[k]);

function SettingStep() {
  const design = useRingStore((s) => s.design);
  const update = useRingStore((s) => s.update);
  const setDesign = useRingStore((s) => s.setDesign);
  const halo = effectiveHalo(design);
  const pave = effectivePave(design);
  return (
    <>
      <Row label="Ring style">
        <Tiles>
          {PRESETS.map((p) => (
            <Tile
              key={p.id}
              selected={matchesPreset(design, p.design)}
              // Keep the engraving: it is personal, not part of the style.
              onSelect={() => setDesign({ ...p.design, engraving: design.engraving })}
              icon={<ShapeIcon cut={p.design.cut} />}
            >
              {p.name}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <Row label="Setting">
        <Tiles>
          {SETTINGS.map((id) => (
            <Tile key={id} selected={design.setting === id} onSelect={() => update({ setting: id })} icon={<SettingIcon setting={id} />}>
              {SETTING_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <Row label="Halo">
        <Tiles>
          {HALOS.map((id) => (
            <Tile
              key={id}
              selected={halo === id}
              // A bezel wall covers the area under the girdle where a hidden halo sits.
              disabled={id === "hidden" && design.setting === "bezel"}
              onSelect={() => update({ halo: id })}
              icon={<HaloIcon halo={id} />}
            >
              {HALO_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <Row label="Shoulders">
        <Tiles>
          {SHOULDERS.map((id) => (
            <Tile key={id} selected={design.shoulder === id} onSelect={() => update({ shoulder: id })} icon={<ShoulderIcon shoulder={id} />}>
              {SHOULDER_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <Row label="Side stones">
        <Tiles>
          {PAVES.map((id) => (
            <Tile
              key={id}
              selected={pave === id}
              // The woven strands of a twisted band leave no flat top for a row of stones.
              disabled={id !== "none" && design.shoulder === "twist"}
              onSelect={() => update({ pave: id })}
              icon={<PaveIcon pave={id} />}
            >
              {PAVE_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <Row label="Ring metal">
        <Tiles>
          {METAL_IDS.map((id) => (
            <Tile key={id} selected={design.metal === id} onSelect={() => update({ metal: id })} icon={<Swatch color={METALS[id].color} />}>
              {METAL_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
    </>
  );
}

function StoneStep() {
  const design = useRingStore((s) => s.design);
  const update = useRingStore((s) => s.update);
  return (
    <>
      <Row label="Shape">
        <Tiles>
          {CUTS.map((id) => (
            <Tile key={id} selected={design.cut === id} onSelect={() => update({ cut: id })} icon={<ShapeIcon cut={id} />}>
              {CUT_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <Row label="Carat" hint={`${design.carat.toFixed(2)} ct · ${stoneSizeLabel(design)}`}>
        <Tiles>
          {CARAT_CHIPS.map((ct) => (
            <Tile key={ct} className="min-w-0 px-2 py-1.5" selected={Math.abs(design.carat - ct) < 0.001} onSelect={() => update({ carat: ct })}>
              {ct.toFixed(2)} ct
            </Tile>
          ))}
        </Tiles>
        <Slider
          aria-label="Carat"
          className="mt-4"
          value={design.carat}
          min={CARAT_MIN}
          max={CARAT_MAX}
          step={0.05}
          onValueChange={(v) => update({ carat: typeof v === "number" ? v : v[0] })}
        />
      </Row>
      <Row label="Gemstone">
        <Tiles>
          {GEM_IDS.map((id) => (
            <Tile key={id} selected={design.gem === id} onSelect={() => update({ gem: id })} icon={<Swatch color={GEMS[id].color} />}>
              {GEM_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
    </>
  );
}

function BandStep() {
  const design = useRingStore((s) => s.design);
  const update = useRingStore((s) => s.update);
  return (
    <>
      <Row label="Band profile">
        <Tiles>
          {PROFILES.map((id) => (
            <Tile key={id} selected={design.profile === id} onSelect={() => update({ profile: id })} icon={<ProfileIcon profile={id} />}>
              {PROFILE_LABELS[id]}
            </Tile>
          ))}
        </Tiles>
      </Row>
      <RangeRow
        label="Ring size"
        display={`US ${design.usSize} · ⌀ ${innerDiameterMm(design.usSize).toFixed(1)} mm`}
        value={design.usSize}
        min={US_SIZE_MIN}
        max={US_SIZE_MAX}
        step={0.25}
        onChange={(usSize) => update({ usSize })}
      />
      <RangeRow
        label="Band width"
        display={`${design.width.toFixed(1)} mm`}
        value={design.width}
        min={WIDTH_MIN}
        max={WIDTH_MAX}
        step={0.1}
        onChange={(width) => update({ width })}
      />
      <RangeRow
        label="Thickness"
        display={`${design.thickness.toFixed(1)} mm`}
        value={design.thickness}
        min={THICKNESS_MIN}
        max={THICKNESS_MAX}
        step={0.1}
        onChange={(thickness) => update({ thickness })}
      />
      <Row label="Engraving" hint={`${design.engraving.length}/${ENGRAVING_MAX} · inside the band`}>
        <Input
          aria-label="Inner engraving"
          value={design.engraving}
          maxLength={ENGRAVING_MAX}
          placeholder="e.g. Forever · 2026.11.13"
          className="font-serif text-base italic"
          onChange={(e) => {
            const engraving = e.target.value;
            if (ringDesignSchema.shape.engraving.safeParse(engraving).success) update({ engraving });
          }}
        />
      </Row>
      <Row label="Your ring">
        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
          {designSummary(design).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-neutral-500">{label}</dt>
              <dd className="text-neutral-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <ShareActions />
        </div>
      </Row>
    </>
  );
}

export function RingPanel({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  return (
    <div className="flex flex-col px-5 md:px-7">
      {step === 0 ? <SettingStep /> : step === 1 ? <StoneStep /> : <BandStep />}
      <div className="flex items-center justify-between gap-3 border-t border-neutral-200 py-4">
        <Button variant="ghost" disabled={step === 0} onClick={() => onStep(step - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button className="px-6" onClick={() => onStep(step + 1)}>
            Next: {STEPS[step + 1]}
          </Button>
        )}
      </div>
    </div>
  );
}
