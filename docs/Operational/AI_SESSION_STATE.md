## What This Document Is Not

This file is temporary working memory for the current debugging/development
session. It is not canonical documentation and may become outdated between
sessions.

Permanent knowledge belongs in:

- docs/Canonical/*
- docs/Operational/KNOWN-ISSUES.md
- docs/Operational/ROADMAP.md

---

Session snapshot (short, editable)

Current Focus
- Finish investigations from the recent R-in vs R-out shading artifacts and capture the lessons learned in repo memory and docs; continue wrapper/caching work as a secondary focus.

Active Hypotheses
- Hypothesis A: Opposite-facing collinear pairs are filtered too early by `viableOutWrappers` (`hasSameFacingCorner`) and require a gated path to the classification stage.
- Hypothesis B: Some memoized arc-volatile getters are not invalidated by `#resetMemoProps()`, causing stale calculations during `maximizeCuddles()` passes.
- Hypothesis C (recent): Visual shading regressions are frequently caused by mask construction/ordering rather than filter math; masks should be a first suspect when shading artifacts appear.

Current Experiments
- Audit `viableOutWrappers` call sites to identify where `hasSameFacingCorner` gating prevents downstream handling.
- Inject conservative cache invalidation (temporary full `resetMemoized` for a segment) to see if it reduces stack traces/non-deterministic failures during `maximizeCuddles()`.
- (Completed) Instrument `Shade.neuShadeSVGFactory()` with `window.DEBUG_NEUSHADES` and add console harness to compare r-in vs r-out parameters (mag, offsets, blur, luma).
- (Completed) Rework `Shape.maskShape()` and `ShapeGroup.createMaskGroup()` to subtract sharp interior shapes before blurring for hole-shaped masks; added guard for outermost R-in mask cases.

Files Under Modification
- `drawAsSVG.js` — inspect `ProtoSegment` methods: `#resetMemoProps`, `#setCurveOrigin`, `viable*` getters.
- `Grid.js` — `maximizeCuddles()` and `inWrapPerimeter()`.
- `ProtoLayerObjects.js` — `Shape.maskShape()` and `ShapeGroup.createMaskGroup()` (mask-ordering fixes applied).
- `neuMark_I.js` — added temporary `DEBUG_NEUSHADES` instrumentation for diagnostic logging.
- `ProtoFilter.js` — transient experiments were run and reverted; no persistent changes remain.
- `docs/Operational/KNOWN-ISSUES.md` — updated 9.14.9 to Fixed with summary.

Relevant Known Issues
- KNOWN-ISSUES §9.7 (Bug B) — opposite-facing collinear wrappers (in-progress).
- KNOWN-ISSUES §9.9 — cache staleness baseline; memoization keys classified as arc-volatile.
- KNOWN-ISSUES §9.14.9 — R-in Shade Layer Not Centered (fixed: mask-order/creation corrected).
- ROADMAP §1 — wrapper audit checklist and sessions to complete before funnel refactor.

Recent Discoveries
- `Frame.setBackGridGroup()` bypasses `maximizeCuddles()` and performs direct `flushWrap`/`adjWrap` calls; useful as a simpler repro path.
- `WrapperDebugOverlay` quickly visualizes coincident/collinear/adjacent/radiant relationships for any grid (useful for toggling when reproducing failures).
- Mask ordering is a common root cause for shading anomalies: ensure subtraction of sharp interior shapes occurs before blur for hole-shaped masks (R-in).
- Instrumentation confirmed `neuShadeSVGFactory()` outputs (mag, offsets, blur, luma) are symmetric for r-in vs r-out; the artifact was due to mask construction.

Next Investigation Steps
1. Verify mask fixes across the three regression hashes and add a short regression entry to `docs/Operational/TESTING.md` (optional — will add if requested).
2. Create small repro case: two same-line opposite-facing corners (unit test or minimal grid) to exercise `viableOutWrappers` and downstream code paths.
3. Run `maximizeCuddles()` on the repro while temporarily forcing `#resetMemoProps()` to a full invalidation and observe behavior.
4. If repro shows stack/degenerate geometry, add guarded path to classification (allow opposite-facing through a narrow check that ensures downstream functions can handle them), then re-test.
5. When stable, move fixes and short summaries to `KNOWN-ISSUES` and add regression harness entries.

Short notes
- Keep this file minimal — edit before ending each session with a 1–2 line status update.
- Use `WrapperDebugOverlay.toggle(GRID)` and `Frame.setBackGridGroup()` for quick visual regressions.

Session timestamp: 2026-03-13
