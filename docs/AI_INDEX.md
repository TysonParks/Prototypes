# AI Index

## Project-Wide Axiom: ArtBlocks Deployment is Immutable

**The ArtBlocks release of this project will be locked on-chain
forever.** Once minted, the deployed code cannot be patched, rolled
back, or updated. Collectors are expected to revisit these works for
*decades*, on browsers and operating systems that don't yet exist.

Every architectural decision in the ArtBlocks-targeted codebase must
therefore prioritize **forward stability** over present-day perfection:

- **Anticipate platform evolution.** When a known platform issue (e.g.
  Safari's legacy WebKit SVG pipeline, KNOWN-ISSUES § 9.15.6) is
  expected to improve, our code should *not fail* and *not look like
  it's failing* when that improvement lands. Loading overlays, UA
  detection, and degraded-mode fallbacks must be conservative and
  reversible — they should gracefully no-op when the underlying
  problem disappears.
- **Avoid load-bearing assumptions about the present.** Don't hard-
  code timing assumptions, browser version checks, feature detections
  that won't survive normal browser evolution. Prefer feature
  detection over UA sniffing where feasible. Prefer behavioral
  thresholds over absolute timing.
- **No feature breaks better than a regressed feature.** If a future
  platform change makes one of our compatibility shims redundant, the
  shim should silently retire itself, not visibly fight the platform.
- **Document what we anticipate.** Each forward-compat decision is
  recorded with the platform change we're betting on. See
  KNOWN-ISSUES.md for current bets (LBSE rollout, EU DMA browser-
  engine liberalization, iOS engine choice).

This axiom does *not* apply to the public generator deployment
(GitHub Pages → SquareSpace embed) or local dev — those are mutable
and can ship aggressive present-day optimizations. It applies
specifically to the ArtBlocks token render path.

## Authority Order
1. GEOMETRY-REFERENCE.md → canonical geometric vocabulary and wrapper taxonomy
2. ARCHITECTURE.md → canonical system architecture and separation-of-concerns model
3. KNOWN-ISSUES.md → canonical bug history, unresolved issues, failed fixes
4. TESTING.md → canonical testing/debug procedures and harness usage
5. ROADMAP.md → canonical future work and sequencing

## Use By Task

### Explaining geometry
Read:
- GEOMETRY-REFERENCE.md
- ARCHITECTURE.md only if architectural boundary matters

### Planning bug fixes
Read:
- KNOWN-ISSUES.md
- TESTING.md
- ARCHITECTURE.md if the bug affects evaluation/opinion boundary

### Planning refactors
Read:
- ARCHITECTURE.md
- ROADMAP.md
- KNOWN-ISSUES.md if related bug history exists

### Writing tests
Read:
- TESTING.md
- KNOWN-ISSUES.md for regression targets

## Current truth rules
- GEOMETRY-REFERENCE.md defines terminology
- KNOWN-ISSUES.md records historical failed attempts; do not repeat them
- ROADMAP.md is intent, not proof of implementation
- `RevealAnimation.js` Chrome and Safari reveal behaviors are reference-locked and approved for ArtBlocks submission
- Dev dynamic regen: `RevealAnimationDev.js` (excluded from submission bundle)
   as of 2026-05-05; Safari work must not alter Chrome behavior unless explicitly requested.

## What This Document Is Not

- Not canonical specification — it's a navigational index for AI and humans
- Not a replacement for the canonical docs listed above