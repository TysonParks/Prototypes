## What This Document Is Not

This file is temporary working memory for the current debugging/development
session. It is not canonical documentation and may become outdated between
sessions.

Permanent knowledge belongs in:

- docs/Canonical/*
- docs/Operational/KNOWN-ISSUES.md
- docs/Operational/ROADMAP.md
- docs/Operational/REVEAL-ANIMATION-STATUS.md

---

Session snapshot (short, editable)

Current Focus
- Safari reveal/transition implementation is complete for the Art Blocks
- Safari and Chrome reveal/transition implementations are complete and
	approved for the Art Blocks submission scope.
- The authoritative handoff is now `docs/Operational/REVEAL-ANIMATION-STATUS.md`.
- Next sessions should move on to non-Safari-transition work unless the user
	explicitly reopens Safari reveal tuning.

Completed Safari Outcomes
- Safari initial load starts in the hidden dummy state.
- Loading text is visible before WebKit's synchronous SVG build lock.
- Safari `n` is ignored; Safari `s` remains available.
- Hidden-state loading motion uses `#safari-dummy-core` transform pulse.
- The reveal transition is stable and user-approved.
- The hard-edged hidden-scale rectangle flash was removed.
- Final Safari artwork raster quality is stable; `BG.elt` is now natural-size
	and opacity-only during reveal while `#safari-dummy` carries the visible
	scale/blur/morph motion.

Current Safari Architecture Constraints
- Keep Chrome as the locked reference execution.
- Keep Safari reveal work behind `isWebKitClass`.
- Do not scale, blur, or force-promote `BG.elt` during Safari reveal.
- Let `#safari-dummy` own visible motion; let `BG.elt` prepaint at normal size
	with near-zero opacity and fade in at natural resolution.

Next Investigation Steps
1. Do not resume Safari reveal changes unless the user explicitly asks.
2. If future Safari regressions appear, start from
	 `docs/Operational/REVEAL-ANIMATION-STATUS.md` rather than the old
	 canvas-image-swap plan.
3. Treat `safariImageSwap.js` as the active Safari reveal module despite the
	 legacy filename.

Session timestamp: 2026-05-03
