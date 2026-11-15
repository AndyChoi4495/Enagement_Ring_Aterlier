# Checklist

**English** | [한국어](checklist.ko.md)

## Phase 0: Setup
- [x] Write plan, checklist, and context notes (EN + KO)
- [x] `git init`, first commit
- [x] Scaffold Next.js (TypeScript, Tailwind, App Router, `src/`)
- [x] Install three, @react-three/fiber, @react-three/drei, zustand, zod
- [x] Set up Vitest
- [x] Run shadcn init and add Slider, Select, Tabs, ToggleGroup
- [x] Update CLAUDE.md Status and Commands

## Phase 1: Viewer + band
- [x] RingViewer: Canvas, environment map, OrbitControls, ContactShadows
- [x] `sizing.ts` (US size → inner diameter) + tests
- [x] `bandProfile.ts` (comfort fit, flat, knife edge) + tests
- [x] Band component (LatheGeometry)
- [x] Metal material presets

## Phase 2: Center stone
- [x] Carat → mm conversion per cut + tests
- [x] Gem geometry for 6 cuts
- [x] Gem material presets (color, IOR, dispersion)

## Phase 3: Setting
- [x] 4/6 prongs
- [x] Bezel
- [x] Halo (InstancedMesh)
- [x] Shoulder pavé (InstancedMesh)

## Phase 4: Panel UI
- [x] zustand store + zod config schema + defaults
- [x] Tabs: metal, stone, setting, band
- [x] 3–4 presets
- [x] Inner engraving

## Phase 5: Sharing
- [x] URL `?d=` encode/decode + tests (round trip, bad input)
- [x] PNG screenshot
- [ ] (Optional) GLB export: skipped for now (see context notes)

## Phase 6: Polish and deploy
- [x] Mobile layout (bottom sheet), check at 390px
- [x] Performance check
- [x] Vercel deploy (https://3d-ring-design.vercel.app)

## Phase 7: Redesign (jewelry-store style)
- [x] Viewer: close 3/4 hero camera, zoom, reset view, hint overlay, design title
- [x] Ring 3D: slim halo frame and bezel cup (no cone), brighter stone lighting
- [x] Layout: header, step bar, viewer card + option card (stacked on mobile)
- [x] Option tiles: shape/setting/profile icons, metal and gem swatches, carat chips
- [x] Steps: 1 Setting → 2 Stone → 3 Band & summary (summary + share)
- [x] Hidden halo option (melee under the girdle, facing sideways)
- [x] Verify (desktop, 390px, share flow)

## Phase 8: Shoulder styles and a finer ring
- [x] Shoulder option: straight, tapered, cathedral, split shank, twist (share link stays compatible)
- [x] Band swept with a varying cross-section; pavé follows each style (disabled on twist)
- [x] Finer head: slim claw prongs, gallery rail; slimmer default band (2.0 × 1.6 mm)
- [x] Verify (every style, with halo/bezel/hidden halo, click flow, 390px)

## Phase 9: Side-stone styles and realistic lighting
- [x] Side stones: plain, pavé (beads), French pavé (V-cut), U-cut pavé, channel set
- [x] Beads between halo melee
- [x] Metal studio rebuilt for contrast (gradient dome, strip lights, black cards), neutral tone mapping, finer gem pattern
- [x] Verify (each style on screen, tests, lint, build)

## Phase 10: Product-photo look (reference: a jeweler's product page)
- [x] High-key studio: near-white background, bright metal room, zoned white gem environment
- [x] Long soft cast shadow from one key light
- [x] Proportions: 1.8 mm default band, side stones fill the band and cover three quarters of it
- [x] Slimmer V/U-cut seats; "Petite Pavé" preset
- [x] Verify (hero and side views against the reference, other presets, tests, lint, build)
- [x] Redeploy to production (Phases 7–11)

## Phase 11: Side-stone coverage
- [x] `coverage` option (30 / 50 / 70% of the circumference) in the schema, share link, summary, and panel
- [x] Verify (side view at each coverage, tests, lint, build)
