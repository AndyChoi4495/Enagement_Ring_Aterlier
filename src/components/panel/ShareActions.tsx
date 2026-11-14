"use client";
// 현재 디자인 링크 복사와 PNG 저장 버튼
// Buttons that copy a link to the current design and save a PNG of the view
import { useEffect, useState } from "react";
import { Check, Download, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureViewer } from "@/components/viewer/capture";
import { SHARE_PARAM, encodeDesign } from "@/lib/share";
import { useRingStore } from "@/store/ringStore";

export function ShareActions() {
  const design = useRingStore((s) => s.design);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copyLink() {
    // Built from the design, not location.href, which lags behind by the URL write delay.
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set(SHARE_PARAM, encodeDesign(design));
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch {
      // Clipboard API is unavailable on insecure origins or when permission is denied.
      window.prompt("Copy this link", url.href);
    }
  }

  async function savePng() {
    const blob = await captureViewer();
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "ring.png";
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Button size="sm" variant="outline" onClick={copyLink}>
        {copied ? <Check /> : <Link />}
        {copied ? "Link copied" : "Copy link"}
      </Button>
      <Button size="sm" variant="outline" onClick={savePng}>
        <Download />
        Save PNG
      </Button>
    </div>
  );
}
