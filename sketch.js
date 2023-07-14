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
let R, S // Random, Store 

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

  functionTestPrint()

  setupPrefs()
  setupStore()
  setupColors()
  setupBackground()
  setupFeatures()
  gridTests2()
  const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  createGUI()
  console.log('random useage', R.useage)
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
  TestMode = true
}

// FUNC: setupStore()
function setupStore() { S = new Store() }

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
    this.mkGrid()
    this.mkBaseShader()
    this.mkShaders()
    this.mkGroups()
    console.log('groups', this.groups)
  }
  //METH: 
  mkGrid() {
    this.grid = new Grid(FRAME, { x: FTS.x, y: FTS.y })
    this.minCellSize = min(this.grid.cellSize.x, this.grid.cellSize.y)
  }
  //METH: 
  mkBaseShader() {
    if (FTS.baseLayer === 'None') {
      //TODO: INSET MIGRATION: test this
      this.grid.setInsetScale(R.random_num(0.9, 0.95))
    } else {
      //TODO: INSET MIGRATION: Will need to reconsider this whole block
      const frameInset = R.random_num(0.02, 0.18)
      this.grid.setInsetScale(1 - frameInset)

      let baseShadeStack
      if (FTS.baseLayer === 'Additive') {
        baseShadeStack = Shade.neuShadeSVGFactory({ mag: R.random_num(0.5, 2) })
      } else {
        baseShadeStack = Shade.neuShadeSVGFactory({ mag: this.grid.gridCellBounds.size.x * 0.5 })
      }
      this.baseShader = createFilter().dropShadow(baseShadeStack)
      this.grid.setFilter(this.baseShader)
    }
  }
  //METH:
  mkShaders() {
    let shaders = FTS.layers.map(l => {
      //TODO: INSET MIGRATION: test this
      const insetAmount = 2 * (1 - l.insetScale)
      //TODO: INSET MIGRATION: test this
      const type = l.type === 'Additive' ? insetAmount : -2 + insetAmount
      const mag = l.loft * type * this.minCellSize
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
  assignShaders() { }
  //METH:
  mkFinal() { }



}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2() {

  let gridX = R.random_int(2, 10)
  // gridX = 6
  grid = new Grid(FRAME, { x: gridX, y: gridX * 2 })
  // grid = new Grid(FRAME, { x: 8, y: 14 })
  let gridInset = R.random_num(0.75, 0.95)
  // grid.inset(gridInset)

  // grid.insetCells(R.random_num(0.1, .4))
  // grid.insetCells(.8, 'grp000')

  // console.log('Grid:', gridX)

  const minCellSize = min(grid.cellSize.x, grid.cellSize.y)
  // console.log('minCellSize', minCellSize)
  //inset: maxShadow <= min(cellSize.x, cellsize.y)
  //outset: maxShadow <= 1-inset * min(cellSize.x, cellsize.y)

  const shadeStack0 = Shade.neuShadeSVGFactory({ mag: minCellSize * -2 })
  const shader0 = createFilter().dropShadow(shadeStack0)
  // console.log('shadeStack0', shadeStack0)

  const shadeStack1 = Shade.neuShadeSVGFactory({ mag: minCellSize * -1 })
  const shader1 = createFilter().dropShadow(shadeStack1)
  // console.log('shadeStack1', shadeStack1)

  const shadeStack2 = Shade.neuShadeSVGFactory({ mag: minCellSize * 0.4 })
  const shader2 = createFilter().dropShadow(shadeStack2)
  // console.log('shadeStack2', shadeStack2)

  // const frameInset = R.random_num(0.02, 0.18)
  FRAME.setInsetScale(.9)
  grid.setInsetScale(.9)
  FRAME.setFilter(shader1)
  // grid.setFilter(shader1)
  console.log('FRAME Filter', FRAME.filter.id)
  console.log('gridFilter', grid.filter.id)

  grid.randGroup(4 / grid.cellCount)
  // grid.randomComb({
  //   selection: (grid.cellRows
  //     // .rotated2D(90)
  //     .flipped2D(Direction.Vertical)
  //     .flat()),
  //   keepRange: range(1, gridX / 2),
  //   dropRange: range(gridX * 2, gridX * 4),
  //   start: 0
  // })

  // grid.comb({
  //   selection: (grid.cellRows
  //     .rotated2D(90)
  //     .flipped2D(Direction.Horizontal)
  //     .flat()),
  //   keep: 2, drop: 8, start: 0
  // })
  // grid.randGroup(0.2)

  // grid.findIslands({
  //   // groupID: 'grp000',
  //   direction: Direction.Cardinal,
  //   taken: true,
  // })

  grid.outlineTaken(Direction.Right, false)
  // grid.outlineTaken(Direction.Up, true)
  grid.outlineTaken(Direction.Up, false)
  // grid.outlineTaken(Direction.All, true)
  grid.randGroup(4 / grid.cellCount)
  grid.outlineGroup(grid.lastGroup.id, Direction.All, false)
  grid.outlineTaken(Direction.All, true)
  grid.outlineTaken(Direction.Right, false)

  // grid.outlineGroup('grp000', Direction.All, false)
  // grid.outline({ groupID: 'grp000', direction: Direction.All, newGroup: true })
  // grid.outlineTaken(Direction.All, 'grp001')

  // grid.outlineTaken(Direction.Down, true)
  // grid.outlineTaken(Direction.All, true)
  // grid.outlineTaken(Direction.Horizontal, true)
  // grid.groupNamed('grp001')?.setFilter(shader2)

  let insetScale = R.random_num(0.9, 0.97)
  insetScale = .9
  // console.log('insetScale', insetScale)

  grid.findIslands({
    groupID: 'grp001',
    filter: shader2,
    insetScale: insetScale,
    // direction: Direction.All,
    // taken: true,
  })

  grid.findIslands({
    groupID: 'grp002',
    filter: shader0,
    insetScale: insetScale,
    // direction: Direction.All,
    // taken: true,
  })

  grid.findIslands({
    groupID: 'grp000',
    filter: shader1,
    insetScale: insetScale,
    direction: Direction.All,
    // taken: true,
  })

  // grid.findIslands({
  //   groupID: 'grp003',
  //   filter: shader1,
  //   insetScale: insetScale,
  //   direction: Direction.Cardinal,
  //   taken: true,
  // })



  // grid.outlineTaken(Direction.Ordinal)
  // grid.groupNamed('grp002')?.setFilter(shader2)

  // grid.findIslands({
  //   // groupID: 'grp002',
  //   filter: shader2,
  //   insetScale: insetScale,
  //   direction: Direction.All,
  //   taken: false,
  // })

  // grid.groupNamed('grp000').setFilter(shader2)
  // grid.groupNamed('grp000').inset(0.7)
  // grid.groupNamed('grp001')?.setFilter(shader1)

  // console.log('shape0', grid.islands[0].shape)
  // console.log('group', grid.groupNamed('grp000'))
  // console.log('children', grid.groupNamed('grp000').svgElt?.child())

  // const testShadeCSS = Shade.neuBoxShadFactory()
  // const testShadeSVG = Shade.neuShadeSVGFactory({ pixToUserUnits: FRAME.pixToUserUnits })
  // console.log('testShadeCSS', testShadeCSS)
  // console.log('testShadeSVG', testShadeSVG)
  // console.log('pixToUserUnits', FRAME.pixToUserUnits)
  // console.log('createSlices', createSlices(1, 64, 0.5))
  // console.log('cleanSlices', cleanSlices(1, 30, 0.5))
  // console.log('exponentialSlices', exponentialSlices(0.5, 2.35, 2))

  // console.log('Effect0', S.Effects.db[0][1])
  // console.log('Effect1', S.Effects.db[1][1])

  console.log('all layers', S.allLayers)
  // console.log('gridBounds', grid.gridCellBounds.cornerCellCenters)
  grid.customizeShapes()
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