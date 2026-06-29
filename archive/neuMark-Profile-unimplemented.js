// ARCHIVED 2026-06 — unimplemented Profile / ProtoCut paths removed from neuMark_I.js
// Not loaded by index.html or submission bundle.

// Planned `s` (squircle curve) and `v` (flat/vertical) cut profiles — never shipped.
// static fIn = new Profile(`s`)
// static fOut = new Profile(`s`, false)
// static vIn = new Profile(`v`)
// static vOut = new Profile(`v`, false)
// get isS() { return this.type === `s` }
// get isV() { return this.type === `v` }

// Planned halfCurve / frameEdge profile modifiers — constructor params and equals() checks removed.
// halfCurve, frameEdge fields on Profile
// isSingleDepth included: this.frameEdge || this.halfCurve
// ProtoCut.description suffixes: `-half`, `-frameEdge`
// ProtoCut.curve() branch for isS
// ProtoCut.#createFilters() stubs for isS / isV
