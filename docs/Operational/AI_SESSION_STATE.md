## What This Document Is Not

This file is temporary working memory for the current debugging/development
session. It is not canonical documentation and may become outdated between
sessions.

Permanent knowledge belongs in:

- docs/Canonical/*
- docs/Operational/KNOWN-ISSUES.md
- docs/Operational/ROADMAP.md

---

Session snapshot (short, editable)

Current Focus
- Safari canvas-image-swap implementation (KNOWN-ISSUES § 9.15.6, ROADMAP S1–S5).
- Immediate next step: S1 tear-out of Apr 28 diagnostic scaffolding per § 9.15.6.1 checklist.

Active Hypotheses
- Confirmed (2026-04-28): WebKit pre-LBSE software rasterizer is the cost driver. Total cost ≈ region_area × primitive_count. Reducing either lever requires architectural rework (§ 9.14.1 cascade broadening blocks region tightening).
- Image-swap path on Safari should bypass the issue entirely, at the cost of losing shadow rotation animation on Safari. Acceptable trade-off.

Files Touched (Apr 28 — most to be torn out per § 9.15.6.1)
- `neuMark_I.js` — `ProtoCut.setLayouts()` userSpaceOnUse fix (KEEP). Tier 1b tight branch (REMOVE).
- `safariCompat.js` — `measurePerf` / `measureAcrossFlags` / `measureTightRegion` / `wrapForIsolation` / two flag inits (REMOVE).
- `gui.js` — four "B1 EXP" keypress diagnostic blocks (REMOVE).
- `docs/Operational/KNOWN-ISSUES.md` — § 9.15.6 added with measurements + tear-out plan (KEEP).
- `docs/Operational/ROADMAP.md` — P1b marked blocked, S1–S5 added (KEEP).

Git Hygiene Note
- User has not committed any work in the last 24h. Recommend: commit current Apr 28 scaffolding + docs to a dedicated branch (e.g. `safari-perf-investigation-apr28`) so the diagnostic code exists in history for future reference, then start the canvas-image-swap work on a fresh branch starting from the S1 tear-out commit. This preserves the experiment record without leaving dead code on main.

Next Investigation Steps
1. Commit Apr 28 scaffolding to a dated branch for archival (optional but recommended).
2. S1 — execute § 9.15.6.1 tear-out checklist; verify hash 1487 still renders correctly in both Chrome and Safari.
3. S2 — UA-detect Safari + create image-swap entry point.
4. S3 — implement SVG → blob → `<img>` rasterization.
5. S4 — replace live SVG with rasterized `<img>` after first paint on Safari.
6. S5 — visual diff Safari `<img>` vs Chrome SVG across hash suite.

Short notes
- Tier 1b A/B numbers (hash 1487, FOSL): A_baseline=11831ms, B_tight=10564ms (1.12×, within noise). Region area identical at 1,060,000 u² total — § 9.14.1 cascade broadening collapses every cut's union AABB to FRAME.
- §9.14.7 banding fix (filter region must extend +50 past FRAME edges) is a hard constraint preserved by the kept `SAFARI_FILTER_REGION_USERSPACE_FIX` path.

Session timestamp: 2026-04-28
