# BoredUI Project Roadmap

> **Purpose:** Track the broader improvement plan for BoredUI. This
> section was reconstructed from session notes after being lost between
> conversations. Items marked ❓ may be incomplete or out of order —
> update as context is recovered.
>
> **Related docs:**
> [GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
> [KNOWN-ISSUES](KNOWN-ISSUES.md) |
> [ARCHITECTURE](ARCHITECTURE.md) |
> [TESTING](TESTING.md)

---

## Table of Contents

1. [Wrapper Audit Checklist](#1-wrapper-audit-checklist)
2. [Full Refactor Plan](#2-full-refactor-plan)

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
| 3 | Adjacent wrappers | 🟡 In progress | Session 5 | Code traced, detection+resolution documented (KNOWN-ISSUES § 9.12). Visual testing with `intershape_3` pending. |
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
| 12a | **Fix SVG filter/mask cropping** — cascade, r-out, waves+ordinal | Agent + verify | 12 | 🟡 In progress | Cascade cropping (§ 9.14.1) ✅ fixed — `boundsRect` override for frame layers. R-out mask (§ 9.14.2) and waves+ordinal (§ 9.14.3) remain. |
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

### Post-Plan Addition: Unified Wrapper Funnel

| Task | Mode | Depends On | Status | Notes |
|------|------|------------|--------|-------|
| Merge flush/adj pipelines (ARCHITECTURE § 11) | Agent + verify | A complete, 5, 6 | ❌ Not started | ~250 line reduction. Requires completed audit to verify edge case coverage. |

### Post-Plan Addition: Second Frame Wrapping Mode

| Task | Mode | Depends On | Status | Notes |
|------|------|------------|--------|-------|
| Design second Frame wrapping mode (ARCHITECTURE § 12.5) | Ask | 10a, 12 | ⭐ Future | Apply full `maximizeCuddles()` pipeline to backGrid shapes. See ARCHITECTURE § 12.5. |

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-04*
