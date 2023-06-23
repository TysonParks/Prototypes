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
let F = {}// Feature Set
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

  //TESTING
  createGUI()
  console.log('random useage', R.useage)
}

// MARK: DRAWING FUNCS

// FUNC: draw()
function draw() {
  if (globalControls.animated) {
    globalAnimation()
  }
}

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
  console.log('F: FeatureSet', F)
  console.log('layers', F.layers)
}

// FUNC: setupColors()
function setupColors() {
  backgroundColor = color(0)
  frameColor = color(240)
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

// FUNC: makePrototype()
// function makePrototype(feats) {
//   //configure grid
//   let grid = new Grid(FRAME, { x: F.x, y: F.y })
//   const minCellSize = min(grid.cellSize.x, grid.cellSize.y)
//   //configure baseLayer
//   let baseShader
//   if (F.baseLayer === 'None') {
//     grid.inset(R.random_num(0.9, 0.95))
//   } else {
//     grid.inset(R.random_num(0.7, 0.9))
//     let baseShadeStack
//     if (F.baseLayer === 'Additive') {
//       baseShadeStack = Shade.neuShadeSVGFactory(
//         { mag: R.random_num(0.5, 2), start: .5, pixToUserUnits: FRAME.pixToUserUnits })
//     } else {
//       baseShadeStack = Shade.neuShadeSVGFactory(
//         { mag: grid.gridCellBounds.size.x * 0.5, start: .5, pixToUserUnits: FRAME.pixToUserUnits })
//     }
//     baseShader = createFilter().dropShadow(baseShadeStack)
//     grid.setFilter(baseShader)
//   }
//   // configure shaders
//   let shaders = new OpArray


//   // configure grouping methods
//   // configure groups
//   // configure islands

// }

class ProtoMill {
  grid
  minCellSize
  baseShader
  shaders

  constructor() { }

  //METH: 
  mkProtoType() {
    this.mkGrid()
    this.mkBaseShader()
    this.mkShaders()
  }
  //METH: 
  mkGrid() {
    this.grid = new Grid(FRAME, { x: F.x, y: F.y })
    this.minCellSize = min(grid.cellSize.x, grid.cellSize.y)
  }
  //METH: 
  mkBaseShader() {
    if (F.baseLayer === 'None') {
      this.grid.inset(R.random_num(0.9, 0.95))
    } else {
      this.grid.inset(R.random_num(0.7, 0.9))
      let baseShadeStack
      if (F.baseLayer === 'Additive') {
        baseShadeStack = Shade.neuShadeSVGFactory(
          { mag: R.random_num(0.5, 2), start: .5, pixToUserUnits: FRAME.pixToUserUnits })
      } else {
        baseShadeStack = Shade.neuShadeSVGFactory(
          { mag: grid.gridCellBounds.size.x * 0.5, start: .5, pixToUserUnits: FRAME.pixToUserUnits })
      }
      this.baseShader = createFilter().dropShadow(baseShadeStack)
      this.grid.setFilter(baseShader)
    }
  }
  //METH:
  mkShaders() {
    let shaders = F.layers.map(l => {
      const inset = 2 * (1 - l.inset)
      const type = (l.type === 'Additive') ? inset : -2 + inset
      const mag = l.loft * type * this.minCellSize
      const stack = Shade.neuShadeSVGFactory({ mag: mag, start: .5, pixToUserUnits: FRAME.pixToUserUnits })
      const shader = createFilter().dropShadow(stack)
      return shader
    })
    this.shaders = shaders
  }
  //METH:
  mkGroups() {

  }

}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2() {
  // FRAME.inset(.95)
  let gridX = R.random_int(2, 10)
  // gridX = 5
  grid = new Grid(FRAME, { x: gridX, y: gridX * 2 })
  // grid = new Grid(FRAME, { x: 8, y: 14 })
  grid.inset(R.random_num(0.95, 0.95))
  // grid.inset(.8)
  grid.insetCells(R.random_num(0.1, .4))
  // grid.insetCells(.8, 'grp000')

  // console.log('Grid:', gridX)

  const minCellSize = min(grid.cellSize.x, grid.cellSize.y)
  // console.log('minCellSize', minCellSize)
  //inset: maxShadow <= min(cellSize.x, cellsize.y)
  //outset: maxShadow <= 1-inset * min(cellSize.x, cellsize.y)

  const shadeStack0 = Shade.neuShadeSVGFactory({ mag: minCellSize * -1.9, start: .5, pixToUserUnits: FRAME.pixToUserUnits })
  const shader0 = createFilter().dropShadow(shadeStack0)
  // console.log('shadeStack0', shadeStack0)

  const shadeStack1 = Shade.neuShadeSVGFactory({ mag: 1, start: .5, pixToUserUnits: FRAME.pixToUserUnits })
  const shader1 = createFilter().dropShadow(shadeStack1)
  // console.log('shadeStack1', shadeStack1)

  const shadeStack2 = Shade.neuShadeSVGFactory({ mag: 8, start: .5, pixToUserUnits: FRAME.pixToUserUnits })
  const shader2 = createFilter().dropShadow(shadeStack2)
  // console.log('shadeStack2', shadeStack2)

  grid.setFilter(shader0)
  // console.log(grid.filter)

  // grid.randGroup(0.05)
  // grid.randomComb({
  //   keepRange: range(1, 4),
  //   dropRange: range(6, 8),
  //   start: 0
  // })

  grid.comb({
    selection: (grid.cellRows
      .rotated2D(90)
      // .flipped2D(Direction.Vertical)
      .flat()),
    keep: 2, drop: 9, start: 0
  })
  grid.randGroup(0.2)

  // grid.findIslands({
  //   // groupID: 'grp000',
  //   direction: Direction.Cardinal,
  //   taken: true,
  // })

  grid.outlineTaken(Direction.All, true)
  // grid.outlineTaken(Direction.All, false)
  // grid.outlineTaken(Direction.All, true)

  // grid.outlineGroup('grp000', Direction.All, false)
  // grid.outline({ groupID: 'grp000', direction: Direction.All, newGroup: true })
  // grid.outlineTaken(Direction.All, 'grp001')

  // grid.outlineTaken(Direction.Down, true)
  // grid.outlineTaken(Direction.All, true)
  // grid.outlineTaken(Direction.Horizontal, true)
  // grid.groupNamed('grp001')?.setFilter(shader2)

  const inset = R.random_num(0.9, 0.99)
  // console.log('inset', inset)

  grid.findIslands({
    groupID: 'grp000',
    filter: shader1,
    inset: inset,
    direction: Direction.All,
    taken: true,
  })

  grid.findIslands({
    groupID: 'grp001',
    filter: shader1,
    inset: inset,
    direction: Direction.Cardinal,
    taken: true,
  })

  grid.findIslands({
    groupID: 'grp002',
    filter: shader1,
    inset: inset,
    direction: Direction.Cardinal,
    taken: true,
  })

  // grid.findIslands({
  //   groupID: 'grp003',
  //   filter: shader1,
  //   inset: inset,
  //   direction: Direction.Cardinal,
  //   taken: true,
  // })



  // grid.outlineTaken(Direction.Ordinal)
  // grid.groupNamed('grp002')?.setFilter(shader2)

  grid.findIslands({
    // groupID: 'grp002',
    filter: shader2,
    inset: inset,
    direction: Direction.Cardinal,
    taken: false,
  })

  grid.groupNamed('grp000').setFilter(shader2)
  grid.groupNamed('grp000').inset(0.7)
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