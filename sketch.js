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
let BG, FRAME // Background, Frame
let R, S, RuID // Random, Store, Random UID

let boxShadowStyle
// let container, clone, fpsDisplay, timeDisplay
let squircle, squircleWrapper
let curvedShape, curvedShapeWrapper
let GRID

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
  const width = min(windowWidth, windowHeight / 2) * 1.1
  const height = width * 1.8
  // const height = 2 * floor(windowHeight / 2)
  // const width = 2 * floor(height / 4)
  frameSize = vert(width, height)
  console.log('frameSize', frameSize)
}

// FUNC: setupPrefs()
function setupPrefs() {
  angleMode(DEGREES)
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
    this.grid = new Grid(FRAME, { x: FTS.x, y: FTS.y })
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

  let gridX = R.random_int(3, 10)
  // gridX = R.random_int(10, 20)
  // gridX = 2

  GRID = new Grid({
    protoParent: FRAME,
    gridSize: vert(gridX, round(gridX * 2)),
    insetScale: 8 / 9
  })
  // GRID = new Grid(FRAME, { x: 10, y: 17 })
  let gridInset = R.random_num(0.75, 0.95)

  // FRAME.setInsetScale(.999)
  // GRID.setInsetScale(7 / 9)

  const minCellSWidth = GRID.minCellWidth
  const minCellSize = min(GRID.cellSize.x, GRID.cellSize.y)
  console.log('minCellSize', minCellSize)
  console.log('minCellSWidth', minCellSWidth)


  let group0, group1, group2, group3, group4
  // GRID.randGroup({amount:1 / GRID.cellCount})
  // group0 = GRID.randomComb({
  //   selection: (GRID.cellRows
  //     .rotated2D(90)
  //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
  //     .flat()),
  //   keepRange: range(1, gridX / 1),
  //   dropRange: range(gridX * 1, gridX * 2),
  //   start: 0
  // })

  // group0 = GRID.comb({
  //   selection: (GRID.cellRows
  //     .rotated2D(R.random_int(0, 3) * 90)
  //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
  //     .flat()),
  //   keep: R.random_int(1, 4), drop: R.random_int(3, 16), start: 0
  // })
  // GRID.randGroup({amount:0.2})

  // GRID.outlineTaken({ direction: Direction.Right, newGroup: false })
  // GRID.outlineTaken({ direction: Direction.Up, newGroup: false })
  // GRID.outlineTaken({ direction: Direction.All, amount: 1, newGroup: false })


  // GRID.squares({ coverage: 32 / GRID.cellCount, minSize: 1, uniform: false, overlapping: 'never' })
  group0 = GRID.squares({ coverage: 0.3, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' })
  // group0 = GRID.randGroup({ amount: 0.4 })
  // GRID.squares(16 / GRID.cellCount)
  // GRID.squares(0.2)
  // GRID.outlineGroup({ groupID: GRID.lastGroup.id, directioqn: Direction.All.random(R.random_int(1, 4)), newGroup: false, amount: R.random_int(0, 1) })
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

  const grp1Dir = Direction.All.random(R.random_int(1, 8))
  const grp1Amount = R.random_int(1, 2)
  console.log(`grp1Dir`, grp1Dir.name)
  console.log(`grp1Amount`, grp1Amount)

  group1 = GRID.outlineGroup({
    groupID: GRID.lastGroup.id,
    // direction: Direction.All,
    direction: grp1Dir,
    newGroup: true,
    amount: grp1Amount
  })

  // console.log(group1.cells.map(c => c.available))

  group2 = GRID.outlineGroup({
    groupID: GRID.lastGroup.id,
    //  direction: Direction.All.random(R.random_int(1, 4)), 
    newGroup: true,
    amount: R.random_int(1, 1)
  })

  const grp3Dir = R.random_int(1, 2)
  console.log(`grp3Dir`, grp1Dir.name)

  group3 = GRID.outlineGroup({
    groupID: GRID.lastGroup.id,
    // direction: Direction.All.random(R.random_int(1, 4)), 
    newGroup: true,
    amount: grp3Dir
  })
  // console.log('right adj', Direction.Right.adjacents)
  // console.log('right and adj', Direction.Right.andAdjacents)
  // console.log('right opposite', Direction.Right.opposites)

  group4 = GRID.randGroup({ amount: 0.5 })

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

  // group4 = GRID.groupAvail()
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

  let insetScale = R.random_num(0.9, 0.97)
  insetScale = .8

  console.log(`group0`, group0)
  console.log(`group1`, group1)
  console.log(`group2`, group2)
  console.log(`group3`, group3)
  console.log(`group4`, group4)

  group0?.createPerimiters('maxCorners', Direction.Cardinal)
  group1?.createPerimiters('maxCorners', Direction.Cardinal)
  group2?.createPerimiters('maxCorners', Direction.Cardinal)
  group3?.createPerimiters('maxCorners', Direction.Cardinal)
  group4?.createPerimiters('maxCorners', Direction.All)
  // will need to create check to make sure all groups used
  // console.log(`groups`, GRID.groups)

  console.error(`  ######################   `)
  // console.groupCollapsed(`nestleShapes`)
  console.group(`nestleShapes`)
  GRID.nestleShapes(4)
  console.groupEnd()

  console.error(`  ######################   `)
  console.log(``)

  //MARK: group0
  group0?.cutIslands({
    profile: Profile.rOut,
    layerStart: 2.5,
    layerEnd: .75,
    amount: 2,
    loftScale: 1 / 1,
    // direction: Direction.Horizontal
  })

  // group0?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .95,
  //   layerEnd: 1 / 32,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  // })

  // group0?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: 1 / 16,
  //   layerEnd: .00001,
  //   amount: 1,
  //   loftScale: 1 / 1,
  // })

  //MARK: group1
  group1?.cutIslands({
    profile: Profile.jIn,
    layerStart: .9,
    layerEnd: .6,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })

  // group1?.cutIslands({
  //   profile: Profile.rOut,
  //   layerStart: 1.25,
  //   layerEnd: 1,
  //   amount: 1,
  //   loftScale: 4 / 4,
  // })

  // group1?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: 1 / 16,
  //   layerEnd: .00001,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.None,
  // })

  //MARK: group2
  group2?.cutIslands({
    profile: Profile.jIn,
    layerStart: .9,
    layerEnd: .001,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })

  // group2?.cutIslands({
  //   profile: Profile.rOut,
  //   layerStart: .5,
  //   layerEnd: .0001,
  //   amount: 1,
  //   loftScale: 1 / 1,
  // })

  //MARK: group3
  group3?.cutIslands({
    profile: Profile.jIn,
    layerStart: 1,
    layerEnd: .8,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })
  // group3?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .9,
  //   layerEnd: .8,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  // })
  group3?.cutIslands({
    profile: Profile.jIn,
    layerStart: .8,
    layerEnd: .65,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })
  // group3?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .7,
  //   layerEnd: .6,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  // })
  group3?.cutIslands({
    profile: Profile.jIn,
    layerStart: .6,
    layerEnd: .45,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })
  // group3?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .5,
  //   layerEnd: .4,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  // })
  group3?.cutIslands({
    profile: Profile.jIn,
    layerStart: .4,
    layerEnd: .25,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })
  // group3?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .3,
  //   layerEnd: .2,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  // })
  group3?.cutIslands({
    profile: Profile.jIn,
    layerStart: .2,
    layerEnd: .05,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
  })

  // group3?.cutIslands({
  //   profile: Profile.jIn,
  //   layerStart: .1,
  //   layerEnd: .0,
  //   loftScale: 1 / 1,
  //   amount: 1,
  //   // direction: Direction.Horizontal
  // })

  // group3?.cutIslands({
  //   profile: Profile.rOut,
  //   layerStart: 1 / 16,
  //   layerEnd: .00001,
  //   loftScale: 1 / 1,
  //   direction: Direction.None,
  // })

  //MARK: group4
  group4?.cutIslands({
    profile: Profile.rOut,
    layerStart: 1.35,
    layerEnd: .85,
    amount: 1,
    loftScale: 1 / 1,
    direction: Direction.All
  })
  // group4?.cutIslands({
  //   profile: Profile.jOut,
  //   layerStart: 1 / 2,
  //   layerEnd: 1 / 4,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.Horizontal
  // })
  // group4.createSubIslands({
  //   // direction: Direction.All,
  //   filter: shader5,
  //   insetScale: .9,
  // })

  // FRAME.setFilter(shader0)

  // console.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)

  GRID.showCellsDebug()

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

  console.log('all layers', S.allLayers)
  console.log(`GRID`, GRID)
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
  // drawContainer()
  // drawClone()
  // drawSquircle()
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