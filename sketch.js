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
let grid

//Graphics constants
const expSeries = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
const PI = Math.PI

// MARK: setup
// FUNC: setup()
function setup() {
  sizeFrame()
  noCanvas(frameSize.x, frameSize.y)

  // functionTestPrint()

  setupPrefs()
  setupColors()
  setupBackground()
  setupFeatures()
  gridTests2()
  // const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  functionTestPrint()
  createGUI()
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
  backgroundColor = color(0)
  frameColor = protoColor(230)
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
    //TODO: create perimeters/limits using Grid.assignGroupPerimeters()
  }
  //METH:
  setTensions() {
    //TODO: tense, curve, and fit shapes using Grid.customizeShapes()
  }
  //METH:
  setShaders() {
    //TODO: assign shaders and insets using Grid.findIslands()
  }
  //METH:
  mkFinal() { }



}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2() {

  let gridX = R.random_int(4, 20)
  // gridX = 8
  grid = new Grid(FRAME, { x: gridX, y: gridX * 2 })
  // grid = new Grid(FRAME, { x: 8, y: 14 })
  let gridInset = R.random_num(0.75, 0.95)
  // grid.inset(gridInset)

  // grid.insetCells(R.random_num(0.1, .4))
  // grid.insetCells(.8, 'grp000')r

  // console.log('Grid:', gridX)

  const minCellSize = min(grid.cellSize.x, grid.cellSize.y)
  console.log('minCellSize', minCellSize)
  //inset: maxShadow <= min(cellSize.x, cellsize.y)
  //outset: maxShadow <= 1-inset * min(cellSize.x, cellsize.y)

  const shadeStack0 = Shade.neuShadeSVGFactory({ mag: minCellSize * -1.8 * 32 })
  const shader0 = createFilter().dropShadow(shadeStack0)
  // console.log('shadeStack0', shadeStack0)

  const shadeStack1 = Shade.neuShadeSVGFactory({ mag: minCellSize * -0.125 * 4 })
  const shader1 = createFilter().dropShadow(shadeStack1)
  // console.log('shadeStack1', shadeStack1)

  const shadeStack2 = Shade.neuShadeSVGFactory({ mag: minCellSize * 0.125 * 8 })
  const shader2 = createFilter().dropShadow(shadeStack2)
  // console.log('shadeStack2', shadeStack2)

  const shadeStack3 = Shade.neuShadeSVGFactory({ mag: minCellSize * -.2 * 4 })
  const shader3 = createFilter().dropShadow(shadeStack3)

  const shadeStackEmpty = Shade.neuShadeSVGFactory({ mag: -1 })
  const emptyShader = createFilter().dropShadow(shadeStackEmpty)

  // const frameInset = R.random_num(0.02, 0.18)
  FRAME.setInsetScale(.95)
  grid.setInsetScale(.8)
  FRAME.setFilter(shader3)
  // grid.setFilter(shader1)
  console.log('FRAME Filter', FRAME.filter.id)
  console.log('gridFilter', grid.filter.id)

  // grid.randGroup(1 / grid.cellCount)
  grid.randomComb({
    selection: (grid.cellRows
      // .rotated2D(90)
      .flipped2D(Direction.Vertical)
      .flat()),
    keepRange: range(1, gridX / 2),
    dropRange: range(gridX * 2, gridX * 4),
    start: 0
  })

  // grid.comb({
  //   selection: (grid.cellRows
  //     .rotated2D(90)
  //     .flipped2D(Direction.Horizontal)
  //     .flat()),
  //   keep: 2, drop: 7, start: 0
  // })
  // grid.randGroup(0.2)

  // grid.outlineTaken({ direction: Direction.Right, newGroup: false })
  // grid.outlineTaken({ direction: Direction.Up, newGroup: false })
  // grid.outlineTaken({ direction: Direction.All, amount: 1, newGroup: false })

  // grid.randGroup(0.2)
  // grid.squares({ coverage: 32 / grid.cellCount, minSize: 1, uniform: false, overlapping: 'never' })
  // grid.squares({ coverage: 0.3, direction: Direction.DownRight, minSize: 3, uniform: false, overlapping: 'never' })
  // grid.randGroup(0.2)
  // grid.squares(16 / grid.cellCount)
  // grid.squares(0.2)
  // grid.outlineGroup({ groupID: grid.lastGroup.id, directioqn: Direction.Right, newGroup: false, amount: 1 })
  // const outlineDir = Direction.Cardinal.random(2)
  // console.log('outlineDir', outlineDir)
  // const outlineDir2 = new Direction([1, 3])
  // console.log('outlineDir2', outlineDir2)
  grid.outlineGroup({ groupID: grid.lastGroup.id, direction: Direction.All.random(R.random_int(1, 1)), amount: R.random_int(1, 2), newGroup: false })
  grid.outlineGroup({ groupID: grid.lastGroup.id, direction: Direction.All, newGroup: true, amount: R.random_int(1, 3) })
  // const randDir = Direction.All.random(3)
  // console.log('randDirection', randDir)
  grid.outlineGroup({ groupID: grid.lastGroup.id, direction: Direction.All, newGroup: true, amount: R.random_int(1, 2) })

  // grid.randGroup(.5)
  // grid.outlineGroup({ groupID: grid.lastGroup.id, direction: Direction.Horizontal, newGroup: false, amount: 2 })
  // grid.outlineGroup({ groupID: grid.lastGroup.id, diresction: Direction.Down.adjacents, newGroup: false, amount: 4 })

  // console.log('right adj', Direction.Right.adjacents)
  // console.log('right and adj', Direction.Right.andAdjacents)
  // console.log('right opposite', Direction.Right.opposites)
  // grid.randGroup(.3)
  // grid.outlineGroup({ groupID: grid.lastGroup.id, direction: Direction.UpRight.adjacents, newGroup: false, amount: 2 })

  // grid.randGroup(1 / grid.cellCount)
  // grid.outlineTaken({ direction: Direction.All, newGroup: true })
  // grid.outlineTaken({ direction: Direction.Right, newGroup: false })

  // grid.outlineGroup('grp000', Direction.All, false)
  // grid.outline({ groupID: 'grp000', direction: Direction.All, newGroup: true })
  // grid.outlineTaken(Direction.All, 'grp001')

  // grid.outlineTaken(Direction.Down, true)
  // grid.outlineTaken(Direction.All, true)
  // grid.outlineTaken(Direction.Horizontal, true)
  // grid.groupNamed('grp001')?.setFilter(shader2)
  grid.groupAvail()

  // const bounds = grid.cellBounds({ selection: grid.cells })
  // const bounds2 = grid.gridCellBounds
  // console.log('grid bounds 1', bounds)
  // console.log('grid bounds 2', bounds2)
  // console.log('half 1', bounds.half(Direction.Right).flat().map(e => e.id))
  // console.log('half 1', bounds2.half(Direction.Right).flat().map(e => e.id))
  // console.log('half 3', grid.gridCellBounds.half(Direction.Right).flat().map(e => e.id))
  console.log('pre-symmetrized cellRows', grid.cellRows)

  // grid.symmetrize({
  //   direction: Direction.Horizontal,
  //   reflection: true,
  //   // useEmptyuseAssign, 
  //   // useEmpty, 
  //   // groupIDs, 
  // })

  console.log('post-symmetrized cellRows', grid.cellRows)

  let insetScale = R.random_num(0.9, 0.97)
  insetScale = .8

  grid.assignGroupPerimeter('grp000', 'maxCorners', Direction.Cardinal)
  grid.assignGroupPerimeter('grp001', 'minCorners', Direction.Cardinal)
  grid.assignGroupPerimeter('grp002', 'maxCorners', Direction.All)
  console.log(`groups`, grid.groups)

  grid.customizeShapes()

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader1,
  //   insetScale: .95,
  //   // direction: Direction.All,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader2,
  //   insetScale: 1,
  //   // direction: Direction.All,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader2,
  //   insetScale: .3,
  //   direction: Direction.Cardinal,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader2,
  //   insetScale: .5,
  //   direction: Direction.Horizontal,
  //   // taken: true,
  //   // isPerimeter: true,
  // })


  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader2,
  //   insetScale: .75,
  //   direction: Direction.All,
  //   // taken: true,
  //   // isPerimeter: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader2,
  //   insetScale: .25,
  //   // direction: Direction.Cardinal,
  //   // taken: true,
  //   // isPerimeter: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader1,
  //   insetScale: .5,
  //   // direction: Direction.Cardinal,
  //   // taken: true,
  //   // isPerimeter: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader1,
  //   insetScale: .25,
  //   // direction: Direction.Cardinal,
  //   // taken: true,
  //   // isPerimeter: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader1,
  //   insetScale: .0001,
  //   // direction: Direction.Cardinal,
  //   // taken: true,
  //   // isPerimeter: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: 1,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .875,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .75,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .625,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .5,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .375,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .25,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp000',
  //   filter: shader3,
  //   insetScale: .125,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .6,
  //   // direction: Direction.All,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .7,
  //   // direction: Direction.All,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .5,
  //   // direction: Direction.All,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .3,
  //   // direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .1,
  //   // direction: Direction.All,
  //   // taken: true,
  // })

  grid.findIslands({
    groupID: 'grp001',
    filter: shader0,
    insetScale: 1,
    direction: Direction.All,
    // taken: true,
  })

  grid.findIslands({
    groupID: 'grp001',
    filter: shader3,
    insetScale: 1,
    direction: Direction.Horizontal,
    // taken: true,
  })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .25,
  //   // direction: Direction.Cardinal,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader2,
  //   insetScale: .025,
  //   direction: Direction.None,
  //   // taken: true,
  // })

  // grid.findIslands({
  //   groupID: 'grp001',
  //   filter: shader1,
  //   insetScale: .25,
  //   direction: Direction.Cardinal,
  //   // taken: true,
  // })


  // grid.outlineTaken(Direction.Ordinal)
  // grid.groupNamed('grp002')?.setFilter(shader2)

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader0,
  //   insetScale: .95,
  //   // direction: Direction.All,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader1,
  //   insetScale: .25,
  //   // direction: Direction.All,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp003',
  //   filter: shader2,
  //   insetScale: .75,
  //   // direction: Direction.All,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader0,
  //   insetScale: .7,
  //   direction: Direction.Vertical,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader2,
  //   insetScale: .7,
  //   // direction: Direction.All,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader2,
  //   insetScale: .5,
  //   // direction: Direction.All,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader2,
  //   insetScale: .1,
  //   // direction: Direction.None,
  //   // taken: false,
  // })

  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader2,
  //   insetScale: .3,
  //   // direction: Direction.Vertical,
  //   // taken: false,
  // })
  console.log(`cell 0 is in an island`, grid.cellIsInAnIsland(0))
  console.log(`cell 1 is in an island`, grid.cellIsInAnIsland(1))
  console.log(`cell 0 is taken`, grid.cellAt(0).taken)
  console.log(`cell 1 is taken`, grid.cellAt(1).taken)



  // console.log('all layers', S.allLayers)
  // grid.customizeShapes()
  console.log('all layers', S.allLayers)
  console.log(`grid`, grid)
}

// MARK: DRAWING FUNCS
// FUNC: globalAnimation()
function globalAnimation() {
  globalControls.shadAngle = (millis() / (1000 * 8)) * 360 % 360
  // globalControls.shadMag = (millis() / (1000 * 4)) * 64 % 64

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
  print('REDRAW ALL called')
  BG.size(windowWidth, windowHeight)
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