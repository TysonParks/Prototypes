# Reveal Animation Status Report
*Last updated: 2026-05-01*

> **Purpose:** Handoff document for future AI sessions working on
> `safariImageSwap.js`. Covers the Chrome animation pipeline (working,
> reference), the Safari animation pipeline (broken, in active repair),
> the isolation boundary between them, and a forensic account of what
> worked in an earlier session and why.

---

## 1. Chrome — Reference Execution (Currently Working as Desired)

### 1.1 What the user sees

On 'n' keypress, a smooth 2-second two-stage transition plays:

- **Stage 1 (0 → 1000ms):** A solid "dummy" div simultaneously:
  - Morphs its rectangular bounds from the artwork's measured shape toward a centered pill
  - Scales down to `hiddenScale = 0.5` (focus-pull / depth-of-field feel)
  - Increases blur from 0 → `blurUserUnits = 30` user-units worth of px
  - Fades opacity 0 → 1 (the dummy was transparent while artwork was visible)
  - The **artwork** simultaneously snaps to `opacity: 0` at the instant the phase boundary fires (no cross-fade — a deliberate instantaneous flip)
- **Stage 2 (1000ms → 2000ms):** Build runs during this window; dummy is fully opaque pill covering the artwork area.
- **After build completes:** 3× `requestAnimationFrame` fires `revealNow()` which reverses the sequence: dummy transitions from pill → artwork shape, scale → 1, blur → 0, then artwork snaps to `opacity: 1` at the phase boundary.

All timing is driven by **CSS `transition` + `transition-delay`** on the dummy element. JS only: sets CSS custom properties, adds/removes a `.revealed` class, and fires a single `setTimeout` for the instantaneous artwork opacity flip.

### 1.2 How it is architecturally structured

**`#reveal-dummy` (the key element)**

A `position: fixed` div created once in `ensureDummy()`, inserted directly into `<body>`. It carries ALL animated properties:

```
transform      (scale)
filter / -webkit-filter   (blur)
border-radius  (per-corner, 4 values)
left / top / width / height  (pixel-precise overlay of artwork rect)
opacity
```

The CSS defines the **hidden state** as the default (pill geometry, blurred, scaled down, opacity 1). The `.revealed` class defines the **revealed state** (artwork geometry, no blur, scale 1, opacity 0). CSS transitions between them entirely.

**Two-phase timing via CSS vars:**

```
--phase-shape-duration    = phaseOffset * totalMs        (blur/scale/border-radius/bounds)
--phase-shape-delay       = 0ms on reveal, opacityDur on hide
--phase-opacity-duration  = (1 − phaseOffset) * totalMs
--phase-opacity-delay     = shapeDur on reveal, 0ms on hide
```

These are set by `setDirectionTiming(totalMs, isReveal)` before `.revealed` is toggled. Total wall-clock = `totalMs` regardless of `phaseOffset`.

**Artwork element (`BG.elt`)**

Only ever animates `opacity`. Never blur, never scale. `prepArtwork()` snaps it to `opacity: 0` (no transition) synchronously after `origBuild` returns, then `revealNow()` schedules a `setTimeout` to snap it back to `opacity: 1` at the phase boundary. This snap-not-fade is intentional: cross-fading artwork and dummy simultaneously produces a gray/double-exposed middle frame.

**Keydown flow (Chrome):**

```
keydown 'n'
  → stopImmediatePropagation (prevents gui.js double-fire)
  → _rebuildInFlight check (debounce)
  → _rebuildInFlight = true
  → hideNow()  ← starts the hide CSS transition on the dummy NOW
  → setTimeout(hideDurationMs)
       → protoBatch.buildFromNewSeed()
            → teardown() → resetForRebuild() → _buildToken++
            → buildFromHash()
                 → _buildToken++
                 → ensureDummy()
                 → updateLayoutVars(defaultFrameMetrics)
                 → origBuild.apply()  ← ~50ms on Chrome
                 → prepArtwork()  ← snaps artwork to opacity 0
                 → updateLayoutVars(currentMetrics)
                 → 3× rAF → revealNow()
                      → setDirectionTiming(revealDurationMs, true)
                      → dummy.classList.add('revealed')  ← CSS does the rest
                      → setTimeout(flipAt) → artwork opacity = 1
                      → setTimeout(revealDurationMs) → _rebuildInFlight = false
```

### 1.3 Why the dummy approach works so well on Chrome

Chrome's Blink compositor can animate `transform`, `opacity`, `filter`, `border-radius`, `left/top/width/height` all **on the compositor thread**, independent of the main thread. Even a 50ms main-thread build doesn't interrupt the CSS animation because the compositor runs separately. The dummy is a plain `<div>` with no SVG children — it has trivial rasterization cost.

### 1.4 The isolation boundary

The Chrome path is entirely self-contained:

- `ensureDummy()` returns early if `isWebKitClass` — no dummy is ever created for Safari.
- `hideNow()` routes to `hideNowSafari()` for WebKit → completely separate function.
- `revealNow()` routes to `revealNowSafari()` for WebKit → completely separate function.
- The keydown handler uses `if (isWebKitClass) { ... return }` to take the Safari branch and never reaches the Chrome `hideNow()` / `setTimeout(hideDurationMs)` path.
- **This isolation MUST be maintained.** Chrome is the reference execution. Safari debugging must never touch the Chrome code path.

---

## 2. Safari — Current State (Not Working as Desired)

### 2.1 Target behavior (what should happen)

On 'n' keypress:
1. **Immediately visible:** artwork fades to 0.5 opacity (200ms CSS transition)
2. **After 2s:** loading text and spinner fade in (1s fade)
3. **Build runs** (10s typical on Safari due to WebKit SVG rasterization)
4. **After build:** artwork fades back to opacity 1 (1s fade), overlay dismisses

### 2.2 What actually happens (as of 2026-05-01)

Inconsistent. Sometimes the dim fires immediately; sometimes it takes 2–10+ seconds; one observed case: over 1 minute delay, then only briefly dimmed before the new artwork appeared. The spinner and text have never been confirmed visible.

### 2.3 The fundamental Safari constraint

**Safari's SVG rasterization blocks the main thread for ~10 seconds.** `origBuild.apply()` inside `buildFromHash` is synchronous — it builds the entire SVG scene graph, and Safari then rasterizes it before returning. During this lock:

- **No JS executes** — no `setTimeout` callbacks, no `requestAnimationFrame` callbacks, no event handlers
- **No layout or paint occurs** — CSS property changes written before the lock are in the style system but may not have been painted (committed to a pixel buffer) yet
- **The GPU compositor CAN still run** — but only for elements on dedicated compositor layers. An element needs to be on its own layer (promoted via `will-change`, `transform: translateZ(0)`, etc.) and needs to have had its layer content **already rasterized** before the lock for the compositor to animate it during the lock.

This means: writing `opacity = 0.5` to `BG.elt` immediately before calling `origBuild` does NOT guarantee the user sees a dimmed artwork — unless the element was already on a promoted compositor layer AND the browser had at least one full paint cycle to rasterize it at the new opacity before the lock started.

### 2.4 History of approaches tried this session

#### Attempt 1: buildFromHash snap + `void offsetWidth`
The `buildFromHash` hook was updated to write `opacity = safariArtworkDimOpacity` with `transition: none`, followed by `void _frameElt.offsetWidth` to force a layout. The `void offsetWidth` trick forces a **layout recalc** (style values are committed to the render tree) but does **not** force a **paint** or **composite**. Since `origBuild` immediately followed with no yield, the browser never got a rendering step — the dim was invisible until after the lock released.

#### Attempt 2: 2× requestAnimationFrame before build
Changed the keydown handler to write the dim, then defer `buildFromNewSeed()` via `rAF → rAF → build`. The reasoning was that two rAFs would guarantee one composited frame. This failed because `rAF` fires in the **pre-paint** phase of the next vsync — the callback runs BEFORE the frame is painted. So `rAF → rAF → build` means: "call build at the start of frame N+1, before frame N+1 has been painted." Frame N had one 16ms window to paint the dim, which may have been too short or already partially consumed.

#### Attempt 3 (current): `setTimeout(250)` + `will-change` promotion + `transition: opacity 200ms`
- `will-change: opacity` + `transform: translateZ(0)` written to `BG.elt` in `prepArtwork()` to promote it to a compositor layer.
- Dim written with a 200ms CSS transition (so the user sees a fade, not a snap).
- Build deferred via `setTimeout(250)` — 250ms of real wall-clock time gives the browser ~15 full 16ms paint cycles.
- Status: **partially working** — dim sometimes fires immediately, sometimes with multi-second or multi-minute delays. Root cause not yet fully identified.

### 2.5 Remaining suspects

#### Suspect A: `BG.elt` is not the right element
`BG` is a p5 graphics object. `BG.elt` is its underlying `<svg>` or `<canvas>` element. But the artwork that's visible on screen may be a different element — e.g. a wrapper div, `FRAME.bleed.elt`, or an element that's a parent of `BG.elt`. If the element we're dimming is not the one composited to screen, the opacity change is invisible regardless of timing. **This should be verified in DevTools by inspecting the element hierarchy while the artwork is visible.**

#### Suspect B: `will-change` not applied early enough
`prepArtwork()` is called *after* `origBuild.apply()` returns (inside the `buildFromHash` hook). By that point, the build is done and we're about to reveal — not the moment we need the layer promoted. The layer needs to be promoted **before the keydown's 250ms window starts** — ideally at init or at the end of the previous reveal. The current code promotes it in `prepArtwork()` on each build, which means the first 'n' press after cold-load hits an unpromoted layer.

#### Suspect C: Safari throttles or defers `setTimeout` during main-thread lock
Safari may reschedule timers that are queued during a long sync operation. If `_safariOverlayDelayMs = 2000` fires a timer from inside `armLoadingText()`, and that `armLoadingText()` call was made during the buildFromHash hook (while locked), the timer start time may be deferred to after the lock releases — causing the overlay to appear 2s *after* the 10s build, not 2s after the keypress.

#### Suspect D: `_rebuildInFlight` is not the debounce problem anymore, but...
The flag starts `true` and is cleared in `revealNowSafari()`. Cold-load: `revealNowSafari()` is called via `setTimeout(safariBuildSettleMs)` from the `buildFromHash` hook. If this fires correctly on cold-load, `_rebuildInFlight` becomes `false` and the first 'n' press proceeds. But if anything goes wrong (timer not firing, wrong element, etc.) `_rebuildInFlight` stays `true` forever and ALL 'n' presses are silently blocked. **Add a console.log in the keydown handler to confirm whether it reaches `_rebuildInFlight = true` on every press.**

#### Suspect E: `resetForRebuild()` clears `_frameElt` unnecessarily
`resetForRebuild()` sets `_frameElt = null`. It is called from `teardown()`, which is called from `buildFromNewSeed()` before `buildFromHash()`. So the sequence is:

```
keydown → setTimeout(250) → buildFromNewSeed()
  → teardown() → resetForRebuild() → _frameElt = null   ← dim handle lost!
  → buildFromHash()
      → dim code: _frameElt is null, BG may not have .elt yet
```

The `_frameElt` set in the keydown handler's 250ms window is nulled before the dim code in `buildFromHash` can use it. The dim code then tries to recover it from `BG.elt` — but at the start of `buildFromHash`, `BG` may not have been rebuilt yet (the new `BG` is created by `origBuild`). This means the dim written in keydown may be on an element that gets replaced, and the `buildFromHash` dim attempt may find no element at all.

### 2.6 How the earlier working session likely functioned

The user reports that on a previous day, Safari animations were working: opacity change, scale, and blur all happened simultaneously on 'n' press.

The key architectural insight is: **CSS animations on a `position: fixed` div with `will-change` run on the GPU compositor thread, completely independent of main-thread SVG rasterization.**

The earlier working state likely had:
- A `#reveal-dummy` div OR an equivalent fixed wrapper that was **pre-inserted into the DOM at page load** — already composited and on a GPU layer before any build ran.
- `hideNow()` / the 'n' handler triggered a CSS class change or inline style change on that div **before** calling `buildFromNewSeed()`.
- The key: the CSS animation was **already in progress** (started before the build) on a **pre-promoted compositor layer**. The 10s lock then ran with the compositor continuing to animate that layer independently.
- The artwork (`BG.elt`) was **hidden by the dummy** — either via z-index or the dummy being opaque in front of it. The artwork itself may not have needed its own compositor-layer promotion because the dummy was covering it.
- Scale + blur happening simultaneously suggests these were CSS `transition` properties on the dummy itself — the compositor animates `transform` (scale) and `filter` (blur) from one keyframe to another, frame by frame, on the GPU — no main thread involvement at all.

The catastrophic mistake that broke it: at some point the dummy was **removed from the Safari path** (`ensureDummy()` has `if (isWebKitClass) return`). Without the dummy, we lost the pre-promoted compositor-layer element. All subsequent attempts to animate `BG.elt` (a complex SVG element) directly have been fighting two problems:
1. Complex SVG elements are expensive to promote and re-rasterize.
2. `BG.elt` is created/replaced on every build, meaning its compositor layer is torn down on every rebuild.

**The most likely path back to a working Safari animation is to restore a persistent fixed wrapper div for Safari** — either re-enable the dummy for Safari (with blur disabled to avoid Safari's pathological CSS-blur-on-SVG path), or add a separate `#safari-artwork-wrapper` that `BG.elt` is parented inside, whose opacity/transform can be animated on a stable compositor layer that survives the build cycle.

---

## 3. Isolation Rules Going Forward

| Rule | Rationale |
|------|-----------|
| Chrome code path MUST NOT be modified while fixing Safari | Chrome is the reference execution; any regression there is unacceptable |
| `isWebKitClass` branch points are the firewall — keep them sharp | Every Safari-specific change should be inside an `if (isWebKitClass)` block |
| `ensureDummy()` must remain no-op for Safari until Chrome dummy is verified working independently | Safari dummy experiment must be a separate element or a Safari-only flag |
| `prepArtwork()` Chrome path (snap to `opacity: 0`) must not be touched | It is correct and working |
| CSS vars `--phase-*` are Chrome-only timing | Safari uses inline styles only; don't let Safari code write these vars |
| `_rebuildInFlight` debounce is shared — changes must not break Chrome's `revealDurationMs` guard | Safari clears it unconditionally; Chrome clears it after `revealDurationMs` timeout |

---

## 4. Recommended Next Steps for a More Capable Model

1. **Verify `BG.elt` identity in DevTools** — with a breakpoint or `console.log(BG.elt)` after a build, confirm what element is actually composited visibly on screen. It may be a wrapper div, not the SVG element itself.

2. **Restore a persistent Safari wrapper div** — create a `#safari-artwork-wrapper` that is inserted at `init()` and never torn down. Give it `will-change: opacity; transform: translateZ(0)`. On each build, move `BG.elt` inside it (or set its background to match). Animate this wrapper's opacity instead of `BG.elt` directly. This gives the compositor a stable layer to animate during the lock.

3. **Re-enable the dummy for Safari (without blur)** — the dummy already has a `safari-mode` CSS class that strips blur (`filter: none !important`). Simply removing the `if (isWebKitClass) return` guard from `ensureDummy()` would restore the stable pre-promoted compositor layer. The dummy covers the artwork during the build — artwork opacity management becomes simpler because the dummy occludes it.

4. **Move `will-change` promotion to `init()`** — promote `BG.elt` (if it exists) at init, and again in `revealNowSafari()` after each reveal, so the layer is warm before the next 'n' press arrives.

5. **Log `_rebuildInFlight` state on every keydown** — if it is ever `true` at the start of a keydown that shouldn't be debounced, the entire flow is blocked. Add `console.log('[RevealAnim] keydown: _rebuildInFlight =', _rebuildInFlight)` before the check.

6. **Do not use `void offsetWidth` as a paint-flush** — it flushes layout, not paint. The only reliable way to guarantee a paint on Safari before a sync block is a real wall-clock delay (250ms+ `setTimeout`) observed to be working in practice.
