# Plan: 3D Engagement Ring Design Web App

**English** | [한국어](plan.ko.md)

## Goal
A personal/portfolio 3D engagement ring customizer. The user changes the band, center stone, setting, and band shape/size, and the 3D preview updates live. Designs can be shared as a link or an image. No backend, payments, or login. All state lives on the client and is shared via the URL.

## Stack
- Next.js (App Router, TypeScript), a single page of client components
- 3D: `three` + `@react-three/fiber` + `@react-three/drei` (OrbitControls, Environment, ContactShadows)
- State: `zustand`; validation: a `zod` schema (also used to validate decoded URLs)
- UI: Tailwind + shadcn/ui
- Tests: Vitest (pure logic); deploy: Vercel
- All geometry is generated procedurally in code, with no external 3D model files.

## Customization scope (v1)
| Area | Options |
|---|---|
| Band metal | Platinum, yellow/white/rose gold |
| Center stone | Cut (round, princess, oval, cushion, emerald, pear), 0.3–3 ct, type (diamond, sapphire, ruby, emerald, moissanite) |
| Setting | 4/6 prongs, bezel, halo (none, single, hidden), shoulders (straight, tapered, cathedral, split shank, twist), side stones (plain, pavé, French pavé, U-cut pavé, channel set) |
| Band shape | Profile (comfort fit, flat, knife edge), width 1.5–4 mm, thickness 1.4–2.4 mm, ring size (US 3–13), inner engraving |

## Key design
- **Real millimeter units.** US size → inner diameter `d = 11.63 + 0.8128 × size` (mm). Round carat → diameter `≈ 6.5 × ∛ct` mm; other cuts use per-cut length/width ratios.
- **Band**: a 2D cross-section profile swept around the ring; its width, thickness, and axial offset vary with the angle, which is how the shoulder styles (taper, cathedral arms, split, twist) are made.
- **Gems**: faceted geometry from computed crown/girdle/pavilion points + drei `MeshRefractionMaterial` (ray-traced internal reflections, ior, dispersion) + a procedural Lightformer studio environment.
- **Setting**: a basket head: claw prongs (tapered tubes) placed around the stone's girdle, joined by a thin gallery rail. Halo and pavé stones use `InstancedMesh`.
- **Engraving**: CanvasTexture text applied to the band's inner surface.
- **Sharing**: the compressed config goes in the URL `?d=` param and is validated with zod (falls back to defaults on failure). PNG screenshot; GLB export is optional.

## File layout (key files)
```
src/app/page.tsx                       layout (viewer + panel; bottom sheet on mobile)
src/components/viewer/RingViewer.tsx   Canvas, lights, environment, controls
src/components/ring/*                  Ring (assembly), Band, CenterStone, Prongs, Sweep (bezel/halo frame), Melee, PaveMetal, Engraving
src/components/Designer.tsx            main screen: header, step bar, viewer card, option card
src/components/panel/*                 stepped option card, tiles, line-art icons, share buttons
src/lib/ring/config.ts                 zod schema, defaults, presets
src/lib/ring/sizing.ts                 size/carat → mm conversion
src/lib/ring/geometry/*                pure geometry builders
src/lib/ring/labels.ts                 option names, design title and summary
src/lib/ring/materials.ts              metal/gem material presets
src/lib/share.ts                       URL encode/decode
src/hooks/useDesignUrlSync.ts          keeps ?d= and the store in sync
src/store/ringStore.ts                 zustand store
```

## Phases
0. Setup
1. Viewer + band
2. Center stone
3. Setting
4. Panel UI
5. Sharing
6. Polish and deploy
7. Redesign: jewelry-store style UI (viewer card + stepped option card with icon tiles) and a more delicate ring head. Layout and mood are inspired by commercial ring builders; no third-party names, logos, or images are used.

Tasks are in [checklist.md](checklist.md); the reasoning behind decisions is in [context-notes.md](context-notes.md).

## Verification
- `npm run lint` and `npm run build` pass
- Vitest: size/carat conversion, band profile dimensions, share URL round trip, fallback to defaults on a bad URL
- Manual check of each option on the dev server, including mobile width (390px)
- Open a share link in a new tab and confirm the same design loads
- Repeat on a Vercel preview deployment
