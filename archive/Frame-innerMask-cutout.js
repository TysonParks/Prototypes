// Archived from ProtoLayerObjects.js Frame.setBackGridGroup() (2026-06).
// Not loaded by index.html — see archive/README.md.
//
// Experiment: complex outer frame geometry that wraps to internal grid state —
// not just a flat rectangle with rounded corners matching frontGrid.
//
// Relationship to setBackGridGroup(mode):
//   mode === 0 → backGrid.groupAvail() (full available grid as backGroup)
//   mode === 1 → backGrid.groupFromIndices(taken cells) — production default
//
// This experiment paired mode-0-style full backing with:
//   1. A second cutIslands pass at layerStart: scaled(0) — inner geometry at full depth
//   2. An SVG <mask> cloned from shapeGroups[1] (inner cut geometry)
//   3. Applying that mask to each ShapeGroup-combo from profile cuts
//
// Production keeps only the flat backing cut at scaled(1) plus real profile cuts.
// See also maskFrame() (live) which masks the whole Frame layer from shapeGroups[0].

// ── Inner cut at full depth (before real profile cuts) ────────────────────────
//
//     //NOTE: this should be used as the inner mask of the frame
//     // this.backGroup.cutIslands({
//     //   // profile: Profile.jIn,        // no profile creates flat backing
//     //   isFrame: true,
//     //   layerStart: scaled(0),
//     //   amount: 1,
//     //   loftScale: 1 / 1,
//     //   addBacking: false,
//     // })

// ── Inner mask from second shapeGroup geometry ────────────────────────────────
//
//     // const
//     //   innerMaskDefs = createSVGElt(`defs`).parent(this.svgElt),
//     //   innerMaskID = `${this.id}-innerMask`,
//     //   innerMask = createSVGElt(`mask`)
//     //     .id(innerMaskID)
//     //     .parent(innerMaskDefs),
//     //   gridClone = this.backGroup.shapeGroups[1].svgGroupElt.elt.cloneNode(true),
//     //   paths = gridClone.querySelectorAll('path')
//     // paths.forEach(p => p.setAttribute(`fill`, `black`))
//     // innerMask.elt.appendChild(gridClone)

// ── Apply inner mask per combo cut group ──────────────────────────────────────
// Inside cuts.forEach(cut => { ... cutIslands(...) ... }):
//
//     // const thisGroup = this.backGroup.shapeGroups.last
//     // if (thisGroup.type === 'ShapeGroup-combo')
//     //   thisGroup.svgGroupElt.attribute(`mask`, `url(#${innerMaskID})`)
