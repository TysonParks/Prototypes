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

**Chrome R-toggle status cues** (2 s hold, fade out via `cardinalStatusHoldMs`):

| Copy | When |
|------|------|
| *Smooth rotation ready.* | First batch bake completed (crossfade from prep overlay) |
| *Smooth rotation enabled.* | Re-enable cardinal while buffers still valid (no re-bake) |
| *Live rotation restored.* | Exit cardinal → live SVG (`R` again) |

Every **R** toggle shows the matching cue whenever buffers are valid on re-enable; invalidation (light angle change, hash rebuild, layout resize) forces a fresh bake and *Smooth rotation ready.*

**Status cues are display-only:** once visible, they do **not** gate keys or clicks. Only actual work (`chromeCardinalToggleBusy`, batch bake, crossfade, export, nav) blocks input. Users may press **R**, arrows, **S**, or tap light while a status message is still on screen.

Prep overlay on Safari uses `#safari-overlay.cardinal-prep` at **z-index 10050** (above `#safari-cardinal-rotation-overlay` at 9998). Chrome prep/status overlay `#chrome-cardinal-prep-overlay` uses `pointer-events: none` so it never intercepts artwork clicks.

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
4. Press **R** again → live SVG + *"Live rotation restored."*; buffers **stay resident** in memory
5. Re-press **R** with valid buffers → *"Smooth rotation enabled."* (no re-bake, no prep overlay)

While light animation runs, Chrome uses live SVG (cardinal disabled) — unchanged.

**Light tap in cardinal mode:** Tap/click on the artwork restores live SVG
(`restoreChromeLiveRotation({ forLight: true })`, no status cue), sets `chromeRotationMode = 'full'`,
and starts the light clock.

- **Capture handler:** `pointerup` on `document` (capture phase) when cardinal mode is active or live SVG is hidden.
- **Hit testing:** when the bitmap overlay is active, `#BG` is `display:none` so viewport rects collapse — use `SafariCardinalBuffers.getDisplayRect()` (cached layout rect) instead of live DOM bounds.
- **Status dismiss:** light tap cancels any in-flight Chrome status cue before restoring live SVG.

Press **R** again to re-enable smooth rotation.

---

## Interaction input gating

Central API: `isArtworkActionBlocked(action)` in [`ArtworkRotation.js`](../../ArtworkRotation.js).  
Actions: `'rotate' | 'export' | 'fullscreen' | 'chromeCardinal' | 'light'`.

**Principle:** one heavy operation at a time. **Light running does not block** F, S, R, or arrows. **Chrome status popups do not block** any input once shown.

| Input | Blocked when |
|-------|----------------|
| **← / →** | Export, rotation crossfade, Chrome R-toggle **batch bake** (`chromeCardinalToggleBusy`), nav — **not** during cardinal bake wait (last-click-wins via `registerPendingRotation`); **not** during status cues |
| **S** | Any heavy work; `exportInFlight` mutex; Safari shows prep overlay before raster |
| **F** | Export, bake, crossfade, R-toggle batch, nav |
| **R** (Chrome) | Export, bake, crossfade, R-toggle batch, nav — **not** during status cues |
| **Light tap** | Export, bake, crossfade, R-toggle batch, nav — **not** during status cues. Starting light in Chrome cardinal mode restores live SVG first (no status cue). |

Export mutex: `window.isArtworkExportInFlight()`.

---

## What changed in code (summary)

| Area | Change |
|------|--------|
| `appControls.js` | Chrome default `chromeRotationMode = 'full'` |
| `ArtworkRotation.js` | R-toggle; `isArtworkActionBlocked()`; light capture + `getDisplayRect` hit test; status cues excluded from `isChromeCardinalWorkActive()` |
| `safariCardinalBuffers.js` | Yielding bake coordinator; classifier; fast-path all-4-before-rotate; Safari prep overlay policy; exports `getDisplayRect` |
| `RevealAnimation.js` | Safari cardinal + export prep overlays; Chrome prep/status cues (display-only, `pointer-events: none`) |
| `Export.js` | `exportInFlight`; Safari `Preparing image...` with 2-frame paint wait before raster |
| `sketch.js` | Light toggle via `activateLightAnimation()` |

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
| Chrome | #1519 | **R** off → live; **R** on with buffers → *enabled* cue; interact while cue visible |
| Chrome | #1519 | Cardinal mode + rotate → tap artwork → live SVG + light animation |
| Chrome | #1527 | Mash S during R batch → silent ignore |

Console: `SafariCompat.capabilities.rotation` is `'cardinal'` on WebKit; Chrome live default uses `window.chromeRotationMode === 'full'`.

*Last updated: 2026-07-09 (status cues display-only; cardinal light tap hit test)*
