# Art Blocks Submission Manifest

> **Purpose:** Define what ships in the Art Blocks test bench bundle vs. dev-only
> tooling. Used by E1 cleanup and E2 `build.sh`.

**Related:** [TESTING.md](TESTING.md) · [ARTBLOCKS-SPRINT.md](ARTBLOCKS-SPRINT.md) · [index.html](../../index.html)

---

## Dev vs submission profiles

| Profile | `index.html` | `tokenHash` | GUI |
|---------|--------------|-------------|-----|
| **Dev** (current) | Full script list | [artBlocks/tokenHash.js](../../artBlocks/tokenHash.js) — `lastHash[]`, `testingControls` | [appControls.js](../../appControls.js) + [guiDev.js](../../guiDev.js) + dat.GUI |
| **Submission** (E2 bundle) | Strip DEV-ONLY blocks | [artBlocks/tokenHash.submission.js](../../artBlocks/tokenHash.submission.js) | [appControls.js](../../appControls.js) only |

---

## Exclude from submission bundle

| Path / symbol | Reason |
|---------------|--------|
| `testing/*` | Dev harnesses (WrapperTestHarness, FilterDebugHarness, WrapperDebugOverlay, FeatureBatchAnalyzer, ProtoBatchDev, testMess) |
| `docs/` | Documentation |
| `archive/*` | Legacy experiments ([Arecibo.js](../../archive/Arecibo.js), [Unused.js](../../archive/Unused.js)) |
| `libraries/dat.gui.min.js` | Dev GUI |
| [guiDev.js](../../guiDev.js) | Export keys, seed nav, wrapper debug |
| [RevealAnimationDev.js](../../RevealAnimationDev.js) | Dynamic `'n'` regen (dev `mode: 0` only), rotation-reload morph |
| `lastHash[]`, `currentHash()` dev branch | ~1600 lines; AB injects `tokenData.hash` |
| `values64x4bit`, `sliceHash`, `primes16` in tokenHash | Used only by testMess |
| `functionTestPrint()` | Ad-hoc tests |
| ProtoBatch dev methods | `stepLastHash`, `batchAnimationExport`, `testContactSheet`, etc. (in ProtoBatchDev) |

---

## Include in submission bundle (load order)

From [index.html](../../index.html), **omit DEV-ONLY blocks**:

1. `libraries/p5.min.js` — confirm AB dependency version at upload (Q6); may be injected by platform
2. [safariCompat.js](../../safariCompat.js)
3. [appControls.js](../../appControls.js)
4. [RandomExtended.js](../../RandomExtended.js)
5. [Features.js](../../Features.js)
6. [artBlocks/ABFeaturesScript.js](../../artBlocks/ABFeaturesScript.js)
7. [artBlocks/tokenHash.submission.js](../../artBlocks/tokenHash.submission.js) *(or platform-injected tokenData)*
8. [artBlocks/Random.js](../../artBlocks/Random.js)
9. [OpArray.js](../../OpArray.js) · [color.js](../../color.js) · [drawAsSVG.js](../../drawAsSVG.js) · [Export.js](../../Export.js)
10. [ProtoStore.js](../../ProtoStore.js) · [DeBugging.js](../../DeBugging.js) · [Animation.js](../../Animation.js)
11. [ProtoUtility.js](../../ProtoUtility.js) · [ProtoLayerObjects.js](../../ProtoLayerObjects.js) · [Grid.js](../../Grid.js)
12. [ProtoFilter.js](../../ProtoFilter.js) · [oklch2rgb.js](../../oklch2rgb.js) · [neuMark_I.js](../../neuMark_I.js) · [squircle.js](../../squircle.js)
13. [ProtoBatch.js](../../ProtoBatch.js) — core build/teardown only
14. [RevealAnimation.js](../../RevealAnimation.js)
15. [ArtworkRotation.js](../../ArtworkRotation.js)
16. [sketch.js](../../sketch.js)

**Runtime notes:**

- `DeBug.enableLogging = false` in DeBugging.js — logging stripped at source in production builds optional.
- Light animation: tap/touch to start only; no auto-start ([Animation.js](../../Animation.js) `userInitiated` chase).
- PostParam `Rotation`: read in [ArtworkRotation.js](../../ArtworkRotation.js) `applyPostParamRotation()`; defaults `Up`.
- **Collector controls (production):** `←`/`→` viewport rotation, `s` PNG save ([Export.js](../../Export.js)), `f`/`Esc` fullscreen ([ArtworkRotation.js](../../ArtworkRotation.js)). No hash stepping — see archived [HashHorizon experiment](HASH-HORIZON.md).

---

## E2 bundle checklist

- [x] `build.sh` — concatenates [build/manifest.txt](../../build/manifest.txt) → `dist/submission/prototypes.js`
- [x] Replace `tokenHash.js` with submission profile *(manifest uses `tokenHash.submission.js`)*
- [x] Remove DEV-ONLY `<script>` tags *(manifest omits dev files)*
- [x] Remove dat.GUI *(not in manifest)*
- [x] Concatenate in order above
- [x] Optional minify (E3): `./build.sh --minify` (compact) or `./build.sh --strip` (readable) — comments + `DeBug.*` via terser
- [ ] Visual parity on 3–5 hashes (E4): serve `dist/preview/index.html`

### build.sh usage

```bash
./build.sh              # dist/submission/prototypes.js + dist/preview/
./build.sh --minify     # compact: strip comments + DeBug.*, single-line output
./build.sh --strip      # readable: strip comments + DeBug.*, keep indentation
./build.sh --verify     # manifest paths only
./build.sh --with-p5    # include p5 in bundle (local standalone; not for AB upload)
```

**Upload:** `dist/submission/prototypes.js` only (Art Blocks injects p5).  
**Local E4:** serve `dist/preview/` and compare hashes to dev `index.html`.
