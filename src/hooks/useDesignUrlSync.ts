// 첫 로드 때 URL(?d=)에서 디자인을 읽고, 이후 변경을 URL에 반영하는 훅
// Hook that loads the design from the URL (?d=) once, then mirrors later changes into it
import { useEffect } from "react";
import { SHARE_PARAM, designFromSearch, encodeDesign } from "@/lib/share";
import { useRingStore } from "@/store/ringStore";

/** Delay before writing the URL, so dragging a slider does not flood history.replaceState. */
const WRITE_DELAY_MS = 300;

export function useDesignUrlSync() {
  useEffect(() => {
    // Read after hydration: the page is prerendered with the default design.
    useRingStore.getState().setDesign(designFromSearch(window.location.search));

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useRingStore.subscribe(({ design }) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set(SHARE_PARAM, encodeDesign(design));
        window.history.replaceState(null, "", url);
      }, WRITE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
}
