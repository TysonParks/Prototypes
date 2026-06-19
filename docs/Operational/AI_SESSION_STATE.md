# AI Session State

## What This Document Is Not

This file is temporary working memory for the current debugging/development
session. It is not canonical documentation and may become outdated between
sessions.

Permanent knowledge belongs in:

- `docs/Canonical/*`
- `docs/Operational/KNOWN-ISSUES.md`
- `docs/Operational/ROADMAP.md`
- `docs/Operational/ARTBLOCKS-SPRINT.md`
- `docs/Operational/FEATURES-AND-DETERMINISM.md`
- `docs/Operational/REVEAL-ANIMATION-STATUS.md`

---

## Session Snapshot

Session timestamp: 2026-06-17

### Current Focus

- **Sprint order:** saved-seed bugs → resume Features cleanup → batch feature analyzer.
- **Features cleanup paused** mid-`Features.js` edits because calc-chain changes break `lastHash` determinism.
- **Not in scope:** Art Blocks marketplace “local rarity” — internal rarity **metrics** (magnitudes/skews) are separate, planned analytical traits.
- Tag **`features-calc-v1-submission`** at last stable commit before further Features calc changes.

### Features.js Changes (Uncommitted)

Done in `publicFeatures`:

- `gridWidth` / `gridHeight`
- `groupCountAdditive` / `groupCountSubtractive`, `groupDensity`
- `insideCuts`, `insideCutStyle`
- Removed `shapeInterpreter`, `likelyFailures`, `unlikelyFailures` from output
- Comment placeholders for five internal rarity metrics

Still needed: `window.$features` wiring, `uniformCutsStyle`/`cutStyleCount`, remove/wire `shapeInterpreter` in calc chain, `ABFeaturesScript.js` collapse.

### Next Session Steps

1. Create git tag `features-calc-v1-submission` (commit before Features calc changes, or current HEAD if uncommitted trait renames only).
2. Return to **sprint bugs** demonstrated by saved seeds (user-directed).
3. After bugs: resume Features cleanup + build `FeatureBatchAnalyzer` (see FEATURES-AND-DETERMINISM.md § Phase 3).
4. Post-AB-upload: pre-release bug fixes against v1 tag; Features v2 + seed re-baseline.

### Key References

- Architecture map: `docs/Canonical/ARCHITECTURE.md` §14
- Determinism + trait inventory: `docs/Operational/FEATURES-AND-DETERMINISM.md`
- Sprint calendar: `docs/Operational/ARTBLOCKS-SPRINT.md` (Days 11–13 revised)
