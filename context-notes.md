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

## 2026-11-14: Phase 8 shoulder styles and a finer ring
User feedback: wants more shoulder options, and the ring (not the stone) looked clunky.
- **Why it looked clunky:** the band had one cross-section all the way round (2.5 × 1.7 mm), and the prongs were thick straight wires with ball tips rising from the band with nothing joining them.
- **Band is now swept, not lathed** (`geometry/band.ts`). A `Strand` gives width, thickness, and axial offset per angle from the top; `strandGeometry` sweeps `bandProfilePoints` along it. The inner radius is never changed, so sizing and the engraving stay exact.
- **`shoulder` option:** straight, tapered (narrows 40% toward the stone), cathedral (arms rise to the gallery rail, then a short wall drops back so the space under the stone stays open), split shank (a second strand over the top 62° each side), twist (two strands weaving in z; the one on top at each crossing is raised 22%).
- **Pavé stays a separate on/off** ("Side stones" row). `paveRow` walks the top surface of each strand, so stones follow cathedral arms and both split strands, and shrink where the band narrows. Twist has no flat top, so `effectivePave()` drops pavé there and the tile is disabled (same pattern as hidden halo + bezel).
- **Head is a basket:** prongs are tapered tubes ending in a claw bent over the crown (radius 5% of stone width, was 6% plus a ball), and a thin gallery rail at 55% pavilion depth joins them. Prong feet land on the strands of a split shank.
- **Default band is 2.0 × 1.6 mm, tapered.** Presets now show the styles: Cushion Halo is cathedral, Pear Sapphire is split shank.
- **Share links:** the shoulder index is appended as a 14th element; 13-element links still decode (as straight), so no version bump.
- **Verified via CDP on the dev server:** every style, cathedral with halo and with hidden halo, split with bezel, tile clicks (pavé disabled on twist and restored after), reload from link, 390 px without horizontal scroll. Tests 87, lint, and build pass.
- **Not done:** metal lighting is unchanged; not redeployed.

## 2026-11-14: Phase 9 side-stone styles and realistic lighting
User feedback: pavé has styles like U-shape, add them and others; the image looks like a toy, make it more realistic.
- **`pave` is now a style, not a boolean:** none, pave (stones sunk in the surface with shared beads), french (V notch under each stone), ucut (U scallop), channel (flush between two walls, no beads). Same share slot, old 0/1 still mean none/pavé.
- **How the cut styles are built** (`PaveMetal.tsx`): one instanced unit geometry per stone, scaled by the stone's diameter. French/U-cut = a block extruded across the band with a V or U notch cut through it, so the stone's sides show from the side view; posts between stones carry two beads. Channel = two walls and a floor extruded along the band. `PAVE_LAYOUT` holds fill (stone/band width), pitch, and lift per style; `paveRow` takes fill and pitch and returns surface points.
- **Halo melee get beads too** (two between each neighboring pair). Stones with nothing holding them were a big part of the toy look.
- **Why it looked like a toy:** the metal reflected a nearly uniform gray room, so it read as matte plastic. The metal studio is now a gradient dome (white overhead, darker floor) with strip lights and black cards for streaks and dark edge lines. First attempt was too dark (floor 0.06 turned platinum into gunmetal and blew out upward faces); settled on floor 0.32 and lower light intensities.
- **Tone mapping is Neutral instead of ACES**, which grayed and desaturated the gold colors.
- **Gem environment:** 150 smaller discs in six gray levels instead of 70 large mostly-black ones, for a finer, less blotchy facet pattern.
- **Verified via CDP on the dev server:** each side-stone style close up, with tapered, cathedral, straight, and split shoulders. Tests 88, lint, and build pass.
- **Still short of a photo:** no ray-traced metal-on-metal reflections or soft shadows between parts; hidden-halo melee have no beads. Not redeployed.

## 2026-11-14: Phase 10 product-photo look
The user pointed to a jeweler's product page (a petite pavé hidden-halo ring in white gold) as the look to aim for. Its images were viewed for reference only; none are used in the app.
- **What the reference does differently:** near-white background, very bright white metal with pale gray gradients, a diamond that is white with pale gray facets (not black shards), a long soft shadow on the floor, a very thin band whose side stones nearly fill its width and run three quarters of the way round.
- **High-key studio.** Background `#f8f8f8`. Metal dome is 0.5 (floor) to 1.15 (top) with dark-gray cards for edge lines; Phase 9's darker room read as gunmetal next to the reference.
- **Gem environment is zoned, not cluttered:** a white dome with a dim cap overhead and a gray band at the horizon, plus 130 gray discs (darkest `#141414`, rare). An all-white version washed the stone out; black-heavy discs gave the harsh shards. The cap must stay small (above 0.86) or the table turns into a gray disc when viewed from above.
- **Cast shadow:** one directional light (intensity 0.6, VSM, radius 14) onto a `shadowMaterial` plane at 10% opacity; every ring mesh has `castShadow`. ContactShadows stays for the contact patch.
- **Proportions:** default width 1.8 mm; fill is 0.82 for French/U-cut and 0.66 for bead pavé; rows end 135° from the top (`PAVE_END`).
- **Seats** are narrower than the stone (0.92 d) and overlap lengthwise, so from above only stones and beads show; the first version looked like a row of boxes.
- **Preset "Petite Pavé"** reproduces the reference configuration.
- **Known gap:** viewed from straight above, the round stone shows concentric rings instead of the arrows pattern of a real brilliant; that needs a more accurate facet model. Idle draw calls with shadows enabled were not re-measured. Not redeployed.

## 2026-11-14: Phase 11 side-stone coverage
- **`coverage` is 30, 50, or 70**: the percent of the circumference, centered on the stone, that the rows reach. Each row ends at `coverage/100 · π` from the top (54°, 90°, 126°); the head's own gap is inside that span, so the set length is slightly less. This replaces the fixed 135° `PAVE_END`.
- **Default is 70**, the closest to the earlier 75%, so existing designs and presets look almost the same.
- **Share link:** the index is appended as a 15th element; 13- and 14-element links decode as 70%. VERSION stays 1.
- **UI:** a "Coverage" row under "Side stones", disabled when there are no side stones (plain, or a twisted band). The summary reads "U-Cut Pavé (70% coverage)".
- Not redeployed.

## 2026-11-14: Redeployed and pushed
- Production (https://3d-ring-design.vercel.app) now serves Phases 7–11, deployed with `vercel deploy --prod` from the local tree; checked with a 50% coverage share link.
- The code is on GitHub at https://github.com/AndyChoi4495/Enagement_Ring_Aterlier (`origin`). The Vercel project is not connected to it, so a push does not deploy.

## 2026-11-14: Phase 12 inset U-cut pavé
User request: a pavé where the U-cut does not sit on top of the band but is set into the ring. Asked which of three readings was meant (U-cut cut into the band, flush setting, larger bead pavé); the user chose the first.
- **New style `inset` ("Inset U-Cut Pavé"),** appended to the end of `PAVES` because share links store the index. Same stone size and spacing as U-cut (fill 0.82, pitch 1.08).
- **The band is lowered, not the seat raised.** A swept band cannot have notches cut out of it, so `groovedStrand` (`band.ts`) lowers the band's thickness by `sink` = 0.5 stone diameters under each row, and the same U-notch seat block fills the groove with its top level with the original band surface (`lift` −0.05). The total height stays the band's thickness; plain U-cut adds about 0.4 diameters on top.
- **The groove follows the actual stones** (first to last center, plus half a stone), so it also stops where a split shank's rows are filtered out, and the end seats cover the step back to full thickness. Under the head the band keeps its full thickness, so prong feet and the stone height do not change.
- **Stones are still laid out on the original strands** (`paveRow` gets the uncut ones); only `Band` receives the grooved strands.
- **Shallower seat block for this style** (bottom at −0.65 instead of −0.85 diameters): starting at the band's top, the deeper one would come through the inside of the thinnest band (1.4 mm, tapered, 1.5 mm stones).
- **Icon:** the side view of U-cut, but a three-stone row between two plain stretches of band, stones level with its top.
- **Verified via CDP on the dev server:** straight, split shank, and cathedral with a 3.2 mm knife-edge band. Tests 91, lint, and build pass. Not redeployed.

## 2026-11-14: Phase 13 hidden halo over the prongs
User request: add an "over the prong" option to the hidden halo.
- **New halo style `hiddenOver` ("Hidden Halo Over Prongs"),** appended to the end of `HALOS` (share links store the index). The existing `hidden` is unchanged: its collar is tucked inside the girdle (outline scale 0.86), so the prongs pass in front of it and interrupt the row.
- **Geometry (first version, replaced the same day; see the next section):** the same collar and melee at the same height, but on the full girdle outline pushed out by 1.8 prong radii (`HIDDEN_OVER`), which is just past the prongs' outer edge at that height. The prongs run up behind the collar and come out above it, so the row of stones is unbroken. From above, a thin rim of the collar shows around the stone, as on real rings of this kind.
- **`isHiddenHalo()`** (`labels.ts`) covers both styles wherever they behave alike: dropped under a bezel, tile disabled with a bezel, "Hidden Halo" in the title.
- **Icon:** the hidden halo's side view with two prongs drawn in front of the row (hidden) or behind it (over the prongs).
- **Verified via CDP on the dev server:** round with 4 prongs, emerald, and pear with 6 prongs and U-cut pavé. Tests 91, lint, and build pass. Not redeployed.

## 2026-11-14: Hidden halo over the prongs, reshaped after a reference
The user sent three screenshots of a reel (an oval on four claws) as the look to aim for. They were viewed for reference only; none are used in the app or committed. The first version (a tall collar at girdle height, pushed outside the girdle) was wrong on three counts: too high, too heavy, and visible from above.
- **Lower.** The ring's center is at half the pavilion depth below the girdle (`HIDDEN_OVER_DEPTH`), about where the gallery rail is. That low the prongs lean well inside the girdle, so a ring around the outside of them is still inside the stone's outline and cannot be seen from above.
- **Where the face goes.** The collar's face is the prongs' outer edge at the collar's top, where they are farthest out: one prong radius beyond the prong's center line, which is taken as straight between the rail and the girdle (outline scale and offset both interpolated). A face that leaned with the prongs was tried first; it turned the stones downward and they barely showed from the side.
- **Finer.** Melee are 10% of the stone's width (0.6–0.85 mm, was 14%, 0.8–1.1 mm), with a pair of beads between each two neighbors for a pavé look. The plain hidden halo keeps its size and has no beads.
- **Verified via CDP on the dev server:** 3 ct oval and 1 ct round from a low side view, round from directly above (the ring does not show), 0.7 ct pear with 6 prongs and U-cut pavé. Tests 91, lint, and build pass. Not redeployed.

## 2026-11-14: Hidden halo over the prongs, U-cut instead of a collar
User feedback: the silver ring should not show; almost only diamonds, as if cut in a U shape.
- **The smooth collar is gone for `hiddenOver`.** Each melee sits in the side stones' U-cut seat, turned to face outward (`PaveMetal style="ucut"` with one matrix per stone: x along the row, y out through the table). The seat is narrower than the stone (0.92 d), so the stones overhang it above and below and no rim shows; from above and below the U scallops and the stones' sides show, with the usual pair of beads on each post. The hand-placed beads from the previous version were removed.
- **`PaveMetal` got two optional props** for a row laid out elsewhere: `pitch` (the halo's actual spacing, mean distance between neighbors over the diameter, since `meleeRing` spaces by perimeter) and `slim` (seat bottom at −0.5 d instead of −0.85 d). The deep seat is meant to sink into a band; here nothing is under it and it read as a wide metal ring from below.
- The plain hidden halo keeps its collar.
- **Verified via CDP on the dev server:** 1 ct round from the front-above and from directly above (not visible), 3 ct oval from a low side view. Tests 91, lint, and build pass. Not redeployed.

## 2026-11-14: Redeployed (Phases 12–13)
- Production (https://3d-ring-design.vercel.app) now serves the inset U-cut pavé and the U-cut hidden halo over the prongs, deployed with `vercel deploy --prod` from the local tree; checked with a share link that uses both. The four commits are not pushed to GitHub.
