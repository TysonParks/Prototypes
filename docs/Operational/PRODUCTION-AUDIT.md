# Production Code Audit (2026-06)

Scope: submission-bundle JS except `Grid.js`, `ProtoLayerObjects.js`, `drawAsSVG.js`, `Features.js`.

Related: [SUBMISSION-MANIFEST.md](SUBMISSION-MANIFEST.md) · [KNOWN-ISSUES.md](KNOWN-ISSUES.md) §9.14.12b

---

## Pre-launch tuning

`productionLimits.minCutDepth` is currently **1** user unit and applies to both machined cut depth and inset/packing spacing. Before mint, consider splitting into:

- `minCutDepth` — CNC / `ProtoCut.depth` floor
- `minInsetSpacing` — grid packing / outset floor

Visual QA on lastHash band (#1528, #1543, #1547–#1549) required. TODO documented in [appControls.js](../../appControls.js).

---

## Archived (implemented 2026-06)

| Source | Archive | Notes |
|--------|---------|-------|
| `color.js` | [archive/color-experiments.js](../../archive/color-experiments.js) | Palette UI + 14 weighted palettes preserved |
| `oklch2rgb.js` | same file | OKLCH math; was never wired in production (`ProtoColor.okLCH` removed) |
| `ProtoFilter.js` dead snippets | [archive/ProtoFilter-experiments.js](../../archive/ProtoFilter-experiments.js) | crossfade, stroke mask, updateOffsets, SVG text |

**Kept in production:** `layoutLimited` / `viewBoxLimited` helper chain (commented prototypes — may enable for launch).

---

## Removed from production (Tier 1)

| File | Removed |
|------|---------|
| `sketch.js` | `ProtoMill.mkProtoType()`, `globalShadowVector()` |
| `Export.js` | `Export.exportSVG` |
| `OpArray.js` | `symDiff`, `reduceLength` | `Set.prototype.equals`, `Object.prototype.map` **kept** — live deps on plain-object `.map()` (`Cell.sides`, bounds rounding) |
| `ProtoStore.js` | `ProtoStorage.remove/named/random`, `Identifiable.equals` |
| `ProtoUtility.js` | `compose`, `safeWhile`, `safeArrayWhile`, `rotateCoords`, trig helpers, `getDivisors`, `isPrime`, `isEven`, `isCoordsObj`, `isDirectionObj`, `Range.forEach/between` |
| `neuMark_I.js` | `Profile.breed`, `AllTypes`, `CurveOptions`, depth getters, `equals`; unused `ProtoColor` API; dead shade experiment block |
| `DeBugging.js` | `Debuggable.showFrameRate` |

---

## Dev-only (keep in dev index.html, not submission-critical)

- `testingControls` (`appControls.js`)
- `ProtoBatch.buildFromNewSeed`, `rebuild`
- `Export.exportFrames`
- `RevealAnim.transitionToHash` (`RevealAnimationDev.js`)
- `window.SafariCompat.*` console QA tools

---

## Naming audit (deferred pre-launch)

High-impact renames deferred to avoid cross-file churn: `mk*` methods, `shad*` abbreviations, `DeBug*` branding, SCREAMING_SNAKE Safari flags. Fixable later: `random_hash` → `randomHash`, typos (`useage`, `perpindiculars`).

Allowed globals: `BG`, `FRAME`, `BGRID`, `GRID`, `ROT`, `R`, `S`, `RuID` ([sketch.js](../../sketch.js)).

---

## Excluded-file audit

Separate follow-up: `Grid.js`, `ProtoLayerObjects.js`, `drawAsSVG.js`, `Features.js`.
