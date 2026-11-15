

## 2026-11-14: Phase 13 hidden halo over the prongs
User request: add an "over the prong" option to the hidden halo.
- **New halo style `hiddenOver` ("Hidden Halo Over Prongs"),** appended to the end of `HALOS` (share links store the index). The existing `hidden` is unchanged: its collar is tucked inside the girdle (outline scale 0.86), so the prongs pass in front of it and interrupt the row.
- **Geometry:** the same collar and melee at the same height, but on the full girdle outline pushed out by 1.8 prong radii (`HIDDEN_OVER`), which is just past the prongs' outer edge at that height. The prongs run up behind the collar and come out above it, so the row of stones is unbroken. From above, a thin rim of the collar shows around the stone, as on real rings of this kind.
- **`isHiddenHalo()`** (`labels.ts`) covers both styles wherever they behave alike: dropped under a bezel, tile disabled with a bezel, "Hidden Halo" in the title.
- **Icon:** the hidden halo's side view with two prongs drawn in front of the row (hidden) or behind it (over the prongs).
- **Verified via CDP on the dev server:** round with 4 prongs, emerald, and pear with 6 prongs and U-cut pavé. Tests 91, lint, and build pass. Not redeployed.
