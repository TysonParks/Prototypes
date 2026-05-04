# BoredUI Project Roadmap

> **Purpose:** Track the broader improvement plan for BoredUI. This
section was reconstructed from session notes after being lost between
conversations. Items marked ❓ may be incomplete or out of order —
update as context is recovered.

**Related docs:**
[GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
[KNOWN-ISSUES](KNOWN-ISSUES.md) |
[ARCHITECTURE](ARCHITECTURE.md) |
[TESTING](TESTING.md)

## What This Document Is Not

- Planning intent only — not proof of implementation
- Not a source of canonical architecture or geometry rules

---

## Table of Contents

1. [Wrapper Audit Checklist](#1-wrapper-audit-checklist)
2. [Full Refactor Plan](#2-full-refactor-plan)
   - [Performance Re-Optimization](#post-plan-addition-performance-re-optimization-known-issues--915)

---

## 1. Wrapper Audit Checklist

Systematic audit of each wrapper type to catalog edge cases before
attempting the Unified Wrapper Funnel (ARCHITECTURE § 11). Each audit
session examines one wrapper type's detection, resolution, and known
failures.

| # | Wrapper Type | Status | Session | Notes |
|---|-------------|--------|---------|-------|
| 0 | Foundation (illustrations, GEOMETRY-REFERENCE, geometric vocab) | ✅ Done | Sessions 1-2 | Hand-drawn sketches analyzed, GEOMETRY-REFERENCE built |
| 1 | Coincident wrappers | ✅ Done | Session 1 | Shared-corner geometry, `hasCoincidentCorner` |
| 2 | Collinear wrappers | ✅ Done | Session 2 | Found Bug A (misdiagnosed, KNOWN-ISSUES § 9.6) + Bug B (opposite-facing, KNOWN-ISSUES § 9.7) |
| 3 | Adjacent wrappers | 🟡 In progress | Session 5 | Code traced, detection+resolution documented (KNOWN-ISSUES § 9.12). Non-square aspect distance bug identified+fixed (§ 9.12.10). Stale `inOutAdjWrappers` memo fixed (§ 9.12.9). Visual verification pending. |
| 4 | Radiant wrappers | ✅ Done | Session 3 | Detection + resolution traced. Priority system confirmed working (KNOWN-ISSUES § 9.8). |
| 5 | Interference | ✅ Done | Session 4 | 9 issues found (KNOWN-ISSUES § 9.10). Key: `removeDuplicates` loop bug (G), missing `canCurveTo` guard (H). |

**Bug B status:** Detection implemented (KNOWN-ISSUES § 9.7.7 —
`isMirroredCorner`, `oppFacingCollinearSegs`). Wrapping action deferred
pending collision constraint design.

---

## 2. Full Refactor Plan

Original 17-task plan, revised to audit geometry/wrapping before
attacking cycles (cycles are likely a secondary cause of issues).

**Revision:** The wrapper audit (§ 1) was inserted before Tasks 2/5
because understanding the geometry is prerequisite to knowing which
"cycles" are real bugs vs. correct behavior. The Unified Wrapper Funnel
(ARCHITECTURE § 11) was identified during the audit as a post-audit goal.

### PHASE A — Understand (no code changes)

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| — | **Wrapper Audit (§ 1)** | Ask | — | 🟡 In progress | *Inserted before Task 2.* Audit geometry/wrapping first. |
| 1 | Read full ProtoSegment class, build property dependency graph | Ask | — | 🟡 Partial | Dependency graph built in GEOMETRY-REFERENCE § 8. Not exhaustive yet. |
| 2 | Identify cycles in ProtoSegment, propose break points | Ask | 1, Audit | ❌ Not started | Deferred until wrapper audit completes. |
| 3 | Read `memoize()` in ProtoUtility.js, confirm minification safety | Ask | — | ❌ Not started | Quick — resolves an open question. |
| 4 | Build mutation → invalidation table for memoized properties | Ask | 1 | ❌ Not started | Same graph, reverse traversal. Finds stale-cache bugs. |
| 7 | Create GLOSSARY.md | Ask → Agent | — | ❌ Not started | Helps share vocabulary precisely. |
| 8 | Create ARCHITECTURE.md with dependency graph | Ask → Agent | 1, 4 | 🟡 Partial | Now exists as [ARCHITECTURE.md](ARCHITECTURE.md), with content from GEOMETRY-REFERENCE §§ 8, 10, 11. |
| 9 | Create FEATURES.md (feature calc order + PRNG consumption) | Ask → Agent | — | ❌ Not started | Documents the second most fragile area. |

### PHASE B — Stabilize ProtoSegment

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 5 | Implement cycle fixes in ProtoSegment | Agent + verify | 2 | ❌ Not started | Small, targeted. Test with known problem hashes. |
| 6 | Implement missing `resetMemoized()` calls | Agent + verify | 4, 5 | ❌ Not started | Safe to fix invalidation gaps after cycles broken. `#resetMemoProps` only invalidates ~12 of 30+ keys (ARCHITECTURE § 10.2.5). |

### PHASE C — Restore Intershapes + Reimplement Masking

> **Revised 2026-03-04:** Task 10 completed — BrokenFuture branch
> analyzed, root cause identified (KNOWN-ISSUES § 9.11). Phase C
> restructured into three sub-phases. Intershape restoration moved
> ahead of Phase B because intershapes are needed to analyze the
> remaining wrapper types (adjacent, intershape-specific wrapping).

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 10 | Read abandoned branch, summarize inner mask intent + what broke | Ask | — | ✅ Done | BrokenFuture analyzed. Root cause: `createSimpleSubShapes` in Shape constructor (KNOWN-ISSUES § 9.11). |
| 10a | **Restore intershapes** — remove constructor blocker + fix svg/assignElement | Agent + verify | 10 | ✅ Done | 3 changes: constructor blocker removed, `svg` length check, `assignElement` guard (KNOWN-ISSUES § 9.11.7). |
| 10b | Add `intershape` test hash to WRAPPER_TEST_CASES | Agent | 10a | ✅ Done | User added `intershape_1/2/3` + `collinear_basic_2` + `broken_07` hashes manually. |
| 11 | Design inner mask implementation plan against working branch | Ask | 10a | ✅ Done | Mask pipeline audited (KNOWN-ISSUES § 9.13). Re-enablement plan in § 9.13.7. |
| 12 | Implement inner mask feature incrementally | Agent + verify | 11 | 🟡 In progress | § 9.13.7 Steps 1-2 done: maskShape return-type fix, degenerate-path guard, createMaskGroup re-enabled at drawElement. Steps 3-5 remain. |
| 12a | **Fix SVG filter/mask cropping** — cascade, r-out, waves+ordinal | Agent + verify | 12 | 🟡 In progress | Cascade cropping (§ 9.14.1) ✅ fixed. R-profile mask (§ 9.14.2) ✅ fixed. Mar 6 `userSpaceOnUse` shared-filter-region rewrite was diagnosed as a visual regression and reverted from the runtime default (§ 9.14.6). Waves+ordinal (§ 9.14.3) remains, and the current frame artifact should be approached as a fresh layout/cropping isolation problem. |
| 12b | **Safari rendering** — percentage vs userSpaceOnUse filter regions | Research + Agent | 12a | ❌ Deferred | KNOWN-ISSUES § 9.14.4-5. Only after B-D stabilize the layout system. |
| 13 | Add structured corner-tracing debug log to `maximizeCuddles` | Agent | 5 | ❌ Not started | Useful during step 12 and all future debugging. |

### PHASE D — Document and reorganize

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 14 | Add JSDoc to core classes (ProtoSegment, Grid, FeatureSet, Shade, SegPath) | Edit (Cmd+I) | 5, 6 | ❌ Not started | Document after cleanup, not before. |
| 15 | Split files + reorganize into folders | Agent | 14 | ❌ Not started | Last structural task. Agent creates new files, moves code, updates index.html. |
| 16 | Create `build.sh` | Agent | 15 | ❌ Not started | References final file structure. Automatic minification. Excludes `testing/` and `docs/`. |

### PHASE E — Ongoing debugging

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| 17 | Visual edge-case debugging using image + log workflow | Ask | 13 | 🟡 Ongoing | Using WrapperDebugOverlay + hash-specific debugging. See [TESTING](TESTING.md). |
| 18 | Frame artifact diagnosis via clean SVG-layout A/Bs | Ask → Agent | 17 | 🟡 In progress | Primary hash `0x3e8a98...251d34`. KNOWN-ISSUES § 9.14.7 now distinguishes a fixed filter-region regression from a still-open vertical/cropping artifact. Next step is `FilterDebugHarness`-driven isolation of filter region, viewport, overflow, and mask behavior before any shader rewrites. |

### Post-Plan Addition: Unified Wrapper Funnel

| Task | Mode | Depends On | Status | Notes |
|------|------|------------|--------|-------|
| Merge flush/adj pipelines (ARCHITECTURE § 11) | Agent + verify | A complete, 5, 6 | ❌ Not started | ~250 line reduction. Requires completed audit to verify edge case coverage. |

### Post-Plan Addition: Second Frame Wrapping Mode

| Task | Mode | Depends On | Status | Notes |
|------|------|------------|--------|-------|
| Design second Frame wrapping mode (ARCHITECTURE § 12.5) | Ask | 10a, 12 | ⭐ Future | Apply full `maximizeCuddles()` pipeline to backGrid shapes. See ARCHITECTURE § 12.5. |

### Post-Plan Addition: Performance Re-Optimization (KNOWN-ISSUES § 9.15)

> **Context:** The § 9.14.1 three-layer fix broadened all filter
> regions and ShapeGroup viewports to FRAME bounds for correctness.
> This phase incrementally tightens them back for performance without
> breaking correctness. See KNOWN-ISSUES § 9.15 for full details.

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| P0 | Establish measurement baselines (load time, FPS, element counts) | Research | 12a | ❌ Not started | § 9.15.5. Must quantify before optimizing. |
| P1a | Per-profile padding precision | Agent + verify | P0 | ❌ Not started | § 9.15.3 Tier 1a. Vary padding by `hasInsetShade`/`hasOutsetShade`/`hasCastShadow`. |
| P1b | Per-cut filter region tightening (`userSpaceOnUse` AABB) | Agent + verify | P0 | 🚫 Blocked | § 9.15.3 Tier 1b — *2026-04-28: ATTEMPTED. Tight AABB collapses to FRAME for every cut due to § 9.14.1 cascade broadening. Zero area reduction (1.12× speedup, within noise). See § 9.15.6. Re-attempt only after § 9.11 maskShape rebuild.* |
| P1c | Animation batch optimization | Research + Agent | P0 | ❌ Not started | § 9.15.3 Tier 1c. Evaluate batch splitting for lower per-frame cost. |
| P2a | Restore tight ShapeGroup viewports (with overflow:visible) | Agent + verify | P1b | ❌ Not started | § 9.15.3 Tier 2a. Highest risk — coordinate system may shift. |
| P2b | Selective overflow:visible (cascade-only) | Agent + verify | P2a | ❌ Not started | § 9.15.3 Tier 2b-2c. Non-cascade cuts get free GPU clipping. |
| P3 | Per-ShapeGroup filter regions (requires filter cloning) | Agent + verify | P2a, 12b | ❌ Not started | § 9.15.3 Tier 3. Synergy with Safari fix (§ 9.14.4b). |
| P4 | Animation-specific optimizations (diff updates, CSS transforms) | Research + Agent | P0 | ❌ Not started | § 9.15.3 Tier 4. Independent of viewport work. |
| P5 | Load time optimizations (lazy filters, deferred DOM) | Research + Agent | P0 | ❌ Not started | § 9.15.4. Profile setup pipeline first. |

---

### Post-Plan Addition: Safari Canvas-Image-Swap (KNOWN-ISSUES § 9.15.6)

> **Context (2026-04-28 → 2026-04-29):** SVG filter pipeline confirmed to be
> ~50–100× slower on Safari than Chrome due to WebKit's pre-LBSE software
> rasterizer. Tier 1b region-tightening produced no measurable benefit
> (§ 9.15.6). Initial decision was to rasterize once and swap in `<img>`,
> but measurement showed the rasterization cost is fixed regardless of
> where it happens (10s either way). Final decision: keep the live SVG,
> disable shadow animation on Safari, and surface a loading overlay +
> persistent footer notice during the slow first paint. See `safariImageSwap.js`.

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| S1 | Tear out Apr 28 diagnostic scaffolding | Agent + verify | — | ✅ Done | § 9.15.6.1 checklist. Removed Tier 1b branch, `wrapForIsolation`, `measurePerf`/`measureAcrossFlags`/`measureTightRegion`, B1 EXP keypress probes. Kept `SAFARI_FILTER_REGION_USERSPACE_FIX` branch. |
| S2 | UA-detect Safari + add image-swap entry point | Agent | S1 | ✅ Superseded | Initial swap path implemented + tested. Replaced by loading-overlay UX after measurement showed swap saves no time. UA detection retained in `safariImageSwap.js` for the overlay/notice. |
| S3 | Implement SVG → blob → `<img>` rasterization | Agent + verify | S2 | ✅ Superseded | Implemented + tested. Swap-target raster needed SVG width/height rewrite for retina sharpness. Removed once it became clear there was no perf benefit. |
| S4 | Replace live SVG with rasterized `<img>` after first paint | Agent + verify | S3 | ✅ Superseded | Implemented + tested. No measurable speedup. Reverted to live-SVG path with overlay during render. |
| S5 | Loading-overlay + Safari notice UX | Agent | S4 | ✅ Done | `safariImageSwap.js` (filename retained) now exposes `window.SafariCompatUX` — fullscreen spinner overlay shown during every build, animation disabled on Safari, persistent footer notice on Safari. |
| S6 | Fine-tune blur radii, animation timings, loading copy + icon | Agent + design | S5 | ❌ Not started | Polish pass on overlay visuals + Safari notice text. Tunable blur amount, fade timings, copy. Cross-engine review. |
| S7 | Fine-tune Chrome rotational light animation | Agent + design | S6 | ❌ Not started | Once Safari UX is finalized, focus on the Chrome-only animation feel: rotation speed, easing, dwell, idle behavior. |

---

### Post-Plan Addition: ProtoBatch Teardown Completeness (KNOWN-ISSUES § 9.16)

> **Context (2026-04-29):** Repeated `n` (new seed) presses occasionally
> land in a state where some shading layers are missing and inset/outset
> behavior misfires. Strongly suspected to be incomplete teardown leaving
> stale references in `S` (ProtoStore), filter `<defs>`, or other module-
> level caches. Low priority for ArtBlocks deployment (full reload per
> hash) but mandatory for the public generator (long-lived sessions).

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| T1 | Reproduce + characterize the bad state | Research | — | ❌ Not started | Identify hash sequences that trigger it. Capture `S.allLayers`, filter defs count, and Random useage before/after. |
| T2 | Audit `ProtoBatch.teardown()` against full setup() pipeline | Research | T1 | ❌ Not started | Walk every global / module-level cache touched during build; verify each is cleared or replaced. |
| T3 | Audit ProtoStore (`S`) lifecycle | Research | T2 | ❌ Not started | Cross-reference what setup() writes vs what teardown() nulls. Anything written during build but never explicitly cleared = candidate. |
| T4 | Audit filter `<defs>` accumulation | Research | T2 | ❌ Not started | Confirm BG removal cascades all filter defs out of the DOM (it should — they live inside FRAME.bleed.elt). Also check any module-level filter ID registries. |
| T5 | Implement state-monitor harness | Agent | T1 | ❌ Not started | Dev-only diagnostic that snapshots key counts (layers, filters, listeners, RAF handles) pre/post teardown to surface leaks. |
| T6 | Fix identified leaks | Agent | T2–T5 | ❌ Not started | Likely additional nulls in teardown(), explicit `S` reset, possibly explicit cache clears. |
| T7 | Stress test: 100× rebuild loop | Verify | T6 | ❌ Not started | Ensure no progressive degradation, no console errors, no missing layers. |

**Possible-culprit flag:** Until this is resolved, any future bug report
that surfaces missing shading layers, broken inset/outset, or stale
filter behavior should treat incomplete teardown as a leading suspect
— particularly when it appears only after one or more `n` presses and
never on a fresh page load.

---

### Post-Plan Addition: Reveal Animation Tuning (KNOWN-ISSUES § 9.15.6, § 9.17)

> **Status update (2026-05-03):** The Safari Art Blocks reveal/transition
> implementation is complete for the current scope. The canonical final
> architecture and guardrails now live in
> `docs/Operational/REVEAL-ANIMATION-STATUS.md`. The planning table below is
> historical. Any remaining RA work applies only if the public generator or a
> future non-Art-Blocks branch explicitly reopens reveal experimentation.

> **Context (2026-04-29):** Now that Safari compatibility is functionally
> resolved, the next frontier is the *reveal experience* — what the user
> sees during page load, between `n` rebuilds, and around any
> animation-related transitions. The goal is a polished cinematic
> "focus pull" that:
>
> 1. Hides the ugliness of slow first paints (Safari) and uneven build
>    times (heavy hashes on any browser).
> 2. Looks consistent across platforms in 2026 *and* in 2036.
> 3. Doesn't over-emphasize execution speed as a feature — collectors
>    should see polish, not a benchmark.
> 4. Works equally well on the locked-forever ArtBlocks deployment and
>    on the live public generator (where users press `n` repeatedly).
>
> **Forward-compat constraint (AI_INDEX axiom):** All four elements
> below must *gracefully no-op* on a future fast platform. A 2-second
> reveal that runs in 50ms is invisible; a perf-tuned shortcut that
> assumes 10s of slack is permanent.

#### Reveal Elements

The reveal scene composes four DOM/SVG elements:

| Element | Type | Existence | Notes |
|---------|------|-----------|-------|
| **E1. Artwork** (Prototype SVG) | `<svg>` (FRAME.bleed.elt) | Always | The final resolved render. |
| **E2. Loading spinner** | `<div>` w/ CSS animation | Built per build | Currently in `safariImageSwap.js`. |
| **E3. "Loading" text** | `<div>` w/ message + secondary | Built per build | Currently in `safariImageSwap.js`. |
| **E4. Blurred dummy backing** | `<div>` or static SVG of frame backing only | **Proposed** | Renders nearly instantly (no filters), provides "subject is already there, camera is focusing" effect. Replaces black-pop-in with focus-pull. |

#### Modulation Channels

For each element we may modulate, in timed sequence:

| Channel | Implementation | Performance note |
|---------|----------------|------------------|
| **Opacity** | CSS `opacity` + `transition` | Cheap on every engine; GPU-composited. ✅ Use freely. |
| **Blur** | CSS `filter: blur(Npx)` + `transition` | GPU-composited *if the element is a layer* (`transform:translateZ(0)` or `will-change:filter`). ✅ Cheap when promoted. ⚠️ Heavy blur on the live SVG would re-trigger SVG filter rasterization on Safari — apply blur only to non-SVG elements (E2, E3, E4) or to the FRAME container *div* wrapping the SVG, not the SVG itself. |

#### Trigger Contexts

| Context | Sequence | Frequency |
|---------|----------|-----------|
| **C1. Initial page load** | Cold DOM → render → first reveal | Once per page session |
| **C2. Resolve transition** | Build complete → reveal artwork | Once per build |
| **C3. User reload (`n`)** | Existing artwork → teardown → new build → reveal | Many times per session (public generator); never on ArtBlocks |

#### Design Pillars (Decision Frame)

Two creative-philosophical questions to settle before the timing table
is finalized:

1. **What should the reveal celebrate?**
   - (a) *Execution as event* — emphasize loading/computation; collectors feel the work being made.
   - (b) *Artwork as object* — minimize loading affordances; the work always feels "there", computation is invisible.
   - (c) *Hybrid* — short, branded reveal that reads as polish on fast platforms and as patience-rewarding on slow ones.

2. **Should the experience drift across platforms / years?**
   - (a) *Stable per-collector experience* — a guaranteed minimum reveal length (e.g. 2s) means the artwork looks identical on every device every year.
   - (b) *Adaptive* — reveal length tracks actual render time, so collectors on faster future hardware see a faster reveal.

The recommended starting point is **1c + 2a**: a polished, branded
reveal with a fixed minimum duration (≈ 2s on the artwork). On fast
platforms the user waits a moment past the build for polish; on slow
platforms the polish is masked by genuine work. As platforms change
over decades, the experience stays consistent. Light-direction
animation (Chrome only, ongoing rAF) is the *only* element that
should improve with future hardware.

#### Proposed Timeline (starting baseline, tunable)

All times are intent — actual measured render times vary. The
*minimum* path runs on fast Chromium (build ≈ 200ms); the *slow*
path runs on legacy Safari (build ≈ 10s). Both should resolve to the
same final state.

```
T = 0ms        page load / `n` pressed / build starts
                ┌─ E2 spinner + E3 "Loading" text fade in (200ms)
                ├─ E4 blurred backing already visible (or fade in if C1)
                └─ E1 artwork SVG hidden (visibility:hidden) or built behind E4
T = build_end  build completes (200ms on Chromium, 10s+ on Safari)
                └─ start min-duration timer → max(build_end + 600ms, T + 2000ms)
T = reveal     E2 spinner fades out (300ms)
                E3 text fades out (300ms)
                E4 blurred backing: blur(40px) → blur(0px) over 800ms
                E4 backing fades out (800ms) crossfading with E1
                E1 artwork: opacity 0 → 1 (400ms, eased)
T = reveal+800 reveal complete; (Chrome only) animation may begin
```

#### Tuning Tasks

| # | Task | Mode | Depends On | Status | Notes |
|---|------|------|------------|--------|-------|
| RA1 | Audit current overlay performance on M1 / Sequoia / Chrome | Research | — | ✅ Superseded | Final Safari implementation uses immediate loading text plus persistent dummy layers; canonical behavior is documented in `REVEAL-ANIMATION-STATUS.md`. |
| RA2 | Build E4: blurred dummy backing (frame plane only, no filters) | Agent | RA1 | ✅ Superseded | Achieved in spirit via `#safari-dummy` and `#safari-dummy-core`; final implementation is body-level DOM, not the originally proposed spinner/backing mix. |
| RA3 | Refactor overlay to compose E2/E3/E4 as siblings of FRAME, with CSS-driven transitions | Agent | RA2 | ✅ Superseded | Final Safari implementation uses persistent body-level siblings and CSS-driven transitions in `safariImageSwap.js`. |
| RA4 | Implement min-duration floor (`max(build_end + Δ, T + 2000ms)`) | Agent | RA3 | ✅ Deferred by scope | Not needed for the locked Art Blocks Safari path; current implementation keys off real build completion plus fixed reveal timing. |
| RA5 | Add C3 (reload) variant: crossfade old artwork → blurred copy → new artwork | Agent | RA3 | ✅ Deferred by scope | Safari dynamic `n` behavior is intentionally disabled for Art Blocks. |
| RA6 | Tune blur radii, fade timings, easing curves | Design + Agent | RA5 | ✅ Complete for current scope | Safari loading text, pulse, reveal timing, and raster-quality constraints were tuned and user-approved. |
| RA7 | Cross-engine review (Chrome / Safari / Firefox / iOS Chrome) | Verify | RA6 | ✅ Partial / sufficient | Chrome and Safari branches were smoke-tested repeatedly; Safari real-device/user validation approved the final behavior. |
| RA8 | Forward-compat smoke test: simulate fast-future-platform with build < 50ms | Verify | RA7 | ✅ Deferred by scope | Not required for the current Art Blocks freeze. |
| RA9 | Lock baseline for ArtBlocks freeze | Approval | RA8 | ✅ Done | Safari reveal implementation is complete and documented; treat it as locked unless the user explicitly reopens it. |

#### Out of Scope (Tracked Separately)

- **Chrome rotational light animation tuning** — separate roadmap entry; depends on reveal lock first.
- **Safari notice copy / footer styling** — falls under RA6.
- **Public generator-specific reveal variations** — public branch can diverge after RA9; ArtBlocks freeze does not.

#### Pre-Release Forward-Compat Polish (Decided 2026-04-29)

Items deferred from initial submission but **must land before public release**.
Reflect the AI_INDEX immutability axiom — graceful degradation across decades.

| # | Concern | Decision | Action |
|---|---------|----------|--------|
| FCP1 | `prefers-reduced-motion` | **Adopt.** Tune the reveal so it still looks polished with reduced motion (cut blur, instant or near-instant opacity transition). | RA6 sub-task. |
| FCP2 | `prefers-color-scheme: light` | **Probably skip.** Background must always be black so the work looks consistent in collection grids and across galleries. Collector-context consistency outranks UA preferences. May revisit a "light cast-shadow" variant for fun, but not for ArtBlocks. | Document decision in KNOWN-ISSUES § 9.17 (FC4 successor). No code action. |
| FCP3 | `Save-Data` / data-saver headers | **Skip.** Overkill for a static gen-art piece. | None. |
| FCP4 | Web Animations API maturation | **Stick with CSS keyframes / transitions.** Most-optimized animation primitive on every engine; least likely to be deprioritized over decades. | Already enforced — RA3 is CSS-only. |
| FCP5 | `content-visibility: auto` | **Ignore.** Layout has no off-screen content (single FRAME centered in viewport). | None. |
| FCP6 | Image decoding model evolution | **Ignore.** Was relevant only to the abandoned canvas-image-swap path. | None. |

**General principle (per AI_INDEX axiom).** Define UX in declarative
CSS as much as possible and let future platforms optimize underneath.
Imperative JS-driven animation pins a specific timing model to a
specific runtime cost — bad for decade-long deployments.

---

### Post-Plan Addition: Public Generator Deployment

| Task | Status | Notes |
|------|--------|-------|
| Rename `2026MarchSquareSpace` → `PublicGenerator-v0.1` | ✅ Done | Branch renamed locally + remote. Old remote deleted. |
| Decouple regen button into `PublicGenerator.js` | ✅ Done | Dynamic button creation, `positionRegenBtn()` guarded in shared code. |
| Update GitHub Pages deploy branch | ⚠️ User action | Settings → Pages → Branch → select `PublicGenerator-v0.1`. |
| `build.sh` excludes `PublicGenerator.js` from dev builds | ❌ Not started | Depends on Task 16 (PHASE D). |

**Branch model:**
- `agent-testing` — active dev branch
- `main` — stable sync point
- `PublicGenerator-v0.1` — public deployment (GitHub Pages → SquareSpace embed)
- Merge path: `agent-testing → main → PublicGenerator-v0.1`
- Public branch diverges in: `index.html` (browser detection, no testing scripts, loads `PublicGenerator.js`), `style.css` (additional `#unsupported-msg` + button styles)

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-05-03 — Safari reveal implementation marked complete for current scope; see REVEAL-ANIMATION-STATUS.md for canonical final architecture.*
