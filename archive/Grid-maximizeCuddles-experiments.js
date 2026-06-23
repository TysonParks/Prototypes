// Archived from Grid.js (2026-06). Not loaded by index.html — see archive/README.md.

// Former inner helpers inside Grid.maximizeCuddles() — quad/corner experiments never wired to nestleShapes().
    //MARK: QUAD SHAPES
    //FIXME: incomplete and unused!
    //ARROW: createQuadShapes(mode) : process 4-sided (square/rect) shapes first with multiple modes
    //TODO: need to add an ABFeature to select these!!!
    // const createQuadShapes = (mode, onlySingles = true) => {
    //   const sumSides = (sides) => sides.reduce((a, b) => a + b)

    //   // DeBug.log(`allSimpleSubShapes`, this.allSimpleSubShapes)
    //   //FIXME: need to filter out outer subShapes that wrap/outline an inner subShape
    //   let quads = onlySingles ? this.allSingleSimpleSubShapes : this.allSimpleSubShapes
    //     .filter(sub => sub.length === 4)// filter for 4-sided shapes
    //     .filter(sub => sub.some(seg => seg.isUTurnOut)) // filter for Outside shapes only (UTurnOut)
    //     .sort((a, b) => sumSides(b) - sumSides(a)) // sort smallest to largest
    //   // .copy
    //   // DeBug.log(`this.allSimpleSubShapes`, this.allSimpleSubShapes)
    //   // DeBug.log('quads', quads)
    //   // DeBug.log(`quad parts`, quads.map(quad => quad.map(seg => seg.part.value)))

    //   let processor
    //   switch (mode) {
    //     case 0: // Max curvature, equal radii
    //       processor = (quad) => {
    //         const radius = min(quad.map(seg => seg.length)) / 2
    //         return Array(4).fill(radius)
    //       }
    //       break
    //     case 1: // Min curvature, equal radii
    //       processor = (quad) => Array(4).fill(this.cellRadius)
    //       // processor = (quad) => [cellRadius, cellRadius, cellRadius, cellRadius]
    //       break

    //     case 2: // Horizontal Symmetry
    //     // quads must be horizontal rectangles! utilize Easter Egg logic but add maxLength?
    //     // might be worth combining symmtry into single mode, 
    //     case 3: // Vertical Symmetry
    //     // quads must be vertical rectangles! utilize Easter Egg logic but add maxLength?
    //     // might be worth combining symmtry into single mode, 

    //     case 4: // Easter Eggs / Eyeballs : max curvature with diagonal symmetry
    //       processor = (quad) => {
    //         // DeBug.error(`hi`)
    //         let cornerMap
    //         const minLength = min(quad.map(seg => seg.length)) // min side length
    //         if (equalsRoundedDec(minLength, this.minCellWidth, 2)) { // quad is single cell width or height
    //           cornerMap = Array(4).fill(this.cellRadius)
    //         } else {
    //           const maxRadius = minLength - this.cellRadius // maxRadius given cellRadius is minRadius
    //           // build options from cellRadius steps from 0->minLength, removing 3 steps (0, minLength/2, and minLength)
    //           const steps = (round(maxRadius / this.cellRadius) - 1) / 2 // totalSteps = 2 * steps + 1
    //           let options = range(-steps, steps)
    //             .array() // totalSteps array minus 1st and last (0 and minLength)
    //             // .filter(s => !(s === 0)) // remove middle (minLength/2) step
    //             .map(s => s + steps + 1) // add back steps like converting -0.5 to 0.5 range to 0-1 range
    //           const radius1 = minLength - (R.random_choice(options) * this.cellRadius)
    //           const radius2 = minLength - radius1
    //           cornerMap = [radius1, radius2, radius1, radius2,]
    //           DeBug.log(`minLength`, minLength)
    //           DeBug.log(`cellRadius`, this.cellRadius)
    //           DeBug.log(`maxRadius`, maxRadius)
    //           DeBug.log(`steps`, steps)
    //           DeBug.log(`options`, options)
    //         }
    //         return cornerMap
    //       }
    //       break

    //     case 5: // Single Big Radius Corner
    //     // use Easter Egg processor but add another mode and Random call that selects a single corner for largest radius
    //     // a [max, min, middle, min] radius scenario would match OG prototype shape used for 3D water renders
    //     case 6: // Random radii per corner
    //     // low priority for implementation: this might be too janky!
    //     case 7: // Mix : change mode for each subShape
    //     // this option should probably be outside of the switch?
    //     default:
    //   }

    //   //ARROW: assignQuad() : null : assign cubic verts using radii from cornerMap
    //   const assignQuad = (quad, cornerMap) => cornerMap.forEach((cMap, i) => quad[i].addDistancedStartCornerVerts(cMap))

    //   quads.forEach((quad, i) => {
    //     const cornerMap = processor(quad)
    //     // DeBug.log(`cornerMap`, cornerMap)
    //     assignQuad(quad, cornerMap)

    //     if (quad.every(seg =>
    //       roundToDec(seg.availableStartLength) <= roundToDec(this.cellRadius)
    //       && roundToDec(seg.availableEndLength) <= roundToDec(this.cellRadius)
    //     )) {
    //       // quad.forEach(s => s.flushWrap())
    //       DeBug.log(`NOT using radiant outWrap`)
    //       // this.outWrapOutsideCorners(quad)
    //       // this.recursiveOutWrapOutsideCorners(quad)
    //     } else {
    //       DeBug.log(`using radiant outWrap!!`)
    //       // this.outWrapOutsideCorners(quad)
    //       // this.recursiveOutWrapOutsideCorners(quad, true)
    //     }
    //     DeBug.log(``)
    //     DeBug.log(`    QUAD`, i, quad[0].parentID)
    //   })
    //   // this.recursiveOutWrapOutsideCorners(quads.flat(), true)
    // }

    //MARK: roundQuads()
    //ARROW: roundQuads()
    // const roundQuads = (mode = 0, preserveQuads = true, wrap = true) => {

    //   let testPool = this.allSingleSimpleSubShapes
    //     .map(p => new SegPath(p))
    //     .filter(p => p.isOutsideQuad                        // filter for outside Quad shapes
    //       && !p.hasMinRadii                          // filter out minRadius shapes
    //     )
    //     // .sort((a, b) => a.perimeter - b.perimeter)        // sort largest to smallest
    //     .sort((a, b) => b.perimeter - a.perimeter)        // sort smallest to largest

    //   DeBug.log(`quads`, testPool.map(p => p.shape.id))
    //   // return

    //   testPool.forEach(segPath => {
    //     DeBug.error(`current segPath start`, segPath.path[0].id)
    //     DeBug.log(`current segPath`, segPath.shape.id)
    //     // const segPath = new SegPath(p)
    //     // DeBug.log(`isComplete`, segPath.isComplete)
    //     // DeBug.log(`isQuad`, segPath.isQuad)
    //     // DeBug.log(`isOutsideShape`, segPath.isOutsideShape)
    //     // DeBug.log(`hasLoosies`, segPath.hasLoosies)
    //     // DeBug.log(`perimeter`, segPath.perimeter)
    //     if (preserveQuads && !segPath.hasAllMiddleArcs) { segPath.makeCurves() }
    //     else { DeBug.log(`segPath.hasAllMiddleArcs`) }

    //   })

    //   const changed = testPool.flat()
    //     .map(s => s.outWrappers).flat().compacted
    //   DeBug.warn(`changed`, changed)

    //   //NOTE: using only these two fixes: #431
    //   DeBug.warn(`roundQuads fixIssues()`)
    //   fixBadFlushWraps()
    //   fixLoosies()
    // }

    //MARK: maximizeOuterCorners()
    //FIXME: incomplete and unused!
    //ARROW: maximizeOuterCorners() : null : maximize curve on outer corners that border on the frame
    // const maximizeOuterCorners = (mode = 0, preserveQuads = true, wrap = true) => {
    //   let testPool = Object.values(this.gridCornerSegs)
    //   DeBug.log(`testPool`, testPool)
    //   testPool.forEach(corner => {

    //     if (corner.couldCurveMoreMoreAtEnd) {
    //       if (corner.radiantInWrappers) {
    //         DeBug.warn(`curving radiant:`, corner)
    //         const innerMost = corner.innerMostRadiantWrapper
    //         DeBug.log(`innerMost`, innerMost)
    //         DeBug.log(`innerMost viableRadOutWrappersOriginBounds`, innerMost.viableRadOutWrappersOriginBounds)
    //         DeBug.log(`innerMost viableRadiantOrigins`, innerMost.viableRadiantOrigins)
    //         const maxViable = innerMost.viableRadiantOrigins.last

    //         innerMost.startNeighbor.cubicVerts.end = undefined
    //         innerMost.endNeighbor.cubicVerts.start = undefined
    //         innerMost.replaceEndRadiantOutWrapsOrigin(maxViable)
    //       } else {
    //         DeBug.log(`curving:`, corner)
    //         const maxViable = corner.maxArcOrigin
    //         corner.startNeighbor.cubicVerts.end = undefined
    //         corner.endNeighbor.cubicVerts.start = undefined
    //         corner.replaceEndCurveOrigin(maxViable)
    //       }
    //     }
    //   })
    //   this.completeEnds(defaultPool)
    // }

    //TODO: DELETE WHEN DONE: only kept as ref to safeArrayWhile() and 'changed' implementations
    //ARROW: fixLooseCorners()                                                                          //UNUSED:
    // const fixLooseCorners = (testPool = this.allLooseCorners()) => {
    //   DeBug.warn(`allLooseCorners`, testPool.map(s => s.id))

    //   const conditionFunc = () => { return testPool }
    //   const action = () => {
    //     DeBug.log(``)
    //     DeBug.log(`loosie count`, testPool.length)
    //     let loosie = testPool.pop()
    //     DeBug.log(`loosie in loop`, loosie)

    //     let changed
    //     let flat = roundToDec(loosie.flatAmount, 1)
    //     const localWrap = () => {
    //       loosie.removeEndCornerVerts()
    //       changed = this.createCubicCorners({ subShapes: [loosie], outWrap: true, radiant: true, replace: true })
    //     }
    //     if (loosie.inWrappers) {
    //       const innerMost = loosie.innerMostWrapper
    //       DeBug.log(`attempting outWrap on ${innerMost.id}`)
    //       DeBug.log(`innerMost`, innerMost)
    //       innerMost.removeEndCornerVerts()
    //       changed =
    //         this.createCubicCorners({ subShapes: [innerMost], outWrap: true, radiant: true, replace: true })
    //     } else {
    //       localWrap()
    //     }
    //     loosie.matchEndCorner()
    //     // DeBug.log(`loosie`, loosie)
    //     // DeBug.log(`flat: ${flat}, new flatAmount: ${loosie.flatAmount}`)
    //     // if (loosie.hasLooseCorner) {
    //     //   DeBug.log(`attempting localWrap()`)
    //     //   localWrap()
    //     // }

    //     DeBug.log(`changed loosies`, changed)
    //     this.completeEnds(defaultPool)

    //     testPool = testPool
    //       .union(changed.outside, [`id`])
    //       .union(changed.inside, [`id`])
    //       .unique([`id`])
    //     testPool = this.allLooseCorners(testPool)
    //   }
    //   safeArrayWhile(conditionFunc, action)
    // }
