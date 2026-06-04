# Prototypes — ArtBlocks Test Bench Sprint Plan

> **Purpose:** Separate sprint plan scoped exclusively to preparing BoredUI for
> upload to the ArtBlocks test bench. This document does **not** replace or
> interrupt the main [ROADMAP](ROADMAP.md) — it runs in parallel. If the project
> does not proceed on ArtBlocks, this document can be archived without affecting
> the primary roadmap.

**Related docs:**
[ROADMAP](ROADMAP.md) |
[KNOWN-ISSUES](KNOWN-ISSUES.md) |
[ARCHITECTURE](ARCHITECTURE.md) |
[TESTING](TESTING.md)

---

## Open Questions (Resolve Before Finalizing Sprint)

These questions should be directed to ArtBlocks directly or answered via their
documentation **before committing to the export pipeline work.** Answers will
change scope estimates significantly.

| # | Question | Who Answers | Status |
|---|----------|-------------|--------|
| Q1 | What is the required format for upload? Single `.js` file? `.html`? Specific bundle format? | ArtBlocks docs / team | Answered (docs): Single JavaScript file only — the generator expects one script file. Do not upload a full HTML page or CDN `<script>` tags; the Generator injects the canvas and the approved dependency library. |
| Q2 | Is minification (whitespace/comment removal) required, recommended, or discouraged for evaluation submissions? | ArtBlocks docs / team | Answered (docs): Minification is recommended to reduce byte-size and gas cost (remove comments/whitespace). It is not strictly required for functional evaluation, but smaller scripts are preferred. |
| Q3 | Is variable/function name obfuscation (uglification) expected, or should code remain human-readable for evaluation? | ArtBlocks team | Answered (docs): Uglification/obfuscation is not specified/required. Docs recommend minifying for size but do not mandate renaming symbols; keep code reviewable for evaluation unless you choose to obfuscate post-approval. |
| Q4 | Are there file size limits for the test bench upload? | ArtBlocks docs | Answered (docs): No hard technical limit published on this page; upload cost scales with bytes (gas formula provided). Recommended target is ~5–20 KB for the script (excluding injected library). |
| Q5 | How does ArtBlocks Post Params work — is it query-string based, hash-segment based, or via their own API? How does it interact with the hash/seed? | ArtBlocks docs | Answered (docs): PostParams are injected into `tokenData` as an external asset dependency (commonly at `tokenData.externalAssetDependencies[0]`). Access individual params via `postParams?.data?.["paramName"]` — values are strings or `undefined`. PostParams are stored on-chain and configured via the Creator Dashboard or by token-owner transactions (they are not passed via URL query strings). Provide hash-seeded PRNG fallbacks when a PostParam is undefined to preserve determinism; compute hash-based fallback values (and call the PRNG) in a consistent order before applying PostParam-based conditionals. PostParams can override or influence token features (`window.$features`) directly and support augmentation hooks for live on-chain data. |
| Q6 | Which p5.js version is supported / bundled by ArtBlocks, or must we include it ourselves? | ArtBlocks docs | Answered (docs): Art Blocks injects the dependency. Supported p5 versions listed include v1.0.0, v1.9.0, and v1.11.11 — confirm preferred version for your project. |
| Q7 | Are external CDN links allowed, or must all dependencies be self-contained? | ArtBlocks docs | Answered (docs): Do not include CDN `<script>` tags. Use libraries from the Art Blocks Dependency Registry; the Generator injects the approved library at runtime. |

---

## Terminology Note: What to Call the Packaging Process

The process of preparing source code for upload doesn't have one agreed name. For
this project, use **"Export Pipeline"** to mean the full sequence of steps that
takes the working multi-file dev codebase and produces an upload-ready artifact.
Sub-steps within that pipeline:

- **Cleanup** — removing dead code, debug statements, commented-out blocks
- **Bundling** — concatenating or combining multi-file source into one file
- **Minification** — stripping whitespace, comments, and shortening string literals
- **Obfuscation / Uglification** — renaming variables/functions to short symbols (makes code non-human-readable — confirm with ArtBlocks whether this is wanted for evaluation)
- **Validation** — running the bundled output against known hashes to confirm visual parity

---

## Sprint Calendar — 2 Weeks

> Time estimates are rough. Actual sprint items are selected in the **Sprint
> Backlog** tables below. This calendar is a template; populate it once Q1–Q4
> above are answered and priorities are finalized.

| Day | Focus | Target Items | Status |
|-----|-------|-------------|----------|
| 1 | ArtBlocks research + Q&A | Resolve Q1–Q7, read upload docs, set up test bench account if needed | ✅ Completed |
| 2 | Bug: Safari compatibility | B1 | ✅ Completed |
| 3 | Bug: Safari compatibility (cont.) + shading | B1, B3 | ✅ Completed |
| 4 | Bug: Wrapping | B2 | ♻️ Deferred |
| 5 | Feature: InfraGrid InnerCuts re-enable | F2 | ♻️ Deferred |
| 6 | Bug: Shading  | ?? | ♻️ Deferred |
| 7 | Animation: timing polish | B4 | ✅ Completed |
| 8 | Animation: performance (cont.) | B4 | ✅ Completed  |
| 9 | Feature: Rotation implementation (basic) | F1 | ✅ Completed  |
| 10 | Feature: Rotation research + Post Params | F1 | 🟡 In Process |
| 11 | AB Features Cleanup | ?? | Not started |
| 12 | AB Features Local Rarity Implementation | ?? | Not started |
| 13 | Code cleanup pass | E1 | Not started |
| 14 | Export Pipeline setup (answer-dependent) | E2 | Planned |
| 15 | Integration testing against ArtBlocks test bench | E3 | Planned |
| 16 | Buffer / overflow / final upload | — | Planned |

> Days 13–14 are intentionally light on new work to allow for unexpected
> integration issues. Do not schedule new features here.

---

## Bug Backlog

Priority scale: **P1** = must fix before upload · **P2** = should fix · **P3** = nice to have

| ID | Bug | Priority | Est. Time | Depends On | KNOWN-ISSUES Ref | Status |
|----|-----|----------|-----------|------------|-------------------|--------|
| B1 | **Safari compatibility** — three sub-issues: (1) 10s–1min render delay (WebKit per-shape masker O(N) cost, Bug #172338); (2) missing/incorrect shapes (same root cause + cross-SVG filter ID resolution, §9.14.4b); (3) animation non-functional (software-path RAF, Bug #19118). Primary workaround: no-op `<filter>` on masked groups. | P1 | 2–3 days | — | §9.14.4b, §9.14.6 | 🟡 In progress |
| B2 | **Remaining wrapping bugs** — adjacent wrapper visual verification still pending; Bug B (opposite-facing collinear) deferred | P2 | 2–3 days | Wrapper audit §1 in ROADMAP | §9.7, §9.12 | 🟡 In progress (audit) |
| B3 | **Shade retuning before release** — viewport-scale unit bug solved for now; objective A/B retune should happen after the ShapeGroup bounds rollback is revalidated | P2 | 1–2 days | B5 | §9.14.10, §9.14.9, §9.13 | 🟡 Retuning needed |
| B5 | **ShapeGroup bounds rollback / J-in cropping** — remove overbroad `this.cut -> FRAME.boundsRect`, then re-test cascade/J-in cropping, Safari, animation FPS, and per-cut filter AABBs | P2 | 1 day | — | §9.14.1, §9.15 | 🟡 Before release |
| B4 | **Animation optimization + timing** — performance re-optimization pass; complete timing/sequencing implementation that was deferred | P3 | 2–3 days | — | §9.15 | 🟡 In progress (clock sync implemented) |

### Bug Notes

**B1 — Safari:**
Three sub-issues: (1) 10 sec–1 min render delay, (2) missing/incorrect shapes,
(3) animation non-functional. All three have known WebKit root causes (see full
attack plan below). **ArtBlocks validates on headless Chromium (SwiftShell) —
Safari fixes are for collector experience, not ArtBlocks evaluation.** But Safari
is a primary collector browser and should not be ignored. Test early, not at the end.

**B2 — Wrapping:**
Scoped to visual verification of adjacent wrappers and the Bug B opposite-facing
collinear case. The full Unified Wrapper Funnel (ARCHITECTURE §11) is **out of scope**
for this sprint — that is a post-audit, post-sprint task.

**Current sprint decision (2026-05-05):** shelve remaining rare wrap bugs for
the submission sprint unless a high-confidence, low-risk targeted fix appears.
Known examples suggest a very low incidence rate, estimated around 0.1% and
likely below reviewer discovery during normal ArtBlocks print/test runs. A
deterministic post-build detection/retry system remains a possible safety net,
but it is not worth introducing new generation-path complexity before the
submission package is otherwise complete. Submission notes can acknowledge that
rare visual defects may remain in a tiny fraction of outputs without describing
the exact artifact pattern.

**B3 — Shading:**
The viewport-scale shade calibration bug is solved for now (§9.14.10): active
`pixToUserUnits` conversion was removed from shade offset/blur authoring and the
current constants were visually retuned. Remaining small-vs-large launch
differences likely come from shade-stack density, especially `offsets.slice(start,
keep())`. Before release, but after the `ShapeGroup.boundsRect` rollback is
revalidated, run an objective Shade A/B retuning pass across
representative hashes and output contexts. Include `keep()` thresholds, offset
ladder shape, blur constants, and possible S-curve shading revival.

**B5 — ShapeGroup bounds rollback / J-in cropping:**
The §9.14.1 `ShapeGroup.boundsRect` branch currently returns FRAME for any cut,
which makes nearly all shaded groups frame-sized. That was too broad for a
cascade/J-in coverage problem and likely distorted recent shade, Safari, and
performance diagnostics. Roll it back to frame-only behavior, keep the
`FilterDebugHarness` `cellBounds`/`frameBounds` A/B modes, and then solve any
returned cropping with explicit filter, mask, or cascade-specific SVG region
math in user units.

**B4 — Animation:**
Timing polish is now centered on a synchronized light clock rather than a
page-local animation timer. `setupPrefs()` defines one invented `arcSecond` as
`PI` seconds; a full light revolution is `20 * PI` seconds, or about 62.83s.
The default clock source is Unix epoch wall time (`Date.now()`), so separate
windows and separate computers with reasonably synchronized system clocks can
share the same global light direction.

Clock-source options considered:

- `Date.now()` / Unix epoch — best default for cross-window and cross-computer
  synchronization; conceptually tied to civic computer time and UTC.
- `performance.timeOrigin + performance.now()` — also epoch-shaped and smoother
  within one browser process, but still anchored by the local machine clock and
  not meaningfully more conceptual than Unix time.
- `performance.now()` / p5 `millis()` — smooth and monotonic, but page-local;
  separate windows start out of phase, so it is not suitable for synchronized
  collector views.
- UTC day phase — derives from Unix time but resets at midnight; conceptually
  solar/civic, though every day repeats the same phase history.
- Project epoch — Unix time minus a chosen project launch timestamp; keeps sync
  while making phase zero artist-defined rather than 1970-defined.
- Token/mint/block timestamp — conceptually tied to the chain or token event,
  but only useful if that timestamp is reliably available in the runtime.
- Server/NTP time — strongest cross-device sync if fetched from a trusted source,
  but introduces networking, latency, and external dependency concerns.
- `AudioContext.currentTime` — excellent for local audio-rate timing, but
  context-local and not cross-window/cross-device synchronized.

Current clock-source decision (2026-05-07): keep Unix epoch wall time via
`Date.now()` as the implementation source for now. It is the best current
balance of performance, universality across execution environments, and
future-proof browser support. A custom project epoch remains the most appealing
conceptual alignment because it can keep the same universal clock while shifting
phase zero to a project-specific date/time, but the date itself is intentionally
undecided. When that date is chosen, implement it as `lightClock.epochMs`
instead of changing the clock source.

Initial implementation (2026-05-07): `AnimationController` computes the global
clock angle from absolute time, then creates a one-shot sync transition whenever
animation starts. The transition compares the current rendered screen-light
angle to the unwrapped global clock position and chooses the smoother of two
paths: coast forward below clock speed if the global clock will catch it soon,
or run a faster forward Hermite chase curve when the rendered light is behind.
Both transition types start from rest and end at the clock's base angular
velocity. During steady-state sync, each frame reads the absolute clock directly;
during catch-up, the precomputed transition supplies the rendered angle without
constantly replanning. Filter updates use direct sine / cosine values instead of
allocating a p5 vector per frame.

Trigger policy (2026-05-07): artwork rotation does **not** stop the synchronized
light animation. While the artwork is visually rotating, the light clock keeps
advancing and the shader-local angle is compensated against the current visual
rotation angle so the screen-space light direction remains continuous. Seed
regeneration is intentionally different: rebuild teardown stops the light clock,
cancels any pending animation frame, and resets the screen-light angle to the
default `90` before fresh geometry is built. If the artwork orientation is
horizontal, the shader-local `globalControls.shadAngle` may read as `0` after
rebuild because it is compensated against the 90° artwork rotation; the tracked
screen-light angle remains the reset/default `90`.

Animation performance audit (2026-05-07): current live-light animation still
spends most of its time in SVG filter re-rasterization, not in clock math or
JavaScript. On the current main hash, the controller cached 62 animated
`feOffset` nodes; the full shade filter stack contained 9 filters, 360 filter
primitives, 59 blurs, 62 offsets, 62 blends, and 106 composites. A runtime trace
showed roughly 4.5-5 fps effective light updates while the raw JavaScript offset
write batch averaged well under 1ms. The bottleneck is therefore browser paint /
raster work after SVG filter primitive attributes change.

Current filter-region tuning status:

- Shade filters in `ProtoCut.setLayouts()` now use `userSpaceOnUse` with the
  visible FRAME region plus selective margin. The current successful strategy is
  `fixedMargin: 0` for high/shad filters and combo-only margin
  `max(0, abs(cut.depth) * 0.25)`. On the current main hash this reduced total
  shade filter region area from the old 540,000 user-unit baseline to about
  186,075 user units (~2.90x smaller) while preserving the tested edge cases.
- Mask/blur utility filters in `p5.Element.prototype.blur()` use
  `userSpaceOnUse` with radius-scaled padding and a 50-unit floor. This was the
  fix for the vertical-line artifact from clipped large blurs. It should stay
  conservative unless a fresh repro proves a narrower bound is safe.
- Per-cut AABB tightening remains blocked as a separate architecture project.
  The prior Tier 1b attempt produced effectively no area reduction because
  §9.14.1 cascade broadening makes cut ShapeGroup bounds collapse to FRAME.
  Re-attempt immediately after the `ShapeGroup.boundsRect` `this.cut` rollback;
  if true cell-bound unions still do not explain the crop/perf tradeoff, then
  escalate to the broader mask/ShapeGroup bounds architecture rebuild.

Animation performance work completed in this pass:

- Cached `S.offsetElts` inside `AnimationController` so the hot loop does not
  flatten the store every frame.
- Switched the live animation path from p5 wrapper `.attribute()` calls to raw
  DOM `feOffset.setAttribute()` writes. This improves JavaScript overhead but
  cannot avoid SVG filter re-rasterization.
- Added overlay instrumentation for real RAF FPS, actual light-update FPS,
  offset count, and recent JavaScript batch time.
- Removed legacy `getMaxFPS()`, `optimizeFrameRate()`, `isCalibrating`,
  `batchSize`, and `frameTimes` from `AnimationController`. That code measured
  cheap JS write time rather than real render throughput, and could push the
  target FPS in the wrong direction.

Deferred / exhibition-grade avenues:

- Progressive frame cache: generate a coarse ring of cached raster frames first
  (for example 120-360 frames), play those cheaply through canvas, and fill
  missing intermediate frames later. This is plausible but belongs after the
  release-critical phase because generating the original frames still goes
  through the expensive SVG filter renderer.
- Disk-backed compressed frame cache: store PNG/WebP/AVIF blobs in IndexedDB,
  Cache API, or OPFS, then keep only a small decoded `ImageBitmap` ring buffer
  in memory. Grayscale artwork should compress well, but normal browser canvas /
  bitmap playback usually expands decoded frames to RGB/RGBA surfaces.
- Full-revolution decoded frame cache is not practical at 4K: `3840 * 2160 * 4`
  is about 31.6 MiB per decoded frame, and roughly 754 frames for a 12fps
  `20π`-second revolution would be over 20 GiB decoded.
- Exhibition video path: for contexts that require smooth synchronized playback,
  render clean videos ahead of time and coordinate sync with the gallery's tech
  stack. This is a better operational fit than forcing the browser SVG runtime
  to behave like a dedicated playback system.

CSS/WAAPI note: animating `feOffset` `dx`/`dy` through CSS is not a reliable
cross-browser performance shortcut. These are SVG filter primitive attributes,
not compositor-friendly transform properties; CSS/SMIL/Web Animations approaches
would still cause SVG filter re-rasterization and are harder to synchronize with
rotation, regeneration, and the global arc-second clock. GPU-cheap CSS
transforms are useful for moving whole layers, but they do not preserve the
neumorphic shadow-vector semantics.

Closing note for release positioning: live browser animation should be described
as synchronized, experimental, and hardware-sensitive rather than guaranteed
smooth playback. A ~4.5fps worst-case current-machine result is acceptable as a
baseline if release copy leaves room for future browser and hardware gains.

**Rotation feature plan (initial implementation):** Chrome-only keyboard-driven
90-degree rotation. Safari/WebKit ignores rotation keys for now. Use right
rotation via `r` / `ArrowRight` and left rotation via `l` / `ArrowLeft`.
Rotation should operate on the finished SVG as a viewport transform, not by
regenerating geometry. During the animated rotation, update SVG filter offsets
each frame so the apparent light direction remains fixed in screen space
(usually the default 90-degree downward light). When a rotation changes the
artwork's fitted size, sequence the transform to stay cleanly inside the black
viewport: shrink first then rotate when the target size is smaller; rotate then
grow when the target size is larger.

---

### B1 — Safari Compatibility: Full Attack Plan

> **Scope note:** ArtBlocks generates static renders using headless Chromium
> (SwiftShader), so Safari issues will **not** block ArtBlocks evaluation. Safari
> matters for collectors viewing the live token page in their browser. Fix B1 for
> collector experience quality — but do not let it block the upload itself.

#### WebKit Open Source Context

WebKit is fully open source: https://github.com/WebKit/WebKit.
SVG rendering code lives in `Source/WebCore/rendering/svg/`.
Bugs and their status are tracked publicly at https://bugs.webkit.org/.
Source is browsable at https://searchfox.org/wubkat/source/.

Research against the public bug tracker reveals the root causes of all three
Safari sub-issues.

---

#### Root Cause A — Per-Shape Masking (drives Issues 1 & 2)

**WebKit Bug [#172338](https://bugs.webkit.org/show_bug.cgi?id=172338) — open
since 2017, still "NEW" as of 2024.**

WebKit's `RenderSVGResourceMasker::applyResource()` applies the mask to each
individual shape in a group's subtree rather than first compositing the entire
group into an offscreen buffer and then applying the mask once. This violates
the SVG 1.1 spec (§14), which requires all painting to be done on an intermediate
canvas *before* applying clipping, masking, and opacity.

This single bug simultaneously causes two of our three Safari issues:

| Effect | Mechanism |
|--------|-----------|
| **Missing/incorrect shapes** | Overlapping shapes in a masked group composite incorrectly — colors, opacity, and fill order are wrong because the mask is applied per-shape rather than to the flattened group |
| **Performance explosion** | `applyMask()` is a software pixel-by-pixel operation (confirmed in WebKit Bug #19118, first raised in 2008). If a masked group has N shapes, WebKit calls `applyMask()` N times instead of once. For complex renders, this O(N) masking loop explains the 10–60 second delays — the profiler shows normal JS timing because the bottleneck is inside the browser's C++ rendering path, invisible to JS profiling. |

**Fix in WebKit:** The new LBSE (Layer-Based SVG Engine) — WebKit's updated SVG
architecture that maps SVG elements to compositing layers — fixes this by
construction. LBSE was "works in LBSE once it is turned on" (Ahmad Saleem, Jan
2024), but is not yet fully deployed in shipping Safari. We cannot rely on it.

**Our workaround:** Adding a no-op `<filter>` to a masked group forces WebKit to
composite the group to an offscreen buffer *before* applying the mask — the same
behavior LBSE provides by default, but triggered via a spec-legal side-effect.
This is a documented workaround in the Bug #172338 comment thread.

```html
<defs>
  <!-- Identity filter — forces Safari to composite group before masking.
       Does not change output. Safe to include in all browsers. -->
  <filter id="webkit-group-isolate">
    <feColorMatrix type="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
  </filter>
</defs>

<!-- BEFORE: Safari applies mask N times (once per child shape) -->
<g mask="url(#shapeMask)">
  <path .../>  <!-- mask applied here -->
  <path .../>  <!-- mask applied again -->
</g>

<!-- AFTER: Safari composites group first, then applies mask once -->
<g mask="url(#shapeMask)" filter="url(#webkit-group-isolate)">
  <path .../>  <!-- rendered into buffer -->
  <path .../>  <!-- rendered into buffer -->
</g>           <!-- mask applied once to buffer — correct AND fast -->
```

---

#### Root Cause B — Cross-SVG Filter ID Resolution (drives Issue 2)

Our own **KNOWN-ISSUES §9.14.4b**: Safari may not resolve `filter="url(#id)"`
references across multiple `<svg>` elements in the DOM. Chrome resolves
cross-document SVG IDs; Safari silently ignores the filter if the `<defs>` live
in a sibling or parent `<svg>`. Shapes that reference a missing filter render
without the filter (which may mean they render visible but incorrect, or not at
all if the filter was providing a necessary compositing step).

---

#### Root Cause C — Software-Path Animation (drives Issue 3)

**WebKit Bug [#19118](https://bugs.webkit.org/show_bug.cgi?id=19118) — open
since 2008.**

SVG animation in WebKit runs through the software rendering path with no GPU
acceleration. CSS `transform` animations are composited via the GPU and animate
at full frame rate. SVG attribute updates (which is how p5.js drives animation
— setting `x`, `y`, fill, etc. on DOM nodes in the draw loop) trigger full
software repaints. Safari does not promote SVG elements to GPU compositor layers
unless an explicit compositing hint is present. The combination of p5's RAF-driven
DOM writes + WebKit's software SVG path = animation that fights the compositor
on every frame.

---

#### Attack Plan — Issue 1: Render Delay

**Goal:** Reduce first-render time from 10–60 sec to < 3 sec on Safari.

**Step 1 — Instrument to find the bottleneck.** Since Safari's Web Inspector
cannot profile inside the SVG rendering pipeline, instrument JS timestamps around
SVG insertion:

```js
const t0 = performance.now();
parent.appendChild(mainSVGElement);

// Double rAF: after 2 frames, the browser has painted at least once
requestAnimationFrame(() => requestAnimationFrame(() => {
  console.log(`[Safari perf] SVG first-paint: ${(performance.now() - t0).toFixed(0)}ms`);
}));
```

If the double-rAF fires quickly but the *visual* result is still slow, the
bottleneck is Safari compositing subsequent frames (progressive layout recalc).
If the double-rAF itself is slow, the bottleneck is initial paint.

**Step 2 — Count shapes per masked group.** The O(N) masker multiplier is the

most likely culprit. In DeBug mode, add a one-time audit:

```js
document.querySelectorAll('[mask]').forEach(el => {
  const n = el.querySelectorAll('path,rect,circle,ellipse,polygon,line').length;
  if (n > 5) console.warn(`Masked group has ${n} shapes — Safari perf risk`);
});
```

Any group with >10 shapes under a mask is a strong performance suspect.

**Step 3 — Apply the empty-filter workaround to every masked group.** This is
the highest-leverage single change. Add `filter="url(#webkit-group-isolate)"` to
every `<g>` that also has a `mask="..."`. The no-op filter definition goes in
`<defs>` once; all groups share the reference. Re-test performance immediately.

**Step 4 — Safari Web Inspector → Timelines.** Open Develop → Web Inspector →
Timelines → Rendering Frames. Look for:
- Long purple **Layout** bars — SVG layout thrashing (interleaved DOM reads/writes)
- Long green **Paint** bars — masker pixel pipeline (confirms Root Cause A)
- Large gaps between JS completion and the first composite frame

---

#### Attack Plan — Issue 2: Missing / Incorrect Shapes

**Goal:** All shapes that render correctly in Chrome render correctly in Safari.

**Step 1 — Apply the empty-filter workaround to all masked groups** (same as
Issue 1 Step 3). This is the single most likely fix. Test against 3–5 known
hashes immediately after.

**Step 2 — Confirm all filter defs are co-located.** Ensure that every
`filter="url(#someId)"` reference resolves within the *same* top-level `<svg>`
as the shape that uses it (Root Cause B). If filter `<defs>` currently live in a
parent or sibling SVG element, move them into the same SVG as their consumers.

**Step 3 — Add `color-interpolation-filters="sRGB"` to all filters.** The SVG
spec defaults filter color math to `linearRGB`, but Safari and Chrome can diverge
in practice. Adding this attribute explicitly to every `<filter>` element ensures
consistent color compositing across both browsers:

```html
<filter id="myBlur" color-interpolation-filters="sRGB">
  <feGaussianBlur stdDeviation="2"/>
</filter>
```

**Step 4 — Binary search if shapes are still missing.** Work methodically:
1. Disable all SVG filters → do the shapes appear?
   - Yes → re-enable filters one at a time; the culprit filter is the one
     that causes disappearance
   - No → the issue is masking or geometry, not filters
2. Disable all masks → do the shapes appear?
   - Yes → the empty-filter workaround may not have been applied to this
     specific masked group; find which one
3. Disable feBlend specifically → does the compositing improve?
   - Yes → the blend mode is being interpreted differently (Safari vs Chrome
     blend mode bug — document the specific blend mode for investigation)

---

#### Attack Plan — Issue 3: Animation

**Priority: Lower.** Only tackle after Issues 1 & 2 are resolved. Animation is
not a primary evaluation feature; defer to post-upload if needed.

**Escalation path (lowest → highest complexity):**

| Approach | Complexity | Notes |
|----------|-----------|-------|
| `will-change: transform` on animated groups | Very low | Promotes the element to a GPU compositor layer; apply before first frame | 
| Drive motion via CSS `transform` instead of SVG attribute writes | Low-medium | CSS transforms are GPU-composited; SVG attribute writes are not; requires restructuring the animation driver |
| Isolate animated elements into a separate `<svg>` / `<canvas>` layer | Medium | Limits the repaint region; static elements are not re-masked each frame |
| Canvas-based animation fallback | High | Composite static SVG to a canvas once; animate only the canvas layer; routes everything through the GPU-accelerated canvas path |

**Immediate first step:** Add `will-change: transform` to the top-level animated
SVG element or group. Cost: one line. Test whether Safari's animation smoothness
improves visibly.

---

#### Decision Tree

```
Test on Safari
│
├─ Performance ≥10s? → Apply empty-filter to ALL masked groups → Re-test
│  ├─ Still slow? → Count shapes per masked group
│  │  └─ Groups with >10 shapes → merge paths or restructure groups
│  └─ OK (<3s) → proceed
│
├─ Missing shapes? → Apply empty-filter workaround (if not done above)
│  ├─ Shapes still missing? → Audit cross-SVG filter ID co-location
│  │  └─ Still missing? → Add color-interpolation-filters="sRGB" to filters
│  │     └─ Still missing? → Binary search: disable filters/masks one at a time
│  └─ All shapes correct → proceed
│
└─ Animation broken? (only after above are resolved)
   ├─ Add will-change: transform to animated elements → Re-test
   ├─ Switch motion to CSS transform → Re-test
   └─ If still unacceptable → canvas-based animation fallback (post-sprint)
```

**Time box:** 2 days for Issues 1+2; 0.5 days for Issue 3 (or defer to post-sprint).
If the empty-filter workaround solves both performance and shapes in Day 1, use
Day 2 for animation + edge cases.

---

#### Investigation Notes (not ArtBlocks questions)

| # | Investigation | Status |
|---|---------------|--------|
| Q14 | Audit current SVG output: do any `filter="url(#id)"` references cross `<svg>` root boundaries? (KNOWN-ISSUES §9.14.4b — establish exact scope before testing.) | ✅ Resolved — all 10 masked elements are nested `<svg>` (not `<g>`). Identity isolate filter is now created locally inside each masked `<svg>`'s own `<defs>` with element-scoped ID (e.g. `webkit-group-isolate-shpGrp00`). Confirmed via `auditMaskedGroups()` (all `isolated: true`) and `getElementById` lookups returning the locally-defined filters. **However:** Cross-SVG resolution was not the actual blocker for missing shapes — see Q17. |
| Q15 | After empty-filter workaround: does Safari Web Inspector Timelines show meaningfully shorter "Paint" bars, confirming the switch away from the per-shape software masker? | ❓ Empirical — deferred until Q17 fix is verified |
| Q16 | **Layout region calculation completeness** — filter/mask regions currently use blanket `50%` objectBoundingBox padding as a temporary fix to avoid clipping of overflow geometry (e.g. `jIn` cuts). The proper approach is to compute exact bounds from each element's known layout values (anchor, size, padding). This is deferred because of SVG grouping complexity and shared-filter optimizations. **Revisit hypothesis:** incomplete layout region calculation may be a contributing cause of Safari rendering differences (mask `layout()` coordinates via `userSpaceOnUse` in `cutIslands` may not correctly cover all painted shapes in Safari's viewport math). Investigate as part of B1 or B3 work. |
| Q17 | **Blur filter region collapse inside `<mask>`/`<defs>` (Apr 27 2026)** — missing-shape pattern correlated with cut depth (deeper cuts = larger blur radius = missing more often). Diagnostic added: `SafariCompat.auditBlurFilters()` walks every `filter[id^="blur-"]` and calls `getBBox()` on its consumer. In Safari, ~12 of 23 rows returned `n/a` (getBBox threw silently) — all of them clones inside `<mask>` subtrees. Root cause: WebKit's `getBBox()` is unreliable inside `<mask>`/`<defs>` (related WebKit bugs #28611, #46276, #161817). When bbox = 0, percentage-based `objectBoundingBox` filter region collapses to a point, the Gaussian blur is clipped to nothing, and the masked group reads as either fully opaque or fully transparent depending on the cut profile — producing the depth-correlated missing-shape bug. **Fix deployed:** `p5.Element.prototype.blur` now uses `filterUnits="userSpaceOnUse"` with absolute bounds (radius-scaled, generous floor) instead of `objectBoundingBox` percentages. **Subsequent finding:** n/a is expected in ALL browsers for elements inside `<mask>` — it is spec-compliant DOM behaviour, not a Safari bug. Therefore the blur region was NOT the actual cause of missing shapes — it was a false lead. Blur fix retained (it is still the correct practice for mask-internal elements), but missing shapes have a different root cause: see Q19. | ⚠️ False lead — blur fix is correct practice but did not fix missing shapes |
| Q18 | **Filter-sharing optimization — not a contributor to Q17** — user recalled an optimization where multiple cell groups share a single filter, with the worry that absolute bounds could only be valid for one consumer. Investigation confirmed: filter sharing exists in `ProtoFilter.applyFilterToElement()` (parents new elements into an existing `<g filter="url(#X)">` via `querySelector`) but it is **only used for `ProtoFilter` instances** (NeumorphicShader/shading filters via `.applyFilter(this.filter)`). The `.blur()` prototype path (used for all cut-related blurs) creates a fresh filter with a unique random ID on every call — no sharing. Therefore the Q17 fix is safe without modifying the sharing system. The sharing system itself remains a risk for future Safari work involving `ProtoFilter` shaders — absolute filter bounds for a shared filter only correctly cover the bbox of the original consumer. | ✅ No action needed for B1 |
| Q19 | **Filter definition defined INSIDE its own consumer `<g>` (Apr 27 2026) — confirmed root cause of missing shapes.** Console test `filterInOwnSubtree: true` on missing group `shpGrp00`. `ProtoFilter.applyFilterToElement()` placed `this.defs` (containing the `<filter>` element) as a child of the `<g filter="url(#...)">` that consumes it: `<g filter="url(#fx00)"><defs><filter id="fx00">...</filter></defs></g>`. Chrome resolves filter IDs globally (full document scan). Safari (WebKit) is spec-strict: resource references are resolved in the ancestor/sibling scope only, not by scanning descendants of the consumer. A `<g>` referencing a filter defined in its own subtree is therefore silently ignored in Safari — the shading filter is never applied, causing the group to render as invisible (the filter graph produces no output when the definition is unreachable). **Fix deployed:** `applyFilterToElement()` now calls `parentSVG.insertBefore(this.defs.elt, parentSVG.firstChild)` to move the filter defs directly into the containing `<svg>` before creating the consumer `<g>`. Filter definition is always an ancestor of its consumer. **However:** structural fix verified in DOM but missing-shape symptom unchanged — the filter is now reachable per spec, yet Safari still fails to render the same shapes. So this was a real spec-correctness fix but NOT the proximate cause of B1 Issue 2. | ✅ Fix retained (correctness), ❌ not the cause |
| Q20 | **`SourceAlpha` → `derivedAlpha` (Apr 28 2026) — false lead, reverted.** Hypothesis: WebKit live compositor returns empty `SourceAlpha` for `<g>` filters, collapsing the 71-primitive shadow chain. Test fix: replace all `SourceAlpha` references with `feColorMatrix`-derived alpha from `SourceGraphic`. **Result:** zero visual change. **Disqualifying logic:** if `SourceAlpha` were universally broken for `<g>` in Safari, *every* shaded shape would fail, but only 3 of ~30 fail. The fix is universal and the failure is selective; the hypothesis was incompatible with the symptom from the start. Reverted. | ⛔ Reverted |
| Q21 | **Critical reframe (Apr 28 2026) — bug is data-dependent, not structural.** All audits to date (`auditMaskedGroups`, `auditBlurFilters`, full DOM dump comparing failing vs working shpGrps) show **byte-identical** structure between failing and working groups. Field values are JS-authored DOM — they are produced by the same code path in Chrome and Safari and will read back identically. The only field that *could* differ between browsers is `getBBox()`, and even that comes back equal (e.g. shpGrp00 fail = `13.6×44.3 @ 53.4,98.3` matches shpGrp03 working = `8.5×29.0 @ 81.5,34.4`, both well-formed). **Implication:** structural audits cannot reveal Safari-specific behaviour. They can only reveal what failing shapes have in common. The failure must be a property of the shapes' *content* (path data, geometry complexity, fill/style values, blur radius magnitude, etc.) interacting with a Safari-specific renderer behaviour. | ✅ Resolved framing |
| Q22 | **Confirmed root cause + fix (Apr 28 2026): filter region too small in Safari for deep-cut shadows.** Live binary-search via gui.js keypress probes (1/2/3 strip, 4 force-fill, 5 inspect, 6/7/8 throttle, 9 global, q region clamp): `q` (override failing groups' filter region to `userSpaceOnUse, 0,-50,100,300` in absolute user units) made the missing shapes appear in Safari with no Chrome regression. **Mechanism:** `ProtoCut.setLayouts()` was emitting `filterUnits='userSpaceOnUse'` with PERCENT strings derived from `maxLayout`. With userSpaceOnUse, percentages resolve against the consumer's nested-svg viewport (the ShapeGroup's `<svg>`), which for deep-cut groups can be as small as 13.6×44.3 user units. The resulting filter region was smaller than the deep-cut blurred + offset shadow extent. Chrome silently auto-extends filter regions to enclose primitive subregion bounds; Safari does not — so the shadow output was clipped to zero visible pixels for affected groups. **Fix deployed:** `ProtoCut.setLayouts()` now emits absolute user-unit coordinates (`FRAME.boundsRect` ± depth-aware padding `max(50, depth × 5)`) with `userSpaceOnUse`. Behind feature flag `window.SAFARI_FILTER_REGION_USERSPACE_FIX` (default true). Legacy %-userSpace path preserved for revert. **Watch for:** the §9.14.6 frame-coordinate banding regression that motivated the original %-userSpace hybrid. The 'q' probe at the failing hash showed no banding, suggesting architecture has since changed (cut ShapeGroups now use FRAME.boundsRect for boundsRect per §9.14.1) — but other hashes should be retested. | ✅ Fix deployed — pending multi-hash verification |

---

#### Consolidated Findings (B1 Issue 2 — Missing Shapes)

This block exists to prevent re-investigating already-eliminated paths. Update as new evidence lands.

**Confirmed about the failing shapes themselves:**
- All failing shapes have the **largest cut depths** of any shape in the output. Holds across multiple hashes. The strongest single correlate.
- Failing shapes appear on **both `combo` and `shad` sub-layers simultaneously** (jIn cuts use these two sub-types, not `high`). Single shape → multiple `<svg>` consumers → all fail in lockstep. Implies failure is upstream of per-layer rendering: it's a property of the shape's geometry/data, not of any one sub-layer's compositing pipeline.
- DOM structure between failing and working shpGrps is byte-identical (Q21).
- `<path d="...">` inside the failing groups is well-formed (paths render in PNG export — see below).

**Confirmed about Safari's behaviour:**
- **PNG export via canvas blob renders correctly** including shading. The one-shot `XMLSerializer` → `<img>` → `canvas.drawImage` → `toBlob` path produces correct output even on the same hashes that fail in live render. Implies the SVG DOM is correct and Safari's image-rasterization path works; only Safari's **incremental live SVG compositor** fails.
- Live render fails in two ways simultaneously: (1) missing shapes for a small subset, (2) huge first-paint delay (10–60 s).

**Confirmed NOT the cause (do not re-investigate):**
- Cross-SVG filter ID resolution (Q14) — workaround applied, does not affect symptom.
- Blur filter region collapse via `objectBoundingBox` inside masks (Q17) — fix retained as correct practice, but not the cause; `n/a` from `getBBox()` inside `<mask>` is spec-compliant in all browsers.
- Filter sharing (Q18) — sharing only happens for `ProtoFilter` shaders; not a contributor to current failure.
- Filter defs placed inside their consumer `<g>` (Q19) — fix retained as correct practice, but not the cause.
- Universal `SourceAlpha` corruption for `<g>` (Q20) — incompatible with the selective failure pattern; reverted.

**Open / not yet eliminated:**
- Cut-depth–dependent path complexity exceeding a Safari renderer threshold (path point count, Bézier curve complexity, self-intersecting subpaths after offset operations).
- Mask-content geometry of the failing shapes specifically — `<mask>` for jIn cuts may produce extreme coordinate ranges (audit shows mask-group bboxes like `209.1×309.1 @ -54.5,-54.5`, far outside the canonical 0,0,100,200 region — though working groups also show this).
- Filter region for the shading filter (`fx00`/`fx09`) — Q21 audit shows failing groups use `-50% -50% 200% 200%` (objectBoundingBox), same as working groups, so unlikely — but worth verifying interaction with cut-depth–driven blur magnitudes.
- Possible WebKit threshold on intermediate filter result buffer size driven by deep-cut blur radii.

**Possible architectural note for later (not B1):**
- For jIn cuts, the high-layer ShapeGroup (`ShapeGroup-high`) appears to be created even though its `shadeElt` may have no visible content. If so, this is wasted work — investigate as an optimization after B1 closes.

---

#### Revised Strategy (Apr 28 2026)

Given (a) ~24h budget remaining for B1, (b) PNG-via-canvas works correctly in Safari, and (c) live-render delay (≥10 s) is independently a worse problem than missing shapes, **the pragmatic plan is to bypass Safari's live SVG compositor entirely on the live token page and serve the canvas-rasterised image instead.** This trades animation features (light rotation, future object rotation) for correct + fast rendering on Safari.

**Track 1 — Canvas-fallback path (primary, time-boxed):**
1. UA-detect Safari/WebKit.
2. On Safari, run the existing canvas blob export pipeline at first frame (the same path used for the `S` keypress export).
3. Hide the live SVG; insert the resulting `<img>` (or draw onto a fullscreen `<canvas>`) at the canvas's display size.
4. Disable any animation that mutates the SVG (light rotation, future rotation).
5. Verify on the failing hashes that the rendered image matches Chrome.
6. Verify performance — single canvas rasterisation should land well under the 10–60 s live-render time.

**Track 2 — Continue narrowing the live-render bug (secondary, only if Track 1 lands fast):**
The remaining productive avenues, in order:
1. **Compare the actual `<path d>` content** of one failing shape (e.g. shp001) vs one working same-celGrp shape (e.g. shp003): point count, length of `d`, presence of unusual segment types. This is a *content* audit, the only audit type Q21 says is still meaningful.
2. **Reduce cut depth by one step** for a single failing shape and re-render in Safari — if the shape now appears, confirms the cut-depth → renderer-threshold hypothesis cleanly.
3. **Strip the shading filter only** (leave mask + paths) on failing groups — if shapes appear, the failure is inside Safari's filter pipeline; if shapes still missing, it's mask or path-level.

**Audits NOT to run (already concluded uninformative):**
- Any further DOM-attribute audit comparing failing vs working groups across browsers.
- Any further filter-region or filterUnits sweep (Q17/Q18 closed).
- Any further `SourceAlpha`/`SourceGraphic` swap (Q20 closed).

---

## Feature Backlog

| ID | Feature | Priority | Est. Time | Open Questions | Status |
|----|---------|----------|-----------|----------------|--------|
| F1 | **Prototype object Rotation** — basic rotation for ProtoLayerObjects; Chrome-only interactive rotation implemented and PostParams trait added (`Rotation`, defaults to Up/0°) | P2 | 2–3 days | Q5 (Post Params API) | ✅ Done |
| F2 | **InfraGrid InnerCuts re-enable** — fix and re-enable the feature that cuts new shapes within a parent shape using only Direction hierarchy 0/1 (the feature whose name is uncertain — likely "InnerCuts" or "InsideCuts" related to infraGrids) | P2 | 1–2 days | — | ❌ Not started |

### Feature Notes

**F1 — Rotation + Post Params:**
Status: Complete (Chrome-only basic rotation). The interactive 90° rotation feature is now
available via keyboard controls and the generator reads a `Rotation` PostParam
(if present) to set the initial orientation. If the PostParam is absent the
default is `Up` (0°). PostParam values supported: `Up` | `Right` | `Down` |
`Left` (maps to position 0/1/2/3 = 0°/90°/180°/270°).

**Final stable state (2026-05-06):** rotation is a viewport transform on the
finished SVG, not a geometry regeneration. Arrow keys are the only path that
animate rotation. During seed regeneration, dummy orientation and artwork
orientation now stay matched by geometry: positions 0/2 use vertical dummy
layout and positions 1/3 use horizontal dummy layout. Horizontal regeneration
preserves horizontal orientation for the next seed; upside-down position 2
resets to position 0 on the next seed. The dummy itself remains unrotated
(`--dummy-rotation: 0deg`) in the normal path. Horizontal hide/reveal also
derives the hidden dummy pill from the measured horizontal artwork span, so the
small dummy target scales from the horizontal footprint rather than the vertical
fallback pill, and that hidden pill is preserved through rebuild prep so reveal
starts from the same corrected horizontal target instead of recomputing a smaller
new-artwork pill while hidden. **Known follow-up (2026-05-07):** a rare,
unreproduced tall-window sequence may still animate the dummy's rotation during
the hide transition; track this as residual rotation/reveal polish rather than
assuming the dummy path is fully closed.

Live rotation uses phase-matched SVG backing scale for performance. The artwork
rotates at the smaller of the start/target display scales, and live `#bleed`
backing resizes only while the visual transform is static: grow-after-settle when
the target orientation is larger, and shrink-before-rotate after the visual
shrink when the target orientation is smaller. Each backing resize gets a static
paint frame before motion resumes. A fixed-size
`#artwork-rotation-viewport` wrapper plus inverse CSS scale compensation keeps
the visual layout stable while reducing filter/raster work during animated
rotation and scale phases.

PNG saving is rotation-aware. The existing vertical resolution presets are
reused directly for positions 0/2 and flipped for positions 1/3 (for example,
3000×5400 becomes 5400×3000). Filenames now include the capture date followed
by the rotation code before the hash:
`Prototypes-{YYYY.MM.DD}-r#A-{hash}-{resolution}.png`, where `#` is position
0–3 and `A` is `V` or `H` (examples: `r0V`, `r1H`, `r2V`, `r3H`). Horizontal
export now treats the live CSS rotation as a fallback authority and rasterizes
using the serialized SVG's intrinsic dimensions, so a horizontal capture cannot
land on a portrait canvas with large empty top/bottom padding if state and live
transform momentarily disagree.

Fullscreen presentation mode is available from the keyboard. Press `f` to enter
or exit browser fullscreen, and press `Escape` to exit. Fullscreen mode syncs the
same frame sizing, rotation viewport, backing scale, and reveal layout used by
normal window resizes, while hiding non-art controls for a clean black stage. If
the host browser surface stalls or blocks native fullscreen, the same key path
falls back to an app-level fullscreen presentation class.

**F2 — InfraGrid InnerCuts:**
*(Confirm feature name before starting — check comments in Grid.js or
ProtoLayerObjects.js for the original feature name.)* Scope is limited to
Direction hierarchy 0/1 only — no higher-order cuts. This keeps the feature
predictable for evaluation without requiring a full nested-grid system.

---

## Export Pipeline Backlog

> Scope of this section depends heavily on answers to Q1–Q4. Do not start E2
> until those are answered.

| ID | Task | Priority | Est. Time | Depends On | Status |
|----|------|----------|-----------|------------|--------|
| E1 | **Code cleanup pass** — remove dead code, orphaned comments, disabled debug blocks; verify all `DeBug.*` calls are guarded or removable | P1 | 1 day | — | ❌ Not started |
| E2 | **Bundle script** — script or Makefile target that concatenates source files in load order into a single output file | P1 | 0.5–1 day | Q1, Q4, Q6, Q7 | ❌ Not started |
| E3 | **Minification step** (answer-dependent) — add minification (whitespace/comment strip only, no obfuscation) as an optional pipeline step | P2 | 0.5 day | Q2, Q3, E2 | ❌ Not started |
| E4 | **Visual parity validation** — run the bundled/minified output against 3–5 known hashes and confirm renders match dev output | P1 | 0.5–1 day | E2, E3 | ❌ Not started |
| E5 | **ArtBlocks test bench upload + smoke test** — first actual upload; verify hash rendering on their infrastructure | P1 | 0.5 day | E4 | ❌ Not started |

### Export Pipeline Notes

The load order for bundling (based on current `index.html`) needs to be audited
before writing a bundle script — there are dependency relationships between files
(e.g., `OpArray.js` must precede `ProtoUtility.js`, p5 must be first, etc.).
Confirm with `index.html` script tag order.

If ArtBlocks bundles p5.js themselves (Q6), we may be able to drop `p5.min.js`
from the bundle entirely, which would significantly reduce file size.

---

## Prioritization Summary

Given a hard 2-week window, the **recommended minimum viable sprint** for a
credible test bench submission is:

1. **B1** (Safari compat) — required; if the piece breaks in Safari it fails evaluation
2. **E1** (Cleanup) — required; messy code makes a bad impression on evaluators
3. **E2** (Bundle script) — required; can't upload without it
4. **E4 + E5** (Validation + upload) — required

Everything else — **B2, B3, B4, F1, F2, E3** — is enhancement. Prioritize them
in order listed in their respective tables if time allows, but don't let them
block the upload.

---

## Production Token Collection — Spec & Build Plan

> **Status:** Conceptual spec for submission. No contract implementation needed
> during the 2-week sprint — this section provides a believable technical sketch
> to accompany the ArtBlocks evaluation submission. Full implementation is a
> post-approval phase.

### Concept Overview

The **Production** collection is a companion ERC-721 collection released via
auction after the Prototypes generative collection. Each Production token
represents a physical sculpture derived from a Prototype output. Production tokens
and Prototype tokens can be irreversibly *paired* by a collector who holds both —
signalling that the Prototype has been selected for physical production and
locking both tokens together permanently.

**Collections:**

| Collection | Role | Release |
|------------|------|---------|
| **Prototypes** | Generative on-chain art; the algorithm is the artwork | Primary (ArtBlocks platform) |
| **Production** | Physical production token; claims a Prototype for fabrication | Secondary auction (post-Prototypes release) |

---

### PostParams Specification — Prototype Token Additions

These PostParams are added to each Prototype token. Both are initialized to their
null/false state at mint and are **only writable by an authorized address** —
specifically the Production collection contract. They should be configured with a
lock mechanism so that once set, they cannot be unset (see Q10).

| Param Name | Type | Initial Value | Who Can Write | Locked After Set? | Notes |
|------------|------|--------------|---------------|-------------------|-------|
| `Produced` | Boolean | `false` | Production contract address (authorized via Creator Dashboard) | Yes — should lock permanently on first `true` write | Indicates this Prototype has been paired to a Production token; flows into `window.$features` for marketplace trait indexing |
| `ProductionTokenId` | String (or Integer) | `undefined` | Production contract address | Yes — should lock permanently once set | The token ID of the paired Production token; drives a visible link in the Prototype's rendered output (optional) |
| `Rotation` | Enum / String | `Up` (0°) | Creator / Authorized address | No — writable until explicitly locked by policy | Initial orientation for the rendered artwork; values: `Up`, `Right`, `Down`, `Left`. Generator applies this as the initial viewport rotation on first build.

**Feature integration (Prototype script):**

```js
const postParams = tokenData.externalAssetDependencies[0]
const produced    = postParams?.data?.["Produced"] === "true"
const prodTokenId = postParams?.data?.["ProductionTokenId"] ?? null

window.$features = {
  // ... existing traits ...
  Produced: produced,           // Boolean → marketplace trait; rarity shifts as tokens are paired
  ProductionTokenId: prodTokenId ?? "None",
}
```

> **Rarity note:** As Prototypes are paired over time, `Produced: true` tokens
> form an increasingly distinct sub-set. The unpaired remainder becomes a
> "production-eligible" category. Consider whether this is a desired rarity
> dynamic before finalizing trait naming.

---

### PostParams Specification — Production Token

Each Production token has four PostParams and one locked mint-time trait.

**Locked mint-time traits (not PostParams — assigned at mint, immutable):**

| Trait Name | Type | Values | Notes |
|------------|------|--------|-------|
| `Size` | Enum (locked) | `"Small"` / `"Medium"` / `"Large"` | Assigned at mint; never changeable; drives physical fabrication tier |
| `BacksidePattern` | TBD | TBD | Reserved — pattern or contour set for the reverse of the sculpture; may be hash-derived or aleatorically assigned at mint; exact values TBD |

**PostParams (mutable, on-chain):**

| Param Name | Type | Initial Value | Who Can Write | Locked After Set? | Notes |
|------------|------|--------------|---------------|-------------------|-------|
| `Paired` | Boolean | `false` | Collector (via Production contract `pair()` function) | Yes — lock on first `true` write | Becomes `true` when collector completes pairing; mirrored on the Prototype side |
| `PairedPrototypeTokenId` | String | `undefined` | Collector (via Production contract `pair()` function) | Yes — lock once set | Token ID of the paired Prototype; used to cross-link both rendered outputs |
| `Complete` | Boolean | `false` | Artist only | No — artist may update until final | Set to `true` when physical sculpture is fabricated and shipped |
| `CompletionURI` | String | `undefined` | Artist only | No — artist may update | URI for image(s) of the completed sculpture; when present, the rendered token image updates to display the completion media |

**Feature integration (Production script):**

```js
const postParams   = tokenData.externalAssetDependencies[0]
const paired       = postParams?.data?.["Paired"] === "true"
const pairedProto  = postParams?.data?.["PairedPrototypeTokenId"] ?? null
const complete     = postParams?.data?.["Complete"] === "true"
const completionURI = postParams?.data?.["CompletionURI"] ?? null

window.$features = {
  Size: SIZE_TRAIT,          // locked mint-time trait (not a PostParam)
  BacksidePattern: BACKSIDE, // TBD
  Paired: paired,
  PairedPrototypeTokenId: pairedProto ?? "None",
  Complete: complete,
}

// Rendering: if complete and URI provided, display completion image
// otherwise display default generative image (see Default Image section below)
```

---

### Pairing Mechanism — Technical Sketch

The Production contract exposes a `pair(uint256 productionTokenId, uint256 prototypeTokenId)`
function. This is the only on-chain write path for the four locked PostParams on
both sides.

**Preconditions checked on-chain before pairing:**

1. `msg.sender` owns `productionTokenId` (or is a valid delegate via delegate.xyz v2)
2. `msg.sender` owns `prototypeTokenId` (or is a valid delegate)
3. `postParams["Paired"]` on the Production token is not yet `true`
4. `postParams["Produced"]` on the Prototype token is not yet `true`

**On successful pair():**

```
Production token:
  PostParam["Paired"]                 = "true"   (locked)
  PostParam["PairedPrototypeTokenId"] = string(prototypeTokenId)  (locked)

Prototype token (cross-collection write, via authorized contract address):
  PostParam["Produced"]               = "true"   (locked)
  PostParam["ProductionTokenId"]      = string(productionTokenId) (locked)

Emit: Paired(productionTokenId, prototypeTokenId, msg.sender)
```

**Authorization model:**

- The Production contract address is set as the authorized writer for the Prototype
  collection's `Produced` and `ProductionTokenId` PostParams via the ArtBlocks
  Creator Dashboard (PostParam authorization type: "Address/Smart Contract").
- Collectors cannot directly write those PostParams on Prototype tokens — only the
  Production contract can, and only via `pair()`.

> **Open question Q8** (see below): Confirm with ArtBlocks that a non-Prototypes
> contract can be authorized to write PostParams on a Prototypes ArtBlocks token.
> This is standard PostParam authorization per the docs but must be validated for
> cross-collection use before committing to this design.

---

### Pairing Notification Design

When `pair()` is called, the contract emits:

```solidity
event Paired(
    uint256 indexed productionTokenId,
    uint256 indexed prototypeTokenId,
    address indexed collector
);
```

**Notification options (off-chain):**

| Method | Complexity | Notes |
|--------|-----------|-------|
| **Alchemy Webhooks** (recommended) | Low | Watch the Production contract address for `Paired` event; POST to a webhook URL (email/Discord/Slack) on match |
| Moralis Streams | Low | Similar to Alchemy; real-time EVM event monitoring |
| The Graph subgraph | Medium | Queryable indexed history; useful if you want a dashboard later |
| Manual polling | None | Not recommended; fragile and easy to miss |

The simplest viable implementation: Alchemy Notify webhook → a small serverless
function (Vercel/Netlify) → email notification with `productionTokenId`,
`prototypeTokenId`, and collector address.

---

### Default Image — Production Token

Before pairing and before `CompletionURI` is set, the Production token needs a
default rendered image. Two options:

| Option | Description | Complexity |
|--------|-------------|-----------|
| **Option A — Minimal Prototypes algorithm** (recommended for submission) | A stripped-down version of the Prototypes generative script seeded from the Production token hash; same visual language, reduced feature complexity; acts as a preview/sketch of the "to be produced" work | Medium — requires a second upload script |
| **Option B — Static placeholder** | A simple static SVG or canvas state (e.g., an outlined grid or "pending production" mark) that is replaced by `CompletionURI` once set | Low — minimal script |
| **Option C — Direct mirror of paired Prototype** | Once paired, the Production token renders the same output as the paired Prototype (read `PairedPrototypeTokenId` and reproduce) | High — requires augmentation hook to fetch Prototype output |

**Recommendation for submission:** Describe Option A in the submission as
intent. Implement Option B for the staging upload to keep scope manageable.
Revisit Option A or C post-approval.

---

### New Open Questions — Production Collection

These questions must be answered before moving into implementation.

| # | Question | Who Answers | Status |
|---|----------|-------------|--------|
| Q8 | Can a non-ArtBlocks contract (the Production contract) be authorized to write PostParams on a Prototypes ArtBlocks Engine Flex token? Is this a supported pattern? | ArtBlocks team | ❓ Open |
| Q9 | Does the Production collection need to be deployed on ArtBlocks, or can it be an independent ERC-721 that interacts with ArtBlocks PostParams via the authorized-address mechanism? | ArtBlocks team | ❓ Open |
| Q10 | Is there an on-chain mechanism to lock a PostParam at the time of an event (rather than at a predefined lock date)? Or must locking be enforced exclusively in the `pair()` function's logic (i.e., check-before-write)? | ArtBlocks docs / team | ❓ Open |
| Q11 | Does releasing the Production collection as a post-Prototypes auction require a separate ArtBlocks submission/approval process, or is it covered by the original Prototypes approval? | ArtBlocks team | ❓ Open |
| Q12 | When `Produced` PostParam changes on a Prototype token, does ArtBlocks automatically refresh the token's on-chain metadata (and therefore trigger marketplace rarity recalculation)? What is the latency? | ArtBlocks docs | ❓ Open |
| Q13 | For the Production token default image — is a second (separate) script upload on the same project possible, or does a default state require a self-contained conditional in a single script? | ArtBlocks docs | ❓ Open |

---

### Production Collection — Feature Tasks

These tasks are **out of scope for the 2-week Prototypes sprint** but should be
tracked for the next planning phase. They are listed here for submission
documentation purposes.

| ID | Task | Priority | Est. Time | Depends On | Status |
|----|------|----------|-----------|------------|--------|
| P1 | **Prototype PostParams setup** — configure `Produced` and `ProductionTokenId` PostParams on the Prototypes project via Creator Dashboard; authorize Production contract address as writer | P1 | 0.5 day | Q8, Q9, Production contract deployed | ❌ Post-sprint |
| P2 | **Production contract — `pair()` function** — implement and test `pair(productionTokenId, prototypeTokenId)` with owner/delegate checks, precondition guards, cross-collection PostParam writes, and `Paired` event emission | P1 | 3–5 days | Q8, Q9, Q10, Solidity dev | ❌ Post-sprint |
| P3 | **Production script — default state rendering** — implement conditional rendering: default generative state (Option A or B) vs. `CompletionURI` overlay when `Complete = true` | P1 | 1–2 days | Q13 | ❌ Post-sprint |
| P4 | **Notification pipeline** — Alchemy webhook → serverless function → email/Discord for `Paired` event | P2 | 0.5–1 day | Production contract deployed | ❌ Post-sprint |
| P5 | **`BacksidePattern` trait design** — define values, decide hash-derived vs aleatoric assignment, implement in mint logic | P2 | TBD | Creative direction decision | ❌ Post-sprint |
| P6 | **Marketplace rarity audit** — verify that `Produced` and `Paired` PostParam changes flow correctly into ArtBlocks trait indexing; confirm refresh latency and rarity impact | P2 | 0.5 day | Q12, staging deployment | ❌ Post-sprint |

---

*Document created: April 23, 2026*
*Last updated: April 24, 2026 — Production Token spec added; Safari B1 full attack plan added*
*Status: Draft — some Open Questions pending ArtBlocks team confirmation*
