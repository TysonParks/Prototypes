# MVP Rotation Shipping (Pre–Art Blocks Submission)

**Status:** Active for submission sprint.  
**Deferred follow-up:** [DEFERRED-ADAPTIVE-RENDER-MODES.md](DEFERRED-ADAPTIVE-RENDER-MODES.md)

---

## Goals (this sprint)

1. **Safari:** Cardinal buffer rotation is native and only path (←/→).
2. **Chrome:** Default **live SVG** rotation; optional cardinal buffers via **R** key (dev/submission testing).
3. **Ship sooner** — defer metrics-based adaptive promotion and `RenderMode` extraction.

---

## Browser models (current)

| Browser | Default rotation | Cardinal buffers | Toggle |
|---------|------------------|------------------|--------|
| **Safari / WebKit** | Cardinal (lazy bake) | Always when rotation enabled | — |
| **Chrome** | Live SVG (`chromeRotationMode = 'full'`) | Opt-in batch bake | **R** key |

Config: [`appControls.js`](../../appControls.js) → `chromeRotationMode` (`'full'` | `'cardinal'`).  
Console: `artworkRotationMode()`, `toggleChromeCardinalMode()`, `isChromeCardinalOptIn()`.

---

## User-facing wait messages (only these three)

All use overlay fade-in, hold until work completes, fade-out. Everything else fails **silently**.

| Copy | When |
|------|------|
| `Preparing orientation...` (+ adaptive second line) | Safari cardinal bake wait |
| `Preparing smooth rotation...` (+ second line) | Chrome R-toggle cardinal batch bake |
| `Preparing image...` | Safari PNG export (S) |

**Safari orientation second lines** (after first-bake classifier):

- **Fast** (< 500 ms first bake): *"Additional orientations are being prepared."*
- **Medium / Slow** (or before classification): *"Additional orientations will be prepared as needed."*

**Chrome R-toggle status cues** (after batch or on re-enable): *"Smooth rotation ready."*, *"Smooth rotation enabled."*, *"Live rotation restored."*

Prep overlay on Safari uses `#safari-overlay.cardinal-prep` at **z-index 10050** (above `#safari-cardinal-rotation-overlay` at 9998).

---

## Safari cardinal bake coordinator

**Lazy kickoff:** no baking after reveal or light-off.

**First arrow:**

1. Show `Preparing orientation...` (adaptive second line until classified)
2. Wait 2 frames so the message paints
3. Bake **target orientation only**
4. Classify first bake time → background policy
5. **Fast:** queue remaining 3, crossfade to fast copy, rotate only when **all 4** ready
6. **Medium / Slow:** rotate when target ready; lazy background per policy

**Classifier** (first single-angle bake time):

| First bake | Policy | Subsequent behavior |
|------------|--------|---------------------|
| < 500 ms | Fast (`all`) | Batch remaining orientations; first rotation waits for all 4 |
| 500 ms – 2 s | Medium (`adjacent`) | One likely adjacent per direction; opportunistic after each background bake |
| > 2 s | Slow (`none`) | Bake only explicit requests + retention (reverse angle) |

**After each rotation:** orientation left is queued for retention (instant reverse). Prep overlay shows on **every** user-waiting bake, not only the first.

**Buffer invalidation:** only when **screen light angle** changes (not on Chrome R-toggle exit). Hash rebuild and layout resize still invalidate.

Diagnostics: `SafariCardinalBuffers.getDiagnosticsSnapshot()` → `firstBakeMs`, `backgroundBakePolicy`.

---

## Chrome R-toggle cardinal mode

1. Press **R** → `chromeRotationMode = 'cardinal'`
2. If buffers not ready: `Preparing smooth rotation...` → batch-bake all 4 → status cue → fade out
3. Arrows use bitmap crossfade when buffers ready
4. Press **R** again → live SVG; buffers **stay resident** in memory
5. Re-press **R** with valid buffers → *"Smooth rotation enabled."* (no re-bake unless invalidated)

While light animation runs, Chrome uses live SVG (cardinal disabled) — unchanged.

---

## Interaction input gating

Central API: `isArtworkActionBlocked(action)` in [`ArtworkRotation.js`](../../ArtworkRotation.js).  
Actions: `'rotate' | 'export' | 'fullscreen' | 'chromeCardinal' | 'light'`.

**Principle:** one heavy operation at a time. **Light running does not block** F, S, R, or arrows.

| Input | Blocked when |
|-------|----------------|
| **← / →** | Export, rotation crossfade, Chrome R-toggle work, nav — **not** during cardinal bake wait (last-click-wins via `registerPendingRotation`) |
| **S** | Any heavy work; `exportInFlight` mutex; Safari shows prep overlay before raster |
| **F** | Export, bake, crossfade, R-toggle, nav |
| **R** (Chrome) | Same heavy flags |
| **Light tap** | Same heavy flags (toggle only — not blocked because light is already on) |

Export mutex: `window.isArtworkExportInFlight()`.

---

## What changed in code (summary)

| Area | Change |
|------|--------|
| `appControls.js` | Chrome default `chromeRotationMode = 'full'` |
| `ArtworkRotation.js` | R-toggle; `isArtworkActionBlocked()`; deferred Safari rotation; light invalidation on angle change only |
| `safariCardinalBuffers.js` | Yielding bake coordinator; classifier; fast-path all-4-before-rotate; Safari prep overlay policy |
| `RevealAnimation.js` | Safari cardinal + export prep overlays; Chrome prep/status cues |
| `Export.js` | `exportInFlight`; Safari `Preparing image...` with 2-frame paint wait before raster |
| `sketch.js` | Light toggle gated during heavy work only |

---

## Safari “frozen image spin” bug (clarified)

**Symptom:** Arrow rotation animated but lighting stayed locked at 0°.

**Cause:** WebKit tiered to `rotation: 'full'` without live light updates during CSS transform.

**Fix:** WebKit always uses cardinal buffers when rotation is enabled.

---

## What stays deferred

- Chrome automatic adaptive Live ↔ Cardinal (metrics probe)
- Proactive post-reveal bake on all browsers
- Four-phase automated benchmarks
- `revealCompleteMs` threshold retuning

---

## Quick manual QA

| Browser | Hash | Check |
|---------|------|-------|
| Safari | #1519 | Reveal → no bake → first arrow prep → rotate; prep on each new unbaked arrow |
| Safari | #1527 | Heavy hash; classifier slow/medium; mash S during bake → silent ignore |
| Safari | #1527 | Light running → arrows still work |
| Safari | any | S → `Preparing image...` during export |
| Chrome | #1519 | Default live arrows; **R** → batch prep → smooth rotations |
| Chrome | #1519 | **R** off → live; **R** on with buffers → *enabled* cue |
| Chrome | #1527 | Mash S during R batch → silent ignore |

Console: `SafariCompat.capabilities.rotation` is `'cardinal'` on WebKit; Chrome live default uses `window.chromeRotationMode === 'full'`.

*Last updated: 2026-07-09*
