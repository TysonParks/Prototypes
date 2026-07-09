# lastHash v1 Repro Manifest

> **Purpose:** Track deferred bugs that require the **v1 FeatureSet** to reproduce
> exact geometry. After F3/v2 work (notably `shapeInterpreter` removal), loading
> the same hash string on v2 **will not** match labeled bug evidence.

**v1 baseline:** git tag / branch `features-calc-v1-submission`  
**Manifest maintained on:** `artBlocksSprint` (v2 forward)

---

## How to repro

**Option A — dev era auto-sync (recommended for routine QA):**

Set `testingControls.hashNumber` to the designator; leave `prngMode` and
`featureSetMode` as `null`. Era 1 hashes auto-select `FeatureSetLegacy` + legacy PRNG.
See [PRNG-MIGRATION.md](PRNG-MIGRATION.md).

**Option B — full v1 workspace (when validating snapshot refresh):**

```bash
git stash   # if needed
git checkout features-calc-v1-submission
# set testingControls.hashNumber to designator, or:
# protoBatch.buildFromHash('<hash>')
```

**Option C — restore Feature calc only (trait/analyzer checks):**

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

## Fixed — new deterministic `lastHash` band (June 2026)

| Designator | Hash prefix | Label | KNOWN-ISSUES | Fix |
|------------|-------------|-------|--------------|-----|
| 1543 | `0x171732f4…` | thin depth bug | §9.14.12 | `keep()` floor 3→4 (`neuMark_I.js`) |
| 1547 | `0xa30e8166…` | thin depth bug | §9.14.12 | `keep()` floor 3→4 (`neuMark_I.js`) |
| 1548 | `0x73ea44ab…` | thin depth bug | §9.14.12 | `keep()` floor 3→4 (`neuMark_I.js`) |
| 1549 | `0x6bd1b2ad…` | thin depth bug | §9.14.12 | `keep()` floor 3→4 (`neuMark_I.js`) |

---

## Corpus notes

- **`lastHash` era 1 (indices 0–1522)** — v1 FeatureSet + legacy PRNG; dev repro via `FeatureSetLegacy` snapshot
- **`lastHash` era 2+** — v2 FeatureSet; may differ from v1 tag geometry

See [PRNG-MIGRATION.md](PRNG-MIGRATION.md) for era table and [FEATURES-AND-DETERMINISM.md](FEATURES-AND-DETERMINISM.md) for tag SHAs.
