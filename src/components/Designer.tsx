"use client";
// 헤더, 단계 표시, 3D 뷰어 카드, 옵션 카드를 배치하는 메인 화면
// Main screen: header, step bar, 3D viewer card, and option card
import { useRef, useState } from "react";
import { RingPanel, STEPS } from "@/components/panel/RingPanel";
import { RingViewer } from "@/components/viewer/RingViewer";
import { useDesignUrlSync } from "@/hooks/useDesignUrlSync";
import { METAL_LABELS, designTitle } from "@/lib/ring/labels";
import { useRingStore } from "@/store/ringStore";

function StepBar({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  return (
    <nav aria-label="Design steps" className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 md:gap-5">
      {STEPS.map((name, i) => (
        <div key={name} className="flex flex-1 items-center gap-3 last:flex-none md:gap-5">
          <button
            type="button"
            aria-current={i === step ? "step" : undefined}
            onClick={() => onStep(i)}
            className={`flex items-baseline gap-2 whitespace-nowrap transition-colors ${i === step ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"}`}
          >
            <span className="font-serif text-2xl leading-none md:text-3xl">{i + 1}</span>
            <span className="text-[13px] font-semibold tracking-wide">{name}</span>
          </button>
          {i < STEPS.length - 1 && <span aria-hidden className={`h-px flex-1 ${i < step ? "bg-neutral-900" : "bg-neutral-300"}`} />}
        </div>
      ))}
    </nav>
  );
}

export function Designer() {
  useDesignUrlSync();
  const design = useRingStore((s) => s.design);
  const [step, setStep] = useState(0);
  const card = useRef<HTMLDivElement>(null);

  function goTo(next: number) {
    setStep(next);
    card.current?.scrollTo({ top: 0 });
  }

  return (
    <main className="flex h-dvh flex-col bg-white text-neutral-900">
      <header className="shrink-0 border-b border-neutral-200 py-2.5 text-center md:py-3.5">
        <h1 className="font-serif text-xl tracking-[0.22em] uppercase md:text-2xl">Ring Atelier</h1>
      </header>
      <div className="shrink-0 py-2.5 md:py-4">
        <StepBar step={step} onStep={goTo} />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3 md:flex-row md:gap-5 md:px-5 md:pb-5">
        <section className="flex h-[38dvh] shrink-0 flex-col md:h-auto md:w-[44%]">
          <div className="min-h-0 flex-1 overflow-hidden md:rounded-sm">
            <RingViewer />
          </div>
          <div className="px-4 pt-2 text-center md:pt-3">
            <p className="font-serif text-lg leading-tight md:text-2xl">{designTitle(design)}</p>
            <p className="mt-0.5 text-xs tracking-wide text-neutral-500 md:text-[13px]">
              {METAL_LABELS[design.metal]} · US {design.usSize}
            </p>
          </div>
        </section>

        <div ref={card} className="min-h-0 flex-1 overflow-y-auto border-t border-neutral-200 md:rounded-lg md:border md:shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <RingPanel step={step} onStep={goTo} />
        </div>
      </div>
    </main>
  );
}
