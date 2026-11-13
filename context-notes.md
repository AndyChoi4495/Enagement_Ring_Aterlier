# Context Notes

**English** | [한국어](context-notes.ko.md)

Decisions and the reasoning behind them. Append new entries at the bottom.

## 2026-11-13: Initial decisions
- **Web app (Next.js + React Three Fiber).** Chosen by the user. Runs in the browser with no install, works on mobile, and deploys easily to Vercel.
- **Personal/portfolio use, no backend.** Chosen by the user. No pricing, orders, or payments. Sharing is done with URL state and images, so no database is needed.
- **v1 customization scope.** The user picked all four areas: band metal/color, center stone, setting/prongs, band shape/size (including engraving).
- **Procedural geometry.** Building shapes from code instead of external GLB models avoids asset licensing issues and lets every parameter (carat, width, profile) change continuously.
- **Real millimeter units.** Ring size and carat convert to real dimensions, so proportions between stone and band look natural without hand-tuning.
- **zod schema shared by store and URL.** A shared link is untrusted input; validating it with the same schema keeps a bad link from breaking the scene.
- **InstancedMesh for halo/pavé.** Dozens of small stones as separate meshes would cost one draw call each; instancing keeps it to one.
