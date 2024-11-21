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
let ROT, frameRate
let R, S, RuID // Random, Store, Random UID

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
  // console.groupCollapsed(`setupFeatures`)
  console.group(`setupFeatures`)
  setupFeatures()
  console.log('random R useage', R.useage)
  console.groupEnd()
  gridTests2()
  // areciboMonolith()
  // const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  // createGUI()
  console.log('random R useage', R.useage)
  console.log('random RuID useage', RuID.useage)
}

// FUNC: draw()
// function draw() {
//   // console.log(`drawing`)
//   if (globalControls.animated) {
//     globalAnimation()
//   }
// }

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
  frameRate = 6
  ROT = 10 * PI
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

  minInsetScale
  gridRatio
  gridInsetScale

  constructor() { }
  //METH: 
  mkProtoType() {
    console.log(':::PROTOMILL RUNNING:::')
    this.mkGrid()
    this.mkGroups()
    this.mkShaders()
    this.mkBaseShader()
    console.log('groups', this.groups)
    console.log('all layers', S.allLayers)
  }
  //METH: 
  mkGrid() {
    //TODO: Tidy up path from setting inset multiplier to setting Frame style / cut size
    //TODO: Make Frame style feature that includes "thick", "thin" ???
    const isFlexiblestyle = FTS.gridStyle === `Flexible`
    const x = FTS.x
    // x = 7
    const y = FTS.y
    const gridYMult = y / x
    let gridRatio, ratio
    // globalOutset = 0.
    // globalOutset = FTS.enums.cellOutset.value
    const cellOutset = FTS.enums.cellOutset.value
    let gridInsetTarget = 0.9

    //ARROW: calcFrameWidth() : 
    const calcFrameWidth = () => {
      // console.log(`frameWidth`,)
      const widths = () => {
        console.log(`frameWidth:`, FTS.frameWidth)
        switch (FTS.frameWidth) {
          case `Minimum`:
            return [40]
          case `Small`:
            return [20, 15, 10, 8]
          case `Medium`:
            return [6, 5, 4, 3]
          case `Large`:
            return [2, 1.5, 1.25, 1]
        }
      }
      // const options = widths()
      // console.log(`options`, options)
      return 1 - (1 / R.random_choice(widths()))
    }

    //ARROW: calcRatio(x) : 
    const calcRatio = () => {
      if (x === 1) { ratio = 9 }
      if (x === 2) { ratio = 4.5 }
      if (x === 3) { ratio = 3 }
      if (x > 3) { ratio = 2 }
      if (x > 8) { ratio = 1 }
      if (x > 15) { ratio = 0.5 }
    }

    calcRatio()
    console.log(`x`, x)
    console.log(`ratio`, ratio)

    //ARROW: calcInset(x) : 
    const calcInset = () => {
      if (isFlexiblestyle) {
        const gridCellBoundsSize = vert(x, y)
        const gridBoundsSize = vert(100, 200)
        const initCellSize = Vertex.div(gridBoundsSize, gridCellBoundsSize)
        const initMinCellWidth = min(initCellSize.x, initCellSize.y)
        const cellAspectRatio = initCellSize.x / initCellSize.y
        const outsetCellSize = Vertex.add(vert(cellOutset * initMinCellWidth), initCellSize)
        const initGridSize = Vertex.add(Vertex.mult(Vertex.sub(gridCellBoundsSize, vert(1)), initCellSize), outsetCellSize)

        const normInset = Vertex.div(gridBoundsSize, initGridSize)
        const minNormInset = min(normInset.x, normInset.y)
        const normCellSize = Vertex.mult(initCellSize, minNormInset)
        const minNormCellWidth = min(normCellSize.x, normCellSize.y)
        const normOutsetCellSize = Vertex.add(vert(cellOutset * minNormCellWidth), normCellSize)
        const normGridSize = Vertex.add(Vertex.mult(Vertex.sub(gridCellBoundsSize, vert(1)), normCellSize), normOutsetCellSize)

        const frameWidth = calcFrameWidth()
        const targetWidth = (100 - frameWidth * 100) * 2
        const insetAmount = normOutsetCellSize.x < targetWidth ?
          ceil(targetWidth / normOutsetCellSize.x)
          : 1 / ceil(normOutsetCellSize.x / targetWidth)

        const insetScale = (100 / (100 + normOutsetCellSize.x * insetAmount)) * minNormInset

        // console.log(``)
        // console.log(`initCellSize`, initCellSize)
        // console.log(`initMinCellWidth`, initMinCellWidth)
        // console.log(`cellAspectRatio`, cellAspectRatio)
        // console.log(`outsetCellSize`, outsetCellSize)
        // console.log(`initGridSize`, initGridSize)
        // console.log(``)
        // console.log(`normInset`, normInset)
        // console.log(`minNormInset`, minNormInset)
        // console.log(`normCellSize`, normCellSize)
        // console.log(`minNormCellWidth`, minNormCellWidth)
        // console.log(`normOutsetCellSize`, normOutsetCellSize)
        // console.log(`normGridSize`, normGridSize)
        // console.log(``)
        // console.log(`frameWidth`, frameWidth)
        // console.log(`targetWidth`, targetWidth)
        // console.log(`insetAmount`, insetAmount)
        // console.log(`insetScale`, insetScale)

        return vert(insetScale)
      } else {
        let insetRatio
        insetRatio = ratio / multiplier
        this.gridRatio = 1 / insetRatio
        console.warn(`GRID Ratio: ${this.gridRatio}:1`)
        return (100 - (100 / (x * insetRatio + 1))) / 100
      }

    }


    console.log(`gridYMult`, gridYMult)
    let multiplier = isFlexiblestyle ?
      ((1 / 10) + (cellOutset / (x * 2))) * x * ratio
      : ceil((gridYMult - 2) * (x)) * ratio
    // : ceil((gridYMult - 2) * (x)) * ratio
    // console.log(`ratio`, ratio)
    console.log(`multiplier`, multiplier)
    // this.gridInsetScale = isFlexiblestyle ? (x / (x + ratio / 2)) - (cellOutset / (ratio)) : calcInset(x)
    this.gridInsetScale = calcInset(x)
    console.log(`gridInsetScale`, this.gridInsetScale)

    this.grid = new Grid({
      protoParent: FRAME,
      gridSize: vert(x, y),
      insetScale: this.gridInsetScale,
      gridStyle: FTS.gridStyle,
      cellOutset: cellOutset
    })
    GRID = this.grid
    FRAME.setGrid(GRID)

    console.log('GRID', GRID)
    // const cellSize = Vertex.div(this.insetSize, this.gridSize)
    const minInsetAmount = 1 / GRID.minCellWidth
    this.minInsetScale = 1 - minInsetAmount
    // const maxGlobalOutset = FTS.gridStyle === `Flexible` ? globalOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))
    console.log(`cellOutset`, cellOutset)
    const maxCellOutset = FTS.gridStyle === `Flexible` ? cellOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))

    console.log(`maxCellOutset`, maxCellOutset)
    // cellOutset = min(cellOutset, maxCellOutset)
    this.grid.cellOutset = min(cellOutset, maxCellOutset)
    console.log(`final cellOutset`, cellOutset)
    this.minCellSize = min(this.grid.cellSize.x, this.grid.cellSize.y)
    console.log('Grid Cells', x, y)

  }
  //METH: mkFrame()
  mkFrame() {
    // if(p.last == jIn/rIn/iIn) {inset from outer edge}
    // if (p.first == jIn/rIn/iIn ) {inset from inner edge}
    // if(p.last == rIn){exclude rOut/jIn}
    // if(p.last == jOut){exclude jIn}

    console.warn(`FeatureSet`, FTS)
    console.log(`frameWidth:`, FTS.frameWidth)
    // if ()
    let profiles = new OpArray(+FTS.frameDivs).fill(0)      // create array from frameDivs amount
      .map(u => FTS.enums.frameProfiles.feature(R))         // randomly populate with Profiles from frameProfiles
    console.log(`profiles:`, profiles)
    const profCount = profiles.length
    console.log(`profCount:`, profCount)
    let spacing = FTS.enums.frameSpacing.value              // get frameSpacing value
    console.log(`spacing initial:`, spacing)
    if (spacing === 1 || spacing < profCount) {             // if spacing = 'Whole' then use frameDivs amount
      spacing = profCount
    }
    console.log(`spacing:`, spacing)
    let spaces = range().subRanges(spacing)                 // create subRanges in 0-1 from spacing
    console.log(`spaces:`, spaces)
    const dif = spacing - profCount
    console.log(`dif:`, dif)
    if (dif) {
      // console.log(`there is a dif of:`, dif)
      if (profCount === 1) {
        spaces = [range((R.random_int(1, spacing - 1) / spacing), 1)]
      } else {
        let combines = range(1, spacing - 1).array()
        console.log(`combines`, combines)
        combines = combines
          .randReduce(dif / (spacing - 1))
        console.log(`combines after`, combines)
        let removals = []
        combines.forEach(c => {
          const startIndex = c - 1
          const start = spaces[startIndex]
          const end = spaces[c]
          const replace = range(start.start, end.end)
          spaces[c] = replace
          removals.push(startIndex)
        })
        console.log(`removals`, removals)
        removals.forEach(r => spaces[r] = undefined)
        console.log(`updated spaces:`, spaces)
        spaces = spaces.compacted
      }
    }
    console.log(`spaces after:`, spaces)
    const stairSets = FTS.enums.frameStairs.value           // get frameStairs value
    let stairs
    if (stairSets > 0) {                                    // create stairs [[index,amount]]
      stairs = range(0, profCount - 1).array()        // create index array from profiles
        .randReduce(stairSets / profCount)            // randomly reduce to stairSets amount
        .map(e => [e, R.random_int(2, 8)])                  // randomly add stairCounts
    }

    console.log(`stairSets:`, stairSets)
    console.log(`stairs:`, stairs)

    let cuts = profiles.map((p, i) => {
      const start = spaces[i].start
      const end = spaces[i].end
      let amount = stairs?.find(s => s[0] === i)
      amount = amount?.last || 1
      return {
        profile: p,
        start: start,
        end: end,
        amount: amount
      }
    })
    console.log(`cuts`, cuts)
    return cuts
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
  const mill = new ProtoMill()
  mill.mkGrid()
  const minInsetScale = mill.minInsetScale

  // //                                                                  //NOTE: 1. Calculate GridX
  // let gridX = R.random_int(1, 10)
  // // gridX = R.random_int(10, 20)
  // // gridX = 8
  // //   
  // let gridYMult = 4
  // globalOutset = .5
  // let gridStyle = 0
  // //                                                                  //NOTE: 2. Calculate GridY
  // let gridSize = vert(gridX, ceil(gridX * gridYMult))
  // // gridSize = vert(23, 73)
  // //                                                                  //NOTE: 3. Calculate inset (bezel size)

  // // let insetMultiplier = round((gridYMult - 2) * (gridX) * 4.5)
  // // insetMultiplier = 3
  // let gridRatio, ratio
  // if (gridX === 1) { ratio = 9 }
  // if (gridX === 2) { ratio = 4.5 }
  // if (gridX === 3) { ratio = 3 }
  // if (gridX > 3) { ratio = 2 }
  // if (gridX > 8) { ratio = 1 }
  // if (gridX > 15) { ratio = 0.5 }

  // //ARROW: calcInset()
  // const calcInset = (x) => {
  //   let insetRatio
  //   insetRatio = ratio / insetMultiplier
  //   gridRatio = 1 / insetRatio
  //   console.warn(`GRID Ratio: ${gridRatio}:1`)
  //   return (100 - (100 / (x * insetRatio + 1))) / 100
  // }
  // // let insetMultiplier = gridStyle === 0 ? (1 / 9) * (gridX * ratio) + (2 * globalOutset / gridYMult * ratio) : ceil((gridYMult - 2) * (gridX)) * ratio
  // let insetMultiplier = gridStyle === 0 ? ((1 / 10) + (globalOutset / (gridX * 2))) * gridX * ratio : ceil((gridYMult - 2) * (gridX)) * ratio
  // console.log(`insetMultiplier`, insetMultiplier)
  // // const gridInsetScale = gridStyle === 0 ? (gridX / (gridX + 1)) - (globalOutset / (ratio)) : calcInset(gridX)
  // const gridInsetScale = calcInset(gridX)

  // //                                                                  //NOTE: 4. Create Grid
  // GRID = new Grid({
  //   protoParent: FRAME,
  //   gridSize: gridSize,
  //   insetScale: gridInsetScale,
  //   gridStyle: gridStyle,
  // })

  // //                                                                  //NOTE: 5. Set Grid to Frame
  // FRAME.setGrid(GRID)
  // // GRID = new Grid(FRAME, { x: 10, y: 17 })
  // // let gridInset = R.random_num(0.75, 0.95)

  // // FRAME.setInsetScale(.999)
  // // GRID.setInsetScale(7 / 9)
  // const minInsetAmount = 1 / GRID.minCellWidth
  // const minInsetScale = 1 - minInsetAmount
  // const maxGlobalOutset = gridStyle === 0 ? globalOutset : min(minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))

  // globalOutset = min(globalOutset, maxGlobalOutset)

  // const minCellSWidth = GRID.minCellWidth
  // const minCellSize = min(GRID.cellSize.x, GRID.cellSize.y)
  // console.log('minCellSize', minCellSize)
  // console.log('minCellSWidth', minCellSWidth)
  // console.log(``)

  //                                                                    //NOTE: 6. (Calculate Group Count)   
  //                                                                    //NOTE: 7. Initialize Groups     
  let group0, group1, group2, group3, group4
  //                                                                    //NOTE: 8. Calculate Each Group (Populate Cells) 
  console.groupCollapsed(`Populate Groups`)
  // console.group(`Populate Groups`)
  if (GRID.cellCount === 1) {
    group0 = GRID.groupFromIndices(0)
  } else {
    const initialCoverage = 0.3


    // group0 = GRID.groupFromIndices([0, 2, 10, 13, 16, 24, 26])

    // group0 = GRID.randomComb({
    //   selection: (GRID.cellRows
    //     // .rotated2D(90)
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()),
    //   keepRange: range(1, round(FTS.x / .5)),
    //   dropRange: range(round(FTS.x * .5), FTS.x * 2),
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
    //   dashArray: OpArray.randomIntArray(R.random_int(3, 12), range(1, 9)).map((n, i) => i % 2 === 0 ? R.random_int(1, 3) : n)
    // })

    if (FTS.x < 4) {
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
      group0 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh', rect: false })
    }


    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, directioqn: Direction.All.random(R.random_int(1, 1)), newGroup: false, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(R.random_int(1, 1)), amount: R.random_int(0, 2), newGroup: false })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All, newGroup: false, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 3)), newGroup: false, amount: R.random_int(1, 2) })
    if (!group0) { group0 = GRID.squares({ coverage: 0.25, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' }) }

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(1), newGroup: false, amount: R.random_int(0, 2) })

    const grp1Dir = Direction.All.random(R.random_int(1, 8))
    const grp1Amount = R.random_int(1, 1)
    console.log(`grp1Dir`, grp1Dir.name)
    console.log(`grp1Amount`, grp1Amount)

    console.log(GRID)

    // group1 = GRID.outlineGroup({
    //   groupID: GRID.lastGroup.id,
    //   // direction: Direction.All,
    //   direction: grp1Dir,
    //   newGroup: true,
    //   amount: grp1Amount
    // })

    // group1 = GRID.squares({ coverage: 0.5, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' })

    // group2 = GRID.outlineGroup({
    //   groupID: GRID.lastGroup.id,
    //   direction: Direction.All.random(R.random_int(2, 4)),
    //   newGroup: true,
    //   amount: R.random_int(1, 2)
    // })

    const grp3Amount = R.random_int(1, 3)

    // group3 = GRID.outlineGroup({
    //   groupID: GRID.lastGroup.id,
    //   // direction: Direction.All.random(R.random_int(1, 4)), 
    //   newGroup: true,
    //   amount: grp3Amount
    // })

    // console.log('right adj', Direction.Right.adjacents)
    // console.log('right and adj', Direction.Right.andAdjacents)
    // console.log('right opposite', Direction.Right.opposites)


    // group3 = GRID.randGroup({ amount: 0.25 })
    // group3 = GRID.groupAvail()
    // group3 = GRID.squares({ coverage: .8, direction: Direction.DownRight, minSize: 1, uniform: false, overlapping: 'meh' })


    // group4 = GRID.randGroup({ amount: 0.5 })
    group3 = GRID.groupAvail()

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.UpRight.adjacents, newGroup: false, amount: 2 })
    // console.log(group3)
    // console.log(group4)

  }

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
  console.log(`group1`, group1)
  console.log(`group2`, group2)
  console.log(`group3`, group3)
  console.log(`group4`, group4)
  console.groupEnd()
  console.log(``)

  // globalOutset = 0.
  //                                                                     //NOTE: 9. (Calculate Each Group's Direction)  
  //NOTE: calc per group: possibleOrdinalConnections, current hor/vert islands, etc...
  //                                                                     //NOTE: 10. Create Perimeters for Each Group
  console.groupCollapsed(`createPerimiters`)
  group0?.createPerimiters(Direction.All)
  group1?.createPerimiters(Direction.Cardinal)
  group2?.createPerimiters(Direction.Cardinal)
  group3?.createPerimiters(Direction.Cardinal)
  group4?.createPerimiters(Direction.Cardinal)
  // will need to create check to make sure all groups used
  // console.log(`groups`, GRID.groups)
  console.groupEnd()
  console.log(``)

  console.error(`  ######################   `)
  // console.groupCollapsed(`nestleShapes`)
  console.groupCollapsed(`nestleShapes`)
  //                                                                     //NOTE: 11. Nestle Shapes 
  GRID.nestleShapes(0)
  console.groupEnd()

  console.error(`  ######################   `)
  console.log(``)

  //                                                                     //NOTE: 12. (Calc Each Group's Height)  
  //NOTE: reorder cutIsland calls based on heights in order to optimize shadow layering, avoid more complex layering

  //                                                                     //NOTE: 13. Cut Islands
  console.groupCollapsed(`cutIslands`)
  //MARK: group0
  // group0?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: true,
  //   layerStart: 64 / 64,
  //   // layerEnd: 0 / 48,
  //   dilationStart: 0.,
  //   dilationEnd: 1 / 3,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.All
  //   // addBacking: true,
  // })
  group0?.cutIslands({
    profile: Profile.rOut,
    isOutsetCut: true,
    // layerStart: min(60 / 64, minInsetScale),
    layerStart: minInsetScale,
    // layerEnd: 0.5,
    // dilationStart: 0 / 3,
    // dilationEnd: 2 / 4,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
    // addBacking: true,
  })
  // group0?.cutIslands({
  //   profile: Profile.jIn,
  //   isOutsetCut: true,
  //   layerStart: .25,
  //   layerEnd: 0 / 48,
  //   // dilationStart: 3 / 4,
  //   // dilationEnd: 3 / 3,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.Horizontal
  //   // addBacking: true,
  // })

  // group0?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: true,
  //   layerStart: -8 / 64 - globalOutset,
  //   layerEnd: -16 / 64 - globalOutset,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.None
  //   // addBacking: true,
  // })


  //MARK: group1
  // group1?.cutIslands({
  //   profile: Profile.jOut,
  //   // isOutsetCut: true,
  //   layerStart: 64 / 64,
  //   layerEnd: 32 / 48,
  //   // dilationEnd: 0.5,
  //   amount: 1,
  //   loftScale: 8 / 8,
  //   // direction: Direction.Horizontal,
  //   // addBacking: true,
  // })
  // group1?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: true,
  //   layerStart: 16 / 64,
  //   // layerEnd: 24 / 48,
  //   // dilationEnd: 1,
  //   amount: 1,
  //   loftScale: 8 / 8,
  //   direction: Direction.Vertical,
  //   // addBacking: true,
  // })

  //MARK: group2
  // group2?.cutIslands({
  //   profile: Profile.jOut,
  //   // isOutsetCut: true,
  //   // layerStart: ,
  //   layerStart: minInsetScale,
  //   // layerEnd: 0 / 20,
  //   dilationStart: 0 / 3,
  //   dilationEnd: 1 / 3,
  //   // amount: 6,
  //   loftScale: 1,
  //   // direction: Direction.Horizontal
  //   // addBacking: true,
  // })
  // group2?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: true,
  //   layerStart: minInsetScale,
  //   // layerEnd: 0 / 20,
  //   dilationStart: 1 / 3,
  //   dilationEnd: 5 / 6,
  //   amount: 1,
  //   loftScale: 1,
  //   // direction: Direction.None
  //   // addBacking: true,
  // })
  // group2?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: true,
  //   layerStart: minInsetScale,
  //   // layerEnd: 0 / 20,
  //   dilationStart: 5 / 6,
  //   dilationEnd: 3 / 3,
  //   amount: 1,
  //   loftScale: 1,
  //   direction: Direction.Vertical
  //   // addBacking: true,
  // })

  //MARK: group3
  group3?.cutIslands({
    profile: Profile.rOut,
    // isOutsetCut: true,
    // layerStart: min(60 / 64, minInsetScale),
    layerStart: minInsetScale,
    // layerEnd: 0.,
    amount: 1,
    loftScale: 1,
    // direction: Direction.Horizontal
    // addBacking: true,
  })
  // group3?.cutIslands({
  //   profile: Profile.rOut,
  //   // isOutsetCut: true,
  //   layerStart: 40 / 64,
  //   // layerEnd: 16 / 64,
  //   amount: 1,
  //   loftScale: 1,
  //   // direction: Direction.None
  //   // addBacking: true,
  // })

  //MARK: group4
  group4?.cutIslands({
    profile: Profile.jIn,
    // isOutsetCut: true,
    layerStart: 1,
    // layerStart: minInsetScale,
    // layerEnd: 16 / 64,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.Vertical
  })
  // group4?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: true,
  //   layerStart: 24 / 64,
  //   // layerStart: minInsetScale,
  //   // layerEnd: -8 / 64,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.Horizontal
  // })


  // console.log(`takenCells`, GRID.takenCells.map(c => c.index))
  console.groupEnd()
  console.log(``)
  //                                                                        //NOTE: 14. set backGridGroup
  // console.groupCollapsed(`setBackGridGroup`)
  console.group(`setBackGridGroup`)
  const frameCuts = mill.mkFrame()
  FRAME.setBackGridGroup(R.random_int(0, 0), R.random_bool(1), frameCuts)
  console.groupEnd()
  console.log(``)

  // console.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)
  // FRAME.backGrid.showCellsDebug()
  // FRAME.backGrid.showShapesDebug()
  // FRAME.backGrid.showShapeGroupsDebug(false)
  // GRID.showCellsDebug(false)
  // GRID.showShapesDebug()
  // GRID.showShapeGroupsDebug(false)


  // console.log(`multi-island simpleSubshapes`, GRID.allSimpleSubShapes.flat().map(s => s.parentID))
  // let interCells01 = GRID.perimeterIslands[3]?.interCells
  // console.log(`interCells01`, interCells01?.map(c => c.id))
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
  console.warn(`GRID cells`, FTS.x, FTS.y)
  // console.warn(`GRID cells`, gridSize)
  console.warn(`minInsetScale`, minInsetScale)
  // console.warn(`maxGlobalOutset`, maxGlobalOutset)
  console.warn(`BGRID`, BGRID)
  console.warn(`GRID Ratio: ${mill.gridRatio / 2}:1`)
  console.warn(`gridInsetScale:`, mill.gridInsetScale)
  console.warn(`GRID.insetAmount.x:`, GRID.insetAmount.x)
  console.warn(`GRID size:`, GRID.insetSize)
  console.warn(`Groups OrdinalConnects`, GRID.groups.map(g => g.ordinalConnections))
  // console.error(`cellSpansBetween`, GRID.cellSpanBetween(0, 161))
  console.error(`filters`, S.Effects.db)

  console.warn(`FRAME.backGroup.padding:`, FRAME.backGroup.padding)
  // console.log(GRID.cellRows.flat().map(cell => cell.center))
}

// MARK: DRAWING FUNCS
// FUNC: startAnimationLoop()
function startAnimationLoop() {
  let previousTime = 0
  let desiredFrameRate = frameRate // The frame rate you wish to achieve
  let frameDuration = 1000 / desiredFrameRate

  // ARROW: animate()
  function animate(currentTime) {
    if (globalControls.animated) {
      if (currentTime - previousTime >= frameDuration) {
        globalAnimation() // Call your animation logic

        previousTime = currentTime
      }
      requestAnimationFrame(animate) // Request the next frame
    }
  }

  requestAnimationFrame(animate) // Start the animation loop
}

// FUNC: stopAnimationLoop()
function stopAnimationLoop() {
  globalControls.animated = false
}

// FUNC: globalAnimation()
function globalAnimation() {
  globalControls.shadAngle = (millis() / (1000 * ROT)) * 360 % 360
  const shadeVect = createVector(1, 0).rotate(radians(globalControls.shadAngle))

  S.Effects.db.forEach((filter) => {
    filter = filter[1]
    filter.updateOffsets(shadeVect)
  })

  //create new shadows for every filter
  // update every filter with new shadows
  // updateDisplay for every shapeGroup
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

// FUNC: globalShadowVector()
function globalShadowVector() {
  return Shade.shadVect(globalControls.shadAngle, globalControls.shadMag)
}