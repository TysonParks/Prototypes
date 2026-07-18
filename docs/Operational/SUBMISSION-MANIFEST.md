# Art Blocks Submission Manifest

> **Purpose:** Define what ships in the Art Blocks test bench bundle vs. dev-only
> tooling. Used by E1 cleanup and E2 `build.sh`.

**Related:** [TESTING.md](TESTING.md) · [ARTBLOCKS-SPRINT.md](ARTBLOCKS-SPRINT.md) · [index.html](../../index.html)

---

## Dev vs submission profiles

| Profile | `index.html` | `tokenHash` | GUI |
|---------|--------------|-------------|-----|
| **Dev** (current) | Full script list + legacy snapshots | [artBlocks/tokenHash.js](../../artBlocks/tokenHash.js) — `lastHash[]`, era metadata | [appControls.js](../../appControls.js) + [guiDev.js](../../guiDev.js) + dat.GUI |
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
| [FeaturesLegacy.js](../../FeaturesLegacy.js) | Frozen v1 FeatureSet snapshot (era 1 repro) |
| [artBlocks/RandomLegacy.js](../../artBlocks/RandomLegacy.js) | Legacy dual-stream PRNG |
| [artBlocks/Random.js](../../artBlocks/Random.js) | Dev PRNG factory (mode switch) |
| [artBlocks/determinacyEra.js](../../artBlocks/determinacyEra.js) | Era / FeatureSet resolution |
| [artBlocks/ABFeaturesScript.js](../../artBlocks/ABFeaturesScript.js) | Dev `calculateFeatures` with FeatureSet factory |
| [artBlocks/prngFactory.js](../../artBlocks/prngFactory.js) | `resolvePrngMode`, `createRandom` |
| `lastHash[]`, `currentHash()` dev branch | ~1600 lines; AB injects `tokenData.hash` |
| `values64x4bit`, `sliceHash`, `primes16` in tokenHash | Used only by testMess |
| `functionTestPrint()` | Ad-hoc tests |
| ProtoBatch dev methods | `stepLastHash`, `batchAnimationExport`, `testContactSheet`, etc. (in ProtoBatchDev) |

---

## Include in submission bundle (load order)

From [index.html](../../index.html), **omit DEV-ONLY blocks**:

1. `libraries/p5.min.js` — confirm AB dependency version at upload (Q6); may be injected by platform
2. [appControls.js](../../appControls.js) — must load before safariCompat (sets `window.chromeRotationMode`)
3. [sketchGlobals.js](../../sketchGlobals.js) — `var` hoisted globals (`FRAME`, `frameSize`, …) for bundle TDZ safety
4. [safariCompat.js](../../safariCompat.js)
5. [RandomExtended.js](../../RandomExtended.js)
6. [Features.js](../../Features.js)
7. [artBlocks/ABFeaturesScript.submission.js](../../artBlocks/ABFeaturesScript.submission.js)
8. [artBlocks/tokenHash.submission.js](../../artBlocks/tokenHash.submission.js) — comments only; **do not declare `tokenData`** (AB injects `let tokenData`)
9. [artBlocks/RandomArtBlocks.js](../../artBlocks/RandomArtBlocks.js)
10. [artBlocks/RandomTracked.js](../../artBlocks/RandomTracked.js)
11. [artBlocks/Random.submission.js](../../artBlocks/Random.submission.js)
12. [OpArray.js](../../OpArray.js) · [drawAsSVG.js](../../drawAsSVG.js) · [Export.js](../../Export.js)
13. [ProtoStore.js](../../ProtoStore.js) · [DeBugging.js](../../DeBugging.js) · [Animation.js](../../Animation.js)
14. [ProtoUtility.js](../../ProtoUtility.js) · [ProtoLayerObjects.js](../../ProtoLayerObjects.js) · [Grid.js](../../Grid.js)
15. [ProtoFilter.js](../../ProtoFilter.js) · [neuMark_I.js](../../neuMark_I.js) — filter/mask DOM ids via `RuID.random_hash()`
16. [ProtoBatch.js](../../ProtoBatch.js) — core build/teardown only
17. [RevealAnimation.js](../../RevealAnimation.js)
18. [ArtworkRotation.js](../../ArtworkRotation.js)
19. [sketch.js](../../sketch.js)

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
./build.sh --strip --chunks  # strip build + split into on-chain plaintext segments
./build.sh --verify     # manifest paths only
./build.sh --with-p5    # include p5 in bundle (local standalone; not for AB upload)
python3 scripts/split-ab-chunks.py   # chunk an existing dist/submission/prototypes.js
```

**Upload:** `dist/submission/prototypes.js` only (Art Blocks injects p5).  
**Local E4:** serve `dist/preview/` and compare hashes to dev `index.html`.  
**`tokenData`:** Never declare in the submission bundle. Art Blocks injects
`let tokenData` before the art script; a second `const`/`let`/`var` throws
`Identifier 'tokenData' has already been declared` (blank outputs). Local
preview injects `tokenData` in `dist/preview/index.html` via `build.sh`.

**Page chrome (AB generator):** The platform does not load `style.css`. Early
`sketchGlobals.js` paints `html`/`body` black and defeats generator
`canvas { left/right/top/bottom: 0 }` for cardinal display canvases. Without
this, live view flashes white on load and, after **cardinal/smooth** rotation
(when `#BG` is hidden), the viewport stays white with an off-center pivot.
Affects **Safari always** and **Chrome when R-toggled to cardinal** — not a
WebKit-only bug.
### On-chain single-segment hotfix (tokenData)

If the script is already deployed in 22×23552 segments and only the stub must
go, replace the declaration with an **equal-length** comment so segment byte
boundaries stay aligned, then **UPDATE segment 2 only**
(`chunk-02-of-22.js`). See `dist/submission/chunks/HOTFIX-tokenData.txt`.
A normal `./build.sh --strip --chunks` after removing the stub shifts all
later segments — use that only when you intend a full re-upload.

### On-chain single-segment hotfix (sessionStorage / live view)

Art Blocks collection **Live view** embeds the generator in a sandboxed iframe
without `allow-same-origin`. Reading `sessionStorage` throws `SecurityError` and
can abort early script evaluation → blank live view while the full generator tab
still works. `safariCompat.js` now try/catches storage access. For an already
deployed 22-segment script, see `dist/submission/chunks/HOTFIX-sessionStorage.txt`
(**UPDATE segment 1 only**).

---

## Art Blocks script chunks (manual / on-chain)

Scripts larger than ~24 KB must be stored as sequential on-chain segments. Creator
Dashboard **Script Compression** compresses **each segment independently** before
`addProjectScriptCompressed()`; on read, each index is decompressed then
concatenated. Do **not** gzip the whole file and slice compressed bytes.

### Workflow

```bash
./build.sh --strip --chunks              # default: 18 segments (Sepolia auto was 17)
./build.sh --strip --chunks --chunk-count 18
./build.sh --strip --chunks --chunk-limit 23552   # conservative if paste rejects
python3 scripts/split-ab-chunks.py --count 18
python3 scripts/split-ab-chunks.py --limit 23552
# → dist/submission/chunks/chunk-01-of-NN.js … chunk-NN-of-NN.js
# → dist/submission/chunks/MANIFEST.txt  (sha256, sizes, gzip-9 estimates)
```

1. **UPDATE** existing script index 0 with `chunk-01` (UI may forbid deleting the first segment).
2. **ADD** `chunk-02` … `chunk-NN` in order. Leave **Script Compression ON**.
3. On a failed tx, retry the **same** chunk file — do not re-split mid-upload.
4. If replacing a prior deploy with a **different segment count**, remove trailing old segments (or replace the full set) so on-chain `scriptCount` matches.
5. Preview after all indices land; do not lock until render works.

Default: **18 chunks** via `ceil(bundle_bytes / 18)` plaintext limit (one above Sepolia auto’s 17). That often exceeds the 23552 UI review size; it relies on Script Compression. If the dashboard rejects a paste, re-split with `--chunk-limit 23552` (more segments, safer).
Override: `python3 scripts/split-ab-chunks.py --limit 23000`.
### Sepolia compression / chunk math (2026-07-09 reference)

Hold these numbers when estimating gas / segment count if the auto-chunk pipeline
is unavailable again.

| Observation | Value |
|-------------|--------|
| Strip bundle under test | ~499 626 B (`./build.sh --strip`) |
| Auto UI (Script Compression ON) | **17** chunks × **23552** B review size |
| Implied auto payload | 17 × 23552 = **400 384** B |
| Naive plaintext split @ 23552 of same ~500 KB file | **22** chunks |
| Manual default (this repo) | **18** chunks via `ceil(bytes/18)` (~27.8 KB plaintext; gzip-9 est. ≪ 24 KB) |
| Local whole-file gzip-9 of that strip build | **~107 578** B (~21.5% of plaintext) |
| Local split@23552 then gzip-9 each | 22 segments, each well under 24 KB compressed |

**Interpretation:** Compression is **per-segment**, not whole-file-then-slice.
The 17 vs 22 discrepancy is unresolved (dashboard packing vs source delta at
upload time). For planning:

- **Preferred manual count:** 18 (`./build.sh --strip --chunks`) — matches auto UI ±1.
- **Conservative tx count:** `ceil(bundle_bytes / 23552)` if paste rejects larger plaintext.
- **Soft factor from Sepolia auto only:** ~17/22 ≈ **0.77×** vs naive plaintext.
`scripts/split-ab-chunks.py` embeds this reference in every `MANIFEST.txt` and
prints per-chunk gzip-9 estimates for packing intuition.