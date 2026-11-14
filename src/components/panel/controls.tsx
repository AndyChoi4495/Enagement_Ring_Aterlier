"use client";
// 패널 탭들이 공유하는 입력 컨트롤 (옵션 선택, 슬라이더, 켜기/끄기)
// Input controls shared by the panel tabs (option picker, slider, on/off switch)
import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function Field({ label, value, children }: { label: string; value?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        {value !== undefined && <span className="text-muted-foreground tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  swatch?: string;
}

export function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={1}
        className="w-full flex-wrap"
        value={[value]}
        // Clicking the active item would deselect it; ignore that so one option stays chosen.
        onValueChange={(next) => next[0] && onChange(next[0] as T)}
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} className="grow basis-[30%] data-pressed:border-foreground">
            {o.swatch && (
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full border border-black/15"
                style={{ background: o.swatch }}
              />
            )}
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}

export function RangeField({
  label,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} value={display}>
      <Slider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(typeof v === "number" ? v : v[0])}
      />
    </Field>
  );
}

export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Field label={label}>
      <Toggle variant="outline" size="sm" className="w-full" pressed={checked} onPressedChange={onChange}>
        {checked ? "On" : "Off"}
      </Toggle>
    </Field>
  );
}
