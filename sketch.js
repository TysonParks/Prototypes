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
let BG, F
// let p1, p2, p3, p4, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16
let R, S

let boxShadowStyle
let container, clone, fpsDisplay, timeDisplay
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
  // redrawAll()

  //TESTING
  createGUI()

  // MARK: grid Test
  const features = calculateFeatures(tokenData)
  // console.log('features', features)
  // gridTests()
  gridTests2()


  // MARK: Test Display
  // displayPalettes()
  // displayHash()
  // fpsDisplay = createDiv('FPS')
  //   .parent(Frame)
  // .center('horizontal')

  // timeDisplay = createDiv('Time')
  //   .parent(Frame)
  // .center('horizontal')

  // setInterval(displayFrameRate, 100)

  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
  // redrawAll()
}

// MARK: DRAWING FUNCS

// FUNC: draw()
function draw() {
  // drawContainer()
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

// FUNC: sizeFrame()
function sizeFrame() {
  const width = min(windowWidth, windowHeight / 2) * 1.1
  const height = width * 1.8
  // const height = 2 * floor(windowHeight / 2)
  // const width = 2 * floor(height / 4)
  frameSize = vert(width, height)
  print(frameSize)
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

// FUNC: setupPrefs()
function setupPrefs() {
  angleMode(DEGREES)
  R = new Random()
  TestMode = true
}

// FUNC: setupStore()
function setupStore() { S = new Store() }

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

  F = new Frame(BG)
}

// FUNC: makePrototype()
function makePrototype(feats) {
  //configure grid
  let grid = new Grid(F, { x: feats.gridX, y: feats.gridY })
  const minCellSize = min(grid.cellSize.x, grid.cellSize.y)
  //configure base
  let baseShader
  if (feats.base === 'None') {
    grid.inset(R.random_num(0.9, 0.95))
  } else {
    grid.inset(R.random_num(0.7, 0.9))
    let baseShadeStack
    if (feats.base === 'additive') {
      baseShadeStack = Shade.neuShadeSVGFactory(
        { mag: R.random_num(0.5, 2), start: .5, pixToUserUnits: F.pixToUserUnits })
    } else {
      baseShadeStack = Shade.neuShadeSVGFactory(
        { mag: grid.gridCellBounds.size.x * 0.5, start: .5, pixToUserUnits: F.pixToUserUnits })
    }
    baseShader = createFilter().dropShadow(baseShadeStack)
    grid.setFilter(baseShader)
  }
  // configure shaders
  let shaders = new OpArray
  let adds, subs
  if (feats.layering.includes('Additive')) { adds = 1 }
  if (feats.layering.includes('Subtractive')) { subs = 1 }
  if (feats.extraGroups !== 'None') {
    const extra = parseInt(feats.extraGroups)
    if (adds > 0 && subs > 0) {
      for (i = 0; i < extra; i++) {
        if (R.random_bool(.5)) { adds += 1 }
        else { subs += 1 }
      }
    }
  }

  // configure grouping methods
  // configure groups
  // configure islands

}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2() {
  // F.inset(.95)
  let gridX = R.random_int(2, 8)
  // gridX = 8
  grid = new Grid(F, { x: gridX, y: gridX * 2 })
  // grid = new Grid(F, { x: 8, y: 14 })
  grid.inset(R.random_num(0.7, 0.95))
  // grid.inset(.8)
  grid.insetCells(R.random_num(0.1, .4))
  // grid.insetCells(.8, 'grp000')

  console.log('Grid:', gridX)

  const minCellSize = min(grid.cellSize.x, grid.cellSize.y)
  console.log('minCellSize', minCellSize)
  //inset: maxShadow <= min(cellSize.x, cellsize.y)
  //outset: maxShadow <= 1-inset * min(cellSize.x, cellsize.y)

  const shadeStack0 = Shade.neuShadeSVGFactory({ mag: -minCellSize * 2, start: .5, pixToUserUnits: F.pixToUserUnits })
  const shader0 = createFilter().dropShadow(shadeStack0)
  console.log('shadeStack0', shadeStack0)

  const shadeStack1 = Shade.neuShadeSVGFactory({ mag: 1, start: .5, pixToUserUnits: F.pixToUserUnits })
  const shader1 = createFilter().dropShadow(shadeStack1)
  // console.log('shadeStack1', shadeStack1)

  const shadeStack2 = Shade.neuShadeSVGFactory({ mag: 8, start: .5, pixToUserUnits: F.pixToUserUnits })
  const shader2 = createFilter().dropShadow(shadeStack2)
  // console.log('shadeStack2', shadeStack2)

  grid.setFilter(shader0)
  console.log(grid.filter)

  grid.randGroup(0.04)
  // grid.randomComb({
  //   keepRange: range(1, 4),
  //   dropRange: range(6, 8),
  //   start: 0
  // })

  // grid.findIslands({
  //   // groupID: 'grp000',
  //   direction: Direction.Cardinal,
  //   taken: true,
  // })

  grid.outlineTaken(Direction.All, false)
  grid.outlineTaken(Direction.Up, false)
  grid.outlineTaken(Direction.All, true)
  // grid.outlineTaken(Direction.All, true)
  // grid.outlineTaken(Direction.Horizontal, true)
  // grid.groupNamed('grp001')?.setFilter(shader2)
  grid.findIslands({
    groupID: 'grp000',
    filter: shader1,
    inset: .9,
    direction: Direction.All,
    taken: true,
  })
  grid.findIslands({
    groupID: 'grp001',
    filter: shader1,
    inset: .9,
    direction: Direction.Cardinal,
    taken: true,
  })
  // grid.findIslands({
  //   groupID: 'grp002',
  //   filter: shader1,
  //   inset: .0001,
  //   direction: Direction.Cardinal,
  //   taken: true,
  // })



  // grid.outlineTaken(Direction.Ordinal)
  // grid.groupNamed('grp002')?.setFilter(shader2)
  grid.findIslands({
    // groupID: 'grp002',
    filter: shader2,
    inset: .9,
    direction: Direction.Cardinal,
    taken: false,
  })

  grid.groupNamed('grp000').setFilter(shader2)
  grid.groupNamed('grp000').inset(0.7)
  // grid.groupNamed('grp001')?.setFilter(shader1)

  console.log('shape0', grid.islands[0].shape)
  console.log('group', grid.groupNamed('grp000'))
  console.log('children', grid.groupNamed('grp000').svgElt?.child())

  // const testShadeCSS = Shade.neuBoxShadFactory()
  // const testShadeSVG = Shade.neuShadeSVGFactory({ pixToUserUnits: F.pixToUserUnits })
  // console.log('testShadeCSS', testShadeCSS)
  // console.log('testShadeSVG', testShadeSVG)
  // console.log('pixToUserUnits', F.pixToUserUnits)
  // console.log('createSlices', createSlices(1, 64, 0.5))
  // console.log('cleanSlices', cleanSlices(1, 30, 0.5))
  // console.log('exponentialSlices', exponentialSlices(0.5, 2.35, 2))

  console.log('Effect0', S.Effects.db[0][1])
  console.log('Effect1', S.Effects.db[1][1])

  console.log('all layers', S.allLayers)
  // console.log('gridBounds', grid.gridCellBounds.cornerCellCenters)
  grid.customizeShapes()
}

// FUNC: gridTests()
function gridTests() {
  let gridX = R.random_int(2, 10)
  gridX = 4
  grid = new Grid({ protoParent: F, gridSize: { x: gridX, y: gridX * 2 } })
  F.inset(0.9)
  grid.inset(0.9)

  let sizer1 = R.random_num(0.1, 1)
  let sizer2 = R.random_num(0.1, 1)
  let funrange = range(0, round(gridX))
  let funrange2 = range(1, round(gridX * 1.2))
  // grid.randomComb({ keepRange: funrange, dropRange: funrange2 })
  // grid.randomComb({ keepRange: range(2, 8), dropRange: range(2, 8) })
  grid.insetCells(sizer1)
  grid.insetCells((1 - sizer1), 'grp000')
  // grid.randomComb({ keepRange: range(1, 2), dropRange: range(1, 10) })
  // grid.insetCells((1 - sizer2), 'grp001')


  // grid.insetCells(sizer1)
  // grid.insetCells((0.6), 'grp000')

  // grid.comb({ keep: 7, drop: 5 })
  // grid.outlineGroup(0)
  grid.randGroup(0.005)
  grid.outlineTaken(Direction.All)
  grid.randGroup(0.025)
  grid.outlineTaken(Direction.Vertical)
  grid.randGroup(0.05)
  // grid.outlineTaken(Direction.Horizontal)
  // grid.randGroup(0.05)
  grid.randGroup(0.15)
  grid.outlineTaken(Direction.Ordinal)

  // grid.randGroup(0.05)
  // grid.outlineTaken()
  // grid.groupAvail()
  // grid.insetCells((sizer2), 'grp002')
  // grid.randomComb()
  // grid.comb({ keep: 4, drop: 1 })
  // grid.randomComb()
  // grid.randomComb()
  // grid.randomComb()


  // print(S.Cells.lastIndex)
  // print(S.Cells.nextIndex)
  // print(grid.cells)
  // print(grid.validNeighbors([grid.cells[0]]))

  // print('all layers:')
  // print(S.allLayers)

  grid.findIslands({
    selection: grid.cells,
    // groupID: 'grp000',
    direction: Direction.Cardinal,
  })

  grid.islands.forEach(e => e.createShape())

  // print(grid.islands[0].shape)
  // print('Frame parentBounds:')
  // print(F.parentBoundsRect)
  // print('Frame bounds:')
  // print(F.boundsRect)
  // print('Frame insetBounds:')
  // print(F.insetBoundsRect)
  // print('Grid bounds:')
  // print(grid.boundsRect)
  // print('Grid insetBounds:')
  // print(grid.insetBoundsRect)

  // print('Isl000 bounds:')
  // print(grid.islands[0].boundsRect)
  // print('Shape bounds:')
  // print(grid.islands[0].shape.boundsRect)

  // print(S.Islands.db[0][1].createShape())
  // print(S.allLayers)
  // print(S.Islands.db[0][1].cells)
  // print(grid.islands)
  // print(grid.islands.map(e => e.cells))
  // print('')
  // print(grid.islands[0].isSingle)
  // print(grid.islands[0].isCardinalSingle)
  // print(grid.islands[0].isHorizontal)
  // print(grid.islands[0].isVertical)
  // print(grid.islands[0].isOrdinal)
  // print(S.Cells.db[0][1].sides)
  // print(S.Islands.db[0][1].exposedSegments)
  // print('start vertNormals call')
  // print(grid.vertNormals({ cellIndex: 9, islandID: grid.cellAt(9).islandID }))
  // print('end vertNormals call')


  // print('all layers:')
  // print(S.allLayers)


  // NOTE: Encoding Process Tests
  print('Encoding Process Tests')
  const selectIsland = grid.islands[0]
  const islandCells = selectIsland.cells
  // print(islandCells)
  // print(grid.cellBounds(islandCells).size)
  // print(grid.cellBounds(islandCells).centroidCell)
  // print(grid.cellBounds(islandCells).centroid)
  // print(grid.cellBounds(islandCells).takenWeight)
  // print(grid.cellBounds(islandCells).isMostlyTaken)
  // print(grid.cellBounds(islandCells).aspect)
  // print(grid.cellBounds(islandCells).centerOfMass)
  // print(grid.rowContains(0, 6))
  // print(grid.columnContains(0, 6))
  // print(grid.rowContaining(islandCells[0].index))
  // print(grid.columnContaining(islandCells[0].index))
  // print(grid.segmentBetween(13, 16))
  // print(grid.segmentBetween(24, 45))
  // print(grid.segmentBetween(18, 3))
  // print('spans')
  // print(grid.spanFrom(0, 7))
  // print(grid.spanFrom(6, 47))

  // let islandCellBounds = grid.cellBounds({ selection: islandCells, islandID: selectIsland.id })
  let islandCellBounds = selectIsland.cellBounds
  // print(islandCellBounds)
  // print(islandCellBounds.selection)
  // print(islandCellBounds.availableCells)
  // print(islandCellBounds.boundsCells)
  print('center of mass:')
  print(islandCellBounds.centerOfMass)
  print('encoder rotation:')
  print(islandCellBounds.encoderRotation)
  print(``)
  // print(islandCellBounds.encoderRotDegrees)
  // print('boundsCells:')
  // print(islandCellBounds.boundsCells)
  // print('boundCellRows:')
  // print(islandCellBounds.boundCellRows)
  // print('encoderCells:')
  // print(islandCellBounds.encoderCells)
  // print('horCellIslands:')
  // print(islandCellBounds.horCellIslands)
  // print('vertCellIslands:')
  // print(islandCellBounds.vertCellIslands)
  // print(`encodingCellCount: ${islandCellBounds.encodingCellCount}`)
  // print('hor EncodingWeight:')
  // print(islandCellBounds.encodingWeight(Direction.Horizontal))
  // print('vert EncodingWeight:')
  // print(islandCellBounds.encodingWeight(Direction.Vertical))

  print(`Encoding costs: ${islandCellBounds.encodingCosts.string}`)
  print(``)
  print(`efficiency: ${islandCellBounds.encodingEfficiency}`)
  print(``)

  print(grid.cellBounds())

  print('')
  print('Class List:')
  print(S.Cells.db[0][1].p5Elt.elt.classList)
  print('')

  // let grid = new Grid(gridParent, { x: 20, y: 20 })
  // let drawnGrid = grid.drawCellsAsDivs()
  // print(BG.elt.position())
  // print(F.anchor)
  // print(grid.cells)
  // print(grid.groups[0].neighborIsInGroup(1, Direction.Right))
  // print(grid.groups[0].exposedSides(5))

  // print(grid.availableCells)
  // print(drawnGrid)

  print('all layers:')
  print(S.allLayers)
  // print(`this:`)
  // print(this)

  // makeTestSVG(grid.islands[0])
}


// FUNC: makeTestSVG()
function makeTestSVG(parent) {
  let testSVG = createSVG(400, 400)
  testSVG
    .parent(parent.p5Elt)
    .html('test0000')
    .position(0, 0)
    .attribute(SVG.viewBox, `0, 0, 400, 400`)
    .id('test0000')
  // .addClass(`testParent`)
  // .attribute(`x`, `0`)
  // .attribute(`y`, `0`)
  // .attribute(SVG.width, `400`)
  // .attribute(SVG.height, `400`)
  // .attribute(SVG.style, `padding : 20`)
  // .attribute(SVG.style, `color : green`)
  // .attribute(SVG.style, `position : 300 100`)
  // .attribute(SVG.fill, `green`)
  testSVG.elt.classList.value = 'someClass otherClass'
  testSVG.elt.classList.add('thisClass')
  testSVG.elt.classList.add('thatClass')

  // print(`testSVG:`)
  // print(testSVG)


  let rectSVG = createSVGElt(`rect`)
  rectSVG
    .attribute('x', '0')
    .attribute('y', '0')
    .attribute('width', '400')
    .attribute('height', '400')
    // .attribute('r', '100')
    .attribute(SVG.fill, '#abc9')
    .parent(testSVG)

  let circleSVG = createSVGElt(`circle`)
  circleSVG
    .attribute('cx', '200')
    .attribute('cy', '200')
    .attribute('r', '100')
    .attribute(SVG.fill, 'red')
    .parent(testSVG)



  print(`testSVG:`)
  print(testSVG)
  // print(testSVG.elt.namespaceURI)
}

// FUNC: drawContainer()
function drawContainer() {
  container
    .size(0.8 * frameSize.x, 1.6 * frameSize.x)
    .style(CS.borderRadius, shapeDef())
    // .style(CS.background, "#492761")
    .style(CS.transform, `skew(${testShapeControls.xSkew}deg, ${testShapeControls.ySkew}deg)`)
    .style(CS.boxShadow, neuBoxShadowFactory(
      globalControls.baseColor,
      globalShadowVector().mult(1),
      globalControls.start,
      globalControls.spread,
      globalControls.inset))
  // .style("will-change", CS.filter)
  // .style(CS.filter, 'blur(4px)')
  // .style('CS.transform', "scaleX(-1)")
}

// FUNC: drawClone()
function drawClone() {
  clone
    .size(0.8 * frameSize.x, 1.6 * frameSize.x)
    .style(CS.borderRadius, shapeDef())
    // .style(CS.background, "#e5000f")
    // .style(CS.transform, `skew(${testShapeControls.xSkew}deg, ${testShapeControls.ySkew}deg)`)
    .style(CS.scale, `${testShapeControls.cloneScale}`)
    .style(CS.boxShadow, neuBoxShadowFactory(
      globalControls.baseColor,
      globalShadowVector(),
      globalControls.start,
      globalControls.spread,
      (globalControls.same ? globalControls.inset : !globalControls.inset)))
  // .style('CS.transform', "scaleX(-1)")
}

// FUNC: drawSquircle()
function drawSquircle(shape, wrapper) {
  let path2 = squirclePath(testSquircleControls.width, testSquircleControls.height, testSquircleControls.curveWidth, testSquircleControls.curveHeight, testSquircleControls.flareMode)

  shape
    .style(CS.backgroundColor, bgCol)
    // .style(CS.background, 'linear-gradient(135deg, #ccc, #fff)')
    .size(testSquircleControls.width, testSquircleControls.height)
    .style(CS.clipPath, path2)
    .style("shape-outside", path2)
    .style("overflow", "visible")

  wrapper
    // .style(CS.backgroundColor, "transparent")
    .style("will-change", CS.filter)
    .style("overflow", "visible")
    .size(testSquircleControls.width, testSquircleControls.height)
    .style(
      CS.filter,
      "drop-shadow(1px 1px 1px #BDBDBD) drop-shadow(-1px -1px 1px #FFFFFF) "
      + "drop-shadow(2px 2px 2px #BDBDBD) drop-shadow(-2px -2px 2px #FFFFFF) "
      + "drop-shadow(4px 4px 4px #BDBDBD) drop-shadow(-4px -4px 4px #FFFFFF) "
      // + "drop-shadow(8px 8px 8px #BDBDBD) drop-shadow(-8px -8px 8px #FFFFFF) "
      // + "drop-shadow(16px 16px 16px #BDBDBD) drop-shadow(-16px -16px 16px #FFFFFF)"
      // + "drop-shadow(32px 32px 32px #BDBDBD) drop-shadow(-32px -32px 32px #FFFFFF)"
      // + "drop-shadow(64px 64px 64px #BDBDBD) drop-shadow(-64px -64px 64px #FFFFFF)"
    )
}

// FUNC: drawCurvedShape()
function drawCurvedShape({ shape, wrapper, drawPoints = false }) {
  // let path = simpleSquare
  let path1 = roundedCornerShape({ shape: testShape5 })
  // let path = squirclePath(400, 200, 0.6, 0)
  let path2 = roundedCornerShape({ shape: testShape5a })
  // path2 = ""
  let path3 = roundedCornerShape({ shape: testShape5b })
  let path4 = roundedCornerShape({ shape: testShape5c })

  let path = `path('${path1} ${path2} ${path3} ${path4}')`
  // path = `path('${path1}')`
  // print(path)

  let points

  if (drawPoints) {
    points = drawPointsAtVerts({
      path: path,
      parent: wrapper,
      size: 5,
      color: '#F07',
      indices: false,
    })
  }

  shape
    .style(CS.backgroundColor, "#AAA")
    // .style(CS.background, 'linear-gradient(135deg, #ccc, #fff)')
    .size(600, 600)
    .style(CS.clipPath, path)
    .style(CS.shapeOutside, path)
    .style("overflow", "visible")
  // .style("outline", 'dashed blue')

  wrapper
    .style("will-change", CS.filter)
    .style("overflow", "visible")
    .size(600, 600)
}

// FUNC: shapeDef()
function shapeDef() {
  return `${cornerDef(testShapeControls.topLeadRadius, testShapeControls.topLeadPercent)} ${cornerDef(testShapeControls.toptTrailRadius, testShapeControls.toptTrailPercent)} ${cornerDef(testShapeControls.botTrailRadius, testShapeControls.botTrailPercent)} ${cornerDef(testShapeControls.botLeadRadius, testShapeControls.botLeadPercent)}`
}

// FUNC: cornerDef()
function cornerDef(value, percent = true) {
  if (percent === true) {
    return `${value}%`
  } else {
    let radius = value / 100 * frameSize.x * 0.8
    return `${radius}px`
  }
}

// FUNC: displayFrameRate()
function displayFrameRate() {
  // let limited = limit(frameRate().toFixed(1))
  fpsDisplay
    .style(CS.padding, '8px')
    .html(`${frameRate().toFixed(1)} fps`)
}

// FUNC: displayTime()
function displayTime() {
  let time = [hour() % 12, minute(), second()]
    .map(e => e.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    }))
  timeDisplay
    .style(CS.padding, '8px')
    .html(`${time[0]}:${time[1]}:${time[2]}`)
}

// FUNC: limit()
function limit(input = "00", interval = 1000) {
  function returnInput() { return input }
  setInterval(returnInput, interval)
}

// FUNC: displayHash()
function displayHash() {
  let hashDisplay = createDiv(tokenData.hash)
    .parent(Frame)
    .center('horizontal')

  let testStyle = GridStyle._2x4.name

  let testEnum = createDiv(testStyle)
    .parent(Frame)
    .style(CS.padding, '0 20px')
}
