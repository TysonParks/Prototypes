# Features, Determinism, and Art Blocks Trait Output

> **Purpose:** Canonical reference for how `FeatureSet` calculates traits,
> what is exposed to Art Blocks, how that relates to generation, and how to
> preserve seed determinism across the submission sprint vs. pre-release polish.
>
> **Related docs:**
> [ARTBLOCKS-SPRINT](ARTBLOCKS-SPRINT.md) |
> [ROADMAP](ROADMAP.md) |
> [ARCHITECTURE](../Canonical/ARCHITECTURE.md) §14 |
> [KNOWN-ISSUES](KNOWN-ISSUES.md) §9.18 |
> [TESTING](TESTING.md)

*Last updated: 2026-06-17*

---

## What This Document Is Not

- **Not** Art Blocks marketplace “local rarity” — that term was a misread.
  Internal rarity **metrics** (enumerative/programmed/spatial magnitudes and
  skew) are separate analytical outputs planned for `publicFeatures`, not
  on-chain rarity tiers.
- Not a substitute for reading `Features.js` — weights and prune rules change.

---

## High-Level Pipeline

```
tokenData.hash
  → Random (R) — alternating prngA/prngB, useage counter
  → FeatureSet.#calcFeatures() — ordered enum draws + conditional pruning
  → calculateFeatures() returns FeatureSet
  → gridTests2(features) / ProtoMill — consumes features + R (generation)
  → (intended) window.$features — Art Blocks trait object
```

**Fragility:** Any change to **order**, **addition**, or **removal** of steps in
`#calcFeatures()`, or any `R`/`r` draw inside it, shifts the PRNG stream for
**every downstream draw** in both feature calculation **and** geometry
generation. Saved hashes in `artBlocks/tokenHash.js` (`lastHash`) are tied to
the exact calculation chain at the time they were captured.

---

## Calculation Order (Current)

| Step | Method | Key outputs |
|------|--------|-------------|
| 1 | `#calcGridProps` | `gridStyle`, `cellAspect`, `x`, `y`, frame props, `gridInsetScale`, `cellSize` |
| 2 | `#calcUniformCuts` | `uniformCuts`, `uniformCutsStyle`, `cutDirections` |
| 3 | `cellInset` enum | `cellInset` label |
| 4 | `#recalcFrameWidth` | Magical `frameWidth` override |
| 5 | `#calcGroupCounts` | `groupCount` `{adds, subs}`, `extraGroups` |
| 6 | `#calcInsideCuts` | `insideCuts`, `insideCutStyle` |
| 7 | `#calcLinearCuts` | `linearCuts` |
| 8 | `uniformLofts` enum | `uniformLofts` boolean |
| 9 | `#calcDensity` | `density` |
| 10 | `#calcWeight` | `weight` |
| 11 | `seed1`, `seed2` | primary/secondary seed styles |
| 12 | `#calcGroups` | `groups[]` recipes |
| 13 | `shapeInterpreter` | **Still drawn; unused in generation (FIXME)** |

Major conditional branches: `gridStyle` (Magical vs Flexible), `x` column count
(prunes `extraGroups`, `cellOutset`, seeds, `linearCuts`), `uniformCuts`
(derives cut direction vs sampling), `cellAspect !== 'Square'` (removes inside
cuts), `groupWeight` (prunes density and linear cuts).

See [ARCHITECTURE §14](../Canonical/ARCHITECTURE.md#14-feature-calculation-and-generation) for generation consumption.

---

## `publicFeatures` — Current State (In Progress)

Partial cleanup landed in `Features.js` (uncommitted on `artBlocksSprint` as of
2026-06-17):

| Change | Status |
|--------|--------|
| `gridWidth` / `gridHeight` (was `cellColumns` / `cellRows`) | ✅ Done |
| `groupCountAdditive` / `groupCountSubtractive` (was raw `{adds,subs}` object) | ✅ Done |
| `groupDensity` (was `density`) | ✅ Done |
| `insideCuts`, `insideCutStyle` added | ✅ Done |
| `shapeInterpreter` removed from output | ✅ Done (still consumes PRNG in `#calcFeatures`) |
| `likelyFailures` / `unlikelyFailures` removed | ✅ Done (were undefined) |
| Internal rarity metric placeholders (commented) | 🟡 Planned, not implemented |
| `uniformCutsStyle` / `cutStyleCount` public reveal | ❌ Not done (noted in enum comments) |
| `window.$features = …publicFeatures` wiring | ❌ Not done (only `Rotation` patched today) |
| Collapse duplicate `FeatureSet` in `ABFeaturesScript.js` | ❌ Not done |
| Remove or wire `shapeInterpreter` from calc chain | ❌ Not done |

### Planned internal rarity metrics (not marketplace rarity)

Comment placeholders in `publicFeatures` for future analytical traits:

- `enumerativeRarityMagnitude`
- `programmedRarityMagnitude`
- `spatialPossibilityMagnitude`
- `programmedRaritySkew`
- `totalPossibilitySkew`

These require a defined measurement model and likely the batch analysis tool
before exposure.

---

## Generation vs. Reporting Gaps

**Used in `ProtoMill` / `gridTests2` but not always in `publicFeatures`:**

- `groups[]` — `{ type, style, method, coverage, minSize, overlapping }`
- `uniformCutsStyle` when `uniformCuts === true`
- `gridInsetScale`, `cellSize`, `weight`
- Private enums: `extraGroups`, `modifierStyle`, `additiveStyle`/`subtractiveStyle`,
  `frameProfiles`, `insideCutAmount`, `rectOverlap`

**Reported but not driving generation:**

- `uniformLofts` — loft assignment in `#calcGroup` is commented out

**PostParams (not hash-derived):**

- `Rotation` — set in `applyPostParamRotation()`; must stay **after** all hash
  draws or use a dedicated non-R fallback path

---

## Seed Corpus and Determinism Baseline

**Saved seeds:** `artBlocks/tokenHash.js` → `lastHash[]` (1500+ annotated hashes
used for regression, wrapper tests, and visual QA).

**Rule:** Do not change the feature calculation chain while debugging issues
those hashes demonstrate, unless you intentionally accept re-baselining the
entire corpus.

### Recommended git workflow

1. **Freeze baseline before further Features work**
   ```bash
   # From the commit that matches your current saved-seed behavior:
   git tag -a features-calc-v1-submission -m "Feature calc frozen for AB sprint seeds"
   git branch features-calc-v1-submission   # optional long-lived branch at same commit
   ```
   Tag the commit **before** any Features.js changes that alter PRNG order, or
   tag immediately after submission upload if the uploaded script must match
   evaluators exactly.

2. **`artBlocksSprint`** — active sprint: bug fixes, shading, submission prep.
   Bug work should run against **`features-calc-v1-submission`** (tag/branch)
   when reproducing `lastHash` issues.

3. **Post-submission / pre-release** — resume Features cleanup and batch
   analyzer on `artBlocksSprint` (or `main`). Re-baseline `lastHash` entries
   or maintain a `lastHash-v2` list for post-cleanup regression.

4. **Document PRNG migration** — when the calc chain changes, record:
   - commit hash of old vs new baseline
   - whether geometry changed for existing hashes (usually yes)
   - updated `R.useage` expectations if testing full builds

### What changes break determinism

| Change type | Breaks saved seeds? |
|-------------|---------------------|
| Rename trait keys in `publicFeatures` only | No (if no calc change) |
| Reorder `#calcFeatures` steps | Yes |
| Add/remove `r`/`R` draws in FeatureSet | Yes |
| Change enum prune logic | Yes |
| Generation-only fixes (Grid, ProtoMill, filters) | Yes for **visual** output, not feature labels |
| PostParam `Rotation` after build | No for hash traits; affects display only |

---

## Remaining Work (Ordered)

### Phase 1 — Now (before Features resume)

1. Fix active bugs demonstrated by saved seeds (shading, geometry, etc.).
2. Work from **`features-calc-v1-submission`** tag when verifying `lastHash`.
3. Create the tag/branch if not already done.

### Phase 2 — Features cleanup (post-bug-fix)

1. Wire `window.$features` from `publicFeatures` (+ PostParams) in
   `calculateFeatures` or `setupFeatures`.
2. Finalize public trait schema (`uniformCutsStyle` vs `cutStyleCount`, etc.).
3. Remove `shapeInterpreter` from calc chain **or** wire it — do not leave as
   silent PRNG burn.
4. Implement or delete internal rarity metric placeholders.
5. Collapse `ABFeaturesScript.js` to thin wrapper; paste final classes for bundle.
6. Create git tag `features-calc-v2-pre-release` after intentional re-baseline.

### Phase 3 — Batch feature analysis tool

Dev-only harness (`testing/FeatureBatchAnalyzer.js`):

- Loop `N` hashes → `new FeatureSet(new Random())` **without** full SVG build.
- Snapshot `publicFeatures` + internal `enums.*.chosen` + derived `groups[]`.
- Report marginals, conditional frequencies, unreachable options after pruning.
- Compare empirical vs. nominal weights **within condition buckets** (not naive
  marginal comparison — see prune tree in Calculation Order above).
- Export CSV/JSON for internal rarity metric design.

Not a substitute for visual regression on `lastHash` — features-only sampling
is fast; full builds remain the authority for render bugs.

---

## Art Blocks Submission vs. Pre-Release

| Phase | Feature calc | Bug fixes | Seed corpus |
|-------|--------------|-----------|-------------|
| **Test bench upload (sprint)** | Freeze at v1; minimal trait wiring | P1/P2 only if low-risk | `lastHash` as-is |
| **After AB approval, before public release** | v2 cleanup + metrics + analyzer | Deferred wrap/shade/geometry | Re-baseline or dual lists |

Acknowledged: some rare visual defects may ship on AB; fix in pre-release using
v1-tagged repros, then merge v2 Features when ready.

---

*Part of the BoredUI documentation suite.*
