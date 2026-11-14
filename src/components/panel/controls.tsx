"use client";
// 옵션 카드의 공용 컨트롤 (항목 줄, 선택 타일, 색상 칩, 슬라이더)
// Shared controls for the option card (labelled row, option tile, swatch, slider)
import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";

/** One labelled row of the option card: label on the left (above on mobile), options on the right. */
export function Row({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-x-6 gap-y-3 border-b border-neutral-200 py-5 last:border-b-0 md:grid-cols-[9.5rem_minmax(0,1fr)] md:items-center">
      <div>
        <h3 className="text-[13px] font-semibold tracking-[0.08em] text-neutral-900 uppercase">{label}</h3>
        {hint && <p className="mt-1 text-xs text-neutral-500 tabular-nums">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Tiles({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

/** A selectable tile: optional icon above a short label. The selected one gets a thin dark frame. */
export function Tile({
  selected,
  onSelect,
  disabled,
  icon,
  children,
  className = "",
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-w-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-md border px-2.5 py-2.5 text-center text-[13px] leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-35 ${
        selected ? "border-neutral-900 text-neutral-950" : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
      } ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/** Round color chip with a soft highlight, for metals and gems. */
export function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-6 rounded-full border border-black/10 shadow-inner"
      style={{ background: `radial-gradient(circle at 32% 28%, #fff 0%, ${color} 55%)` }}
    />
  );
}

export function RangeRow({
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
    <Row label={label} hint={display}>
      <Slider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(typeof v === "number" ? v : v[0])}
      />
    </Row>
  );
}
