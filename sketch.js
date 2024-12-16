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
  // DeBug.groupCollapsed(`setupFeatures`)
  DeBug.group(`setupFeatures`)
  setupFeatures()
  DeBug.log('random R useage', R.useage)
  DeBug.groupEnd()
  gridTests2()
  // areciboMonolith()
  // const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  // createGUI()
  DeBug.log('random R useage', R.useage)
  DeBug.log('random RuID useage', RuID.useage)
}

// FUNC: draw()
// function draw() {
//   // DeBug.log(`drawing`)
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
  DeBug.log('frameSize', frameSize)
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
  DeBug.log('FTS: FeatureSet', FTS)
  DeBug.log('groups', FTS.groups)
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
    DeBug.log(':::PROTOMILL RUNNING:::')
    this.mkGrid()
    this.mkGroups()
    this.mkShaders()
    this.mkBaseShader()
    DeBug.log('groups', this.groups)
    DeBug.log('all ProtoLayers', S.allLayers)
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
      // DeBug.log(`frameWidth`,)
      const widths = () => {
        DeBug.log(`frameWidth:`, FTS.frameWidth)
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
      // DeBug.log(`options`, options)
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
    DeBug.log(`x`, x)
    DeBug.log(`ratio`, ratio)

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

        // DeBug.log(``)
        // DeBug.log(`initCellSize`, initCellSize)
        // DeBug.log(`initMinCellWidth`, initMinCellWidth)
        // DeBug.log(`cellAspectRatio`, cellAspectRatio)
        // DeBug.log(`outsetCellSize`, outsetCellSize)
        // DeBug.log(`initGridSize`, initGridSize)
        // DeBug.log(``)
        // DeBug.log(`normInset`, normInset)
        // DeBug.log(`minNormInset`, minNormInset)
        // DeBug.log(`normCellSize`, normCellSize)
        // DeBug.log(`minNormCellWidth`, minNormCellWidth)
        // DeBug.log(`normOutsetCellSize`, normOutsetCellSize)
        // DeBug.log(`normGridSize`, normGridSize)
        // DeBug.log(``)
        // DeBug.log(`frameWidth`, frameWidth)
        // DeBug.log(`targetWidth`, targetWidth)
        // DeBug.log(`insetAmount`, insetAmount)
        // DeBug.log(`insetScale`, insetScale)

        return vert(insetScale)
      } else {
        let insetRatio
        insetRatio = ratio / multiplier
        this.gridRatio = 1 / insetRatio
        DeBug.warn(`GRID Ratio: ${this.gridRatio}:1`)
        return (100 - (100 / (x * insetRatio + 1))) / 100
      }

    }


    DeBug.log(`gridYMult`, gridYMult)
    let multiplier = isFlexiblestyle ?
      ((1 / 10) + (cellOutset / (x * 2))) * x * ratio
      : ceil((gridYMult - 2) * (x)) * ratio
    // : ceil((gridYMult - 2) * (x)) * ratio
    // DeBug.log(`ratio`, ratio)
    DeBug.log(`multiplier`, multiplier)
    // this.gridInsetScale = isFlexiblestyle ? (x / (x + ratio / 2)) - (cellOutset / (ratio)) : calcInset(x)
    this.gridInsetScale = calcInset(x)
    DeBug.log(`gridInsetScale`, this.gridInsetScale)

    this.grid = new Grid({
      protoParent: FRAME,
      gridSize: vert(x, y),
      insetScale: this.gridInsetScale,
      gridStyle: FTS.gridStyle,
      cellOutset: cellOutset
    })
    GRID = this.grid
    FRAME.setGrid(GRID)

    DeBug.log('GRID', GRID)
    // const cellSize = Vertex.div(this.insetSize, this.gridSize)
    const minInsetAmount = 1 / GRID.minCellWidth
    this.minInsetScale = 1 - minInsetAmount
    // const maxGlobalOutset = FTS.gridStyle === `Flexible` ? globalOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))
    DeBug.log(`cellOutset`, cellOutset)
    const maxCellOutset = FTS.gridStyle === `Flexible` ? cellOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))

    DeBug.log(`maxCellOutset`, maxCellOutset)
    // cellOutset = min(cellOutset, maxCellOutset)
    this.grid.cellOutset = min(cellOutset, maxCellOutset)
    DeBug.log(`final cellOutset`, cellOutset)
    this.minCellSize = min(this.grid.cellSize.x, this.grid.cellSize.y)
    DeBug.log('Grid Cells', x, y)

  }
  //METH: mkFrame()
  mkFrame() {
    // FRAME ONLY
    // if(p.last == jIn/rIn)      { inset or torus outer edge }
    // if(p.last == iIn)     { convert to iOut }
    // if (p.first == iIn/rIn/ )  { inset or jIn inner edge OR FIX FRAME shadows}
    // ALL USES
    // if(iOut->iIn, iOut->jIn)   { inset or torus between }
    // if(iOut->rOut)             { BAN or inset between or combine shadows }   // 
    // if(jOut->iIn, jOut->jIn)   { inset or torus between }
    // if(jOut->rOut)             { BAN or inset between or blur to make sOut } // cyma reversa
    // if(rIn->iIn)               { BAN or inset between or combine shadows }   // 
    // if(rIn->jIn)               { BAN or inset between or blur to make sIn }  // cyma reversa
    // if(rIn->rOut)              { inset or scoop between }



    DeBug.warn(`FeatureSet`, FTS)
    DeBug.log(`frameWidth:`, FTS.frameWidth)
    const widthVal = FTS.enums.frameWidth.value

    //ARROW: randInset
    const randInset = (minDenom = 3, maxDenom = widthVal * 4) => {
      const inset = 1 - 1 / max(ceil(R.random_num(minDenom, maxDenom)), 2)
      DeBug.log(`new randInset`, inset)
      return inset

    }

    // profiles
    let profiles = new OpArray(+FTS.frameDivs).fill(0)      // create array from frameDivs amount
      .map((u, i, a) => {
        if (i === a.lastIndex) { FTS.enums.frameProfiles.removeOptions([`iIn`, `iOut`, `Flat`]) }
        return FTS.enums.frameProfiles.feature(R)
      })         // randomly populate with Profiles from frameProfiles
    DeBug.log(`profiles:`, profiles)
    const profCount = profiles.length
    DeBug.log(`profCount:`, profCount)

    //spacing
    let spacing = FTS.enums.frameSpacing.value              // get frameSpacing value
    DeBug.log(`spacing initial:`, spacing)
    if (spacing === 1 || spacing < profCount) {             // if spacing = 'Whole' then use frameDivs amount
      spacing = profCount
    }
    DeBug.log(`spacing:`, spacing)
    let spaces = range().subRanges(spacing)                 // create subRanges in 0-1 from spacing
    DeBug.log(`spaces:`, spaces)

    //dif
    const dif = spacing - profCount
    DeBug.log(`dif:`, dif)
    if (dif) {
      DeBug.log(`there is a dif of:`, dif)
      if (profCount === 1) {
        spaces = [range((R.random_int(1, spacing - 1) / spacing), 1)]
      } else {
        let combines = range(1, spacing - 1).array()
        DeBug.log(`combines`, combines)
        // englarge inner frame layer
        const enlargeInner = R.random_bool(1)
        if (enlargeInner) {
          DeBug.log(`englarge inner layer`)
          combines = combines.slice(0, dif)
        } else {
          DeBug.log(`random layer enlarge`)
          combines = combines
            .randReduce(dif / (spacing - 1))
        }

        DeBug.log(`combines after`, combines)
        let removals = []
        combines.forEach(c => {
          const startIndex = c - 1
          const start = spaces[startIndex]
          const end = spaces[c]
          const replace = range(start.start, end.end)
          spaces[c] = replace
          removals.push(startIndex)
        })
        DeBug.log(`removals`, removals)
        removals.forEach(r => spaces[r] = undefined)
        DeBug.log(`updated spaces:`, spaces)
        spaces = spaces.compacted
      }
    }
    DeBug.log(`spaces after:`, spaces)

    //cascades
    const cascadeCount = FTS.enums.frameCascades.value          // get frameCascades value
    let cascades
    if (cascadeCount > 0) {                                     // create cascades [[index,amount]]
      cascades = range(0, profCount - 1).array()                // create index array from profiles
        .randReduce(cascadeCount / profCount)                   // randomly reduce to cascadeCount amount
        .map(e => [e, R.random_int(2, floor(3 * widthVal / profCount))])                      // randomly add stairCounts
    }

    DeBug.log(`cascadeCount:`, cascadeCount)
    DeBug.log(`cascades:`, cascades)


    DeBug.log(`widthVal`, widthVal)

    //ARROW: removeFlats()
    const removeFlats = () => {
      // let hasFlats = () => profiles.some(p => p === `Flat`)
      // while(hasFlats()){}
      profiles.forEach((p, i, a) => {
        let space = spaces[i]
        let cascade = cascades?.find(c => c[0] === i)
        // DeBug.log(`space`, space)
        // DeBug.log(`cascade`, cascade)

        if (p === `Flat`) {
          // DeBug.warn(`trying to flatten!`)
          spaces[i] = undefined
          spaces = spaces.compacted
          if (!cascade) {
            cascades?.forEach(c => { if (c[0] > i) { c[0] -= 1 } })
          }
          a[i] = undefined
          // profiles = profiles.compacted
        }
        // DeBug.log(`profiles`, profiles)
        // DeBug.log(`spaces`, spaces)
        // DeBug.log(`cascades`, cascades)
      })
      profiles = profiles.compacted
    }
    removeFlats()
    DeBug.log(`profiles`, profiles)
    //final cuts
    // let cuts = profiles
    profiles = profiles
      .map((p, i, a) => {
        DeBug.error(`profile ${i}:`, p)
        DeBug.log(`spaces`, spaces)
        let space = spaces[i]
        let cascade = cascades?.find(s => s[0] === i)
        let start = space.start
        let end = space.end

        const insetStart = (min, max) => { spaces[i].start = end - space.size * randInset(min, max) }
        const insetEnd = () => { spaces[i].end = start + space.size * randInset() }
        const setToFlat = () => { p = `Flat` }
        const randFlatOrInset = () => {
          const inset = R.random_bool(2 / 3)
          if (inset) { insetStart() } else { setToFlat() }
        }

        // innermost cut processing
        if (i === 0) {
          if (p === `iIn` || p === `rIn`) {
            // inset
            if (widthVal < 2) {
              if (profCount > 1) {
                setToFlat()
              } else {
                p = p === `iIn` ? `jOut` : `rOut`
              }
            } else {
              insetStart()
            }
          }
          // random make more space in middle
          if (widthVal > 1) {
            const makeSpace = R.random_bool(2 / 3)
            if (makeSpace) {
              DeBug.log(`making inner space!`)
              insetStart(1.25, 4)
            }
          }

        }
        // outermost cut processing
        if (i === profiles.lastIndex) {
          if (p === `iIn`) { p = `iOut` }                       // iIn will cast a false shadow from nothing
          if (p === `jIn` || p === `rIn`) {                     // jIn/rIn are hard to read without an outside reference line
            // inset
            if (widthVal < 2) {
              p = p === `jIn` ? `jOut` : `rOut`
            } else {
              insetEnd()
            }
          }
        }
        // cut combo processing
        if (i > 0) {
          let prev = profiles[i - 1]
          DeBug.log(`profiles`, profiles)
          DeBug.log(`this`, p)
          DeBug.log(`prev`, prev)
          DeBug.log(`cascade`, cascade)
          if (p === `iOut`) {
            if (prev === `iIn` || prev === `jIn`) { insetStart() }
            if (prev === `rOut`) { randFlatOrInset() }
          }
          if (p === `jOut`) {
            if (prev === `iIn` || prev === `jIn`) { insetStart() }
            if (prev === `rOut`) { randFlatOrInset() }
          }
          if (p === `rIn`) {
            if (prev === `rOut`) { insetStart() }
            if (prev === `iIn` || prev === `jIn`) { randFlatOrInset() }
          }
        }

        return p
      })
      .compacted
    removeFlats()
    let cuts = profiles
      .map((p, i, a) => {
        // DeBug.log(profiles)
        // DeBug.log(`spaces after`)
        // removeFlats()
        let space = spaces[i]
        let cascade = cascades?.find(s => s[0] === i)
        let start = space.start
        let end = space.end


        const amount = cascade?.last || 1
        return p === `Flat` ? undefined : {
          profile: p,
          start: start,
          end: end,
          amount: amount
        }
      })
    DeBug.log(`cuts`, cuts)
    return cuts
  }

  //METH:
  mkGroups() {
    // #groups
    const coverage = roundToDec(1 / FTS.weight)
    DeBug.log('density:', FTS.density)
    DeBug.log('total weight:', FTS.weight)
    DeBug.log('groupWeight:', FTS.groupWeight)
    DeBug.log('emptyWeight:', FTS.emptyWeight)
    DeBug.log('coverage:', coverage)

    let count = FTS.groupWeight
    let full = true
    let emptyCvrg = 0
    if (FTS.density !== 'At Capacity') {
      count = max(2, FTS.groupWeight * 2 - 1)
      full = false
      emptyCvrg = roundToDec(FTS.emptyWeight / FTS.weight * (1 / max(1, (FTS.groupWeight - 1))))
    }
    let cvrg = { empty: emptyCvrg, layer: coverage, total: 0 }
    DeBug.log('emptyCvrg', emptyCvrg)
    DeBug.log('count', count)
    DeBug.log('full', full)
    let groups = []
    for (let i = 1; i <= count; i++) {
      const group = this.mkGroup(i, count, full, cvrg)
      DeBug.log('group', i, group)
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
    if (i === 1) { methods = [FTS.seedStyle] }
    cvrg.total += coverage

    return { methods: methods, coverage: coverage }
  }
  //METH:
  mkShaders() {
    let shaders = FTS.groups.map(l => {
      //TODO: INSET MIGRATION: test this
      const insetAmount = 2 * (1 - l.inset)
      //TODO: INSET MIGRATION: test this
      const type = l.type === 'Additive' ? insetAmount : -2 + insetAmount
      const mag = l.loft * type * this.minCellSize
      DeBug.log('group l.insetScale', l.inset)
      // DeBug.log('group insetAmount', insetAmount)
      // DeBug.log('group type', type)
      DeBug.log('group mag', mag)
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
  DeBug.groupCollapsed(`mkGrid()`)
  const mill = new ProtoMill()
  mill.mkGrid()
  const minInsetScale = mill.minInsetScale
  DeBug.groupEnd()
  // //                                                                  //NOTE: 1. Calculate GridX
  // //                                                                  //NOTE: 2. Calculate GridY
  // //                                                                  //NOTE: 3. Calculate inset (bezel size)
  // //                                                                  //NOTE: 4. Create Grid
  // //                                                                  //NOTE: 5. Set Grid to Frame
  // //                                                                  //NOTE: 6. (Calculate Group Count)   
  DeBug.groupCollapsed(`mkGroups()`)
  mill.mkGroups()
  DeBug.groupEnd()
  //                                                                    //NOTE: 7. Initialize Groups     
  let group0, group1, group2, group3, group4
  //                                                                    //NOTE: 8. Calculate Each Group (Populate Cells) 
  DeBug.groupCollapsed(`Populate Groups`)
  // DeBug.group(`Populate Groups`)
  // DeBug.group(`Populate Groups`)
  if (GRID.cellCount === 1) {
    group0 = GRID.groupFromIndices(0)
  } else {
    const initialCoverage = 0.3

    //NOTE: Snake
    group0 = GRID.snake({ direction: Direction.Cardinal, cornerStart: true, size: 1, turns: 12, coverage: .3 })

    // group1 = GRID.snake({ direction: Direction.Cardinal })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(1).andAdjacents, newGroup: false, amount: 1 })
    // group2 = GRID.snake({ direction: Direction.Ordinal })
    // group3 = GRID.snake()
    // group0 = GRID.groupFromIndices([0, 2, 10, 13, 16, 24, 26])

    //NOTE: Random Comb
    // group0 = GRID.randomComb({
    //   selection: (GRID.cellRows
    //     // .rotated2D(90)
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()
    //     .intersect(GRID.availableCells, `id`)),
    //   keepRange: range(1, round(FTS.x / .5)),
    //   dropRange: range(round(FTS.x * .5), FTS.x * 2),
    //   start: 0
    // })

    // group0 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'never', mode: 4 })

    //NOTE: Simple Pattern
    // group1 = GRID.comb({
    //   selection: (GRID.cellRows
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()
    //     .intersect(GRID.availableCells, `id`)),
    //   keep: R.random_int(1, 3), drop: R.random_int(12, 16), start: 0
    // })

    //NOTE: Complex Pattern
    // group1 = GRID.comb2({
    //   selection: (GRID.cellRows
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()
    //     .intersect(GRID.availableCells, `id`)),
    //   dashArray: OpArray.randomIntArray(R.random_int(3, 12), range(1, 9)).map((n, i) => i % 2 === 0 ? R.random_int(1, 3) : n)
    // })

    //NOTE: Squares
    // if (FTS.x < 4) {
    //   group1 = GRID.groupFromIndices(
    //     OpArray.randomIntArray(
    //       ceil((GRID.cellCount - 1) * initialCoverage),
    //       range(0, GRID.cellCount - 1)
    //     ).unique()
    //   )
    // } else {

    group1 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh', mode: 1 })

    // }

    //NOTE: Rectangles
    // group0 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 1, uniform: false, overlapping: 'never', mode: 4 })

    //NOTE: Noise
    // group1 = GRID.randGroup({ amount: initialCoverage })

    group2 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 5, coverage: .5 })
    // group2 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 5, coverage: .5 })

    // group1 = GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 8)), newGroup: true, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(1), newGroup: false, amount: 1 })


    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, directioqn: Direction.All.random(R.random_int(1, 1)), newGroup: false, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(R.random_int(1, 1)), amount: R.random_int(0, 2), newGroup: false })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All, newGroup: false, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 3)), newGroup: false, amount: R.random_int(1, 2) })
    // if (!group0) { group0 = GRID.squares({ coverage: 0.25, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' }) }

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(1), newGroup: false, amount: R.random_int(0, 2) })

    const grp1Dir = Direction.All.random(R.random_int(1, 8))
    const grp1Amount = R.random_int(1, 1)
    DeBug.log(`grp1Dir`, grp1Dir.name)
    DeBug.log(`grp1Amount`, grp1Amount)

    DeBug.log(GRID)

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

    group3 = GRID.outlineGroup({
      // groupID: GRID.lastGroup.id,
      groupID: group1?.id || GRID.lastGroup.id,
      // direction: Direction.All.random(R.random_int(1, 4)), 
      newGroup: true,
      amount: grp3Amount
    })

    // DeBug.log('right adj', Direction.Right.adjacents)
    // DeBug.log('right and adj', Direction.Right.andAdjacents)
    // DeBug.log('right opposite', Direction.Right.opposites)


    // group3 = GRID.randGroup({ amount: 0.5 })
    // group3 = GRID.groupAvail()
    // group3 = GRID.squares({ coverage: .8, direction: Direction.DownRight, minSize: 1, uniform: false, overlapping: 'meh' })


    // group4 = GRID.randGroup({ amount: 0.5 })
    group4 = GRID.groupAvail()

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.UpRight.adjacents, newGroup: false, amount: 2 })
    // DeBug.log(group3)
    // DeBug.log(group4)

  }

  //MARK: SYMMETRY
  // DeBug.log('pre-symmetrized cellRows', GRID.cellRows)
  // GRID.symmetrize({
  //   direction: Direction.Cardinal,
  //   reflection: true,
  //   // useEmptyuseAssign, 
  //   // useEmpty, 
  //   // groupIDs, 
  // })
  // DeBug.log('post-symmetrized cellRows', GRID.cellRows)

  // let insetScale = R.random_num(0.9, 0.97)
  // insetScale = .8

  DeBug.log(`group0`, group0)
  DeBug.log(`group1`, group1)
  DeBug.log(`group2`, group2)
  DeBug.log(`group3`, group3)
  DeBug.log(`group4`, group4)
  DeBug.groupEnd()
  DeBug.log(``)

  // globalOutset = 0.
  //                                                                     //NOTE: 9. (Calculate Each Group's Direction)  
  //NOTE: calc per group: possibleOrdinalConnections, current hor/vert islands, etc...
  DeBug.warn(`Groups OrdinalConnects`, GRID.groups.map(g => g.ordinalConnections))
  const ordinalIndices = GRID.groups.map((g, i) => {
    if (!g.ordinalConnections.isEmpty) { return i }
  }).compacted
  DeBug.log(`ordinalIndices`, ordinalIndices)
  const useOrdinal = R.random_bool(0.25)
  const outsetIndex = !ordinalIndices.isEmpty && useOrdinal ? R.random_choice(ordinalIndices) : R.random_int(0, GRID.groups.lastIndex)
  DeBug.log(`outsetIndex`, outsetIndex)
  const outsetGroup = GRID.groups[outsetIndex]
  DeBug.log(`outsetGroup`, outsetGroup)

  //                                                                     //NOTE: 10. Create Perimeters for Each Group
  // DeBug.groupCollapsed(`createPerimiters`)
  DeBug.group(`groupPerimeters`)
  const groupPerimeters = () => {
    GRID.groups.forEach((g, i) => {
      const dir = outsetIndex === i ? Direction.All : Direction.Cardinal
      g.createPerimiters(dir)
    })

    // group0?.createPerimiters(Direction.Cardinal)
    // group1?.createPerimiters(Direction.All)
    // group2?.createPerimiters(Direction.Cardinal)
    // group3?.createPerimiters(Direction.Cardinal)
    // group4?.createPerimiters(Direction.Cardinal)
  }
  groupPerimeters()
  // will need to create check to make sure all groups used
  // DeBug.log(`groups`, GRID.groups)

  const converts = () => {
    let converts = outsetGroup.nonNeighborIslands?.sort((a, b) => a.neighborIslands.length - b.neighborIslands.length)
    // converts = converts?.slice(0, 2)
    return converts || []
  }

  let tempConverts = converts()

  DeBug.log(`converts`, tempConverts?.map(i => i.id))
  while (tempConverts.length > 0) {
    DeBug.error(`converts`, converts().map(i => i.id))
    const c = tempConverts.pop()
    DeBug.warn(`processing:`, c.id)
    const cells = c.cells
    const group = GRID.groupNamed(c.groupID)
    group.cells = group.cells.exclude(cells, `id`)
    group.perimeterIslands = group.perimeterIslands.exclude(c, `id`)
    // GRID.assignCells(cells, outsetGroup.id)
    outsetGroup.cells = outsetGroup.cells.union(c.cells, `id`)
    outsetGroup.perimeterIslands = outsetGroup.perimeterIslands.union(c, `id`)
    // outset
    // groupPerimeters()

    tempConverts = converts()
    DeBug.log(`updated converts`, tempConverts?.map(i => i.id))
    // tempConverts = new OpArray
    // converts = converts.slice(0, 3)
  }


  // group0?.createPerimiters(Direction.Cardinal)

  DeBug.groupEnd()
  DeBug.log(``)

  DeBug.error(`  ######################   `)
  // DeBug.groupCollapsed(`nestleShapes`)
  DeBug.groupCollapsed(`nestleShapes`)
  //                                                                     //NOTE: 11. Nestle Shapes 
  GRID.nestleShapes(0)
  DeBug.groupEnd()

  DeBug.error(`  ######################   `)
  DeBug.log(``)

  //                                                                     //NOTE: 12. (Calc Each Group's Height)  
  //NOTE: reorder cutIsland calls based on heights in order to optimize shadow layering, avoid more complex layering

  //                                                                     //NOTE: 13. Cut Islands
  DeBug.groupCollapsed(`cutIslands`)
  //MARK: group0
  // group0?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: outsetIndex === 0,
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
    isOutsetCut: outsetIndex === 0,
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
  //   isOutsetCut: outsetIndex===0,
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
  //   isOutsetCut: outsetIndex===0,
  //   layerStart: -8 / 64 - globalOutset,
  //   layerEnd: -16 / 64 - globalOutset,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.None
  //   // addBacking: true,
  // })


  //MARK: group1
  group1?.cutIslands({
    profile: Profile.rOut,
    isOutsetCut: outsetIndex === 1,
    layerStart: minInsetScale,
    // layerEnd: .6,
    // dilationStart: 0,
    // dilationEnd: 1 / 2,
    amount: 1,
    // loftScale: 8 / 8,
    // direction: Direction.Vertical,
    // addBacking: true,
  })
  // group1?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: outsetIndex === 1,
  //   // layerStart: minInsetScale,
  //   // layerStart: .6,
  //   // layerEnd: 0.2,
  //   dilationStart: 1 / 2,
  //   dilationEnd: 1,
  //   amount: 1,
  //   // loftScale: 8 / 8,
  //   // direction: Direction.Horizontal,
  //   // addBacking: true,
  // })
  // group1?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: outsetIndex===1,
  //   layerStart: minInsetScale,
  //   // layerEnd: 24 / 48,
  //   dilationStart: 0.75,
  //   dilationEnd: 1,
  //   amount: 1,
  //   loftScale: 8 / 8,
  //   // direction: Direction.None,
  //   // addBacking: true,
  // })

  //MARK: group2
  // group2?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: outsetIndex === 2,
  //   // layerStart: ,
  //   layerStart: minInsetScale,
  //   // layerEnd: 0 / 20,
  //   // dilationStart: 0 / 3,
  //   // dilationEnd: 1 / 3,
  //   amount: 1,
  //   // loftScale: 2,
  //   // direction: Direction.Horizontal
  //   // addBacking: true,
  // })
  group2?.cutIslands({
    profile: Profile.jIn,
    // isOutsetCut: outsetIndex===2,
    layerStart: minInsetScale,
    // layerEnd: 0 / 20,
    dilationStart: 1 / 3,
    dilationEnd: 5 / 6,
    amount: 1,
    loftScale: 1,
    // direction: Direction.None
    // addBacking: true,
  })
  // group2?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: outsetIndex===2,
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
    isOutsetCut: outsetIndex === 3,
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
  //   // isOutsetCut: outsetIndex===3,
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
    isOutsetCut: outsetIndex === 4,
    layerStart: 1,
    // layerStart: minInsetScale,
    // layerEnd: 16 / 64,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.Vertical
  })
  // group4?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: outsetIndex===4,
  //   layerStart: 24 / 64,
  //   // layerStart: minInsetScale,
  //   // layerEnd: -8 / 64,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.Horizontal
  // })


  // DeBug.log(`takenCells`, GRID.takenCells.map(c => c.index))
  DeBug.groupEnd()
  DeBug.log(``)
  //                                                                        //NOTE: 14. set backGridGroup
  DeBug.groupCollapsed(`setBackGridGroup`)
  // DeBug.group(`setBackGridGroup`)
  const frameCuts = mill.mkFrame()
  FRAME.setBackGridGroup(R.random_int(0, 0), R.random_bool(1), frameCuts)
  DeBug.groupEnd()
  DeBug.log(``)

  // DeBug.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)
  // FRAME.backGrid.showCellsDebug()
  // FRAME.backGrid.showShapesDebug()
  // FRAME.backGrid.showShapeGroupsDebug(false)
  // GRID.showCellsDebug()
  // GRID.showShapesDebug()
  // GRID.showShapeGroupsDebug(false)


  // DeBug.log(`multi-island simpleSubshapes`, GRID.allSimpleSubShapes.flat().map(s => s.parentID))
  // let interCells01 = GRID.perimeterIslands[3]?.interCells
  // DeBug.log(`interCells01`, interCells01?.map(c => c.id))
  // DeBug.log(`GRID.islands`, GRID.islands)
  // DeBug.log(`are squares?`, GRID.islands.map(i => i.isSquare))
  // DeBug.log(`are roundedSquares?`, GRID.islands.map(i => i.shape.isRoundedSquare))
  // DeBug.log(`are circles?`, GRID.islands.map(i => i.shape.isCircle))
  // DeBug.log(`are leaves?`, GRID.islands.map(i => i.shape.isLeaf))
  // DeBug.log(`are square leaves?`, GRID.islands.map(i => i.shape.isSquareLeaf))
  // DeBug.log(`maxSquareLeafLoftRadius?`, GRID.islands.map(i => i.shape.maxSquareLeafLoftRadius))
  // DeBug.log(`start cell?`, GRID.islands.map(i => i.cells[0].id))

  // let testShape = GRID.shapeNamed('shp057')
  // DeBug.log(`testShape.simpleSubShapes`, testShape.simpleSubShapes)
  // let subs = testShape.simpleSubShapes.flat()
  // DeBug.log(`subs does not hasBothCubicVerts`, subs.filter(s => !s.hasBothCubicVerts))
  // DeBug.log(`subs does not hasBothCompleteCorners`, subs.filter(s => !s.hasBothCompleteCorners))
  // DeBug.log(`subs hasFlatness`, subs.filter(s => s.hasFlatness).map(s => s.id))
  // DeBug.log(`subs canCurveMoreAtEnd`, subs.filter(s => s.canCurveMoreAtEnd).map(s => s.id))
  // globalAnimation()

  // GRID.maxCuddle()

  DeBug.log(`  ######################   `)
  DeBug.log(`Features`, FTS)
  DeBug.log('all ProtoLayers', S.allLayers)
  DeBug.log(`GRID`, GRID)
  DeBug.warn(`cellSize`, GRID.cellSize)
  DeBug.warn(`GRID cells`, FTS.x, FTS.y)
  // DeBug.warn(`GRID cells`, gridSize)
  DeBug.warn(`minInsetScale`, minInsetScale)
  // DeBug.warn(`maxGlobalOutset`, maxGlobalOutset)
  DeBug.warn(`BGRID`, BGRID)
  DeBug.warn(`GRID Ratio: ${mill.gridRatio / 2}:1`)
  DeBug.warn(`gridInsetScale:`, mill.gridInsetScale)
  DeBug.warn(`GRID.insetAmount.x:`, GRID.insetAmount.x)
  DeBug.warn(`GRID size:`, GRID.insetSize)
  DeBug.warn(`Groups OrdinalConnects`, GRID.groups.map(g => g.ordinalConnections))
  // DeBug.error(`cellSpansBetween`, GRID.cellSpanBetween(0, 161))
  DeBug.error(`filters`, S.Effects.db)

  DeBug.warn(`FRAME.backGroup.padding:`, FRAME.backGroup.padding)
  // DeBug.log(GRID.cellRows.flat().map(cell => cell.center))
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