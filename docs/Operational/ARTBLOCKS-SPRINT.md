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
| Q5 | How does ArtBlocks Post Params work — is it query-string based, hash-segment based, or via their own API? How does it interact with the hash/seed? | ArtBlocks docs | Partially answered (docs): The page notes that PostParam settings affect determinism (features must be consistent with hash + PostParams) but implementation details are in MCP/Generator docs (see MCP/Generator and "Staging & Testing"). Follow-up: read MCP / Generator spec for exact PostParam format. |
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

| Day | Focus | Target Items |
|-----|-------|-------------|
| 1 | ArtBlocks research + Q&A | Resolve Q1–Q7, read upload docs, set up test bench account if needed |
| 2 | Bug: Safari compatibility | B1 |
| 3 | Bug: Safari compatibility (cont.) + shading | B1, B3 |
| 4 | Bug: Wrapping | B2 |
| 5 | Bug: Wrapping (cont.) | B2 |
| 6 | Feature: InfraGrid InnerCuts re-enable | F2 |
| 7 | Feature: Rotation research + Post Params | F1 |
| 8 | Feature: Rotation implementation (basic) | F1 |
| 9 | Code cleanup pass | E1 |
| 10 | Export Pipeline setup (answer-dependent) | E2 |
| 11 | Animation: timing polish | B4 |
| 12 | Animation: performance (cont.) | B4 |
| 13 | Integration testing against ArtBlocks test bench | E3 |
| 14 | Buffer / overflow / final upload | — |

> Days 13–14 are intentionally light on new work to allow for unexpected
> integration issues. Do not schedule new features here.

---

## Bug Backlog

Priority scale: **P1** = must fix before upload · **P2** = should fix · **P3** = nice to have

| ID | Bug | Priority | Est. Time | Depends On | KNOWN-ISSUES Ref | Status |
|----|-----|----------|-----------|------------|-------------------|--------|
| B1 | **Safari compatibility** — SVG filter rendering differences (percentage vs user-unit layout, cross-SVG filter ID resolution) | P1 | 2–3 days | — | §9.14.4b | ❌ Not started |
| B2 | **Remaining wrapping bugs** — adjacent wrapper visual verification still pending; Bug B (opposite-facing collinear) deferred | P2 | 2–3 days | Wrapper audit §1 in ROADMAP | §9.7, §9.12 | 🟡 In progress (audit) |
| B3 | **Remaining shading bugs** — R-in shade layer not centered; potential mask cropping edge cases | P2 | 1–2 days | — | §9.14.9, §9.13 | ❌ Not started |
| B4 | **Animation optimization + timing** — performance re-optimization pass; complete timing/sequencing implementation that was deferred | P3 | 2–3 days | — | §9.15 | ❌ Not started |

### Bug Notes

**B1 — Safari:**
The primary known risk is SVG filter ID resolution and the percent vs. user-unit
filter region layout (KNOWN-ISSUES §9.14.4b). The user-unit layout rewrite (§9.14.6)
should help, but Safari's rendering engine may still diverge. Test against real Safari
early — don't save this for the end.

**B2 — Wrapping:**
Scoped to visual verification of adjacent wrappers and the Bug B opposite-facing
collinear case. The full Unified Wrapper Funnel (ARCHITECTURE §11) is **out of scope**
for this sprint — that is a post-audit, post-sprint task.

**B3 — Shading:**
R-in shade layer centering (§9.14.9) is the most concrete open item. Audit wave +
ordinal mask mismatch briefly before committing time.

**B4 — Animation:**
Lower priority for evaluation unless animation is a primary feature being demonstrated.
Can be deferred to post-upload if needed.

---

## Feature Backlog

| ID | Feature | Priority | Est. Time | Open Questions | Status |
|----|---------|----------|-----------|----------------|--------|
| F1 | **Prototype object Rotation** — basic rotation for ProtoLayerObjects; research ArtBlocks Post Params integration to allow rotation parameter to be passed externally | P2 | 2–3 days | Q5 (Post Params API) | ❌ Not started |
| F2 | **InfraGrid InnerCuts re-enable** — fix and re-enable the feature that cuts new shapes within a parent shape using only Direction hierarchy 0/1 (the feature whose name is uncertain — likely "InnerCuts" or "InsideCuts" related to infraGrids) | P2 | 1–2 days | — | ❌ Not started |

### Feature Notes

**F1 — Rotation + Post Params:**
Research phase first: understand how ArtBlocks Post Params are exposed at runtime
(Q5). If Post Params are query-string or hash-based, a rotation parameter could
be added without touching the core PRNG seed. Basic rotation (90° increments or
free-angle) for the prototype layer objects is the implementation target — not
a full transform system. Scope creep risk is high here; timebox research to half
a day.

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

*Document created: April 23, 2026*
*Status: Draft — pending answers to Open Questions*
