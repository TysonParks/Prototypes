# Deferred: Adaptive Render Modes and Benchmark Strategy

**Status:** Deferred until after ArtBlocks submission.  
**Sprint reference:** [ARTBLOCKS-SPRINT.md](ARTBLOCKS-SPRINT.md) — item **B8**.  
**Shipping MVP:** [MVP-ROTATION-SHIPPING.md](MVP-ROTATION-SHIPPING.md)

---

## Summary

Safari forced discovery of **Cardinal Buffer Mode** — pre-baked orientation bitmaps with compensated lighting and dual-layer crossfade rotation. This is a general viewing strategy, not only a Safari workaround. Post-submission work will:

1. Promote cardinal buffers to a **cross-browser adaptive** feature (not browser-gated).
2. Use **Chrome first-rotation quality probes** (`maxFrameGapMs`, long tasks) to decide Live SVG vs Cardinal per session.
3. Keep **Safari default cardinal** until WebKit LBSE makes live filtered rotation trustworthy.
4. Replace `firstPaintMs` with **`revealCompleteMs`** as the primary user-facing load metric.
5. Run a **four-phase benchmark** (complexity sweep, rotation benchmark, Safari benchmark, cross-browser compare) with a fixed regression suite plus random sweeps.

---

## Two viewing modes (target architecture)

| Mode | When | Rotation |
|------|------|----------|
| **Live SVG** | Animated lighting active; live rotation quality acceptable | CSS transform + live `feOffset` updates |
| **Cardinal Buffer** | Static light; live rotation expensive or unreliable | Four GA bitmaps; lazy bake; crossfade animation |

**Light animation** forces Live SVG and invalidates cardinal cache.

---

## Metrics (target)

### Load

- `revealCompleteMs` — build start → `notifyRevealComplete()` (primary)
- `buildMs` — JS + DOM assembly only

### Cardinal readiness

- `firstVisibleMs`, `firstCardinalMs`, `allCardinalsMs`
- `cardinalBakeMsByAngle`

### Complexity proxies (Chrome sweep — not Safari thresholds)

- `offsetCount`, `filterCount`, `blurCount`, `maskCount`, grid stats

### Rotation quality (Chrome promotion)

- `maxFrameGapMs` (primary), `p95FrameGapMs`, `longTaskCount`, `firstRotationDurationMs`

---

## Three threshold decisions (post-submission)

1. **Disable features** — Safari `revealCompleteMs` / `buildMs` safety valves only (not Chrome-derived).
2. **Chrome Live → Cardinal promotion** — quality probe after first live rotation.
3. **Safari default** — cardinal until LBSE probe passes; then adaptive like Chrome.

---

## Testing phases (post-submission)

| Phase | Goal |
|-------|------|
| **A** | Chrome complexity sweep (50–100 hashes + regression suite) |
| **B** | Chrome rotation benchmark on regression suite |
| **C** | Safari reveal + cardinal readiness |
| **D** | Cross-browser: Chrome Live vs Chrome Cardinal vs Safari Cardinal |

**Regression suite** (`testing/regressionSuite.json`): fastest/slowest build, grid extremes, filter extremes, favorites (#1519, #1527–1529).

---

## Implementation deliverables (deferred)

- `RenderMode.js` — session `viewMode`, Chrome adaptive promotion
- Metrics instrumentation (`revealCompleteMs`, cardinal milestones, rotation probe)
- `testing/complexitySweep.mjs`, `rotationBenchmark.mjs`, `safariBenchmark.mjs`, `viewModeCompare.mjs`
- Full update to [RENDERING-PIPELINE.md](../Canonical/RENDERING-PIPELINE.md)

---

## Known bug that motivated Safari lock (pre-submission)

Light hashes on Safari were briefly tiered to `rotation: 'full'` (live CSS rotation) while `lightAnimation` remained off. Result: **CSS spin of a frozen-lit SVG** — rotation animation ran but lighting did not recalculate. Submission MVP locks WebKit to cardinal only and blocks live SVG rotation fallback on WebKit.

*Last updated: 2026-07-07*
