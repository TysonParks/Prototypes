/*
Prototypes
Bored UI Buttons Club by Tyson Parks, 2021
*/

// MARK:
// MARK: INITIALIZATION
// import { Random } from './artBlocks/Random.js'
// import { Grid } from './ProtoLayerObjects.js'
// import { Direction } from './ProtoUtility.js'
// import { Store } from './ProtoStore.js'
// import { Look, Shade, CS } from './neuMark_I.js'

// MARK: Storage

//Color Constants
let accentHue = 10
let backgroundColor, frameColor, accentColor, acHiCol, acShCol
let bgCol, acCol, hiCol, shCol

//Variables
let TestMode, frameSize
let FTS = {}// Feature Set
let BG, FRAME, BGRID, GRID // Background, Frame, Background Grid, Grid
let R, S, RuID // Random, Store, Random UID
let globalOutset

//Graphics constants
const expSeries = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

// MARK: setup
// FUNC: setup()
function setup() {
  sizeFrame()
  noCanvas(frameSize.x, frameSize.y)

  functionTestPrint()

  setupPrefs()
  setupColors()
  setupBackground()
  console.groupCollapsed(`setupFeatures`)
  setupFeatures()
  console.groupEnd()
  gridTests2()
  // const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  // createGUI()
  console.log('random R useage', R.useage)
  console.log('random RuID useage', RuID.useage)
}

// FUNC: draw()
function draw() {
  if (globalControls.animated) {
    globalAnimation()
  }
}


// MARK: SETUP FUNCS
// FUNC: sizeFrame()
function sizeFrame() {
  let width = min(windowWidth, windowHeight / 2) * 1.1
  let height = width * 1.8

  // width = min(windowWidth, windowHeight / 2) * 1.8
  // height = width * 1.8

  frameSize = vert(width, height)
  console.log('frameSize', frameSize)
}

// FUNC: setupPrefs()
function setupPrefs() {
  // angleMode(DEGREES)
  R = new Random()
  S = new Store()
  RuID = new Random()
  TestMode = true
}

// FUNC: setupFeatures()
function setupFeatures() {
  calculateFeatures(tokenData)
  console.log('FTS: FeatureSet', FTS)
  console.log('layers', FTS.layers)

}

// FUNC: setupColors()
function setupColors() {
  backgroundColor = achromic(0)
  frameColor = achromic(0.9)
  // frameColor = color(`oklch(70% 0.1 49)`)
  accentColor = color("hsb(190, 100%, 90%)")

  acHiCol = color("hsb(190, 20%, 100%)").toString('#rrggbb')
  acShCol = color("hsb(190, 100%, 70%)").toString('#rrggbb')

  bgCol = backgroundColor.toString('#rrggbb')
  acCol = accentColor.toString('#rrggbb')
  hiCol = color(255).toString('#rrggbb')
  shCol = color(210).toString('#rrggbb')
}

// FUNC: setupBackground()
function setupBackground() {
  BG = createDiv().id('BG')
    .size(windowWidth, windowHeight)
    .look(Look.centeredFlex(backgroundColor, 'column'))
  FRAME = new Frame(BG)
}

//CLASS: ProtoMill
// SIZE: 134 lines
class ProtoMill {
  grid
  minCellSize
  baseShader
  shaders
  groups

  constructor() { }
  //METH: 
  mkProtoType() {
    console.log(':::PROTOMILL RUNNING:::')
    this.mkGrid()
    this.mkBaseShader()
    this.mkShaders()
    this.mkGroups()
    console.log('groups', this.groups)
    console.log('all layers', S.allLayers)
  }
  //METH: 
  mkGrid() {

    this.grid = new Grid({
      protoParent: FRAME,
      gridSize: vert(FTS.x, FTS.y),
      insetScale: gridInsetScale,
    })
    this.minCellSize = min(this.grid.cellSize.x, this.grid.cellSize.y)
    console.log('Grid Cells', FTS.x, FTS.y)
  }
  //METH: 
  mkBaseShader() {
    if (FTS.baseLayer === 'None') {
      this.grid.setInsetScale(R.random_num(0.9, 0.96))
    } else {
      FRAME.setInsetScale(FTS.baseLayer.inset)
      this.grid.setInsetScale(FTS.baseLayer.inset)
      // this.grid.setInsetScale(1 - (0.2 - frameInset))

      let mag
      if (FTS.baseLayer.type === 'Additive') {
        const max = min(FRAME.padSize.x, FRAME.padSize.y) * 3
        mag = R.random_num(max / 2, max)
      } else {
        const max = min(this.grid.padSize.x, this.grid.padSize.y) * 3
        mag = -R.random_num(max / 2, max)
      }
      // console.log('base mag', mag)
      const baseShadeStack = Shade.neuShadeSVGFactory({ mag: mag })
      this.baseShader = createFilter().dropShadow(baseShadeStack)
      FRAME.setFilter(this.baseShader)
    }
  }
  //METH:
  mkShaders() {
    let shaders = FTS.layers.map(l => {
      //TODO: INSET MIGRATION: test this
      const insetAmount = 2 * (1 - l.inset)
      //TODO: INSET MIGRATION: test this
      const type = l.type === 'Additive' ? insetAmount : -2 + insetAmount
      const mag = l.loft * type * this.minCellSize
      console.log('layer l.insetScale', l.inset)
      // console.log('layer insetAmount', insetAmount)
      // console.log('layer type', type)
      console.log('layer mag', mag)
      const stack = Shade.neuShadeSVGFactory({ mag: mag })
      const shader = createFilter().dropShadow(stack)
      return shader
    })
    this.shaders = shaders
  }
  //METH:
  mkGroups() {
    const layerCvrg = roundToDec(1 / FTS.weight)
    console.log('density', FTS.density)
    console.log('total weight', FTS.weight)
    console.log('layerWeight', FTS.layerWeight)
    console.log('emptyWeight', FTS.emptyWeight)
    console.log('layerCvrg', layerCvrg)

    let count = FTS.layerWeight
    let full = true
    let emptyCvrg = 0
    if (FTS.density !== 'At Capacity') {
      count = max(2, FTS.layerWeight * 2 - 1)
      full = false
      emptyCvrg = roundToDec(FTS.emptyWeight / FTS.weight * (1 / max(1, (FTS.layerWeight - 1))))
    }
    let cvrg = { empty: emptyCvrg, layer: layerCvrg, total: 0 }
    console.log('emptyCvrg', emptyCvrg)
    console.log('count', count)
    console.log('full', full)
    let groups = []
    for (let i = 1; i <= count; i++) {
      const group = this.mkGroup(i, count, full, cvrg)
      console.log('group', i, group)
      groups.push(group)
    }
    this.groups = groups
  }
  //METH:
  mkGroup(i, count, full, cvrg) {
    let methods
    let coverage = cvrg.layer
    if (i === count) {
      methods = ['groupAvail', FTS.modifierStyle]
      coverage = roundToDec((1 - cvrg.total))
    }
    if (1 < i && i < count) {
      if (!full && i % 2 === 0) {
        methods = ['empty', FTS.modifierStyle]
        coverage = cvrg.empty
      } else { methods = FTS.modifierStyle }
    }
    if (i === 1) { methods = [FTS.seedStyle, FTS.modifierStyle] }
    cvrg.total += coverage



    return { methods: methods, coverage: coverage }
  }
  //METH:
  mkLimits() {
    //TODO: create perimeters/limits using groupXXX.createPerimeters()
  }
  //METH:
  setTensions() {
    //TODO: tense, curve, and fit shapes using Grid.nestleShapes()
    // maybe call this "nestle"? It's nice because it's like nest + cuddle
    // "snuggle" might be more human/relatable
  }
  //METH:
  setShaders() {
    //TODO: assign shaders and insets using groupXXX.createSubIslands()
  }
  //METH:
  mkFinal() { }



}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2() {
  //                                                                  //NOTE: 1. Calculate GridX
  let gridX = R.random_int(1, 10)
  // gridX = R.random_int(10, 20)
  // gridX = 3
  //                                                                  //NOTE: 2. Calculate GridY
  let gridSize = vert(gridX, round(gridX * 2))
  // gridSize = vert(3, 7)
  //                                                                  //NOTE: 3. Calculate inset (bezel size)
  let insetMultiplier = 4
  let gridRatio

  //ARROW: calcInset()
  const calcInset = (x) => {
    let ratio
    if (x === 1) { ratio = 9 }
    if (x === 2) { ratio = 4.5 }
    if (x === 3) { ratio = 3 }
    if (x > 3) { ratio = 2 }
    if (x > 8) { ratio = 1 }
    if (x > 15) { ratio = 0.5 }
    // insetMultiplier = min(gridX + 1, insetMultiplier)
    ratio = ratio / insetMultiplier
    // ratio = 1 / 3
    gridRatio = 1 / ratio
    console.warn(`GRID Ratio: ${gridRatio}:1`)
    return (100 - (100 / (x * ratio + 1))) / 100
  }


  const gridInsetScale = calcInset(gridX)
  //                                                                  //NOTE: 4. Create Grid
  GRID = new Grid({
    protoParent: FRAME,
    gridSize: gridSize,
    insetScale: gridInsetScale,
  })

  //                                                                  //NOTE: 5. Set Grid to Frame
  FRAME.setGrid(GRID)
  // GRID = new Grid(FRAME, { x: 10, y: 17 })
  let gridInset = R.random_num(0.75, 0.95)

  // FRAME.setInsetScale(.999)
  // GRID.setInsetScale(7 / 9)

  const minCellSWidth = GRID.minCellWidth
  const minCellSize = min(GRID.cellSize.x, GRID.cellSize.y)
  console.log('minCellSize', minCellSize)
  console.log('minCellSWidth', minCellSWidth)
  console.log(``)

  //                                                                    //NOTE: 6. (Calculate Group Count)   
  //                                                                    //NOTE: 7. Initialize Groups     
  let group0, group1, group2, group3, group4
  //                                                                    //NOTE: 8. Calculate Each Group (Populate Cells) 
  console.groupCollapsed(`Populate Groups`)
  if (GRID.cellCount === 1) {
    group0 = GRID.groupFromIndices(0)
  } else {
    const initialCoverage = 0.3
    // group0 = GRID.randomComb({
    //   selection: (GRID.cellRows
    //     .rotated2D(90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()),
    //   keepRange: range(1, round(gridX / .5)),
    //   dropRange: range(round(gridX * .5), gridX * 2),
    //   start: 0
    // })

    // group0 = GRID.comb({
    //   selection: (GRID.cellRows
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()),
    //   keep: R.random_int(1, 3), drop: R.random_int(12, 16), start: 0
    // })

    // group0 = GRID.comb2({
    //   selection: (GRID.cellRows
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()),
    //   dashArray: OpArray.randomIntArray(R.random_int(3, 6), range(4, 9)).map((n, i) => i % 2 === 0 ? R.random_int(1, 3) : n)
    // })

    if (gridX < 4) {
      // group0 = GRID.groupFromIndices([1, 2])
      // group0 = GRID.groupFromIndices([1])
      // group1 = GRID.groupFromIndices([1])
      group0 = GRID.groupFromIndices(
        OpArray.randomIntArray(
          ceil((GRID.cellCount - 1) * initialCoverage),
          range(0, GRID.cellCount - 1)
        ).unique()
      )
    } else {
      group0 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' })
    }


    // group1 = GRID.squares({ coverage: 0.3, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' })
    // group1 = GRID.randGroup({ amount: 0.3 })
    // GRID.squares(16 / GRID.cellCount)
    // GRID.squares(0.2)
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, directioqn: Direction.All.random(R.random_int(1, 1)), newGroup: false, amount: R.random_int(1, 1) })
    // const outlineDir = Direction.Cardinal.random(2)
    // console.log('outlineDir', outlineDir)
    // const outlineDir2 = new Direction([1, 3])
    // console.log('outlineDir2', outlineDir2)
    // GRID.randGroup({amount:0.1})
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(R.random_int(1, 1)), amount: R.random_int(0, 2), newGroup: false })
    // GRID.randGroup({ amount: 0.05 })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All, newGroup: false, amount: R.random_int(1, 1) })
    // const randDir = Direction.All.random(3)
    // console.log('randDirection', randDir)
    // group1 = GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 3)), newGroup: true, amount: R.random_int(1, 2) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 3)), newGroup: false, amount: R.random_int(1, 2) })
    if (!group0) { group0 = GRID.squares({ coverage: 0.25, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' }) }

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(1), newGroup: false, amount: R.random_int(0, 2) })

    const grp1Dir = Direction.All.random(R.random_int(1, 8))
    const grp1Amount = R.random_int(1, 1)
    console.log(`grp1Dir`, grp1Dir.name)
    console.log(`grp1Amount`, grp1Amount)

    console.log(GRID)

    group1 = GRID.outlineGroup({
      groupID: GRID.lastGroup.id,
      // direction: Direction.All,
      direction: grp1Dir,
      newGroup: true,
      amount: grp1Amount
    })

    // group1 = GRID.squares({ coverage: 0.5, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' })





    group2 = GRID.outlineGroup({
      groupID: GRID.lastGroup.id,
      //  direction: Direction.All.random(R.random_int(1, 4)), 
      newGroup: true,
      amount: R.random_int(1, 1)
    })

    const grp3Amount = R.random_int(1, 3)


    group3 = GRID.outlineGroup({
      groupID: GRID.lastGroup.id,
      // direction: Direction.All.random(R.random_int(1, 4)), 
      newGroup: true,
      amount: grp3Amount
    })
    // console.log('right adj', Direction.Right.adjacents)
    // console.log('right and adj', Direction.Right.andAdjacents)
    // console.log('right opposite', Direction.Right.opposites)

    // group4 = GRID.randGroup({ amount: 0.75 })
    group4 = GRID.groupAvail()

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.UpRight.adjacents, newGroup: false, amount: 2 })
    // console.log(group3)
    // console.log(group4)

    // GRID.randGroup({ amount: 1 / GRID.cellCount })
    // GRID.outlineTaken({ direction: Direction.All, newGroup: true })
    // GRID.outlineTaken({ direction: Direction.Right, newGroup: false })

    // GRID.outlineGroup('grp000', Direction.All, false)
    // GRID.outline({ groupID: 'grp000', direction: Direction.All, newGroup: true })
    // GRID.outlineTaken(Direction.All, 'grp001')

    // GRID.outlineTaken(Direction.Down, true)
    // GRID.outlineTaken(Direction.All, true)
    // GRID.outlineTaken(Direction.Horizontal, true)
    // GRID.groupNamed('grp001')?.setFilter(shader2)
  }


  // group1 = GRID.groupAvail() // will need to create check to make sure something is available at end and all groups are used. I suppose group instance array will be compacted before a forEach run

  //MARK: SYMMETRY
  // console.log('pre-symmetrized cellRows', GRID.cellRows)
  // GRID.symmetrize({
  //   direction: Direction.Cardinal,
  //   reflection: true,
  //   // useEmptyuseAssign, 
  //   // useEmpty, 
  //   // groupIDs, 
  // })
  // console.log('post-symmetrized cellRows', GRID.cellRows)

  // let insetScale = R.random_num(0.9, 0.97)
  // insetScale = .8

  console.log(`group0`, group0)
  // console.log(`group0 cells`, group0.cells.map(c => c.id))
  console.log(`group1`, group1)
  console.log(`group2`, group2)
  console.log(`group3`, group3)
  console.log(`group4`, group4)
  console.groupEnd()
  console.log(``)

  globalOutset = .5
  //                                                                     //NOTE: 9. (Calculate Each Group's Direction)  
  //NOTE: calc per group: possibleOrdinalConnections, current hor/vert islands, etc...
  //                                                                     //NOTE: 10. Create Perimeters for Each Group
  console.groupCollapsed(`createPerimiters`)
  group0?.createPerimiters('maxCorners', Direction.Cardinal)
  group1?.createPerimiters('maxCorners', Direction.Cardinal)
  group2?.createPerimiters('maxCorners', Direction.Cardinal)
  group3?.createPerimiters('maxCorners', Direction.Cardinal)
  group4?.createPerimiters('maxCorners', Direction.Cardinal)
  // will need to create check to make sure all groups used
  // console.log(`groups`, GRID.groups)
  console.groupEnd()
  console.log(``)

  console.error(`  ######################   `)
  // console.groupCollapsed(`nestleShapes`)
  console.groupCollapsed(`nestleShapes`)
  //                                                                     //NOTE: 11. Nestle Shapes 
  GRID.nestleShapes(4)
  console.groupEnd()

  console.error(`  ######################   `)
  console.log(``)

  //                                                                     //NOTE: 12. (Calc Each Group's Height)  
  //NOTE: reorder cutIsland calls based on heights in order to optimize shadow layering, avoid more complex layering

  //                                                                     //NOTE: 13. Cut Islands
  console.groupCollapsed(`cutIslands`)
  //MARK: group0
  group0?.cutIslands({
    profile: Profile.rOut,
    // isOutsetCut: true,
    layerStart: .9,
    // layerEnd: -.1,
    amount: 1,
    loftScale: 1,
    // direction: Direction.All
    // backing: true,

  })
  // group0?.cutIslands({
  //   profile: Profile.rIn,
  //   layerStart: -.5,
  //   layerEnd: -1,
  //   amount: 1,
  //   loftScale: 1,
  //   // direction: Direction.All
  //   // backing: true,

  // })

  //MARK: group1
  group1?.cutIslands({
    profile: Profile.rOut,
    isOutsetCut: true,
    // layerStart: 0,
    layerEnd: .9,
    // dilationEnd: 1,
    amount: 1,
    loftScale: 1,
    // direction: Direction.Horizontal,
    // backing: true,

  })


  //MARK: group2
  group2?.cutIslands({
    profile: Profile.jIn,
    // isOutsetCut: true,
    layerStart: 0,
    layerEnd: .9,
    amount: 1,
    loftScale: 1,
    // direction: Direction.Horizontal
    // backing: true,
  })


  //MARK: group3
  group3?.cutIslands({
    profile: Profile.rOut,
    // isOutsetCut: true,
    layerStart: .9,
    layerEnd: .0,
    amount: 1,
    loftScale: 1,
    // direction: Direction.All
    // backing: true,
  })
  // group3?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .9,
  //   // layerEnd: .0,
  //   amount: .1,
  //   loftScale: 1,
  //   // direction: Direction.All
  //   backing: true,
  // })

  //MARK: group4
  group4?.cutIslands({
    profile: Profile.jIn,
    // isOutsetCut: true,
    layerStart: .9,
    // layerEnd: .9,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })
  // group4?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: 3,
  //   // layerEnd: .9,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  //   backing: true,
  // })
  // group4?.cutIslands({
  //   profile: Profile.rIn,
  //   layerStart: 1,
  //   layerEnd: 1,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  //   backing: true,
  // })

  // console.log(`takenCells`, GRID.takenCells.map(c => c.index))
  console.groupEnd()
  console.log(``)
  //                                                                        //NOTE: 14. set backGridGroup
  console.groupCollapsed(`setBackGridGroup`)
  FRAME.setBackGridGroup()
  console.groupEnd()
  console.log(``)

  // console.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)
  // FRAME.backGrid.showCellsDebug()
  // FRAME.backGrid.showShapesDebug()
  // GRID.showCellsDebug()
  // GRID.showShapesDebug()

  // console.log(`multi-island simpleSubshapes`, GRID.allSimpleSubShapes.flat().map(s => s.parentID))
  let interCells01 = GRID.perimeterIslands[3]?.interCells
  console.log(`interCells01`, interCells01?.map(c => c.id))
  // console.log(`GRID.islands`, GRID.islands)
  // console.log(`are squares?`, GRID.islands.map(i => i.isSquare))
  // console.log(`are roundedSquares?`, GRID.islands.map(i => i.shape.isRoundedSquare))
  // console.log(`are circles?`, GRID.islands.map(i => i.shape.isCircle))
  // console.log(`are leaves?`, GRID.islands.map(i => i.shape.isLeaf))
  // console.log(`are square leaves?`, GRID.islands.map(i => i.shape.isSquareLeaf))
  // console.log(`maxSquareLeafLoftRadius?`, GRID.islands.map(i => i.shape.maxSquareLeafLoftRadius))
  // console.log(`start cell?`, GRID.islands.map(i => i.cells[0].id))

  // let testShape = GRID.shapeNamed('shp057')
  // console.log(`testShape.simpleSubShapes`, testShape.simpleSubShapes)
  // let subs = testShape.simpleSubShapes.flat()
  // console.log(`subs does not hasBothCubicVerts`, subs.filter(s => !s.hasBothCubicVerts))
  // console.log(`subs does not hasBothCompleteCorners`, subs.filter(s => !s.hasBothCompleteCorners))
  // console.log(`subs hasFlatness`, subs.filter(s => s.hasFlatness).map(s => s.id))
  // console.log(`subs canCurveMoreAtEnd`, subs.filter(s => s.canCurveMoreAtEnd).map(s => s.id))
  // globalAnimation()

  // GRID.maxCuddle()

  console.log(`  ######################   `)
  console.log(`Features`, FTS)
  console.log('all layers', S.allLayers)
  console.log(`GRID`, GRID)
  console.warn(`cellSize`, GRID.cellSize)
  console.warn(`GRID cells`, gridSize)
  console.warn(`GRID Ratio: ${gridRatio / 2}:1`)
  console.warn(`gridInsetScale:`, gridInsetScale)
  console.warn(`GRID.insetAmount.x:`, GRID.insetAmount.x)
  console.warn(`GRID size:`, GRID.insetSize)
  console.warn(`Groups OrdinalConnects`, GRID.groups.map(g => g.ordinalConnections))

  console.warn(`FRAME.backGroup.padding:`, FRAME.backGroup.padding)
  // console.log(GRID.cellRows.flat().map(cell => cell.center))
}

// MARK: DRAWING FUNCS
// FUNC: globalAnimation()
function globalAnimation() {
  globalControls.shadAngle = (millis() / (1000 * 8)) * 360 % 360
  //create new shadows for every filter
  // update every filter with new shadows
  // updateDisplay for every shapeGroup

  // displayTime()
  drawObjects()
}

// FUNC: drawObjects()
function drawObjects() {
  redrawAll()
}

// MARK: GLOBAL FUNCS

// FUNC: windowResized()
function windowResized() {
  sizeFrame()
  BG.size(windowWidth, windowHeight)
  redrawAll()
}

// FUNC: redrawAll()
function redrawAll() {
  // print('REDRAW ALL called')
  // BG.size(windowWidth, windowHeight)
  S.ShapeGroups.db.forEach(sg => sg[1].updateDisplay())
  // S.allLayers.forEach(e => e.resize())
}

// FUNC: wix() : returns pixel value of a wixel count
// NOTE: 'wixel' is the fundamental measure unit of Prototypes, its the percent of frameSize.x
// NOTE: i.e. every Prototype is 100 wixels wide x 200 wixels high
// NOTE: 0.5 wix should be minimum Element size (~3px on 4K Landscape, ~6px on iphone Portrait)
function wix(count) { return count / 100 * frameSize.x }
function wixPx(count) { return `${wix(count)}px` }

// FUNC: globalShadowVector()
function globalShadowVector() {
  return Shade.shadVect(globalControls.shadAngle, globalControls.shadMag)
}