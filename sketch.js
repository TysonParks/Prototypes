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
let frameSize
// let FTS                     // Feature Set
let BG, FRAME, BGRID, GRID  // Background, Frame, Background Grid, Grid
let ROT, frameRate
let R, S, RuID              // Random, Store, Random UID
let animationController

//Graphics constants
// const expSeries = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

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
  const features = setupFeatures()
  DeBug.log('random R useage', R.useage)
  DeBug.groupEnd()
  gridTests2(features)

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
  frameRate = 12
  ROT = 10 * PI
  animationController = new AnimationController(frameRate)
}

// FUNC: setupFeatures()
function setupFeatures() {
  const features = calculateFeatures(tokenData)
  DeBug.log('FeatureSet', features)
  DeBug.log('groups', features.groups)
  return features
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
    .look(Look.centeredFlex(backgroundColor, 'column'))      // FIXME: deprecating Look, assign CSS styling directly
  FRAME = new Frame(BG)
}

//CLASS: ProtoMill
// SIZE: 134 lines
class ProtoMill {
  F                     // Features
  grid
  minCellSize
  shaders
  groups

  minInsetScale
  gridRatio
  gridInsetScale

  constructor(features) {
    this.F = features
  }
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
    const isFlexiblestyle = this.F.gridStyle === `Flexible`
    const x = this.F.x
    // x = 7
    const y = this.F.y
    const gridYMult = y / x
    let gridRatio, ratio
    // globalOutset = 0.
    // globalOutset = this.F.enums.cellOutset.value
    const cellOutset = this.F.enums.cellOutset.value
    let gridInsetTarget = 0.9

    //ARROW: calcFrameWidth() : 
    const calcFrameWidth = () => {
      // DeBug.log(`frameWidth`,)
      const widths = () => {
        DeBug.log(`frameWidth:`, this.F.frameWidth)
        switch (this.F.frameWidth) {
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
      gridStyle: this.F.gridStyle,
      cellOutset: cellOutset
    })
    GRID = this.grid
    FRAME.setGrid(GRID)

    DeBug.log('GRID', GRID)
    // const cellSize = Vertex.div(this.insetSize, this.gridSize)
    // const minInsetAmount = 1 / GRID.minCellWidth
    const minInsetAmount = 1 / GRID.minCellWidth
    this.minInsetScale = 1 - minInsetAmount
    // const maxGlobalOutset = this.F.gridStyle === `Flexible` ? globalOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))
    DeBug.log(`cellOutset`, cellOutset)
    const maxCellOutset = this.F.gridStyle === `Flexible` ? cellOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))

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
    // if(rIn->rOut)              { inset or scoop between



    DeBug.warn(`FeatureSet`, this.F)
    DeBug.log(`frameWidth:`, this.F.frameWidth)
    const widthVal = this.F.enums.frameWidth.value

    //ARROW: randInset
    const randInset = (minDenom = 3, maxDenom = widthVal * 4) => {
      const inset = 1 - 1 / max(ceil(R.random_num(minDenom, maxDenom)), 2)
      DeBug.log(`new randInset`, inset)
      return inset

    }

    // profiles
    let profiles = new OpArray(+this.F.frameDivs).fill(0)      // create array from frameDivs amount
      .map((u, i, a) => {
        if (i === a.lastIndex) { this.F.enums.frameProfiles.removeOptions([`iIn`, `iOut`, `Flat`]) }
        return this.F.enums.frameProfiles.feature(R)
      })         // randomly populate with Profiles from frameProfiles
    DeBug.log(`profiles:`, profiles)
    const profCount = profiles.length
    DeBug.log(`profCount:`, profCount)

    //spacing
    let spacing = this.F.enums.frameSpacing.value              // get frameSpacing value
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
    const cascadeCount = this.F.enums.frameCascades.value                 // get frameCascades value
    let cascades
    if (cascadeCount > 0) {                                               // create cascades [[index,amount]]
      cascades = range(0, profCount - 1).array()                          // create index array from profiles
        .randReduce(cascadeCount / profCount)                             // randomly reduce to cascadeCount amount
        .map(e => [e, R.random_int(2, floor(3 * widthVal / profCount))])  // randomly add stairCounts
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
    DeBug.log('density:', this.F.density)
    DeBug.log('total weight:', this.F.weight)
    DeBug.log('groupWeight:', this.F.groupWeight)
    DeBug.log('emptyWeight:', this.F.emptyWeight)

    let count = this.F.groupWeight
    let full = true
    if (count < this.F.weight) full = false
    console.log('count', count)
    console.log('full', full)
    console.log('')

    let groups = []
    for (let i = 1; i <= count; i++) {
      const group = this.mkGroup(i, count, full)
      // DeBug.log('group', i, group)
      groups.push(group)
    }
    this.groups = groups
  }
  //METH:
  mkGroup(i, count, full) {
    const emptyGroup = { type: 'empty', style: 'empty', loft: 0, method: 'empty' }
    const group = this.F.groups[i - 1] || emptyGroup
    // DeBug.log('groupWeight', this.F.groupWeight)
    // DeBug.log('groups', this.F.groups)
    // DeBug.log('count', count)
    let method = 'empty'
    if (i === 1) method = this.F.seed1
    if (i === 2 && count > 2) {
      method = this.F.seed2 === 'Modifier' ? this.F.enums.modifierStyle.feature(R) : this.F.seed2
    }
    if (i === count) {
      if (this.F.density === 'At Capacity') method = 'groupAvail'
    }
    else if (i > 2 && i <= count) method = this.F.enums.modifierStyle.feature(R)

    return { type: group.type, style: group.style, loft: group.loft, method: method }
  }
  //METH:
  mkShaders() {
    let shaders = this.F.groups.map(l => {
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
function gridTests2(features) {
  DeBug.groupCollapsed(`mkGrid()`)
  const mill = new ProtoMill(features)
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

    // GRID.seed(`Noise`)
    // GRID.seed(`Random Comb`)
    // GRID.seed(`Squares`)
    // GRID.seed(`Rectangles`)
    // GRID.seed('Squares and Rectangles')
    // GRID.seed(`Simple Pattern`)
    // GRID.seed(`Complex Pattern`)
    // GRID.seed(`Snake`)

    // GRID.seed(`Random Comb`)
    GRID.seed(`Snake`)
    // GRID.seed(`Complex Pattern`)
    // GRID.seed(`Snake`)
    // GRID.seed(`Snake`)
    // GRID.seed(`Snake`)
    // GRID.seed(`Snake`)


    GRID.groupAvail()

    // group0 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 12, coverage: .3 })

    // group1 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 12, coverage: .3 })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(1).andAdjacents, newGroup: false, amount: 1 })
    // group2 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 12, coverage: .3 })
    // group3 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 12, coverage: .3 })
    // group0 = GRID.groupFromIndices([0, 2, 10, 13, 16, 24, 26])

    //NOTE: Random Comb
    // group0 = GRID.randomComb({
    //   selection: GRID.cellRows
    //     // .rotated2D(90)
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()
    //     .intersect(GRID.availableCells, `id`),
    //   keepRange: range(1, round(features.x / .5)),
    //   dropRange: range(round(features.x * .5), features.x * 2),
    //   start: 0
    // })

    // group0 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'never', rectMode: 6 })
    // group1 = GRID.randGroup({ amount: initialCoverage })

    //NOTE: Complex Pattern
    // group0 = GRID.comb2({
    //   selection: (GRID.cellRows
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()
    //     .intersect(GRID.availableCells, `id`)),
    //   dashArray: OpArray.randomIntArray(R.random_int(3, 12), range(1, 9)).map((n, i) => i % 2 === 0 ? R.random_int(1, 3) : n)
    // })

    //NOTE: Simple Pattern
    // group1 = GRID.comb({
    //   selection: (GRID.cellRows
    //     .rotated2D(R.random_int(0, 3) * 90)
    //     .flipped2D(Direction.Cardinal.random(1).andOpposites)
    //     .flat()
    //     .intersect(GRID.availableCells, `id`)),
    //   keep: R.random_int(1, 3), drop: R.random_int(12, 16), start: 0
    // })

    //NOTE: Squares
    // if (features.x < 4) {
    //   group0 = GRID.groupFromIndices(
    //     OpArray.randomIntArray(
    //       ceil((GRID.cellCount - 1) * initialCoverage),
    //       range(0, GRID.cellCount - 1)
    //     ).unique()
    //   )
    // } else {

    //   group0 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 1, uniform: false, overlapping: 'meh', rectMode: 0 })

    // }

    //NOTE: Rectangles
    // group1 = GRID.squares({ coverage: initialCoverage, direction: Direction.DownRight, minSize: 1, uniform: false, overlapping: 'never', rectMode: 1 })

    //NOTE: Noise
    // group1 = GRID.randGroup({ amount: initialCoverage })

    // group2 = GRID.snake({ direction: Direction.Cardinal, cornerStart: true, size: 1, turns: 12, coverage: .5 })
    // group2 = GRID.snake({ direction: Direction.Cardinal, cornerStart: false, size: 1, turns: 12, coverage: .5 })

    // group1 = GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 8)), newGroup: true, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(1), newGroup: false, amount: 1 })


    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, directioqn: Direction.All.random(R.random_int(1, 1)), newGroup: false, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(R.random_int(1, 1)), amount: R.random_int(0, 2), newGroup: false })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All, newGroup: false, amount: R.random_int(1, 1) })
    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.All.random(R.random_int(1, 3)), newGroup: false, amount: R.random_int(1, 2) })
    // if (!group0) { group0 = GRID.squares({ coverage: 0.25, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' }) }

    // GRID.outlineGroup({ groupID: GRID.lastGroup.id, direction: Direction.Cardinal.random(1), newGroup: false, amount: R.random_int(0, 2) })

    const grp1Dir = Direction.All.random(R.random_int(1, 8))
    const grp1Amount = 1
    // const grp1Amount = R.random_int(1, 2)
    DeBug.log(`grp1Dir`, grp1Dir.name)
    DeBug.log(`grp1Amount`, grp1Amount)

    DeBug.log(GRID)

    // group5 = GRID.outlineGroup({
    //   groupID: GRID.lastGroup?.id,
    //   direction: Direction.All,
    //   direction: grp1Dir,
    //   newGroup: true,
    //   amount: grp1Amount
    // })

    // group2 = GRID.snake({ direction: Direction.Cardinal, cornerStart: true, size: 2, turns: 12, coverage: .5 })
    // group3 = GRID.snake({ direction: Direction.Cardinal, cornerStart: true, size: 1, turns: 12, coverage: .5 })
    // group1 = GRID.squares({ coverage: 0.5, direction: Direction.DownRight, minSize: 2, uniform: false, overlapping: 'meh' })

    // group4 = GRID.outlineGroup({
    //   groupID: GRID.lastGroup.id,
    //   direction: Direction.All.random(R.random_int(2, 8)),
    //   newGroup: true,
    //   amount: R.random_int(1, 2)
    // })

    const grp3Amount = R.random_int(1, 3)

    // group5 = GRID.outlineGroup({
    //   groupID: GRID.lastGroup?.id,
    //   // groupID: group1?.id || GRID.lastGroup.id,
    //   // direction: Direction.All.random(R.random_int(1, 4)), 
    //   newGroup: true,
    //   amount: grp3Amount
    // })

    // DeBug.log('right adj', Direction.Right.adjacents)
    // DeBug.log('right and adj', Direction.Right.andAdjacents)
    // DeBug.log('right opposite', Direction.Right.opposites)


    // group3 = GRID.randGroup({ amount: 0.5 })
    // group4 = GRID.randGroup({ amount: 0.5 })
    // group5 = GRID.randGroup({ amount: 0.5 })
    // group6 = GRID.randGroup({ amount: 0.5 })
    // group3 = GRID.groupAvail()
    // group6 = GRID.squares({ coverage: .8, direction: Direction.DownRight, minSize: 1, uniform: false, overlapping: 'never', rectMode: 5 })


    // group5 = GRID.randGroup({ amount: 0.5 })
    // group7 = GRID.groupAvail()

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
  DeBug.log(`groups`, GRID.groups)


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
    let converts = outsetGroup?.nonNeighborIslands?.filter(i => !i.hasOrdinalConnections)
      .sort((a, b) => a.neighborIslands.length - b.neighborIslands.length)
    // converts = converts?.slice(0, 2)
    return converts || []
  }

  let tempConverts = converts()

  DeBug.log(`converts`, tempConverts?.map(i => i.id))
  while (tempConverts.length > 0) {
    DeBug.error(`converts`, converts().map(i => i.id))
    const isle = tempConverts.pop()
    console.warn(`processing:`, isle.id)
    const cells = isle.cells
    const group = GRID.groupNamed(isle.groupID)
    group.cells = group.cells.exclude(cells, `id`)
    group.perimeterIslands = group.perimeterIslands.exclude(isle, `id`)
    // GRID.assignCells(cells, outsetGroup.id)
    outsetGroup.cells = outsetGroup.cells.union(isle.cells, `id`)
    outsetGroup.perimeterIslands = outsetGroup.perimeterIslands.union(isle, `id`)
    isle.groupID = outsetGroup.id
    //FIXME: still need to change shapeGroups or cuts.shapeGroups to get padding/size calculation correct

    tempConverts = converts()
    DeBug.log(`updated converts`, tempConverts?.map(i => i.id))
    // tempConverts = new OpArray
    // converts = converts.slice(0, 3)
  }
  // outsetGroup.createPerimiters(Direction.All)

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

  GRID.groups.forEach((g, i) => {
    let makeInCut = R.random_bool(.2)
    makeInCut = false
    let inCut, dilAmount = 1
    // let inCut
    if (makeInCut) {
      dilAmount = R.random_choice([.25, .5, .75,])
      // dilAmount = .5
      // dilAmount = R.random_choice([.125, .25, .375, .5, .625, .75, .875])
      // inCut = R.random_choice([Direction.Horizontal, Direction.Vertical, Direction.None, Direction.Cardinal])
      inCut = R.random_choice([Direction.Horizontal, Direction.Vertical, Direction.None])
    }
    g.cutIslands({
      profile: R.random_choice([
        Profile.rOut,
        Profile.jIn,
        Profile.rIn,
        Profile.jOut
      ]),
      // profile: Profile.rOut,
      // isOutsetCut: false,
      isOutsetCut: outsetIndex === i,
      // layerStart: min(60 / 64, minInsetScale),
      // layerStart: minInsetScale - R.random_num(0, minInsetScale / 5),
      layerStart: minInsetScale,
      // layerEnd: 0.5,
      // dilationStart: 0,
      // dilationEnd: R.random_int(0, round(1 / dilAmount) * -4),
      dilationEnd: dilAmount,
      // amount: outsetIndex === i ? R.random_int(1, ceil(1 / (1 - GRID.cellOutset)) + 1) : 1,
      amount: 1,
      loftScale: 1 / 1,
      direction: outsetIndex === i ? Direction.All : Direction.Cardinal,
      // direction: Direction.Horizontal
      // addBacking: true,
    })
    if (makeInCut) {
      g.cutIslands({
        profile: R.random_choice([
          Profile.rOut,
          Profile.jIn,
          // Profile.rIn,
          // Profile.jOut
        ]),
        // profile: Profile.rOut,
        isOutsetCut: false,
        // layerStart: minInsetScale - R.random_num(0, minInsetScale / 5),
        layerStart: minInsetScale,
        // dilationStart: R.random_num(.25, .9),
        dilationStart: dilAmount,
        dilationEnd: 1,
        // dilationEnd: R.random_int(-2, round(1 / dilAmount) * 4),
        // amount: R.random_int(1, round(1 / dilAmount) * 4),
        amount: R.random_int(1, ceil(1 / (1 - GRID.cellOutset)) + 1),
        direction: inCut
      })
    }

  })

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

  console.error(`GRID`, GRID.shapeGroups)
  console.error(`backGrid`, BGRID.shapeGroups)

  GRID.shapeGroups.forEach(shgrp => shgrp.drawElement())
  BGRID.shapeGroups.forEach(shgrp => shgrp.drawElement())

  console.error(`S.Cuts`, S.Cuts)

  S.Cuts.db.map(c => c[1]).forEach(c => c.setLayouts())

  // DeBug.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)
  // FRAME.backGrid.showCellsDebug()
  // FRAME.backGrid.showShapesDebug()
  // FRAME.backGrid.showShapeGroupsDebug(false)
  // GRID.showCellsDebug()
  // GRID.showShapesDebug()
  // GRID.showShapeGroupsDebug(false)
  // GRID.showFrameRate(animationController)

  // globalAnimation()
  // GRID.maxCuddle()

  // DeBug.log(`  ######################   `)
  console.error(`GRID`, GRID.shapeGroups)
  console.error(`backGrid`, BGRID.shapeGroups)
  console.log('hash', tokenData.hash)
  console.log(`Features`, features)
  console.log(`Mill`, mill)
  console.log('all ProtoLayers', S.allLayers)
  console.log(`GRID`, GRID)
  DeBug.warn(`cellSize`, GRID.cellSize)
  DeBug.warn(`GRID cells`, features.x, features.y)
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
  if (globalControls.animated) {
    // Don't start if already running
    return
  }

  globalControls.animated = true
  animationController.globalAnimation()
}

// FUNC: stopAnimationLoop()
function stopAnimationLoop() {
  globalControls.animated = false
}

// // FUNC: shadeAnimation()
function shadeAnimation() {
  if (globalControls.animated) {
    stopAnimationLoop()
  } else {
    // globalControls.animated = true
    startAnimationLoop()
  }
}


// MARK: GLOBAL FUNCS

// FUNC: windowResized()
function windowResized() {
  sizeFrame()
  BG.size(windowWidth, windowHeight)
}


// FUNC: globalShadowVector()
function globalShadowVector() {
  return Shade.shadVect(globalControls.shadAngle, globalControls.shadMag)
}