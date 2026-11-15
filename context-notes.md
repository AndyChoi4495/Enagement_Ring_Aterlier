

## 2026-11-14: Hidden halo over the prongs, reshaped after a reference
The user sent three screenshots of a reel (an oval on four claws) as the look to aim for. They were viewed for reference only; none are used in the app or committed. The first version (a tall collar at girdle height, pushed outside the girdle) was wrong on three counts: too high, too heavy, and visible from above.
- **Lower.** The ring's center is at half the pavilion depth below the girdle (`HIDDEN_OVER_DEPTH`), about where the gallery rail is. That low the prongs lean well inside the girdle, so a ring around the outside of them is still inside the stone's outline and cannot be seen from above.
- **Where the face goes.** The collar's face is the prongs' outer edge at the collar's top, where they are farthest out: one prong radius beyond the prong's center line, which is taken as straight between the rail and the girdle (outline scale and offset both interpolated). A face that leaned with the prongs was tried first; it turned the stones downward and they barely showed from the side.
- **Finer.** Melee are 10% of the stone's width (0.6–0.85 mm, was 14%, 0.8–1.1 mm), with a pair of beads between each two neighbors for a pavé look. The plain hidden halo keeps its size and has no beads.
- **Verified via CDP on the dev server:** 3 ct oval and 1 ct round from a low side view, round from directly above (the ring does not show), 0.7 ct pear with 6 prongs and U-cut pavé. Tests 91, lint, and build pass. Not redeployed.
