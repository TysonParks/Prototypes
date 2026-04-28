# BoredUI Project Roadmap

> **Purpose:** Track the broader improvement plan for BoredUI. This
section was reconstructed from session notes after being lost between
conversations. Items marked ❓ may be incomplete or out of order —
update as context is recovered.

**Related docs:**
[GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
[KNOWN-ISSUES](KNOWN-ISSUES.md) |
[ARCHITECTURE](ARCHITECTURE.md) |
[TESTING](TESTING.md)

## What This Document Is Not

- Planning intent only — not proof of implementation
- Not a source of canonical architecture or geometry rules

---

## Table of Contents

1. [Wrapper Audit Checklist](#1-wrapper-audit-checklist)
2. [Full Refactor Plan](#2-full-refactor-plan)
   - [Performance Re-Optimization](#post-plan-addition-performance-re-optimization-known-issues--915)

---

## 1. Wrapper Audit Checklist

Systematic audit of each wrapper type to catalog edge cases before
attempting the Unified Wrapper Funnel (ARCHITECTURE § 11). Each audit
session examines one wrapper type's detection, resolution, and known
failures.

| # | Wrapper Type | Status | Session | Notes |
|---|-------------|--------|---------|-------|
| 0 | Foundation (illustrations, GEOMETRY-REFERENCE, geometric vocab) | ✅ Done | Sessions 1-2 | Hand-drawn sketches analyzed, GEOMETRY-REFERENCE built |
| 1 | Coincident wrappers | ✅ Done | Session 1 | Shared-corner geometry, `hasCoincidentCorner` |
| 2 | Collinear wrappers | ✅ Done | Session 2 | Found Bug A (misdiagnosed, KNOWN-ISSUES § 9.6) + Bug B (opposite-facing, KNOWN-ISSUES § 9.7) |
| 3 | Adjacent wrappers | 🟡 In progress | Session 5 | Code traced, detection+resolution documented (KNOWN-ISSUES § 9.12). Non-square aspect distance bug identified+fixed (§ 9.12.10). Stale `inOutAdjWrappers` memo fixed (§ 9.12.9). Visual verification pending. |
| 4 | Radiant wrappers | ✅ Done | Session 3 | Detection + resolution traced. Priority system confirmed working (KNOWN-ISSUES § 9.8). |
| 5 | Interference | ✅ Done | Session 4 | 9 issues found (KNOWN-ISSUES § 9.10). Key: `removeDuplicates` loop bug (G), missing `canCurveTo` guard (H). |

**Bug B status:** Detection implemented (KNOWN-ISSUES § 9.7.7 —
`isMirroredCorner`, `oppFacingCollinearSegs`). Wrapping action deferred
pending collision constraint design.

---

## 2. Full Refactor Plan

Original 17-task plan, revised to audit geometry/wrapping before
attacking cycles (cycles are likely a secondary cause of issues).

**Revision:** The wrapper audit (§ 1) was inserted before Tasks 2/5
because understanding the geometry is prerequisite to knowing which
"cycles" are real bugs vs. correct behavior. The Unified Wrapper Funnel
(ARCHITECTURE § 11) was identified during the audit as a post-audit goal.

### PHASE A — Understand (no code changes)

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| — | **Wrapper Audit (§ 1)** | Ask | — | 🟡 In progress | *Inserted before Task 2.* Audit geometry/wrapping first. |
| 1 | Read full ProtoSegment class, build property dependency graph | Ask | — | 🟡 Partial | Dependency graph built in GEOMETRY-REFERENCE § 8. Not exhaustive yet. |
| 2 | Identify cycles in ProtoSegment, propose break points | Ask | 1, Audit | ❌ Not started | Deferred until wrapper audit completes. |
| 3 | Read `memoize()` in ProtoUtility.js, confirm minification safety | Ask | — | ❌ Not started | Quick — resolves an open question. |
| 4 | Build mutation → invalidation table for memoized properties | Ask | 1 | ❌ Not started | Same graph, reverse traversal. Finds stale-cache bugs. |
| 7 | Create GLOSSARY.md | Ask → Agent | — | ❌ Not started | Helps share vocabulary precisely. |
| 8 | Create ARCHITECTURE.md with dependency graph | Ask → Agent | 1, 4 | 🟡 Partial | Now exists as [ARCHITECTURE.md](ARCHITECTURE.md), with content from GEOMETRY-REFERENCE §§ 8, 10, 11. |
| 9 | Create FEATURES.md (feature calc order + PRNG consumption) | Ask → Agent | — | ❌ Not started | Documents the second most fragile area. |

### PHASE B — Stabilize ProtoSegment

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 5 | Implement cycle fixes in ProtoSegment | Agent + verify | 2 | ❌ Not started | Small, targeted. Test with known problem hashes. |
| 6 | Implement missing `resetMemoized()` calls | Agent + verify | 4, 5 | ❌ Not started | Safe to fix invalidation gaps after cycles broken. `#resetMemoProps` only invalidates ~12 of 30+ keys (ARCHITECTURE § 10.2.5). |

### PHASE C — Restore Intershapes + Reimplement Masking

> **Revised 2026-03-04:** Task 10 completed — BrokenFuture branch
> analyzed, root cause identified (KNOWN-ISSUES § 9.11). Phase C
> restructured into three sub-phases. Intershape restoration moved
> ahead of Phase B because intershapes are needed to analyze the
> remaining wrapper types (adjacent, intershape-specific wrapping).

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 10 | Read abandoned branch, summarize inner mask intent + what broke | Ask | — | ✅ Done | BrokenFuture analyzed. Root cause: `createSimpleSubShapes` in Shape constructor (KNOWN-ISSUES § 9.11). |
| 10a | **Restore intershapes** — remove constructor blocker + fix svg/assignElement | Agent + verify | 10 | ✅ Done | 3 changes: constructor blocker removed, `svg` length check, `assignElement` guard (KNOWN-ISSUES § 9.11.7). |
| 10b | Add `intershape` test hash to WRAPPER_TEST_CASES | Agent | 10a | ✅ Done | User added `intershape_1/2/3` + `collinear_basic_2` + `broken_07` hashes manually. |
| 11 | Design inner mask implementation plan against working branch | Ask | 10a | ✅ Done | Mask pipeline audited (KNOWN-ISSUES § 9.13). Re-enablement plan in § 9.13.7. |
| 12 | Implement inner mask feature incrementally | Agent + verify | 11 | 🟡 In progress | § 9.13.7 Steps 1-2 done: maskShape return-type fix, degenerate-path guard, createMaskGroup re-enabled at drawElement. Steps 3-5 remain. |
| 12a | **Fix SVG filter/mask cropping** — cascade, r-out, waves+ordinal | Agent + verify | 12 | 🟡 In progress | Cascade cropping (§ 9.14.1) ✅ fixed. R-profile mask (§ 9.14.2) ✅ fixed. Mar 6 `userSpaceOnUse` shared-filter-region rewrite was diagnosed as a visual regression and reverted from the runtime default (§ 9.14.6). Waves+ordinal (§ 9.14.3) remains, and the current frame artifact should be approached as a fresh layout/cropping isolation problem. |
| 12b | **Safari rendering** — percentage vs userSpaceOnUse filter regions | Research + Agent | 12a | ❌ Deferred | KNOWN-ISSUES § 9.14.4-5. Only after B-D stabilize the layout system. |
| 13 | Add structured corner-tracing debug log to `maximizeCuddles` | Agent | 5 | ❌ Not started | Useful during step 12 and all future debugging. |

### PHASE D — Document and reorganize

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 14 | Add JSDoc to core classes (ProtoSegment, Grid, FeatureSet, Shade, SegPath) | Edit (Cmd+I) | 5, 6 | ❌ Not started | Document after cleanup, not before. |
| 15 | Split files + reorganize into folders | Agent | 14 | ❌ Not started | Last structural task. Agent creates new files, moves code, updates index.html. |
| 16 | Create `build.sh` | Agent | 15 | ❌ Not started | References final file structure. Automatic minification. Excludes `testing/` and `docs/`. |

### PHASE E — Ongoing debugging

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 17 | Visual edge-case debugging using image + log workflow | Ask | 13 | 🟡 Ongoing | Using WrapperDebugOverlay + hash-specific debugging. See [TESTING](TESTING.md). |
| 18 | Frame artifact diagnosis via clean SVG-layout A/Bs | Ask → Agent | 17 | 🟡 In progress | Primary hash `0x3e8a98...251d34`. KNOWN-ISSUES § 9.14.7 now distinguishes a fixed filter-region regression from a still-open vertical/cropping artifact. Next step is `FilterDebugHarness`-driven isolation of filter region, viewport, overflow, and mask behavior before any shader rewrites. |

### Post-Plan Addition: Unified Wrapper Funnel

| Task | Mode | Depends On | Status | Notes |
|------|------|------------|--------|-------|
| Merge flush/adj pipelines (ARCHITECTURE § 11) | Agent + verify | A complete, 5, 6 | ❌ Not started | ~250 line reduction. Requires completed audit to verify edge case coverage. |

### Post-Plan Addition: Second Frame Wrapping Mode

| Task | Mode | Depends On | Status | Notes |
|------|------|------------|--------|-------|
| Design second Frame wrapping mode (ARCHITECTURE § 12.5) | Ask | 10a, 12 | ⭐ Future | Apply full `maximizeCuddles()` pipeline to backGrid shapes. See ARCHITECTURE § 12.5. |

### Post-Plan Addition: Performance Re-Optimization (KNOWN-ISSUES § 9.15)

> **Context:** The § 9.14.1 three-layer fix broadened all filter
> regions and ShapeGroup viewports to FRAME bounds for correctness.
> This phase incrementally tightens them back for performance without
> breaking correctness. See KNOWN-ISSUES § 9.15 for full details.

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| P0 | Establish measurement baselines (load time, FPS, element counts) | Research | 12a | ❌ Not started | § 9.15.5. Must quantify before optimizing. |
| P1a | Per-profile padding precision | Agent + verify | P0 | ❌ Not started | § 9.15.3 Tier 1a. Vary padding by `hasInsetShade`/`hasOutsetShade`/`hasCastShadow`. |
| P1b | Per-cut filter region tightening (`userSpaceOnUse` AABB) | Agent + verify | P0 | 🚫 Blocked | § 9.15.3 Tier 1b — *2026-04-28: ATTEMPTED. Tight AABB collapses to FRAME for every cut due to § 9.14.1 cascade broadening. Zero area reduction (1.12× speedup, within noise). See § 9.15.6. Re-attempt only after § 9.11 maskShape rebuild.* |
| P1c | Animation batch optimization | Research + Agent | P0 | ❌ Not started | § 9.15.3 Tier 1c. Evaluate batch splitting for lower per-frame cost. |
| P2a | Restore tight ShapeGroup viewports (with overflow:visible) | Agent + verify | P1b | ❌ Not started | § 9.15.3 Tier 2a. Highest risk — coordinate system may shift. |
| P2b | Selective overflow:visible (cascade-only) | Agent + verify | P2a | ❌ Not started | § 9.15.3 Tier 2b-2c. Non-cascade cuts get free GPU clipping. |
| P3 | Per-ShapeGroup filter regions (requires filter cloning) | Agent + verify | P2a, 12b | ❌ Not started | § 9.15.3 Tier 3. Synergy with Safari fix (§ 9.14.4b). |
| P4 | Animation-specific optimizations (diff updates, CSS transforms) | Research + Agent | P0 | ❌ Not started | § 9.15.3 Tier 4. Independent of viewport work. |
| P5 | Load time optimizations (lazy filters, deferred DOM) | Research + Agent | P0 | ❌ Not started | § 9.15.4. Profile setup pipeline first. |

---

### Post-Plan Addition: Safari Canvas-Image-Swap (KNOWN-ISSUES § 9.15.6)

> **Context (2026-04-28):** SVG filter pipeline confirmed to be ~50–100×
> slower on Safari than Chrome due to WebKit's pre-LBSE software
> rasterizer. Tier 1b region-tightening produced no measurable benefit
> (§ 9.15.6). Decision: render once, rasterize to bitmap, swap in `<img>`
> on Safari only.

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| S1 | Tear out Apr 28 diagnostic scaffolding | Agent + verify | — | 🟡 In progress | § 9.15.6.1 checklist. Removes Tier 1b branch, `wrapForIsolation`, `measurePerf`/`measureAcrossFlags`/`measureTightRegion`, B1 EXP keypress probes. Keep `SAFARI_FILTER_REGION_USERSPACE_FIX` branch. |
| S2 | UA-detect Safari + add image-swap entry point | Agent | S1 | ❌ Not started | Detect via feature test or UA. Hook into render-complete. |
| S3 | Implement SVG → blob → `<img>` rasterization | Agent + verify | S2 | ❌ Not started | XMLSerializer + `Blob` + `URL.createObjectURL` + `Image.decode()`. Pixel ratio aware. |
| S4 | Replace live SVG with rasterized `<img>` after first paint | Agent + verify | S3 | ❌ Not started | Loses shadow rotation on Safari. Acceptable. |
| S5 | Visual diff Safari `<img>` vs Chrome SVG across hash suite | Research | S4 | ❌ Not started | Confirm color / blur / mask fidelity at target DPR. |

---

### Post-Plan Addition: Public Generator Deployment

| Task | Status | Notes |
|------|--------|-------|
| Rename `2026MarchSquareSpace` → `PublicGenerator-v0.1` | ✅ Done | Branch renamed locally + remote. Old remote deleted. |
| Decouple regen button into `PublicGenerator.js` | ✅ Done | Dynamic button creation, `positionRegenBtn()` guarded in shared code. |
| Update GitHub Pages deploy branch | ⚠️ User action | Settings → Pages → Branch → select `PublicGenerator-v0.1`. |
| `build.sh` excludes `PublicGenerator.js` from dev builds | ❌ Not started | Depends on Task 16 (PHASE D). |

**Branch model:**
- `agent-testing` — active dev branch
- `main` — stable sync point
- `PublicGenerator-v0.1` — public deployment (GitHub Pages → SquareSpace embed)
- Merge path: `agent-testing → main → PublicGenerator-v0.1`
- Public branch diverges in: `index.html` (browser detection, no testing scripts, loads `PublicGenerator.js`), `style.css` (additional `#unsupported-msg` + button styles)

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-19 — PublicGenerator decoupling complete; branch model documented*
