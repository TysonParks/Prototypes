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
*Last updated: April 24, 2026 — Production Token spec added*
*Status: Draft — some Open Questions pending ArtBlocks team confirmation*
