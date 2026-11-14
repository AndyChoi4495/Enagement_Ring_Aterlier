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
