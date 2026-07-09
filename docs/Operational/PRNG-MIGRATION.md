# PRNG and Determinacy Migration

> **Purpose:** Document the two-axis determinacy model (FeatureSet × PRNG),
> `lastHash` era structure, dev vs submission profiles, and repro paths for
> each saved-hash baseline.

**Related:**
[FEATURES-AND-DETERMINISM](FEATURES-AND-DETERMINISM.md) |
[LASTHASH-V1-REPRO-MANIFEST](LASTHASH-V1-REPRO-MANIFEST.md) |
[SUBMISSION-MANIFEST](SUBMISSION-MANIFEST.md)

*Last updated: 2026-07-09*

---

## Two axes

| Axis | Dev options | Submission |
|------|-------------|------------|
| **FeatureSet** | `v1` (`FeatureSetLegacy`) or `v2` (`FeatureSet`) | `v2` only |
| **PRNG** | `legacy` (dual sfc32) or `ab` (Art Blocks single-stream) | `ab` only |

Each `lastHash` index maps to an **era** — a fixed `(FeatureSet, PRNG)` pair.
Era metadata lives in [`artBlocks/tokenHash.js`](../../artBlocks/tokenHash.js) → `lastHashEras`.

---

## PRNG differences

| | **Legacy** (`RandomLegacy.js`) | **Art Blocks** (`RandomArtBlocks.js`) |
|--|--------------------------------|---------------------------------------|
| Seed | `hash.substr(2,32)` + `hash.substr(34,32)` | `hash.slice(2)` first 32 hex chars |
| Draw | Alternate `prngA` / `prngB` | Single `_next()` |
| Warmup | 1M paired steps | None |
| Usage counter | External [`RandomTracked.js`](../../artBlocks/RandomTracked.js) | Same wrapper |

The sfc32 bitwise step is identical; scheduling differs. **Same hash string → different outputs** when switching PRNG.

---

## lastHash eras (current)

| Era | Indices | FeatureSet | PRNG | Git anchor |
|-----|---------|------------|------|------------|
| **era1** | 0–1522 | v1 (`FeatureSetLegacy`) | legacy | `features-calc-v1-submission @ a67f45c` |
| **era2** | 1523–1531 | v2 (`FeatureSet`) | legacy | `features-calc-v2-pre-release @ 00001d7` / HEAD |
| **era3** | 1532+ | v2 (`FeatureSet`) | ab | HEAD + tag `prng-v2-ab` (recommended at first AB upload) |

New QA hashes after migration append **only** to `lastHash_era3_v2_ab`.

---

## Dev repro (no git checkout)

1. Set `testingControls.hashNumber` to the target index (dat.GUI or arrow keys).
2. Leave `testingControls.prngMode` and `featureSetMode` as **`null`** (auto).
3. Era defaults resolve automatically on nav (`applyEraDefaults()` in [`guiDev.js`](../../guiDev.js) / [`ProtoBatchDev.js`](../../testing/ProtoBatchDev.js)).

Manual override: set `testingControls.prngMode` or `featureSetMode` to `'legacy'`, `'ab'`, `'v1'`, or `'v2'`. Console warns when override disagrees with era.

### Repro cheat sheet

| Goal | hashNumber | Auto-resolved modes |
|------|------------|---------------------|
| v1 bug from June 2026 band | e.g. 1490 | v1 + legacy |
| v2 pre-PRNG-migration hash | e.g. 1527 | v2 + legacy |
| Submission-parity hash | era3 entry | v2 + ab |

---

## File layout

### Dev-only (excluded from bundle)

| File | Role |
|------|------|
| [`FeaturesLegacy.js`](../../FeaturesLegacy.js) | Frozen v1 FeatureSet snapshot (IIFE-scoped; exposes `window.FeatureSetLegacy` only) |
| [`artBlocks/RandomLegacy.js`](../../artBlocks/RandomLegacy.js) | Dual-stream PRNG |
| [`artBlocks/Random.js`](../../artBlocks/Random.js) | PRNG factory (reads era / override) |
| [`artBlocks/determinacyEra.js`](../../artBlocks/determinacyEra.js) | Era + FeatureSet resolution |
| [`artBlocks/ABFeaturesScript.js`](../../artBlocks/ABFeaturesScript.js) | Dev `calculateFeatures` with factory |
| [`artBlocks/tokenHash.js`](../../artBlocks/tokenHash.js) | Full `lastHash` corpus |

### Submission bundle

| File | Role |
|------|------|
| [`artBlocks/RandomArtBlocks.js`](../../artBlocks/RandomArtBlocks.js) | Verbatim AB PRNG |
| [`artBlocks/RandomTracked.js`](../../artBlocks/RandomTracked.js) | Usage wrapper (no legacy core) |
| [`artBlocks/Random.submission.js`](../../artBlocks/Random.submission.js) | Hardcoded AB factory |
| [`artBlocks/ABFeaturesScript.submission.js`](../../artBlocks/ABFeaturesScript.submission.js) | v2 FeatureSet only |
| [`Features.js`](../../Features.js) | Current FeatureSet |

Build: `./build.sh --strip` → `dist/submission/prototypes.js`

---

## R vs RuID streams

| Instance | Purpose | Affects visual output? |
|----------|---------|------------------------|
| **`R`** | Feature calc + geometry generation | Yes |
| **`RuID`** | Storage UIDs (`ProtoStore.assignUID`), SVG filter/mask DOM ids ([`ProtoFilter.js`](../../ProtoFilter.js)) | No (internal ids only) |

`ProtoBatch` logs both after features and after `ProtoMill`:

- `R.afterFeatures` — draws consumed in `#calcFeatures`
- `R.geometryUseage` — draws consumed in generation
- `RuID.useage` — separate counter

---

## Refreshing frozen snapshots

**FeatureSet v1:**

```bash
git show a67f45c:Features.js > FeaturesLegacy.js
# Re-apply header + rename FeatureSet → FeatureSetLegacy, EnumFeature → EnumFeatureLegacy
# Re-wrap body in IIFE; expose window.FeatureSetLegacy at end (avoids publicOptions / LilVert clash with Features.js)
```

**PRNG legacy:** edit [`RandomLegacy.js`](../../artBlocks/RandomLegacy.js) only when intentionally changing the legacy baseline (rare).

Document any refresh in this file and update git tags.

---

## Art Blocks disclosure

Submission uses the **current Art Blocks single-stream sfc32 PRNG** from creator docs.
Prior local development used a legacy dual-stream variant; era-1/era-2 hashes are preserved
in dev via `RandomLegacy.js` and are not part of the on-chain script.

---

*Part of the BoredUI documentation suite.*
