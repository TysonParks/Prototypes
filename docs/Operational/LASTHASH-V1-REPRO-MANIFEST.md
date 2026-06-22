# lastHash v1 Repro Manifest

> **Purpose:** Track deferred bugs that require the **v1 FeatureSet** to reproduce
> exact geometry. After F3/v2 work (notably `shapeInterpreter` removal), loading
> the same hash string on v2 **will not** match labeled bug evidence.

**v1 baseline:** git tag / branch `features-calc-v1-submission`  
**Manifest maintained on:** `artBlocksSprint` (v2 forward)

---

## How to repro

**Option A — full v1 workspace (recommended for visual bugs):**

```bash
git stash   # if needed
git checkout features-calc-v1-submission
# set testingControls.hashNumber to designator, or:
# protoBatch.buildFromHash('<hash>')
```

**Option B — restore Feature calc only (trait/analyzer checks):**

```bash
git checkout features-calc-v1-submission -- Features.js artBlocks/ABFeaturesScript.js
```

---

## Deferred bugs (1480–1522 audit, June 2026)

| Designator | Hash prefix | Label | KNOWN-ISSUES | Status |
|------------|-------------|-------|--------------|--------|
| 1490 | `0xd900f863…` | thin r-Out outline bug | §9.14.13 | deferred |
| 1491 | `0x1d3b6e65…` | thin r-Out outline bug | §9.14.13 | deferred |
| 1495 | `0xa062fb40…` | SLOW SAFARI | §9.15.6 | deferred (perf) |
| 1518 | `0x08c672bb…` | thin depth bug | §9.14.12 | **fixed** (Feature limits) |
| 1521 | `0x7b5ad1f2…` | thin r-Out outline bug | §9.14.13 | deferred |
| 1522 | `0x9bec1edc…` | thin r-Out outline bug | §9.14.13 | deferred |
| 1526 | `0x2ea13b06…` | Proximal Wrap | §9.7 / B2 | deferred |
| 1532 | `0x9928c9c3…` | thin r-Out outline bug | §9.14.13 | deferred |

## Fixed in submission sprint (same band)

| Designator | Label | KNOWN-ISSUES |
|------------|-------|--------------|
| 1444–1520 (cascade crop set) | cascade crop | §9.14.1 |
| 1494, 1518, 1521 | thin depth (Flexible) | §9.14.12 |
| 1505–1516 | j-in crop | §9.14.1 |

---

## Corpus notes

- **`lastHash` at v1 commit** — frozen repro archive; designator = array index ≈ gui `hashNumber`.
- **`lastHash` on v2** — may diverge after re-baseline; new entries should note v1 vs v2 in comments.

See [FEATURES-AND-DETERMINISM.md](FEATURES-AND-DETERMINISM.md) for tag SHAs and PRNG migration rules.
