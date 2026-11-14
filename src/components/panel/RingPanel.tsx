"use client";
// 프리셋과 금속·스톤·세팅·밴드 탭으로 디자인을 바꾸는 편집 패널
// Editing panel: presets plus metal, stone, setting, and band tabs
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CUTS,
  ENGRAVING_MAX,
  GEM_IDS,
  METAL_IDS,
  PRESETS,
  PROFILES,
  SETTINGS,
  THICKNESS_MAX,
  THICKNESS_MIN,
  WIDTH_MAX,
  WIDTH_MIN,
  ringDesignSchema,
  type RingDesign,
} from "@/lib/ring/config";
import { GEMS, METALS } from "@/lib/ring/materials";
import { CARAT_MAX, CARAT_MIN, innerDiameterMm, stoneSizeMm, US_SIZE_MAX, US_SIZE_MIN } from "@/lib/ring/sizing";
import { useDesignUrlSync } from "@/hooks/useDesignUrlSync";
import { useRingStore } from "@/store/ringStore";
import { OptionPicker, RangeField, Switch, Field } from "./controls";
import { ShareActions } from "./ShareActions";

const METAL_LABELS: Record<RingDesign["metal"], string> = {
  platinum: "Platinum",
  yellowGold: "Yellow gold",
  whiteGold: "White gold",
  roseGold: "Rose gold",
};
const GEM_LABELS: Record<RingDesign["gem"], string> = {
  diamond: "Diamond",
  sapphire: "Sapphire",
  ruby: "Ruby",
  emerald: "Emerald",
  moissanite: "Moissanite",
};
const CUT_LABELS: Record<RingDesign["cut"], string> = {
  round: "Round",
  princess: "Princess",
  oval: "Oval",
  cushion: "Cushion",
  emerald: "Emerald",
  pear: "Pear",
};
const SETTING_LABELS: Record<RingDesign["setting"], string> = {
  prong4: "4 prongs",
  prong6: "6 prongs",
  bezel: "Bezel",
};
const PROFILE_LABELS: Record<RingDesign["profile"], string> = {
  comfort: "Comfort fit",
  flat: "Flat",
  knife: "Knife edge",
};

// Presets ignore the engraving, so it is left out of the comparison too.
const matchesPreset = (a: RingDesign, b: RingDesign) =>
  (Object.keys(a) as (keyof RingDesign)[]).every((k) => k === "engraving" || a[k] === b[k]);

export function RingPanel() {
  const design = useRingStore((s) => s.design);
  const update = useRingStore((s) => s.update);
  const setDesign = useRingStore((s) => s.setDesign);
  useDesignUrlSync();

  const stoneMm = stoneSizeMm(design.cut, design.carat, GEMS[design.gem].density);
  const stoneLabel =
    design.cut === "round" ? `${stoneMm.length.toFixed(1)} mm` : `${stoneMm.length.toFixed(1)} × ${stoneMm.width.toFixed(1)} mm`;

  return (
    <div className="flex flex-col gap-5 p-4">
      <ShareActions />
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium text-muted-foreground">Presets</h2>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={matchesPreset(design, p.design) ? "default" : "outline"}
              // Keep the engraving: it is personal, not part of the style.
              onClick={() => setDesign({ ...p.design, engraving: design.engraving })}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </section>

      <Tabs defaultValue="metal">
        <TabsList className="w-full">
          <TabsTrigger value="metal">Metal</TabsTrigger>
          <TabsTrigger value="stone">Stone</TabsTrigger>
          <TabsTrigger value="setting">Setting</TabsTrigger>
          <TabsTrigger value="band">Band</TabsTrigger>
        </TabsList>

        <TabsContent value="metal" className="flex flex-col gap-5 pt-3">
          <OptionPicker
            label="Metal"
            value={design.metal}
            onChange={(metal) => update({ metal })}
            options={METAL_IDS.map((id) => ({ value: id, label: METAL_LABELS[id], swatch: METALS[id].color }))}
          />
        </TabsContent>

        <TabsContent value="stone" className="flex flex-col gap-5 pt-3">
          <OptionPicker
            label="Cut"
            value={design.cut}
            onChange={(cut) => update({ cut })}
            options={CUTS.map((id) => ({ value: id, label: CUT_LABELS[id] }))}
          />
          <RangeField
            label="Carat"
            display={`${design.carat.toFixed(2)} ct · ${stoneLabel}`}
            value={design.carat}
            min={CARAT_MIN}
            max={CARAT_MAX}
            step={0.05}
            onChange={(carat) => update({ carat })}
          />
          <OptionPicker
            label="Gem"
            value={design.gem}
            onChange={(gem) => update({ gem })}
            options={GEM_IDS.map((id) => ({ value: id, label: GEM_LABELS[id], swatch: GEMS[id].color }))}
          />
        </TabsContent>

        <TabsContent value="setting" className="flex flex-col gap-5 pt-3">
          <OptionPicker
            label="Head"
            value={design.setting}
            onChange={(setting) => update({ setting })}
            options={SETTINGS.map((id) => ({ value: id, label: SETTING_LABELS[id] }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Switch label="Halo" checked={design.halo} onChange={(halo) => update({ halo })} />
            <Switch label="Shoulder pavé" checked={design.pave} onChange={(pave) => update({ pave })} />
          </div>
        </TabsContent>

        <TabsContent value="band" className="flex flex-col gap-5 pt-3">
          <OptionPicker
            label="Profile"
            value={design.profile}
            onChange={(profile) => update({ profile })}
            options={PROFILES.map((id) => ({ value: id, label: PROFILE_LABELS[id] }))}
          />
          <RangeField
            label="Ring size"
            display={`US ${design.usSize} · ⌀ ${innerDiameterMm(design.usSize).toFixed(1)} mm`}
            value={design.usSize}
            min={US_SIZE_MIN}
            max={US_SIZE_MAX}
            step={0.25}
            onChange={(usSize) => update({ usSize })}
          />
          <RangeField
            label="Width"
            display={`${design.width.toFixed(1)} mm`}
            value={design.width}
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={0.1}
            onChange={(width) => update({ width })}
          />
          <RangeField
            label="Thickness"
            display={`${design.thickness.toFixed(1)} mm`}
            value={design.thickness}
            min={THICKNESS_MIN}
            max={THICKNESS_MAX}
            step={0.1}
            onChange={(thickness) => update({ thickness })}
          />
          <Field label="Inner engraving" value={`${design.engraving.length}/${ENGRAVING_MAX}`}>
            <Input
              value={design.engraving}
              maxLength={ENGRAVING_MAX}
              placeholder="e.g. Forever · 2026.11.13"
              onChange={(e) => {
                const engraving = e.target.value;
                if (ringDesignSchema.shape.engraving.safeParse(engraving).success) update({ engraving });
              }}
            />
          </Field>
        </TabsContent>
      </Tabs>
    </div>
  );
}
