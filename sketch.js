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


// MARK: setup
// FUNC: setup()
function setup() {
  sizeFrame()
  noCanvas(frameSize.x, frameSize.y)

  functionTestPrint()

  setupPrefs()
  setupColors()
  setupBackground()
  DeBug.groupCollapsed(`setupFeatures`)
  // DeBug.group(`setupFeatures`)
  const features = setupFeatures()
  //  DeBug.log(`setupFeatures`)
  // DeBug.log('random R useage', R.useage)
  DeBug.groupEnd()
  DeBug.warn('Features', features)
  DeBug.warn('Features R useage', R.useage)
  gridTests2(features)

  // areciboMonolith()
  // const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  // createGUI()
  DeBug.log('random R useage', R.useage)
  DeBug.log('random RuID useage', RuID.useage)
}

// MARK: SETUP FUNCS
// FUNC: sizeFrame()
function sizeFrame() {
  let width = min(windowWidth, windowHeight / 2) * 1.1,
    height = width * 1.8

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

//MARK: CLASS: ProtoMill
//CLASS: ProtoMill
// SIZE: 134 lines
class ProtoMill {
  F                     // Features
  grid
  minCellSize
  shaders
  // groups

  minInsetAmount
  minInsetScale
  gridRatio
  gridInsetScale

  constructor(features) {
    this.F = features
  }
  //METH: mkProtoType()
  mkProtoType() {
    DeBug.log(':::PROTOMILL RUNNING:::')
    this.mkGrid()
    this.mkFeatureGroups()
    this.mkShaders()
    this.mkBaseShader()
    DeBug.log('groups', this.groups)
    DeBug.log('all ProtoLayers', S.allLayers)
  }
  //METH: mkShaders()
  mkGrid() {
    //TODO: Tidy up path from setting inset multiplier to setting Frame style / cut size
    const
      //   isFlex = this.F.gridStyle === `Flexible`,
      x = this.F.x,
      y = this.F.y,
      cellOutset = this.F.enums.cellOutset.value

    this.grid = new Grid({
      protoParent: FRAME,
      gridSize: vert(x, y),
      insetScale: this.F.gridInsetScale,
      gridStyle: this.F.gridStyle,
      cellOutset: cellOutset
    })
    GRID = this.grid
    FRAME.setGrid(GRID)

    DeBug.log('GRID', GRID)
    DeBug.log('minCellWidth', GRID.minCellWidth)

    this.minInsetAmount = max(.05, 1 / GRID.minCellWidth * this.F.enums.cellInset.value)
    const minCellInsetAmount = this.minInsetAmount
    this.minInsetScale = (1 - minCellInsetAmount)
    // const maxGlobalOutset = this.F.gridStyle === `Flexible` ? globalOutset : min(this.minInsetScale - minInsetAmount, max(GRID.minCellWidth - 5, 0))
    DeBug.log(`minInsetAmount`, minCellInsetAmount)
    DeBug.log(`this.minInsetScale`, this.minInsetScale)
    DeBug.log(`cellOutset`, cellOutset)
    const maxCellOutset = this.F.gridStyle === `Flexible` ? cellOutset : min(this.minInsetScale - minCellInsetAmount, max(GRID.minCellWidth - 5, 0))

    DeBug.log(`maxCellOutset`, maxCellOutset)
    // cellOutset = min(cellOutset, maxCellOutset)
    this.grid.cellOutset = min(cellOutset, maxCellOutset)
    DeBug.log(`final cellOutset`, cellOutset)
    this.minCellSize = min(this.grid.cellSize.x, this.grid.cellSize.y)
    DeBug.log('Grid Cells', x, y)

  }
  //METH: mkGroups()
  mkGroups() {
    let G = this.grid
    this.F.groups.forEach((group, i) => {
      if (G.isFull) return
      const startCount = G.groups.length
      if (G.cellCount === 1) G.groupFromIndices(0)
      else {
        console.log('group', group)
        G.seed(group.method, { coverage: group.coverage, minSize: group.minSize })
      }
      if (group.method !== 'Empty' && startCount === G.groups.length) {
        console.log('regroup!', group)
        G.seed(group.method, { useAllTaken: true })
      }
      if (group.method === 'Empty'
        && (this.F.density === 'Some Availability' || G.cellCount > 160)
        && G.availableCells.length > G.takenCells.length) {
        {
          G.seed('Outline', { useAllTaken: true })
        }
      }
    })
  }
  //METH: nestleGroups()
  nestleGroups() {
    // set outsetGroup
    console.warn(`Groups OrdinalConnects`, this.grid.groups.map(g => g.ordinalConnections))
    const ordinalIndices = this.grid.groups.map((g, i) => {
      console.log(`ordinalConnections`, i, g.hasOrdinalConnections)
      if (g.hasOrdinalConnections) { return i }
    }).compacted
    console.log(`ordinalIndices`, ordinalIndices)
    // const useOrdinal = R.random_bool(0.25)
    // this.outsetIndex = !ordinalIndices.isEmpty && useOrdinal ? R.random_choice(ordinalIndices) : R.random_int(0, this.grid.groups.lastIndex)
    this.outsetIndex = !ordinalIndices.isEmpty ? R.random_choice(ordinalIndices) : R.random_int(0, this.grid.groups.lastIndex)
    console.log(`outsetIndex`, this.outsetIndex)
    const outsetGroup = this.grid.groups[this.outsetIndex]
    console.log(`outsetGroup`, outsetGroup)
    console.log(`groups`, this.grid.groups)

    // group perimeters
    DeBug.groupCollapsed(`createPerimiters`)
    // DeBug.group(`groupPerimeters`)
    const groupPerimeters = () => {
      this.grid.groups.forEach((g, i) => {
        let
          // varDir = R.random_choice([Direction.Cardinal, Direction.Cardinal, Direction.Horizontal, Direction.Vertical])
          varDir = Direction.Cardinal
        const dir = this.outsetIndex === i ? Direction.All : varDir
        g.createPerimiters(dir)
      })
    }
    groupPerimeters()

    // pack spacing by moving shapes to outsetGroup
    if (this.F.cellOutset !== 'None') {
      // if (false) {
      //ARROW: converts()
      const converts = () => {
        // DeBug.log(`outsetGroup`, outsetGroup?.nonNeighborIslands?.map(i => [i.id, i.ordinalConnections]))
        let maxConxs, converts = outsetGroup?.nonNeighborIslands
        if (converts) {
          maxConxs = max(converts.map(i => i.ordinalConnections.length))
          maxConxs = R.random_int(0, maxConxs)
          // maxConxs = 0
          // DeBug.log(`maxConxs`, maxConxs)
          // converts = converts.filter(i => i.ordinalConnections.length <= maxConxs)
          converts
            // .sort((a, b) => a.neighborIslands.length - b.neighborIslands.length)
            .sort((a, b) => a.cells.length - b.cells.length)
          // .sort((a, b) => b.cells.length - a.cells.length)
        }
        return converts || []
      }
      DeBug.log(`outsetGroup`, outsetGroup.nonNeighborIslands)
      let tempConverts = converts()

      DeBug.log(`converts`, tempConverts?.map(i => i.id))
      while (tempConverts.length > 0) {
        DeBug.error(`converts`, converts().map(i => i.id))
        const isle = tempConverts.pop()
        DeBug.warn(`processing:`, isle.id)
        const cells = isle.cells
        const group = this.grid.groupNamed(isle.groupID)
        group.cells = group.cells.exclude(cells, `id`)
        group.perimeterIslands = group.perimeterIslands.exclude(isle, `id`)
        // this.grid.assignCells(cells, outsetGroup.id)
        outsetGroup.cells = outsetGroup.cells.union(isle.cells, `id`)
        outsetGroup.perimeterIslands = outsetGroup.perimeterIslands.union(isle, `id`)
        isle.groupID = outsetGroup.id
        //FIXME: still need to change shapeGroups or cuts.shapeGroups to get padding/size calculation correct

        tempConverts = converts()
        DeBug.log(`updated converts`, tempConverts?.map(i => i.id))
        // tempConverts = new OpArray
        // converts = converts.slice(0, 3)
      }
    }
    DeBug.error(`outsetGroup`, outsetGroup)
    //FIXME: 

    // this.grid.createSimpleSubShapes()
    // outsetGroup.createPerimiters(Direction.All)

    // group0?.createPerimiters(Direction.Cardinal)

    DeBug.groupEnd()
    DeBug.log(``)

    DeBug.error(`  ######################   `)
    DeBug.group(`nestleShapes`)
    // DeBug.groupCollapsed(`nestleShapes`)
    //                                                                     //NOTE: 11. Nestle Shapes 
    GRID.nestleShapes(0)
    DeBug.groupEnd()

    DeBug.error(`  ######################   `)
    DeBug.log(``)

  }
  //METH: cutGroups()
  cutGroups() {
    DeBug.warn(`cutGroups`)
    this.grid.groups.forEach((g, i) => {
      // if (i > 2) return                                                         //TESTING:
      const
        group = this.F.groups[i],
        makeInsideCut = this.F.enums.insideCuts.value,
        useAltDirection = true
      let
        primeCut = new Profile(group.style, group.type !== `Additive`),
        altDirection = Direction.Cardinal,
        insideStyle, insideCutAmount

      // DeBug.warn(`cutGroups`)

      if (makeInsideCut) {
        insideStyle = this.F.insideCutStyle
        if (insideStyle === `Cyma Recta`) insideCutAmount = 2
        else {
          this.F.enums.insideCutAmount.feature(R)
          const insideCutDiv = this.F.enums.insideCutAmount.value
          insideCutAmount = R.random_int(2, floor(this.minCellSize * (1 + this.grid.cellOutset) / insideCutDiv))
        }

        DeBug.log(`insideCutAmount`, insideCutAmount)
      }
      if (useAltDirection) {
        // altDirection = R.random_choice([Direction.Horizontal, Direction.Vertical, Direction.None])
        altDirection = this.grid.cellAspect.isSquare ?
          R.random_choice([
            Direction.Horizontal,
            Direction.Vertical,
            // Direction.None
          ])
          : altDirection
      }



      // let makeInCut = R.random_bool(.2)
      // makeInCut = false
      // makeInCut = this.F.cellAspect === `Square`



      // let inCut, inCutProfile, dilAmount = 0

      // if (makeInCut) {
      //   dilAmount = R.random_choice([
      //     // .25,
      //     .5,
      //     // .75,
      //   ])
      //   // dilAmount = .5
      //   // dilAmount = R.random_choice([.125, .25, .375, .5, .625, .75, .875])
      //   // inCut = R.random_choice([Direction.Horizontal, Direction.Vertical, Direction.None, Direction.Cardinal])
      //   inCut = R.random_choice([
      //     Direction.Cardinal,
      //     Direction.Horizontal,
      //     Direction.Vertical,
      //     Direction.None
      //   ])
      //   inCutProfile = new Profile(group.style, group.type === `Additive`)
      // }
      // primeCut = R.random_choice([
      //   // Profile.rOut,
      //   // Profile.jIn,
      //   // Profile.rIn,
      //   Profile.jOut
      // ])
      g.cutIslands({
        profile: primeCut,
        isOutsetCut: this.outsetIndex === i,
        layerStart: primeCut.hasInsetShade ? this.minInsetScale : 1,
        amount: this.outsetIndex === i && makeInsideCut ? insideCutAmount : 1,
        direction: this.outsetIndex === i ? Direction.All : altDirection,
        insideCutStyle: insideStyle,
      })
      // if (makeInCut) {
      //   g.cutIslands({
      //     // profile: inCutProfile,
      //     profile: R.random_choice([
      //       Profile.rOut,
      //       // Profile.jIn,
      //       Profile.rIn,
      //       // Profile.jOut
      //     ]),
      //     // profile: Profile.rOut,
      //     isOutsetCut: this.outsetIndex === i,
      //     // layerStart: minInsetScale - R.random_num(0, minInsetScale / 5),
      //     layerStart: this.minInsetScale,
      //     // dilationStart: R.random_num(.25, .9),
      //     dilationStart: dilAmount,
      //     dilationEnd: 0,
      //     // dilationEnd: R.random_int(-2, round(1 / dilAmount) * 4),
      //     // amount: R.random_int(1, round(1 / dilAmount) * 4),
      //     // amount: R.random_int(1, ceil(1 / (1 - GRID.cellOutset)) + 1),
      //     amount: 1,
      //     direction: inCut
      //   })
      // }

    })
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
    DeBug.log(`frameWidth val:`, this.F.enums.frameWidth.value)
    const widthVal = this.F.enums.frameWidth.value
    const frameWidth = (100 - this.grid.insetSize.x) / 2
      - (this.minInsetAmount * this.grid.cellRadius)
    DeBug.log(`frameWidth`, frameWidth)

    // profiles
    let profiles = new OpArray(+this.F.frameDivs).fill(0)             // create array from frameDivs amount
      .map((u, i, a) => {
        if (i === a.lastIndex) { this.F.enums.frameProfiles.removeOptions([`iIn`, `iOut`, `Flat`]) }
        return this.F.enums.frameProfiles.feature(R)
      })         // randomly populate with Profiles from frameProfiles
    DeBug.log(`profiles:`, profiles)
    const profCount = profiles.length
    DeBug.log(`profCount:`, profCount)

    //spacing
    let spacing = this.F.enums.frameSpacing.value                     // get frameSpacing value
    DeBug.log(`spacing initial:`, spacing)
    if (spacing === 1 || spacing < profCount) spacing = profCount     // if spacing = 'Whole' then use frameDivs amount

    DeBug.log(`spacing:`, spacing)
    let spaces = range(0, 1).subRanges(spacing)                           // create subRanges in 0-1 from spacing
    // DeBug.log(`spaces start/end`, spaces[0].start, spaces[0].end)
    DeBug.log(`spaces:`, spaces)

    //ARROW: spaceWidth(i)
    const spaceWidth = (i) => spaces[i].size * frameWidth

    //ARROW: randInset()
    const randInset = (spaceIndex, minDenom = 3, maxDenom = widthVal * 4) => {
      // const maxSize = 2 / spaceWidth(spaceIndex)
      let maxSize = abs(1 - 2 / spaceWidth(spaceIndex))
      maxSize = maxSize > .1 ? maxSize : 1 - maxSize
      DeBug.log(`spaceWidth(spaceIndex)`, spaceWidth(spaceIndex))
      DeBug.log(`maxSize`, maxSize)
      const inset = min(maxSize, 1 - 1 / max(4, ceil(R.random_num(minDenom, maxDenom))))
      DeBug.log(`new randInset`, inset)
      return inset

    }

    //dif
    const dif = spacing - profCount
    DeBug.log(`dif:`, dif)
    if (dif) {
      DeBug.log(`there is a dif of:`, dif)
      if (profCount === 1) {
        spaces = [range((R.random_int(1, spacing - 1) / spacing), 1)]
        DeBug.log(`spaces after dif`, spaces[0])
      } else {
        let combines = range(1, spacing - 1).array()
        DeBug.log(`combines`, combines)
        // englarge inner frame layer
        const enlargeInner = R.random_bool(0.5)
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
    // DeBug.log(`spaces after dif: start/end`, spaces[0].start, spaces[0].end)
    DeBug.log(`spaces after:`, spaces[0])

    //cascades
    const cascadeCount = this.F.enums.frameCascades.value                 // get frameCascades value
    DeBug.log(`cascadeCount`, cascadeCount / profCount)
    let cascades
    if (cascadeCount > 0) {                                               // create cascades [[index,amount]]
      cascades = range(0, profCount - 1).array()                          // create index array from profiles
      DeBug.log(`cascades original`, cascades)
      cascades = cascades
        .filter((e, i) => {
          DeBug.log(`rangeSize`, spaces[e].size)
          DeBug.log(`SpaceWidth`, e, spaceWidth(e))
          return spaceWidth(e) > 5
        })                                                                // remove spaces that are too small
      DeBug.log(`cascades filtered`, cascades)
      if (cascades.length > 1) cascades = cascades.randReduce(cascadeCount / profCount)  // randomly reduce to cascadeCount amount

      cascades = cascades
        .map(e => {
          const maxAmount = floor(spaceWidth(e) / 1.5)
          DeBug.log(`maxAmount`, e, maxAmount)
          return [e, R.random_int(2, maxAmount)]
        })  // randomly add stairCounts
      // .map(e => [e, R.random_int(2, floor(3 * widthVal / profCount))])  // randomly add stairCounts
    }

    DeBug.log(`cascadeCount:`, cascadeCount)
    DeBug.log(`cascades:`, cascades)


    DeBug.log(`widthVal`, widthVal)

    //ARROW: removeFlats()
    const removeFlats = () => {
      profiles.forEach((p, i, a) => {
        // let space = spaces[i]
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
        }
        // DeBug.log(`profiles`, profiles)
        // DeBug.log(`spaces`, spaces)
        // DeBug.log(`cascades`, cascades)
      })
      profiles = profiles.compacted
    }

    removeFlats()
    // DeBug.log(`spaces after removeFlats(): start/end`, spaces[0].start, spaces[0].end)
    console.log('')
    DeBug.warn('Processing Profiles')
    DeBug.log(`profiles`, profiles)
    //final cuts
    // let cuts = profiles

    profiles = profiles
      .map((p, i, a) => {
        DeBug.error(`profile ${i}:`, p)
        DeBug.log(`spaces`, spaces[0], spaces[1])
        let
          space = spaces[i],
          cascade = cascades?.find(s => s[0] === i),
          start = space.start,
          end = space.end,
          startInset = false

        DeBug.log(`space`, space)

        //ARROW: gap()
        const gap = () => space.end - space.start

        //ARROW: insetStart()
        const insetStart = (min, max) => {
          const inset = randInset(i, min, max)
          DeBug.error(`insetStart()`, inset)
          DeBug.log(`space.size`, space.size)
          // startInset = inset
          spaces[i].start = end - space.size * inset
        }

        //ARROW: insetEnd()
        const insetEnd = (min = false) => {
          if (min) spaces[i].end = space.end - 1.5 / spaceWidth(i)
          else {
            let inset = randInset(i)
            DeBug.error(`insetEnd()`, inset)
            spaces[i].end = start + space.size * inset
          }
        }

        //ARROW: setToFlat()
        const setToFlat = () => p = `Flat`

        //ARROW: randFlatOrInset()
        const randFlatOrInset = () => {
          const inset = R.random_bool(2 / 3)
          if (inset) { insetStart() } else { setToFlat() }
        }

        DeBug.warn(`initial Start/End`, space.start, space.end)

        // innermost cut processing
        if (i === 0) {
          DeBug.warn(`processing innermost`, p)
          if (p === `iIn` || p === `rIn`) {
            // inset
            if (widthVal < 2) {
              if (profCount > 1) {
                setToFlat()
              } else {
                p = p === `iIn` ? `jOut` : `rOut`
              }
            } else {
              if (gap() > .5 * profCount) insetStart()

              DeBug.warn('new start:', spaces[i])
            }
          }
          // random make more space in middle
          if (widthVal > 1
            // && gap() < .5 / profCount
          ) {
            const makeSpace = cascadeCount > 0 ? R.random_bool(1 / 3) : R.random_bool(2 / 3)
            // const makeSpace = R.random_bool(2 / 3)
            if (makeSpace) {
              DeBug.log(`making inner space!`)
              // insetStart()
              insetStart(1.25, 4)
              startInset = true
            }
          }

        }
        // outermost cut processing
        if (i === profiles.lastIndex) {
          if (p === `iIn`) { p = `iOut` }                       // iIn will cast a false shadow from nothing
          if (p === `jIn` || p === `rIn`) {                     // jIn/rIn are hard to read without an outside reference line
            // inset
            if (widthVal < 2) p = p === `jIn` ? `jOut` : `rOut`
            else {
              DeBug.warn('new end, startInset', startInset)
              const min = startInset ? true : R.random_bool(.5)
              insetEnd(min)
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
    // DeBug.log(`spaces after profiles.compacted: start/end`, spaces[0].start, spaces[0].end)

    let cuts = profiles
      .map((p, i, a) => {
        // DeBug.log(profiles)
        // DeBug.log(`spaces after`)
        // removeFlats()
        let
          space = spaces[i],
          cascade = cascades?.find(s => s[0] === i),
          start = space.start,
          end = space.end,
          // maxAmount = (end - start) * frameWidth,
          amount = cascade ? cascade.last : 1

        DeBug.warn(`space`, space)
        DeBug.warn(`cascade`, cascade)
        // DeBug.warn(`maxAmount`, maxAmount)
        DeBug.warn(`amount`, amount)
        DeBug.warn(`calculated inset Start/End`, start, end)

        // if (
        //   p !== `Flat`
        //   &&
        //   i < profiles.length
        //   &&
        //   abs(start - end) < .25 / widthVal
        // ) {         // make sure start and end are not equal (rare but nasty bug)
        //   // DeBug.log(`cascades`, cascades)
        //   // if (start > abs(1 - end)) 
        //   // start = 0
        //   // else 
        //   // end = 1
        //   // start = 0
        //   // amount = ceil(amount / 2)
        //   if (p === `rIn` || p === `iIn`) p = `jIn`

        // }

        DeBug.warn(`cascade`, cascade)

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
}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2(features) {
  //                                                                  //NOTE: 1. Initialize ProtoMill
  DeBug.groupCollapsed(`mkGrid()`)
  const mill = new ProtoMill(features)
  //                                                                  //NOTE: 2. Create Grid
  mill.mkGrid()
  console.log(`mill.grid.`, mill.grid.gridSize)
  const minInsetScale = mill.minInsetScale
  DeBug.groupEnd()
  //                                                                  //NOTE: 3. Populate Groups
  DeBug.groupCollapsed(`Populate Groups`)
  mill.mkGroups()
  DeBug.groupEnd()
  //                                                                  //NOTE: 4. Nestle Groups
  DeBug.groupCollapsed(`Nestle Groups`)
  // DeBug.group(`Nestle Groups`)
  mill.nestleGroups()
  DeBug.groupEnd()
  //                                                                  //NOTE: 5. Cut Groups/Islands
  DeBug.groupCollapsed(`Cut Groups`)
  // DeBug.group(`Cut Groups`)
  mill.cutGroups()
  // DeBug.log(`takenCells`, GRID.takenCells.map(c => c.index))
  DeBug.groupEnd()
  DeBug.log(``)
  //                                                                  //NOTE: 6. Make Frame
  DeBug.groupCollapsed(`Make Frame`)
  // DeBug.group(`setBackGridGroup`)
  const frameCuts = mill.mkFrame()
  // FRAME.setBackGridGroup(R.random_int(0, 0), R.random_bool(1), frameCuts)
  FRAME.setBackGridGroup(0, true, frameCuts, mill.minInsetAmount)
  DeBug.groupEnd()
  DeBug.log(``)

  console.error(`GRID`, GRID.shapeGroups)
  console.error(`backGrid`, BGRID.shapeGroups)

  GRID.shapeGroups.forEach(shgrp => shgrp.drawElement())
  BGRID.shapeGroups.forEach(shgrp => shgrp.drawElement())

  // console.error(`S.Cuts`, S.Cuts)

  S.Cuts.db.map(c => c[1]).forEach(c => c.setLayouts())

  // DeBug.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)
  // FRAME.backGrid.showCellsDebug()
  // FRAME.backGrid.showShapesDebug()
  // FRAME.backGrid.showShapeGroupsDebug(false)
  // GRID.showCellsDebug()
  // GRID.showShapesDebug()
  // GRID.showShapeGroupsDebug(false)
  // GRID.showFrameRate(animationController)
  // GRID.showSizeGrid(4)

  // globalAnimation()
  // GRID.maxCuddle()

  // DeBug.log(`  ######################   `)
  // console.error(`GRID`, GRID.shapeGroups)
  // console.error(`backGrid`, BGRID.shapeGroups)
  console.log('hash', tokenData.hash)
  console.log(`Features`, features)
  DeBug.warn(` InsideCuts`, features.insideCuts)
  console.log(`Mill`, mill)
  console.log('all ProtoLayers', S.allLayers)
  console.log(`GRID`, GRID)
  console.warn(`cellSize`, GRID.cellSize)
  console.warn(`GRID cells`, features.x, features.y)
  console.error(`F.groups`, features.groups)
  console.error(`mill.grid.groups`, mill.grid.groups)
  console.warn(`uniformCutsStyle`, mill.F.uniformCutsStyle)
  console.warn(`extraGroups avail`, mill.F.enums.extraGroups.options)
  // console.warn(`GRID cells`, gridSize)
  DeBug.warn(`minInsetScale`, minInsetScale)
  // DeBug.warn(`minInsetAmount`, (1 - minInsetScale) * GRID.minCellWidth)
  DeBug.warn(`minInsetAmount`, mill.minInsetAmount)
  DeBug.warn(`FRAME Cuts`, GRID.protoParent.backGroup.cuts)
  DeBug.warn(`BGRID`, BGRID)
  DeBug.warn(`GRID Ratio: ${mill.gridRatio / 2}:1`)
  console.warn(`gridInsetScale:`, mill.gridInsetScale)
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