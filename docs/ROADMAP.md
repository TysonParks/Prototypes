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
| 3 | Adjacent wrappers | ⏸ Deferred | — | `minAdjWrapperDistanceObj`, `adjDistanceObjs`, tangent intersection. Deferred — needs better test example. |
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

### PHASE C — Reimplement inner mask

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 10 | Read abandoned branch, summarize inner mask intent + what broke | Ask | 5, 6 | ❌ Not started | ProtoSegment health must be solid first. Stuck since Nov 2024. |
| 11 | Design inner mask implementation plan against working branch | Ask | 10 | ❌ Not started | Step-by-step plan, no code yet. |
| 12 | Implement inner mask feature incrementally | Agent + verify | 11 | ❌ Not started | One small change at a time, browser-verify between each. |
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

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-03*
