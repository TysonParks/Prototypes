# HashHorizon — archived experiment (2026-06)

> **Status:** Removed from production and dev runtime. Code preserved in [archive/HashHorizon.js](../../archive/HashHorizon.js).

---

## Conceptual ground

Each token was to include a **bounded navigation mode** allowing exploration of a small neighborhood within hash space. Rather than exposing an unrestricted generator, the work would treat the minted output as a **privileged origin** from which nearby latent states could be examined.

Navigation was constrained by a **single hexadecimal coordinate** derived directly from the token hash:

```
locus = clamp( round( parseInt(body.slice(-2), 16) / 4 ), 0, 63 )
```

Only the hex digit at that locus could step `0`–`F` (`↑`/`↓`), with `0` returning to the mint hash. Sixteen variants were precomputed per token.

> Each token includes a bounded navigation mode that allows exploration of a small neighborhood within hash space. Rather than exposing an unrestricted generator, the work treats the minted output as a privileged origin from which nearby latent states may be examined. The navigation itself is constrained by a single hexadecimal coordinate derived directly from the token hash, making each work's local horizon unique.

---

## Why it was removed

After implementation and testing, the feature did **not** convey the intended conceptual meaning in practice. Stepping one hex digit produced outputs that felt arbitrary relative to the minted work rather than a coherent “local horizon.” The interaction cost (full rebuild + hide animation per step) also worked against the poetic framing.

The experiment is archived for reference; it is not part of the Art Blocks submission bundle.

---

## What was built (archived)

| Piece | Location (was) | Archive |
|-------|------------------|---------|
| `HashHorizon` class | `Features.js` | [archive/HashHorizon.js](../../archive/HashHorizon.js) |
| `↑`/`↓`/`0` key nav + `animatedBuildFromHash` | `ProtoBatch.js` | same file (comment + reference) |
| `testingControls.mode` toggle | `appControls.js`, `guiDev.js` | removed |
| Hide/reveal on hash change | `RevealAnimation.js` `transitionToHash` | **kept** — still used by dev `'n'` regen |

### Hide-transition bugs fixed during the experiment

These fixes remain in [RevealAnimation.js](../../RevealAnimation.js) for dev regen and any future reload UX:

1. `hideNow()` now parents artwork into `#chrome-reveal-blur-layer` before animating
2. Artwork scale hide uses explicit reflow → transform (`hideChromeArtwork`)
3. Nav rebuilds preserve hidden pill layout (`_navInFlight`) instead of snapping to default metrics

Timing: `CHROME_REFERENCE_PRESET.hideDurationMs` (200ms) + `chromeHiddenPulseHoldMs` (50ms) in `RevealAnimation.js`.

---

## Production collector controls (current)

Shipped token outputs ([SUBMISSION-MANIFEST.md](SUBMISSION-MANIFEST.md)):

| Input | Action |
|-------|--------|
| `←` / `→` (or `l`) | Viewport rotation ([ArtworkRotation.js](../../ArtworkRotation.js)) |
| `s` | Save PNG ([Export.js](../../Export.js) `saveArtworkPNG`) |
| `f` / `Esc` | Fullscreen ([ArtworkRotation.js](../../ArtworkRotation.js)) |

No hash stepping, no `'n'` random regen (dev-only via `RevealAnimationDev.js`).
