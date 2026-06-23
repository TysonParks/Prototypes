// Archived from ProtoLayerObjects.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// ProtoLayer view-property experiments — unused; paste onto ProtoLayer to revive.

// Optional field paired with filterLoft getter (was declared on class, never assigned):
// _filterLoft

// get filterLoft() { return this._filterLoft ?? 0 }
// get loft() { return this.protoParent.loft + this.filterLoft }

// get padSize() {
//   return memoize(() => {
//     return Vertex.sub(this.size, this.insetSize).div(2)
//   }, `padSize`).call(this)
// }
