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

## 2026-11-13: Phase 1 viewer + band
- **Band cross-section is a superellipse with a separate exponent per half.** One formula covers all three profiles: high exponent = flat face with eased corners, ~2 = dome (comfort fit inside), < 2 = ridge (knife edge). Rounded corners also matter for LatheGeometry, which averages normals between neighboring segments; a single sharp corner point would shade as a smear.
- **The inner radius is the profile's minimum x for every profile.** Ring size is defined by the narrowest point of the finger hole, so a comfort-fit dome bulges outward from that radius, never inward past it. Tests assert min x = inner radius, max x = inner radius + thickness, and width exact.
- **Profile points are plain `[x, y]` tuples.** The builder stays free of three.js so it tests in Node; `Band` converts to `Vector2`.
- **`<latheGeometry args>` instead of a memoized geometry prop.** R3F rebuilds and disposes the geometry when args change, so there is no manual `dispose()` to forget.
- **Studio environment built from drei `Lightformer`s, not an HDR preset.** Presets download HDR files from a CDN at runtime; Lightformers are procedural (matches the "no external assets" decision) and give softbox-style highlights suited to metal and gems. The environment background is mid-gray (`#a3a3a3`): darker (`#6b6b6b`) made gold look brown.
- **Metal colors approximate measured reflectance (F0)** converted to sRGB, with `metalness: 1`.
- **Ring stands upright** (lathe axis rotated from Y to Z), so the center stone will sit at +Y in Phase 2. ContactShadows sit just under the outer radius.
- **Viewer uses a fixed `DEMO` config** until the zustand store lands in Phase 4. Only comfort/yellow gold (default) and knife/platinum were checked visually; flat is covered by tests.
- **Visual check method:** headless Chrome `--screenshot` against `npm run dev`. It sometimes captures a blank frame; retrying works. The white strip at the bottom of the screenshots appears to be headless window chrome; re-check the layout in a real browser in Phase 6.
