# HashHorizon — bounded hash-space navigation

> **Purpose:** Document the production collector UX for exploring a small neighborhood
> around the minted hash, plus dev/prod mode switching and implementation notes.

**Related:** [SUBMISSION-MANIFEST.md](SUBMISSION-MANIFEST.md) · [RevealAnimation.js](../../RevealAnimation.js) · [Features.js](../../Features.js)

---

## What was built

### HashHorizon class (`Features.js`)

Each token gets a **unique locus** (0–63) derived from the last two hex digits of the mint hash body:

```
locus = clamp( round( parseInt(body.slice(-2), 16) / 4 ), 0, 63 )
```

Only the hex digit at that locus may change. Sixteen hash variants are precomputed at init (digits `0`–`F`).

| Key | Action |
|-----|--------|
| `↑` | Increment that digit (stop at `F`) |
| `↓` | Decrement (stop at `0`) |
| `0` | Return to mint origin hash |

No PRNG involvement, no public `$features` trait — purely navigational.

### Animated transitions (`RevealAnimation.js`)

Hash changes use the same Chrome hide → rebuild → reveal choreography as dev regen:

- `hideNow()` — scale/blur artwork, morph dummy to pill
- `transitionToHash(buildFn)` — wait for hide, then teardown + `buildFromHash`
- Reveal hook runs automatically after build

### Unified key nav (`ProtoBatch.js`)

One key listener routes by `testingControls.mode`:

| `mode` | Label | `↑`/`↓` | `0` | `n` regen |
|--------|-------|---------|-----|-----------|
| `0` | Dev | `lastHash` corpus | — | Enabled (dev only) |
| `1` | Production | HashHorizon | origin reset | **Disabled** |

Default: **`mode: 1`** in [appControls.js](../../appControls.js).

### Dev tooling

- dat.GUI toggle in [guiDev.js](../../guiDev.js) Testing folder
- `isDevHashNavMode()` helper gates `'n'` in [RevealAnimationDev.js](../../RevealAnimationDev.js) and [guiDev.js](../../guiDev.js)

### Submission bundle

[build/manifest.txt](../../build/manifest.txt) includes HashHorizon, ProtoBatch nav, and RevealAnimation production API. It **excludes** [RevealAnimationDev.js](../../RevealAnimationDev.js) and [guiDev.js](../../guiDev.js), so `'n'` random regen is not present in the upload artifact. `mode` defaults to `1`.

**Safari/WebKit:** HashHorizon and `'n'` regen are both disabled (Chrome desktop is the reference environment).

---

## Why

Collectors can explore **nearby latent states** without an unrestricted generator. The minted output is the privileged origin; navigation is mechanically bounded to one hex coordinate per token, making each work's local horizon unique.

Conceptual framing:

> Each token includes a bounded navigation mode that allows exploration of a small neighborhood within hash space. Rather than exposing an unrestricted generator, the work treats the minted output as a privileged origin from which nearby latent states may be examined. The navigation itself is constrained by a single hexadecimal coordinate derived directly from the token hash, making each work's local horizon unique.

---

## Bugs fixed during implementation

### 1. Hide transition bypassed on hash nav

**Symptom:** Arrow-key hash changes jumped straight to rebuild with no visible morph to the loading pill.

**Causes:**

1. `hideNow()` did not call `parentChromeRevealLayers()` — artwork could sit outside `#chrome-reveal-blur-layer`, so scale/blur transitions did not render.
2. Artwork hide set CSS `transition` and `transform` in one synchronous step without a reflow between them — the browser often skipped the animation.
3. `buildFromHash` hook called `updateLayoutVars(defaultFrameMetrics)` immediately on nav rebuild, snapping the dummy back to default pill geometry and wiping the hide morph.

**Fix:**

- Added `hideChromeArtwork()` with proper reflow → transform sequence
- `hideNow()` parents layers, stops existing pulse, uses fixed artwork hide
- `transitionToHash()` waits two rAF frames before the rebuild timeout so the hide start paints
- When `_navInFlight`, `buildFromHash` preserves the hidden pill instead of resetting layout

### 2. Timing reference

Chrome hide/reveal durations live in `CHROME_REFERENCE_PRESET` at the top of [RevealAnimation.js](../../RevealAnimation.js):

- `hideDurationMs` / `revealDurationMs` — default **200ms** each
- `chromeHiddenPulseHoldMs` — **50ms** hold on pulsing pill before rebuild starts

Total wait before SVG build on nav: **~250ms** (+ 2 rAF frames). Increase `hideDurationMs` if the hide feels too fast.

---

## Manual test checklist

1. **Chrome, mode 1:** `↑`/`↓` step horizon digit; `0` restores origin; hide → pill pulse → reveal visible
2. **Chrome, mode 1:** `'n'` does nothing
3. **Chrome, mode 0:** `'n'` random regen works with hide animation; `↑`/`↓` walks `lastHash`
4. **Safari:** `↑`/`↓`/`0`/`n` all no-op
5. **Submission preview:** `./build.sh --strip`, serve `dist/preview/` — mode 1 default, HashHorizon only
