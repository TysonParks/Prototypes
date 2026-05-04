# Reveal Animation Status Report
*Last updated: 2026-05-03 (rev 5 - Safari Art Blocks submission direction)*

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

The dynamic Safari generator loop is paused. That includes Safari `n`
keypress hide transitions, post-hide rebuild timing, watchdog/debounce
recovery, and new-hash launch behavior.

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
6. The artwork is put into its hidden Safari reveal state immediately after
  build, before Safari has a chance to paint it full-scale behind the dummy.
7. After two `requestAnimationFrame` ticks, `revealNowSafari()` removes the
  hidden pulse, flushes the hidden dummy/core state, waits one more frame, then
  flips `#safari-dummy.revealed`, transitions the artwork to revealed, and
  removes `.building` from the overlay.

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
same reveal pieces are useful without the reverse dynamic path.

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
- If dynamic Safari hide/reveal returns later, investigate a true shared
  persistent Safari stage or clipping strategy so artwork cannot protrude
  behind the dummy before disappearing.

---

## 5. Current Tunables Worth Testing In Safari

- `safariTransitionMs`: cold-load reveal duration.
- `safariArtworkHiddenScale`: artwork scale during the hidden side of the
  Safari reveal.
- `safariOverlayFadeMs`: loading text fade duration.
- `safariDummyPulseAmount`: absolute scale delta around `hiddenScale` for the
  hidden dummy core pulse; defaults to `0.05`.
- `safariDummyPulseMs`: hidden dummy core pulse duration; defaults to `2000` ms.

Chrome still reads from `CHROME_REFERENCE_PRESET`; do not use Safari tunables
as a shared timing surface.
