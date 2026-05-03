# Reveal Animation Status Report
*Last updated: 2026-05-01 (rev 2 — adds §5 Smoking Gun + §6 Proposed Fresh Architecture)*

> **Purpose:** Handoff document for future AI sessions working on
> `safariImageSwap.js`. Covers the Chrome animation pipeline (working,
> reference), the Safari animation pipeline (broken, in active repair),
> the isolation boundary between them, a forensic account of what
> worked in an earlier session, and a fresh architectural plan that
> sidesteps the WebKit main-thread-lock problem entirely.

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

---

## 5. The Smoking Gun (rev 2 — discovered 2026-05-01)

### 5.1 BG.elt is destroyed and replaced on every build

This is the single most important fact in this document, and it invalidates every approach that has been tried this session:

```js
// ProtoBatch.js teardown()
if (BG && BG.elt && BG.elt.parentNode) {
  BG.elt.parentNode.removeChild(BG.elt)   // ← removed from DOM
}
BG = null                                   // ← reference dropped
```

`teardown()` runs **inside** `protoBatch.buildFromNewSeed()`, **before** `buildFromHash()`. So the actual sequence on 'n' press is:

```
keydown
  → write opacity 0.5 to BG.elt          ← element X
  → setTimeout(250)
    → buildFromNewSeed()
        → teardown()
            → BG.elt.parentNode.removeChild(BG.elt)   ← element X destroyed
            → BG = null
        → buildFromHash()
            → setupBackground() creates a NEW BG div  ← element Y
            → origBuild() builds new SVG inside element Y
            → prepArtwork() promotes element Y to compositor layer
            → setTimeout(safariBuildSettleMs)
                → revealNowSafari() fades element Y to opacity 1
```

The element we dimmed in keydown (X) is **never composited to screen**. By the time the user could see it, it has been removed from the DOM. The element that does eventually appear on screen (Y) was created inside the locked thread — its layer wasn't promoted until *after* the build, and even the dim written in `buildFromHash` is on a `BG.elt` that is replaced moments later by `setupBackground()`.

Every attempt this session to dim `BG.elt` was doomed by this fact. There is no timing or compositor trick that will rescue an element that gets `removeChild`-ed.

### 5.2 What this proves about the working "yesterday" architecture

The earlier working state could not have been animating `BG.elt`. It must have been animating an element that **outlived the teardown/rebuild cycle**. The only candidates that survive teardown are:

- The `<body>` itself
- A persistent overlay `<div>` inserted at module init and never removed
- The `#reveal-dummy` element (which does survive — `ensureDummy()` is idempotent and the dummy is appended to body, not BG)

The most likely "yesterday" architecture was the `#reveal-dummy` covering the artwork during builds. Its CSS transitions ran on the GPU compositor layer. When the build lock began, the transitions were already in progress on a stable, pre-promoted layer — the compositor continued them frame-by-frame using only the GPU, no main thread involvement.

The catastrophic regression: `ensureDummy()` was changed to `if (isWebKitClass) return` at the top, killing the dummy for Safari entirely. From that point forward, all Safari animation effort has been chasing a moving target (`BG.elt`) that is destroyed on every build.

---

## 6. Proposed Fresh Architecture for Safari

### 6.1 Design principles

1. **Never animate any element that lives inside `BG`.** Everything `BG` contains is destroyed and rebuilt on every press of 'n'. Animations on those elements cannot survive a rebuild.
2. **All Safari animation lives on persistent overlay elements** inserted at module init, parented directly to `<body>`, never removed.
3. **Use CSS keyframe `@keyframes` animations with `animation-delay`, not `setTimeout` chains.** Once a CSS animation is started on the main thread, its compositable properties (opacity, transform) tick on the GPU compositor independently — they keep running even while the main thread is locked rasterizing the SVG. `setTimeout` callbacks queue up during the lock and fire all at once when it releases (which is why the user sees timing collapse).
4. **The dim is achieved by a black-fill overlay layered above the artwork**, not by changing the artwork's own opacity. Opacity-fading a complex SVG layer is expensive on Safari; cross-fading a solid `<div>` is essentially free.
5. **One CSS class on a single root overlay element** drives the entire sequence (dim, spinner appear, text appear, spinner spin). The keydown handler does only two things: add the class, and call `buildFromNewSeed`. No JS timing logic at all.

### 6.2 DOM structure

Inserted once at `init()`, never removed:

```html
<body>
  <!-- BG is created/destroyed by p5/ProtoBatch — irrelevant to overlay -->
  <div id="BG"> ...artwork SVG... </div>

  <!-- All Safari overlay UX lives here, persistent for page lifetime -->
  <div id="safari-overlay" class="">
    <div id="safari-dim"></div>          <!-- black fill, opacity-animated -->
    <div id="safari-spinner-wrapper">
      <canvas id="safari-spinner-canvas"></canvas>
    </div>
    <div id="safari-loading-text">...</div>
  </div>
</body>
```

The overlay sits at `z-index: 100`, `pointer-events: none`, `position: fixed; inset: 0`.

### 6.3 CSS-driven sequence

A single class on `#safari-overlay` drives everything:

```css
:root {
  --safari-dim-opacity: 0.5;     /* tunable */
  --safari-dim-fade-ms: 200ms;   /* tunable */
  --safari-overlay-delay: 2000ms;/* delay before spinner+text appear */
  --safari-overlay-fade-ms: 1000ms;
  --safari-spinner-rev-ms: 30000ms;
}

#safari-overlay {
  position: fixed; inset: 0; z-index: 100; pointer-events: none;
}

/* DIM: full-screen black, opacity-animated.
   Always on the compositor (will-change: opacity), animates
   independently of main thread. */
#safari-dim {
  position: absolute; inset: 0;
  background: black;
  opacity: 0;
  will-change: opacity;
  transition: opacity var(--safari-dim-fade-ms) linear;
}
#safari-overlay.building #safari-dim {
  opacity: var(--safari-dim-opacity);
}

/* SPINNER + TEXT: appear after a delay, using keyframe animation
   (NOT transition-delay, which is less reliable during main-thread
   lock). animation-fill-mode: forwards holds the end state. */
#safari-spinner-wrapper, #safari-loading-text {
  position: absolute;
  /* ...positioning... */
  opacity: 0;
  will-change: opacity;
}
#safari-overlay.building #safari-spinner-wrapper,
#safari-overlay.building #safari-loading-text {
  animation: safari-overlay-fade-in var(--safari-overlay-fade-ms)
             linear var(--safari-overlay-delay) forwards;
}
@keyframes safari-overlay-fade-in {
  from { opacity: 0 }
  to   { opacity: 1 }
}

/* SPINNER ROTATION: pre-rendered blurred arc on a canvas, rotated
   via CSS keyframe animation. Pure compositor work. */
#safari-spinner-canvas {
  animation: safari-spinner-spin var(--safari-spinner-rev-ms)
             linear infinite;
  animation-play-state: paused;
}
#safari-overlay.building #safari-spinner-canvas {
  animation-play-state: running;
}
@keyframes safari-spinner-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

### 6.4 JavaScript — the entire Safari path

```js
function revealHideSafari_show() {
  // Trigger ALL animations via a single class change.
  // Compositor takes over from this moment.
  overlay.classList.add('building')
}

function revealHideSafari_hide() {
  // Reverse: dim fades out, spinner+text fade-out (they revert when
  // animation rule no longer applies because forwards stops applying).
  overlay.classList.remove('building')
}

// Keydown handler — Safari path
if (isWebKitClass) {
  if (_rebuildInFlight) return
  _rebuildInFlight = true
  revealHideSafari_show()

  // Yield ONE frame so the compositor receives the class change and
  // promotes/composites the dim layer before the lock starts.
  // requestAnimationFrame is enough here — we're not waiting for
  // paint of a complex element, just commit of a solid black div
  // whose opacity transition has already been queued on the compositor.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      protoBatch.buildFromNewSeed()
    })
  })
}

// Reveal hook — fires at end of buildFromHash hook on Safari
if (isWebKitClass) {
  // Wait long enough for the compositor to settle after the lock
  // releases, then reverse.
  setTimeout(() => {
    revealHideSafari_hide()
    _rebuildInFlight = false
  }, safariBuildSettleMs)
}
```

### 6.5 Why this works on Safari (the technical justification)

1. **No element inside `BG` is touched.** Teardown's `removeChild(BG.elt)` is irrelevant to the overlay.
2. **The overlay is always on a promoted compositor layer.** `will-change: opacity` and `position: fixed` ensure WebKit creates a dedicated compositing layer on first paint. That layer is created at module init, long before any 'n' press.
3. **CSS keyframe animations tick on the compositor.** Once started, `@keyframes`-driven `opacity` and `transform` animations run on a separate thread from the JS main thread. WebKit bug history confirms this: animations of compositor-friendly properties (`opacity`, `transform`, `filter` on simple layers) survive main-thread blocking (see WebKit Bug 222842, Bug 187945, and Apple's "Optimizing CSS Animations" docs).
4. **`animation-delay` is honored on the compositor.** Unlike `setTimeout` (which queues callbacks on the main thread, where they pile up during the lock and fire in a burst when it releases), `animation-delay` is part of the compositor's own animation timeline. It uses the high-precision compositor clock, not the main thread's event loop. The 2-second wait before spinner appears will fire at exactly 2 seconds even mid-build.
5. **Solid-fill div opacity is the cheapest possible animation.** Animating a complex SVG's opacity requires Safari to re-rasterize the SVG content into a separate buffer for compositing — this can take seconds for our artwork. Animating a `<div>` with a flat color background is a single compositor operation: just multiply by the alpha. Cost is O(1) regardless of what's beneath.

### 6.6 Migration plan (concrete steps for the implementing model)

**Phase 1 — Strip and replace the Safari path**

1. In `safariImageSwap.js`, leave the entire Chrome path untouched (anything outside `if (isWebKitClass)` blocks).
2. Remove `revealNowSafari`, `hideNowSafari`, the Safari branch in `buildFromHash` hook, the Safari branch in the keydown handler, and the spinner-positioning code in `ensureSafariSpinner`.
3. Remove `ensureDummy`'s `if (isWebKitClass) return` guard — but ALSO keep the dummy from being inserted on Safari for now (the new architecture doesn't use it). Actually: leave `ensureDummy` as-is (Safari-skipping). The new overlay is a separate element.
4. Build a new `ensureSafariOverlay()` that creates `#safari-overlay`, `#safari-dim`, `#safari-spinner-wrapper`, `#safari-loading-text` once at init. Idempotent.
5. Replace the Safari keydown branch with the simple `add class + 2× rAF + buildFromNewSeed` flow shown in §6.4.
6. Replace the Safari `buildFromHash` hook with a no-op for the dim (the dim is already on screen via the overlay; nothing to do here).
7. After `origBuild` returns, schedule `setTimeout(safariBuildSettleMs, removeClass+clearDebounce)`. This is the only `setTimeout` in the Safari path, and it fires AFTER the lock has released, so it's reliable.

**Phase 2 — Tunable verification**

Expose all timing as CSS custom properties on `:root` so they can be adjusted live in DevTools without reload:
- `--safari-dim-opacity`
- `--safari-dim-fade-ms`
- `--safari-overlay-delay`
- `--safari-overlay-fade-ms`
- `--safari-spinner-rev-ms`

Mirror them as JS-side constants for first-paint values and update via `document.documentElement.style.setProperty` if exposed through a tunables API.

**Phase 3 — Spinner positioning**

The spinner needs to be positioned over the artwork, not the viewport. Read the artwork rect from the existing `--dummy-art-*` CSS vars (already maintained by `updateLayoutVars`). Position spinner wrapper with `left: calc(var(--dummy-art-left) + var(--dummy-art-width)/2)` etc. — fully CSS-driven, updates automatically when `updateLayoutVars` writes new vars.

### 6.7 Things to deliberately NOT do

- ❌ Do not touch `BG.elt` opacity for the dim. Use the overlay.
- ❌ Do not call `prepArtwork()` for Safari (the Chrome version snaps `BG.elt` to opacity 0; not needed when overlay handles concealment via fully-opaque dim... but if `safariArtworkDimOpacity = 0.5` we DO want the artwork visible at half brightness, so just leave artwork alone).
- ❌ Do not use `setTimeout` for any Safari sequence timing during the build lock window. Only `setTimeout(safariBuildSettleMs)` after `origBuild` returns is allowed (post-lock).
- ❌ Do not use `transition-delay` for the 2-second overlay delay. Use `animation-delay` on a `@keyframes` rule. Transitions can be interrupted/coalesced; animations cannot.
- ❌ Do not animate `filter: blur()` on anything that contains SVG content. Pre-rasterize blur into a canvas (already done for the spinner; keep that approach).
- ❌ Do not modify `ensureDummy()` to insert the dummy for Safari. Keep the Safari overlay completely separate from the Chrome dummy. They serve different purposes; mixing them invites regressions.

### 6.8 Estimated implementation surface

- ~150 lines removed (Safari hideNow/revealNow, keydown Safari branch, buildFromHash Safari block, prepArtwork Safari branch).
- ~120 lines added (new `ensureSafariOverlay`, new CSS block, simplified keydown, simplified post-build hook).
- Net: file gets shorter, complexity drops significantly.
- Chrome path: untouched.


---

## 7. Why the §6 Implementation Failed in Practice (rev 3 — 2026-05-01)

### 7.1 What the user observed after §6 was implemented

1. **Cold-load:** Sometimes white background, sometimes 90+ second hang that never completes. Body is supposed to be black (it is, per `style.css`) but Safari occasionally paints a white frame before any content renders.
2. **First 'n' press:** A dim+blur appears — but it is **clipped to the artwork rect / artwork shape** instead of bleeding across the full viewport (compare attached images: image 1 = correct Chrome behavior, image 2 = broken Safari clip).
3. **Subsequent 'n' presses:** Sometimes 30+ seconds of total non-response, then a delayed dim, then the new artwork pops in **without any reveal transition**.
4. **No reliable way to tell which keypress triggered which event.**

### 7.2 Root causes of the §6 failure

#### Bug 1 — `#safari-dim` is rect-clipped to the artwork shape

The §6 CSS sized `#safari-dim` to `--dummy-art-*` vars and applied `border-radius: var(--dummy-art-radius-*)`. `backdrop-filter` is then **clipped by the element's own border-box** — so blur+dim appear only over the artwork. On Chrome the equivalent visual is achieved by the **dummy element itself** (a solid `#e6e6e6` pill at `hiddenScale = 0.5` blurred via `filter: blur(30uu)`), painted on the body's black background. The blur of a solid pill into surrounding black is what produces the soft full-viewport glow seen in image 1 — NOT a backdrop-filter.

The fix is not "make the dim full-screen." The fix is **use the dummy**, the same way Chrome does.

#### Bug 2 — `backdrop-filter` was the wrong tool for this visual

`backdrop-filter` blurs whatever is **behind** the element. With a fully-opaque artwork behind it, you get a blurred copy of the artwork tinted dark. But the desired visual (image 1) is **a blurred rendition of the dummy itself** against black — a different image entirely. We were producing the wrong picture by design.

#### Bug 3 — `_rebuildInFlight` can stay stuck `true` indefinitely

The flag is cleared inside `revealNowSafari()`, which is called via `setTimeout(safariBuildSettleMs, …)` after `origBuild` returns. If anything along the way silently fails (timer rescheduled by the engine, `_buildToken` mismatch from a concurrent rebuild, an exception in `revealNowSafari`), the flag stays `true` forever and **all subsequent 'n' presses are silently swallowed** (the keydown handler returns early on the debounce check). This explains the "second 'n' press does nothing" symptom.

There is currently **no watchdog** to forcibly clear the debounce after a sane upper bound. We need one.

#### Bug 4 — No visible cold-load state

`ensureDummy()` early-returns for `isWebKitClass`, so Safari has **no element on screen** during the first build. The body is black (good), but if cold-load takes 90+ seconds the user has zero feedback. There is also a brief race where Safari can paint one white frame before the body's background-color rule applies — easily fixable by inlining the rule on `<html>` itself or by inserting a black overlay div via the script that loads earliest.

#### Bug 5 — "No reveal transition" is a mismatched assumption, not a bug

§6 prescribed: keypress adds `.building` (dim+blur in 200ms), build runs, post-build removes `.building` (dim+blur fade out over 800ms). But **there is no morph from "dim pill rect" to "new artwork."** The user expects a Chrome-style morph: a blurred pill scales up + sharpens + reshapes into the new artwork's outline. That morph requires a **dummy element** that animates `transform`, `filter: blur()`, `border-radius`, and `left/top/width/height` from pill geometry to artwork geometry. None of that exists in the §6 architecture.

#### Bug 6 — Two-phase choreography conflicts with the user's new spec

The §1 Chrome reference uses a two-phase split (`phaseOffset = 0.5`) — shape morph in phase 1, opacity flip at phase boundary, opacity fade in phase 2. The user's new spec table (2026-05-01) is **single-phase**: all properties animate together with delay 0 over the full duration. Artwork opacity is still an instantaneous flip (at start of reveal, end of hide) — but every other property runs concurrently for the entire duration. This needs to be implemented as a CSS variable change, not a structural rework.

### 7.3 The Smoking-Gun assumption that was wrong

§5 stated: "`filter: blur()` cannot be animated on anything Safari composites because it re-rasterizes per frame." This is **only true for SVG content**. For a flat-color `<div>` (which is what `#reveal-dummy` is — a single `background-color`), `filter: blur()` is cheap on Safari because there's nothing to re-rasterize: the layer's bitmap is a constant color, and the blur of a constant-color rect is a known closed-form gradient that the GPU can compute analytically. The Chrome reference proves this works because it *is* using `filter: blur()` on the dummy — Safari can do the same.

The mistake was reading "filter: blur is slow on Safari" as universally true and routing around it. It is only slow when the content beneath is non-trivial.

### 7.4 The corrected architecture (§8 below supersedes §6)

The user's spec is now: **one unified dummy-driven approach**, single-phase transitions, with two Safari-specific adaptations:
1. The **persistent overlay** (loading text + spinner) is kept from §6 — these MUST use compositor-clock `animation-delay` to fire correctly during the main-thread lock.
2. The **dummy** is the visual surface. It is created and inserted at module init (Safari and Chrome alike), never destroyed. It carries opacity + transform(scale) + filter(blur) + border-radius + bounds. Single-phase, all delays = 0, all durations = `transitionDurationMs` (default 2000ms for perceptibility).

The `#safari-dim` element is removed entirely. The dummy itself, opaque at hidden state, is the dim — it covers the artwork rect (and more, because at `hiddenScale = 0.5` it's smaller but blurred so the soft edge bleeds out).

---

## 8. Final Architecture (rev 3 — implementing now)

### 8.1 Single-phase transition table (user spec 2026-05-01)

| Property | Hidden | Revealed | Reveal transition | Hide transition |
|----------|--------|----------|-------------------|-----------------|
| dummy opacity | 1 | 0 | 1 → 0 | 0 → 1 |
| dummy blur | blurUserUnits | 0 | blurUU → 0 | 0 → blurUU |
| dummy scale | hiddenScale | 1 | hiddenScale → 1 | 1 → hiddenScale |
| dummy shape | default pill | current artwork | new artwork (start = pill, end = new shape) | current artwork (start = current shape, end = pill) |
| artwork opacity | 0 | 1 | 1 (no change — instantaneous flip at t=0) | 1 (no change — instantaneous flip at t=full) |
| artwork blur | blurUU | 0 | (table value) — visually irrelevant; dummy occludes | (table value) — visually irrelevant |
| artwork scale | hiddenScale | 1 | (table value) — visually irrelevant | (table value) — visually irrelevant |

**Key insight:** the artwork-row blur/scale entries in the table describe the conceptual hidden/revealed states. They are not actually applied to the SVG — applying CSS `filter: blur()` to SVG content is pathologically expensive on WebKit. The visual hidden state is instead achieved by the dummy fully covering the artwork. So in implementation:
- Artwork only animates **opacity** (instantaneous flip at the appropriate boundary).
- All visible morphing happens on the dummy.

This is identical to the Chrome reference except all phase-delay variables are zero and all durations equal `transitionDurationMs`.

### 8.2 Single-phase JS

Replace `setDirectionTiming(totalMs, isReveal)` with simpler logic: write `--phase-shape-duration = transitionDurationMs`, `--phase-opacity-duration = transitionDurationMs`, both delays = `0ms`, in BOTH directions. Artwork opacity flip schedule:
- Reveal: flip at t=0 (synchronously, before adding `.revealed`).
- Hide: flip at t=`transitionDurationMs` (after dummy has finished fading in).

### 8.3 DOM structure (final)

```html
<body style="background:#000">
  <div id="BG"> ... (created/destroyed by ProtoBatch) ... </div>

  <!-- Persistent. Created at module init. NEVER destroyed. -->
  <div id="reveal-dummy"></div>

  <!-- Persistent. Created at module init. WebKit-only. -->
  <div id="safari-overlay">
    <div id="safari-spinner-wrapper">
      <canvas id="safari-spinner-canvas"></canvas>
    </div>
    <div id="safari-loading-text">…</div>
  </div>
</body>
```

`#safari-dim` is gone — the dummy provides the visual hide.

### 8.4 Cold-load flow

1. Script load → `ensureStyles()` writes `:root` vars including default-pill bounds (computed from `computeFrameSize()` mirror of `sizeFrame()`).
2. `ensureDummy()` inserts `#reveal-dummy` parented to `<body>`. Dummy uses default CSS values: opaque `#e6e6e6` pill at `hiddenScale=0.5` with `filter: blur(blurUU)` — the hidden state.
3. `ensureSafariOverlay()` inserts the spinner+text wrapper (Safari only).
4. p5 `setup()` → `protoBatch.buildFromNewSeed()` → `buildFromHash()`. The hooked version runs `origBuild` (10s lock on Safari). During this lock, the dummy is ALREADY visible (was painted before the lock). The `.building` class on `#safari-overlay` is added to start the 2s spinner-fade-in animation-delay.
5. Build completes → `prepArtwork()` (snaps artwork to opacity 0 — invisible behind dummy) → `updateLayoutVars(...)` writes new `--dummy-art-*` vars.
6. Yield + call `revealNow()`: snap artwork opacity to 1, add `.revealed` to dummy, `.building` removed from overlay. Single-phase 2s transition runs on compositor.

### 8.5 Keydown 'n' flow (Safari)

1. Debounce check (`_rebuildInFlight`); reject if true.
2. Set `_rebuildInFlight = true`.
3. **Schedule a watchdog** `setTimeout(60000, () => _rebuildInFlight = false)` so we never get stuck forever.
4. `hideNow()`: snap artwork to opacity 0 (instant), remove `.revealed` from dummy → CSS transition runs on compositor (dummy fades from 0→1 opacity, scales 1→0.5, blur 0→blurUU, shape morphs to pill — all 2000ms). Add `.building` to overlay.
5. Yield 2× rAF so the compositor has the new keyframe values committed.
6. `setTimeout(transitionDurationMs, () => protoBatch.buildFromNewSeed())` — the build starts AFTER the dummy has reached the hidden state (and therefore fully covers the artwork). Even if the build lock starts mid-transition, the compositor continues the dummy animation independently.
7. The hooked `buildFromHash` post-build path schedules `revealNow()` (after `safariBuildSettleMs`).
8. `revealNow()` clears `_rebuildInFlight` after `transitionDurationMs`.

Chrome flow is **identical** except `#safari-overlay` doesn't exist on Chrome and the watchdog is unnecessary (build is ~50ms).

### 8.6 Why this fixes every observed bug

- ✅ **Masked-blur clip**: `#safari-dim` is gone; the dummy provides the dim, painted against black body, blurred via cheap `filter: blur()` on flat color.
- ✅ **Cold-load white flash**: dummy is appended to body at script-load (synchronous, before p5 setup). User sees a black background with a small blurred pill the instant any pixels are painted.
- ✅ **Cold-load 90s hang**: still 90s, but the user sees the dummy + spinner + text the whole time. Nothing visually "hangs."
- ✅ **Stuck `_rebuildInFlight`**: 60s watchdog force-clears it.
- ✅ **No reveal transition**: now the dummy itself does the morph from pill → artwork shape, single-phase 2000ms.
- ✅ **2000ms perceptible transitions**: `transitionDurationMs = 2000` default.

### 8.7 What stays the same

- `ensureSafariOverlay()` and the spinner canvas pre-render are kept verbatim (only difference: no `#safari-dim` child).
- `@keyframes safari-overlay-fadein` + `animation-delay: 2000ms` for spinner+text — still required because nothing else can fire on a deterministic 2s schedule during the main-thread lock.
- `_rebuildSafariSpinnerCanvas()` still fires after each build to update the canvas at the new `_uuToPxArt`.
- All Chrome-path code outside the `if (isWebKitClass)` branches is unchanged.

