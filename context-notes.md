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

## 2026-11-13: Phase 0 setup
- **Scaffolded in a scratch folder, then copied in.** `create-next-app` refuses a non-empty directory, and this one already had CLAUDE.md and the plan docs. The scaffold's README was not copied; a bilingual README pair can be written later.
- **`@types/node` bumped from ^20 to ^24.** Vitest 5 requires `@types/node` ^22 or >=24 as a peer, and the scaffold's ^20 caused an ERESOLVE error. The machine runs Node 24, so ^24 matches the real runtime.
- **Kept `AGENTS.md`.** It is written by `next dev` and points agents to the Next.js 16 docs in `node_modules`; deleting it only makes it reappear.
- **Vitest uses `passWithNoTests`** so `npm test` succeeds before any test files exist.
