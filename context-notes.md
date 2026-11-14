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

## 2026-11-13: Phase 2 center stone
- **Carat → mm comes from size charts, scaled by ∛carat.** Each cut stores the face-up length of a 1 ct diamond and its length/width ratio (round 6.5 mm, oval 7.7 mm at 1.35, …). Carat is weight, so other gems scale by ∛(3.52 / density): a 1 ct sapphire is smaller than a 1 ct diamond, a 1 ct emerald larger.
- **Gem mesh = girdle outline × stacked rings.** Each cut defines a unit outline (superellipse for round/oval/cushion, polygon for princess/emerald, a normalized teardrop for pear) and a list of rings from table to culet. Brilliant-style cuts shift alternate rings by half a sample, which turns quads into triangular facets; the emerald cut uses aligned rings for step facets. Polygon outlines give every edge an equal t-span, so sample counts that are a multiple of the edge count land exactly on corners.
- **Winding is tested, not assumed.** Tests check signed volume > 0 and that every triangle faces away from the stone's center. The first version was consistently inside-out; flipping every triangle fixed it.
- **The geometry is checked against real weight.** A round at the 1 ct size, as a diamond, comes out ≈ 0.99 ct by volume (test allows 0.85–1.15).
- **Stone orientation:** table up (+y), length along the ring axis (z), i.e. "north–south". y = 0 is the girdle middle; `CenterStone` positions the stone from a `culetY`, which Phase 3's head will replace with a real seat height. For now it floats 0.6 mm above the band.
- **Switched from `MeshPhysicalMaterial` to drei `MeshRefractionMaterial`.** Transmission only shows the scene behind the stone, so the diamond looked like flat glass. The refraction material ray-traces internal bounces against a BVH of the stone, which produces real facet contrast and fire. `plan.md` updated to match.
- **Dispersion maps to `aberrationStrength = dispersion / (2 × ior)`.** The shader traces red with ior × (1 − a) and blue with ior × (1 + a); this makes the blue−red spread equal the gem's physical dispersion. Diamond comes out 0.0091, close to drei's default 0.01.
- **The BVH is built once on mount,** so the stone mesh is keyed on the geometry's uuid to remount when cut/carat changes. drei logs "already non-indexed" warnings when it clones the geometry for the BVH; harmless.
- **`StudioEnvironment` shares the env cube map through context.** drei's `Environment` does not expose its texture, only assigns it to `scene.environment`. A `useFrame` pointer check copies it into state (an effect calling setState is blocked by the `react-hooks/set-state-in-effect` lint rule). The stone renders nothing until the map exists.
- **Polyfill: an empty `cube_uv_reflection_fragment` shader chunk.** three r187 removed it, but drei 10.7.9 (latest) still `#include`s it. Its only function is unused with a cube env map. Remove the polyfill once drei catches up.
- **Black cards in the studio environment.** Two black Lightformers below the horizon give stones dark facets and add contrast to metal edges, as in jewelry photography.
- **Visually checked:** round diamond, emerald-cut sapphire, pear ruby, princess emerald (close-up camera, temporarily). Oval, cushion, and moissanite are covered by tests only.

## 2026-11-13: Phase 3 setting
- **`Ring` assembles everything from one `RingDesign`.** It builds the stone geometry once and derives every dimension (girdle height, prong radius, halo gap, pavé start angle) so the parts agree. `RingDesign` lives in `config.ts` as a plain type; Phase 4 turns it into the zod schema.
- **Prong positions per cut** (`PRONG_T` in `setting.ts`): diagonals for round/oval/cushion, corners for princess, chamfered corners for emerald (6 adds the long-side middles), and one prong guarding the pear's point. Each prong is a Catmull-Rom tube from the band, past the girdle, to a ball tip over the crown edge. The base converges toward the band and is clamped inside the band width so prongs never float beside a narrow band.
- **Prong radius = 6% of stone width, clamped to 0.35–0.6 mm** (real prongs are ~0.8–1.2 mm across).
- **Bezel and halo frame share one sweep builder.** A closed cross-section is swept around the girdle outline; each profile edge has its own vertex rings so profile corners stay sharp while the outline stays smooth. Both collars taper down into the band ("seat") so the head never floats.
- **Scale, not negative offset, for rings pulled far inward.** At polygon corners the normal is a diagonal average, so a large inward offset left spikes at the emerald cut's corners. Profile points take an optional outline scale for that.
- **Halo layout spaces melee by arc length, then drops the count until no two neighbors touch.** Around the pear's point the offset curve bends tightly and chords become shorter than arcs; the first version overlapped there (caught by tests).
- **Halo gap depends on the setting:** 2 × prong radius with prongs, bezel wall + 0.1 mm with a bezel, so melee never collide with them.
- **Pavé is one row per shoulder,** starting just outside the head footprint and spanning 45°. Melee diameter = min(1.3 mm, 55% of band width). Pavé beads/prongs are not modeled.
- **Melee use the same refraction material through `InstancedMesh`.** drei's shader supports `USE_INSTANCING`, so each halo or pavé row is one draw call with one shared BVH. Two bounces instead of three, since stones are ~1 mm.
- **Shared code extracted:** `MetalMaterial` (band + setting) and `gem.tsx` (`useGemGeometry`, `GemMaterial`, shader polyfill) for center stone + melee.
- **Visually checked:** 4-prong round (full and close-up), 6-prong + halo + pavé round, bezel + pavé emerald, 4-prong + halo pear in platinum.

## 2026-11-13: Phase 4 panel UI
- **The zod schema is the single source of the config type.** `RingDesign = z.infer<typeof ringDesignSchema>`; option lists (`CUTS`, `PROFILES`, `SETTINGS`, `METAL_IDS`, `GEM_IDS`) are exported so the panel and the schema cannot drift. Phase 5 will reuse the same schema to validate decoded URLs.
- **New ranges:** thickness 1.4–2.4 mm (the plan left it open), ring size in 0.25 steps, carat in 0.05 steps. Engraving: up to 24 characters, any script (Hangul is fine), no control characters, so it always stays one line.
- **Store is minimal:** `design`, `update(patch)`, `setDesign(design)`. The viewer and panel subscribe to it; the fixed `DEMO` is gone. Default design = the "Classic solitaire" preset (platinum, 1 ct round, 4 prongs).
- **Four presets:** Classic solitaire, Cushion halo (rose gold, halo + pavé), Modern bezel (yellow gold, emerald cut, flat band), Pear sapphire (white gold, knife edge, 6 prongs + halo). Applying a preset keeps the current engraving, since it is personal rather than part of the style; the active-preset highlight ignores the engraving for the same reason.
- **Engraving = canvas text as an alpha map** on an open cylinder just inside the band's inner radius, rendered `BackSide` in darker, rougher metal. Centered at the bottom of the ring; glyph height ≈ 45% of the band width (≤ 1.3 mm), shrunk if the text would wrap past 300°. `flipY = false` makes it read correctly when looking into the ring from the front (checked with a close-up camera). Comfort-fit bands curve away from that cylinder by only ~0.04 mm at the text edges.
- **UI text is English** (the page is `lang="en"`); the plan names no language, and this keeps the portfolio readable for anyone.
- **Fixed a Phase 0 bug:** `globals.css` had `--font-sans: var(--font-sans)` (self-reference written by shadcn init), so the page fell back to a serif font. It now points at Geist.
- **Layout:** panel is a 360 px right sidebar from `md` up and a 45 dvh bottom sheet below. At 390 px (checked inside an iframe, because headless Chrome on macOS will not make a window that narrow) the panel fits without horizontal scroll.
- **Selected options get a dark border**; the shadcn default (light gray fill) was too faint.
- **Visually checked:** every tab, the three non-default presets (cushion halo rendered for the first time), engraving close-up, mobile panel width.

## 2026-11-13: Phase 5 sharing
- **Link format: positional JSON array → UTF-8 → base64url.** `[version, metal index, profile index, size, width, thickness, cut index, carat, gem index, setting index, halo 0/1, pavé 0/1, engraving]`. Enums become indices and numbers are rounded to two decimals, so a full design is ~60 characters with no compression library. UTF-8 before base64 keeps Hangul engravings intact.
- **Decoding never trusts the link.** Wrong version, wrong length, non-integer or out-of-range indices (including `"0"` as a string, which JS would accept as an array index), and anything the zod schema rejects all return `null`; the page then shows the default design. Partial recovery was not attempted: a half-applied link would show a design nobody shared.
- **Version field.** If the layout ever changes, old links fail cleanly to the default instead of being misread.
- **URL sync (`useDesignUrlSync`).** Reads `?d=` once after hydration (the page is prerendered with the default), then subscribes to the store and writes `?d=` with `history.replaceState`, debounced 300 ms so slider drags do not flood history (Safari throttles frequent calls). replaceState, not pushState: the back button should leave the app, not undo each slider step.
- **"Copy link" builds the URL from the current design,** not `location.href`, which lags by the debounce. Falls back to `window.prompt` when the Clipboard API is unavailable (insecure origin, denied permission).
- **PNG capture without `preserveDrawingBuffer`.** A bridge component inside the canvas registers a capture function that renders one frame and calls `toBlob` in the same task; the canvas bitmap is copied synchronously, so the buffer clear after compositing does not matter. Keeping `preserveDrawingBuffer` off avoids its per-frame cost.
- **GLB export skipped for now.** Stones use drei's ray-traced `MeshRefractionMaterial` (a custom shader), which `GLTFExporter` cannot express; exported stones would be plain opaque meshes, and the setting would need its instancing flattened. Worth revisiting only if someone needs the model in another tool.
- **Verified:** round-trip tests for every preset and a Hangul engraving, 12 bad-input cases, fallback via `designFromSearch`; in the browser, a share link restored the pear sapphire preset with a Hangul engraving, `?d=garbage` showed the default, and a temporary auto-capture showed the PNG matches the view. Not verified in headless: clipboard copy and the debounced URL write (both need real interaction).

## 2026-11-13: Phase 6 polish
- **Real-browser checks now go through the Chrome DevTools Protocol** (a small Node driver in the session scratchpad): device emulation, real mouse clicks, typed text, clipboard read, download capture, frame counting. The earlier `--screenshot` method could not interact or emulate a phone.
- **Mobile at 390 × 844 (dpr 2, touch):** canvas 390 × 464, panel sheet 380 px, no horizontal scroll. **The white strip at the bottom of earlier screenshots was headless window chrome,** not a layout bug; it does not appear with CDP screenshots.
- **End-to-end flow verified on the production build:** preset → tab → cut → toggle → Hangul engraving typed into the input; `?d=` updated; "Copy link" put the exact URL on the clipboard and showed "Link copied"; "Save PNG" downloaded `ring.png` (158 KB); opening the copied link restored the full design including the engraving.
- **Frame rate:** 60 fps (display cap) idle and while orbiting, for both the default and the heaviest design (halo + pavé + engraving) on this Mac. JS heap ≈ 18 MB. Weaker phone GPUs were not measured.
- **`frameloop="demand"`.** The scene is static between interactions, yet the ray-traced stones were redrawn 60 times a second, which costs battery and heat on phones. Now R3F renders only when props change or OrbitControls moves. Measured with a draw-call counter: 0 draws in 2 s idle after load and after a preset change; after an orbit drag, draws stop once damping settles (~2 s). The env-map pointer check in `StudioEnvironment` still works because its state change triggers a render.

## 2026-11-13: Phase 6 deploy
- **Live at https://3d-ring-design.vercel.app** (Vercel project `3d-ring-design`, deployed from the CLI; no Git remote is connected yet).
- **`vercel.json` pins `"framework": "nextjs"`.** A project created with `vercel project add` gets the "Other" preset, so the first deploy skipped the Next.js build and served an empty site (404 on every path). Pinning it in the repo makes the build independent of dashboard settings.
- **`engines.node = "24.x"` in `package.json`.** The new project defaulted to Node 26; local development and tests run on 24.
- **Mistake on record:** the user asked for a preview first, but the first `vercel deploy` on a project with no production deployment went straight to production (and was the broken 404 build). After the fix, a real preview was checked with `vercel curl` (preview URLs sit behind Vercel Authentication), then promoted. Next time, check the project's production state before the first deploy.
- **Production verified with the same CDP flow as local:** presets, tabs, toggles, Hangul engraving, `?d=` update, clipboard link, PNG download (158 KB), reload from the copied link, and the 390 px mobile layout.

## 2026-11-13: Phase 7 redesign
- **Why:** the user found the first design poor and pointed to a commercial ring builder as the target style. Only layout and mood are borrowed (big viewer card, stepped option card with icon tiles, thin dark frame on the selected tile). No third-party name, logo, photo, or copy is used; the wordmark "Ring Atelier" is a placeholder of our own.
- **Hero camera.** `[10, 40, 36]` looking at `[0, 5, 0]`, fov 30: from the front and well above, so the table faces the viewer and the band recedes, as in product photos. The old side view made the stone tiny. Zoom range 14–90, a Reset button (`OrbitControls.reset()`), and a hint that fades after the first drag.
- **Gems get their own environment map.** Refracting the soft gray metal studio made stones look like flat gray glass. `StudioEnvironment` now renders a second cube map once (white room + 70 seeded dark discs of mixed size) and shares that through context; a facet is bright or dark depending on where its light path ends, which gives the crisp pattern of a cut stone. This also removed the `scene.environment` pointer-polling hack. The metal studio background went from `#a3a3a3` to `#c9c9c9` for brighter white metals.
- **Halo frame is a shallow tray (0.9 mm), not a cone.** It is carried by the prongs (its inner edge sits at 2 × prong radius, where the prongs pass) or by the bezel wall. **Bezel is a cup** that follows the pavilion to a narrow stem in the band, using outline scale per profile point.
- **Hidden halo (user request, mid-phase).** `halo` changed from boolean to `"none" | "halo" | "hidden"`. Hidden = a thin collar at 86% outline scale just under the girdle, with melee on it facing sideways (`meleeRing` returns centers with outward normals; `haloLayout` now wraps it). A bezel would cover it, so `effectiveHalo()` treats bezel + hidden as none everywhere (3D, title, summary) and the tile is disabled; the stored value is kept, so switching back to prongs restores it.
- **Share links stay compatible.** Halo is now an index 0–2 in the same slot; old 0/1 still mean none/halo, so no version bump.
- **Steps: 1 Setting → 2 Stone → 3 Band.** Step 3 ends with a summary (`designSummary`) and the share buttons. Steps are freely clickable; nothing is gated, since every option always has a valid value.
- **Icons are drawn from the real geometry:** shape icons from `girdlePoint` (the same outline the 3D stone uses) and band icons from `bandProfilePoints`, so icons cannot drift from the model.
- **`labels.ts`** holds option names plus `designTitle` ("1.20 ct Cushion Diamond Halo Pavé Ring"), shown under the viewer.
- **Carat:** chips for common weights plus the slider for anything between.
- **Layout:** the app fills the viewport (no page scroll); the option card scrolls inside. Mobile: viewer 38 dvh on top, card below. Display serif (Cormorant Garamond) for wordmark, step numbers, title.
- **Verified on a production build via CDP:** preset → hidden halo → bezel (tile disabled, title updates) → 6 prongs (hidden halo returns) → stone step → band step with Hangul engraving; clipboard link equals the URL; PNG download; reload from link restores the design; orbit + Reset; 0 draw calls while idle; 390 px width without horizontal scroll.
- **Not yet redeployed:** production still serves the old design until the user confirms.
