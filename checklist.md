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
- [ ] Redeploy to production
