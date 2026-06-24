// Archived from drawAsSVG.js ProtoSegment (2026-06). Not loaded by index.html — see archive/README.md.
//
// Part-classification getters — delegate to EdgePart (see Part in ProtoUtility.js).
// Live ProtoSegment still exposes isStair / isStairIn; revive these when segment-level
// UTurn/Flat/Corner queries are needed (pairs with archive/Shape-unused.js hasUTurns).

// Paste onto ProtoSegment after `get part()`:

// get isUTurn() { return this.part?.isUTurn }
// get isUTurnIn() { return this.part?.isUTurnIn }   // LL
// get isUTurnOut() { return this.part?.isUTurnOut } // RR

// get isStairOut() { return this.part?.isStairOut } // LR

// get isFlat() { return this.part?.isFlat }
// get isCorner() { return this.part?.isCorner }
