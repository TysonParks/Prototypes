# Reveal Animation Status Report
*Last updated: 2026-05-03 (rev 7 - Safari transition complete)*

> Handoff document for future work on `safariImageSwap.js`. The current
> priority is no longer a fully dynamic Safari generator. For Art Blocks,
> token artworks load once from an immutable hash, so Safari work is now
> scoped to the first page load only.

---

## 0. Current Priority

### Chrome

Chrome is the reference execution and is already good enough for the
submission target. Do not modify Chrome reveal/hide timings, phase
structure, dummy behavior, keydown behavior, or artwork opacity behavior
unless the user explicitly asks for Chrome work.

The recovery snapshot is `CHROME_REFERENCE_PRESET` in `safariImageSwap.js`.
Safari work must stay behind the `isWebKitClass` boundary or in Safari-only
helpers.

### Safari

Safari is now scoped to:

1. Initial load starts in the hidden state.
2. Loading text appears consistently during WebKit's slow SVG build.
3. The built artwork transitions consistently to the revealed state.
4. The `n` key is ignored completely on Safari.
5. The `s` key remains available for capture/debug output through `gui.js`.

The Safari transition, loading text, hidden-state pulse, and final raster
quality are user-approved and should be treated as complete for the Art Blocks
submission scope. Future Safari work should only preserve or repair that
behavior unless the user explicitly reopens transition tuning.

The dynamic Safari generator loop is paused. That includes Safari `n`
keypress hide transitions, post-hide rebuild timing, watchdog/debounce
recovery, and new-hash launch behavior.

### Completion Summary

The final Safari implementation solved four requirements simultaneously:

- reliable visible loading text before WebKit's synchronous SVG lock,
- a consistent hidden-state dummy reveal with continuous pulse motion,
- no hard-edged hidden-scale rectangle flash during handoff, and
- no intermittent low-resolution final artwork raster.

The key architectural decisions that made this stable were:

- keep all visible motion on persistent body-level helper layers,
- let `#safari-dummy` own the scale/blur/morph reveal,
- keep `BG.elt` natural-size and opacity-only during Safari reveal,
- prepaint `BG.elt` at normal size with near-zero opacity before reveal, and
- clear any temporary inline reveal styles after the reveal completes.

---

## 1. Active Safari Implementation

The active Safari path uses persistent body-level elements that survive
`ProtoBatch.teardown()`:

- `#safari-dummy`: hidden-state visual cover and reveal morph layer.
- `#safari-dummy-core`: inner fill layer used only for hidden-state scale
  pulsing; the outer dummy keeps ownership of reveal morph/scale.
- `#safari-overlay`: loading text container.
- `#safari-loading-text`: Safari-specific loading copy.

The Safari ring spinner is currently disabled and is not initialized. A later
hidden-dummy corner-radii animation experiment was also removed: animating
`border-radius` is paint-bound in Safari and competes with the reveal morph,
which also needs to transition `border-radius` into the measured artwork shape.
Hidden-state loading motion now uses a compositor-friendly `transform: scale()`
pulse on `#safari-dummy-core`, so it does not override the outer dummy's reveal
`transform`, bounds, or border-radius transitions. The pulse uses a two-point
`linear infinite alternate` keyframe so it moves continuously without the
endpoint pause caused by `0%, 100%` plus easing.

Cold-load sequence:

1. `init()` injects styles, writes default pill geometry, creates the Safari
   dummy and overlay, and starts `.building` on the overlay.
2. `ProtoBatch.prototype.buildFromHash` is already patched before
   `sketch.js` calls `setup()`.
3. On Safari, the build hook ensures the overlay and dummy exist, writes
   default hidden geometry, starts the loading overlay, then yields via
   `requestAnimationFrame` before calling the original build.
4. `origBuild.apply()` performs the slow synchronous SVG build. During this
  lock, the persistent overlay is already visible; no delayed loading
  animation is required to start mid-lock.
5. After build, `updateLayoutVars(getCurrentFrameMetrics())` writes the new
  artwork geometry. If exact mask-path measurement is unavailable, the
  dummy targets the rendered `BG.elt` rect instead of falling back to the
  pill, so the reveal still has a morph target.
6. The artwork is first put into a normal-size near-transparent prepaint state
  (`opacity: 0.001`, no transform, no filter). This gives WebKit a chance to
  raster/paint the finished SVG at full size before any scale reveal starts.
7. After two `requestAnimationFrame` ticks, `revealNowSafari()` keeps the
  artwork at natural size and near-transparent opacity, removes the hidden
  pulse, flushes the dummy/core/artwork state, waits one more frame, then
  flips `#safari-dummy.revealed`, fades the artwork to opaque, and removes
  `.building` from the overlay. The complex `BG.elt` artwork must not be
  scaled, blurred, `translateZ(0)`-promoted, or `will-change`-promoted here;
  the simple dummy layer carries the visible scale/blur/morph motion.
8. After the reveal transition completes, Safari clears the temporary
  `BG.elt` transition, transform, filter, and `will-change` styles. This lets
  WebKit drop the low-resolution composited raster it used during the scale
  reveal and repaint the finished SVG at normal vector quality.

Current Safari key behavior:

- `n`: swallowed by the capture-phase handler in `safariImageSwap.js`; no hide,
  no teardown, no new hash.
- `s`: not intercepted by `safariImageSwap.js`; `gui.js` handles PNG export.

---

## 2. Why Dynamic Safari Rebuilds Are Paused

Safari's SVG render path can lock the main thread during the synchronous
build. During that lock:

- JavaScript timers and event handlers do not run.
- `requestAnimationFrame` does not provide a reliable post-paint guarantee.
- Style writes to complex SVG elements may not paint before the lock.
- Persistent, simple, compositor-friendly DOM layers are much more reliable
  than anything inside `BG.elt`.

The dynamic generator path created too many timing surfaces at once: hide
transition, artwork transform/filter, dummy morph, overlay delay, delayed
teardown, synchronous build, post-build settle, and reveal. For submission,
all of that risk is unnecessary because the token loads once.

---

## 3. Findings From Paused Safari Dynamic Work

These findings should be preserved for a future website-generator pass.

### BG.elt Is Not a Stable Animation Target

`ProtoBatch.teardown()` removes `BG.elt` from the DOM and then rebuilds a new
one. Any hide/dim/scale state applied to the old element is destroyed before
the new artwork exists. This made direct `BG.elt` dimming or promotion a poor
foundation for Safari rebuilds.

### Loading UI Must Exist Before The Lock

Loading text is most reliable when `.building` is applied before the
synchronous build starts. Delayed fade-in variants were unreliable in
practice, so the current implementation shows the loading text immediately
while `.building` is present.

### Overlay/Backdrop Dims Produced The Wrong Image

The full overlay/backdrop approach helped separate UI from SVG teardown, but
it did not reproduce the desired dummy-hidden visual. Backdrop blur also
created clipping and compositing surprises. The dummy remains the better
visual layer for the hidden/reveal effect.

### Dummy Plus Artwork Reveal Was Closer, But Dynamic Hide Was Fragile

The later Safari Rev 4 direction used a separate `#safari-dummy` plus
Safari-only artwork transform/filter so the artwork could tuck behind the
dummy. This improved the visual idea, but the reverse hide/rebuild path still
had timing issues and protrusion/snap artifacts. For initial load only, the
same dummy reveal pieces are useful without the reverse dynamic path. The
current Safari path no longer transforms or filters `BG.elt`; the artwork is
normal-size and opacity-only to avoid intermittent low-resolution WebKit
rasters.

### Zero Blur Needs A Real No-Filter Path

When computed blur is zero, leaving `filter: blur(0px)` in the stack can still
trigger Safari compositor/filter behavior. The implementation now toggles a
`reveal-no-blur` class and uses `filter: none` for zero blur.

---

## 4. Guardrails For Future Work

- Keep Chrome locked unless the user asks for Chrome changes.
- Do not re-enable Safari `n` until the goal is explicitly dynamic generator
  behavior again.
- Any future Safari dynamic architecture should animate persistent body-level
  layers, not elements destroyed by `ProtoBatch.teardown()`.
- Avoid JavaScript timers for visual timing during the synchronous Safari
  build window. Prefer already-visible persistent layers.
- Avoid CSS filter animation on complex SVG content. Flat-color dummy layers
  are safer.
- Do not leave `BG.elt` promoted with `transform`, `filter`, or `will-change`
  after the Safari reveal completes; WebKit can keep displaying the scaled
  transition raster, making the finished artwork look pixelated.
- Do not scale, blur, or force-promote `BG.elt` during the Safari reveal.
  Keep compositor hints on the simple dummy layer instead; the complex SVG
  should stay at natural size and fade in at natural resolution.
- Before the Safari dummy scale reveal, let `BG.elt` prepaint at normal size
  with near-zero opacity. Fully transparent `opacity: 0` may be optimized away
  and fail to build a full-size backing raster.
- If dynamic Safari hide/reveal returns later, investigate a true shared
  persistent Safari stage or clipping strategy so artwork cannot protrude
  behind the dummy before disappearing.

---

## 5. Current Tunables Worth Testing In Safari

- `safariTransitionMs`: cold-load reveal duration.
- `safariOverlayFadeMs`: loading text fade duration.
- `safariDummyPulseAmount`: absolute scale delta around `hiddenScale` for the
  hidden dummy core pulse; defaults to `0.05`.
- `safariDummyPulseMs`: hidden dummy core pulse duration; defaults to `2000` ms.

Chrome still reads from `CHROME_REFERENCE_PRESET`; do not use Safari tunables
as a shared timing surface.
