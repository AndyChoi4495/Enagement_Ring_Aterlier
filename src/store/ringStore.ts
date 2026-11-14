// 현재 반지 디자인을 보관하고 수정하는 zustand 스토어
// Zustand store that holds and updates the current ring design
import { create } from "zustand";
import { DEFAULT_DESIGN, type RingDesign } from "@/lib/ring/config";

interface RingStore {
  design: RingDesign;
  update: (patch: Partial<RingDesign>) => void;
  setDesign: (design: RingDesign) => void;
}

export const useRingStore = create<RingStore>((set) => ({
  design: DEFAULT_DESIGN,
  update: (patch) => set((s) => ({ design: { ...s.design, ...patch } })),
  setDesign: (design) => set({ design }),
}));
