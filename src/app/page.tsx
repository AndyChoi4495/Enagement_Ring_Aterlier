import { RingPanel } from "@/components/panel/RingPanel";
import { RingViewer } from "@/components/viewer/RingViewer";

export default function Home() {
  return (
    <main className="flex h-dvh w-full flex-col md:flex-row">
      <div className="min-h-0 flex-1">
        <RingViewer />
      </div>
      {/* Bottom sheet on mobile, sidebar from md up. */}
      <aside className="h-[45dvh] shrink-0 overflow-y-auto border-t bg-background md:h-full md:w-[360px] md:border-t-0 md:border-l">
        <RingPanel />
      </aside>
    </main>
  );
}
