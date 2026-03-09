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
- Maximize stability of the wrapper pipeline: reproduce and localize Bug B (opposite-facing collinear wrappers) and cache staleness in `ProtoSegment` memoization.

Active Hypotheses
- Hypothesis A: Opposite-facing collinear pairs are filtered too early by `viableOutWrappers` (`hasSameFacingCorner`) and require a gated path to the classification stage, not unconditional inclusion.
- Hypothesis B: Some memoized arc-volatile getters are not invalidated by `#resetMemoProps()`, causing stale calculations during `maximizeCuddles()` passes.

Current Experiments
- Audit `viableOutWrappers` call sites to identify where `hasSameFacingCorner` gating prevents downstream handling.
- Inject conservative cache invalidation (temporary full `resetMemoized` for a segment) to see if it reduces stack traces/non-deterministic failures during `maximizeCuddles()`.

Files Under Modification
- `drawAsSVG.js` — inspect `ProtoSegment` methods: `#resetMemoProps`, `#setCurveOrigin`, `viable*` getters.
- `Grid.js` — `maximizeCuddles()` and `inWrapPerimeter()`.
- `ProtoLayerObjects.js` — `Frame.setBackGridGroup()` (frame wrapper differences).
- `docs/Operational/CODE_MAP.md` — added for navigation.

Relevant Known Issues
- KNOWN-ISSUES §9.7 (Bug B) — opposite-facing collinear wrappers (in-progress).
- KNOWN-ISSUES §9.9 — cache staleness baseline; memoization keys classified as arc-volatile.
- ROADMAP §1 — wrapper audit checklist and sessions to complete before funnel refactor.

Recent Discoveries
- `Frame.setBackGridGroup()` bypasses `maximizeCuddles()` and performs direct `flushWrap`/`adjWrap` calls; useful as a simpler repro path.
- `WrapperDebugOverlay` quickly visualizes coincident/collinear/adjacent/radiant relationships for any grid (useful for toggling when reproducing failures).

Next Investigation Steps
1. Create small repro case: two same-line opposite-facing corners (unit test or minimal grid) to exercise `viableOutWrappers` and downstream code paths.
2. Run `maximizeCuddles()` on the repro while temporarily forcing `#resetMemoProps()` to a full invalidation and observe behavior.
3. If repro shows stack/degenerate geometry, add guarded path to classification (allow opposite-facing through a narrow check that ensures downstream functions can handle them), then re-test.
4. Document outcomes and move any stable fixes to `KNOWN-ISSUES` as resolved with references.

Short notes
- Keep this file minimal — edit before ending each session with a 1–2 line status update.
- Use `WrapperDebugOverlay.toggle(GRID)` and `Frame.setBackGridGroup()` for quick visual regressions.

Session timestamp: 2026-03-09
