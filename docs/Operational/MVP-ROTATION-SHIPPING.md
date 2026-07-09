# MVP Rotation Shipping (Pre–Art Blocks Submission)

**Status:** Active for submission sprint.  
**Deferred follow-up:** [DEFERRED-ADAPTIVE-RENDER-MODES.md](DEFERRED-ADAPTIVE-RENDER-MODES.md)

---

## Goals (this sprint)

1. **Cardinal buffer rotation on all browsers** — default for Chrome and Safari; no metrics-based toggling yet.
2. **Safari locked to cardinal** — never tier to live SVG rotation (`rotation: 'full'`); block WebKit live-rotation fallback paths.
3. **Ship sooner** — defer benchmark harnesses, adaptive promotion, and `RenderMode` extraction.

---

## What changed in code

| Area | Change |
|------|--------|
| `safariCompat.js` | `CHROME_CAPABILITIES.rotation = 'cardinal'`; WebKit never promotes to `'full'` |
| `safariCardinalBuffers.js` | **Yielding cardinal bake coordinator** — lazy session on first arrow; per-angle bake with yield points; last-click-wins deferred rotation |
| `ArtworkRotation.js` | Deferred rotation via `pendingDirection`; prep overlay when user waits; live SVG when light animation is on |
| `RevealAnimation.js` | No post-reveal bake kickoff; prep overlay only on user rotation wait |
| `sketch.js` | Light toggle stops coordinator / invalidates; shade tap blocked only during active crossfade |

---

## Cardinal bake coordinator (current behavior)

**Lazy kickoff:** no baking after reveal or light-off.

**First arrow:**
1. Show `Preparing orientation...`
2. Wait 2 frames so the message paints
3. Bake **target orientation only** (live SVG is outgoing on first rotation)
4. Rotate when target buffer is ready

**After each rotation:** the orientation you left is always queued for retention (enables instant reverse). Classifier adds more only when fast enough:

| First bake | Additional background |
|------------|----------------------|
| < 500ms | All remaining missing orientations |
| 500ms–2s | One adjacent (+90° or −90°) |
| > 2s | Retention only (reverse angle) — no extra background |

Diagnostics: `SafariCardinalBuffers.getDiagnosticsSnapshot()` exposes `firstBakeMs` and `backgroundBakePolicy`.

---

## Safari “frozen image spin” bug (clarified)

**Symptom:** On light hashes (#1527–1529), arrow rotation animated but looked like spinning the 0° snapshot — lighting did not update.

**Cause:** Performance tiering set `rotation: 'full'` (live CSS transform) while `lightAnimation: false` (no `feOffset` updates during rotation). The SVG rotated visually but **shading stayed locked** at the initial angle.

**Fix:** WebKit always uses cardinal buffers when rotation is enabled. Live SVG rotation is blocked on WebKit even as a fallback.

---

## What stays deferred

- Chrome first-rotation quality probe and adaptive Live ↔ Cardinal switching
- Proactive post-reveal bake kickoff tuned by metrics
- Four-phase automated benchmarks and regression suite manifest
- `revealCompleteMs` instrumentation and threshold retuning
- LBSE detection and Safari live-first probe
- Light-angle invalidation when toggling animated lighting during cardinal mode

---

## Quick manual QA before submit

| Browser | Hash | Check |
|---------|------|-------|
| Safari | #1519 | Reveal → no background bake → first arrow shows prep then rotates; ×3 stable |
| Safari | #1527 | Same; not frozen 0° spin |
| Chrome | #1519 | Reveal idle (no bake) → first arrow prep/rotate; export (S) works |
| Chrome | #1527 | Lazy first arrow; second rotation faster if post-rotate fill completed |

Console: `SafariCompat.capabilities.rotation` should be **`'cardinal'`** on both browsers (or `'off'` only on pathological loads).

*Last updated: 2026-07-07*
