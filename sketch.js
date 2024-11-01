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
let ROT
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
  // areciboMonolith()
  // const mill = new ProtoMill()
  // mill.mkProtoType()

  //TESTING
  // createGUI()
  console.log('random R useage', R.useage)
  console.log('random RuID useage', RuID.useage)
}

// FUNC: draw()
function draw() {
  // console.log(`drawing`)
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
  frameRate(24)
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
    let insetMultiplier = 2
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

    this.grid = new Grid({
      protoParent: FRAME,
      gridSize: vert(FTS.x, FTS.y),
      insetScale: gridInsetScale,
    })
    GRID = this.grid
    FRAME.setGrid(GRID)

    this.minCellSize = min(this.grid.cellSize.x, this.grid.cellSize.y)
    console.log('Grid Cells', FTS.x, FTS.y)
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

const arecibo = {
  // lsdmX: [69, 71, 73, 75, 77, 79, 81, 83, 86, 89, 216, 217, 218, 219, 220, 322, 323, 324, 325, 326, 328, 329, 330, 331, 332, 334, 335, 336, 337, 338, 340, 341, 342, 343, 344, 437, 438, 439, 440, 441, 455, 456, 457, 458, 459, 552, 553, 554, 555, 556, 558, 559, 560, 561, 562, 564, 565, 566, 567, 568, 570, 571, 572, 573, 574, 667, 668, 669, 670, 671, 687, 688, 689, 690, 691, 976, 1120, 1150, 1669],
  numbers: [6, 8, 10, 12, 25, 27, 33, 35, 43, 46, 50, 54, 58, 61, 63, 64, 67, 69, 71, 73, 75, 77, 79, 81, 83, 86, 89],
  dna: [127, 128, 148, 149, 151, 171, 172, 174, 193, 195, 197, 216, 217, 218, 219, 220],
  nucleotides: [253, 254, 259, 260, 261, 265, 266, 271, 272, 276, 290, 291, 294, 299, 300, 302, 306, 307, 311, 312, 317, 318, 320, 322, 323, 324, 325, 326, 328, 329, 330, 331, 332, 334, 335, 336, 337, 338, 340, 341, 342, 343, 344, 371, 389, 418, 436, 437, 438, 439, 440, 441, 455, 456, 457, 458, 459, 483, 484, 489, 490, 495, 496, 497, 501, 502, 506, 514, 524, 529, 530, 532, 537, 538, 542, 543, 544, 547, 548, 550, 552, 553, 554, 555, 556, 558, 559, 560, 561, 562, 564, 565, 566, 567, 568, 570, 571, 572, 573, 574, 601, 619, 648, 666, 667, 668, 669, 670, 671, 685, 686, 687, 688, 689],
  // nucleotides1: [253, 254, 259, 260, 261, 265, 266, 271, 272, 276, 290, 291, 294, 299, 300, 302, 306, 307, 311, 312, 317, 318, 320, 322, 323, 324, 325, 326, 328, 329, 330, 331, 332, 334, 335, 336, 337, 338, 340, 341, 342, 343, 344],
  // nucleotides2: [371, 389, 418, 436, 437, 438, 439, 440, 441, 455, 456, 457, 458, 459],
  // nucleotides3: [483, 484, 489, 490, 495, 496, 497, 501, 502, 506, 514, 524, 529, 530, 532, 537, 538, 542, 543, 544, 547, 548, 550, 552, 553, 554, 555, 556, 558, 559, 560, 561, 562, 564, 565, 566, 567, 568, 570, 571, 572, 573, 574],
  // nucleotides4: [601, 619, 648, 666, 667, 668, 669, 670, 671, 685, 686, 687, 688, 689],
  helixBasePairs: [608, 609, 631, 632, 654, 655, 677, 678, 700, 701, 724, 746, 747, 769, 770, 793, 815, 816, 839, 861, 862, 884, 907, 908, 930, 931, 954, 976],
  helixDesign: [715, 733, 739, 755, 763, 764, 777, 788, 789, 798, 799, 819, 820, 834, 835, 844, 845, 855, 856, 869, 877, 893, 899, 917, 921, 940, 944, 962, 968, 984, 992, 1005, 1006, 1016, 1017, 1026, 1027, 1041, 1042, 1043, 1047, 1048],
  // helixDesign: [715, 733, 738, 756, 761, 762, 763, 764, 777, 778, 779, 788, 789, 798, 799, 819, 820, 834, 835, 844, 845, 852, 853, 854, 855, 856, 869, 870, 871, 875, 894, 898, 917, 921, 940, 944, 963, 967, 986, 990, 1005, 1006, 1007, 1008, 1009, 1013, 1014, 1015, 1016, 1017, 1026, 1027, 1041, 1042, 1043, 1047, 1048],
  humanityStick: [1037, 1038, 1060, 1083, 1106, 1198, 1221, 1244, 1245],
  humanHeight: [1150, 1152, 1153, 1154],
  humanDesign: [1045, 1068, 1089, 1090, 1091, 1092, 1093, 1111, 1113, 1114, 1115, 1117, 1133, 1136, 1137, 1138, 1141, 1159, 1160, 1161, 1182, 1184, 1205, 1207, 1228, 1230, 1250, 1251, 1253, 1254],
  humanPopulation: [1120, 1122, 1123, 1124, 1125, 1144, 1145, 1146, 1147, 1148, 1149, 1167, 1168, 1170, 1171, 1172, 1190, 1191, 1192, 1194, 1195, 1213, 1214, 1215, 1216, 1217, 1218, 1236, 1237],
  planets: [1290, 1291, 1292, 1298, 1313, 1314, 1315, 1317, 1319, 1323, 1325, 1327, 1329, 1331, 1333, 1336, 1337, 1338, 1348, 1350, 1352, 1354, 1371, 1373],
  // telescopeGraphic: [1381, 1382, 1383, 1384, 1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 1394, 1395, 1396, 1397, 1398, 1399, 1404, 1405, 1406, 1407, 1408, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1418, 1419, 1420, 1421, 1422, 1427, 1445, 1450, 1468, 1473, 1477, 1487, 1491, 1496, 1500, 1501, 1509, 1510, 1514, 1519, 1523, 1525, 1531, 1533, 1537, 1542, 1546, 1549, 1553, 1556, 1560, 1569, 1573, 1575, 1579, 1592, 1597, 1602, 1615, 1625],
  // telescopeGraphic: [1388, 1389, 1390, 1391, 1392, 1404, 1405, 1406, 1407, 1408, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1418, 1419, 1420, 1421, 1422, 1427, 1445, 1450, 1468, 1473, 1477, 1487, 1491, 1496, 1500, 1501, 1509, 1510, 1514, 1519, 1523, 1525, 1531, 1533, 1537, 1542, 1546, 1549, 1553, 1556, 1560, 1569, 1573, 1575, 1579, 1592, 1597, 1602, 1615, 1625],
  telescopeGraphic: [1388, 1389, 1390, 1391, 1392, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1430, 1431, 1432, 1440, 1441, 1442, 1452, 1453, 1465, 1466, 1474, 1475, 1477, 1487, 1489, 1490, 1496, 1497, 1500, 1501, 1509, 1510, 1513, 1514, 1519, 1523, 1525, 1531, 1533, 1537, 1542, 1546, 1549, 1553, 1556, 1560, 1569, 1573, 1575, 1579, 1592, 1597, 1602, 1615, 1625],
  // telescopeMirror: [1388, 1389, 1390, 1391, 1392, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1430, 1431, 1432, 1440, 1441, 1442, 1452, 1453, 1465, 1466, 1474, 1475,1489, 1490, 1496, 1497,1513, 1514, 1519, 1537, 1542,1560],
  // telescopeLightPath: [1477, 1487,1500, 1501, 1509, 1510,1523, 1525, 1531, 1533,1546, 1549, 1553, 1556,1569, 1573, 1575, 1579, 1592, 1597, 1602, 1615, 1625],
  telescopeStick: [1634, 1652, 1657, 1658, 1659, 1660, 1672, 1673, 1674, 1675],
  telescopeDiameter: [1640, 1643, 1645, 1663, 1664, 1665, 1666, 1667, 1669],
}

const areciboPlus = {
  lsdmX: [69, 71, 73, 75, 77, 79, 81, 83, 86, 89, 216, 217, 218, 219, 220, 322, 323, 324, 325, 326, 328, 329, 330, 331, 332, 334, 335, 336, 337, 338, 340, 341, 342, 343, 344, 437, 438, 439, 440, 441, 455, 456, 457, 458, 459, 552, 553, 554, 555, 556, 558, 559, 560, 561, 562, 564, 565, 566, 567, 568, 570, 571, 572, 573, 574, 667, 668, 669, 670, 671, 685, 686, 687, 688, 689, 690, 691, 976, 1120, 1150, 1669],
}

function areciboMonolith() {
  const gridSize = vert(23, 73)
  const gridInsetScale = .5
  GRID = new Grid({
    protoParent: FRAME,
    gridSize: gridSize,
    insetScale: gridInsetScale,
  })
  FRAME.setGrid(GRID)

  const groups = arecibo.map((indices, key) => {
    const group = GRID.groupFromIndices(indices)
    let dir = Direction.All
    let isMax = true
    console.error(key)
    if (key.includes(`numbers`)
      || key.includes(`dna`)
      || key.includes(`nucleotides`)
      || key.includes(`helixBasePairs`)
      || key.includes(`Stick`)
      || key.includes(`humanHeight`)
      || key.includes(`humanPopulation`)
      || key.includes(`telescopeDiameter`)
    ) {
      // console.log(`found match`, key)
      // dir = Direction.Vertical
      isMax = false
    }

    group.createPerimiters(dir, isMax)
    return group
  })
  console.log(`groups`, groups)

  globalOutset = 0.

  GRID.nestleShapes(0)

  const lsdmXCells = OpArray.format(areciboPlus.lsdmX.map(i => GRID.cellAt(i)))
  const notLSDMXCells = GRID.takenCells.exclude(lsdmXCells, 'id')

  console.warn(`lsdmXCells`, lsdmXCells.map(c => c.id))
  console.warn(`notLSDMXCells`, notLSDMXCells.map(c => c.id))

  //MARK: NUMBERS SECTION
  groups.numbers.cutIslands({
    profile: Profile.jIn,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.numbers.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.numbers.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.None,
  })
  groups.numbers.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Vertical,
  })

  //MARK: DNA SECTION
  groups.dna.cutIslands({
    profile: Profile.rOut,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.dna.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.dna.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.dna.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Vertical,
  })

  //MARK: NUCLEOTIDES SECTION
  groups.nucleotides.cutIslands({
    profile: Profile.jIn,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.nucleotides.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.nucleotides.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.nucleotides.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Vertical,
  })


  //MARK: HELIX SECTION
  groups.helixBasePairs.cutIslands({
    profile: Profile.rOut,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.helixBasePairs.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.helixBasePairs.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.helixBasePairs.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Vertical,
  })
  groups.helixDesign.cutIslands({
    profile: Profile.rOut,
    layerStart: 1,
    layerEnd: 0,
    amount: 1,
  })

  //MARK: HUMAN SECTION
  groups.humanityStick.cutIslands({
    profile: Profile.jOut,
    layerStart: .5,
    // layerEnd: -.5,
    // amount: 1,
  })
  groups.humanHeight.cutIslands({
    profile: Profile.jIn,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.humanHeight.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Vertical,
  })
  groups.humanHeight.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.humanHeight.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Horizontal,
  })

  groups.humanDesign.cutIslands({
    profile: Profile.rOut,
    layerStart: 1.5,
    // layerEnd: 1,
    amount: 1,
  })
  groups.humanPopulation.cutIslands({
    profile: Profile.jIn,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.humanPopulation.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Vertical,
  })
  groups.humanPopulation.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.humanPopulation.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Horizontal,
  })

  //MARK: PLANETS SECTION
  groups.planets.cutIslands({
    profile: Profile.rOut,
    layerStart: 1.5,
    // layerEnd: 0,
    amount: 1,
  })

  //MARK: TELESCOPE SECTION
  groups.telescopeGraphic.cutIslands({
    profile: Profile.rOut,
    layerStart: 1,
    layerEnd: 0,
    amount: 1,
  })
  groups.telescopeStick.cutIslands({
    profile: Profile.jOut,
    layerStart: .5,
    // layerEnd: -.5,
    // amount: 1,
  })

  groups.telescopeDiameter.cutIslands({
    profile: Profile.jIn,
    layerStart: 1.5,
    layerEnd: 1,
    amount: 1,
  })
  groups.telescopeDiameter.cutIslands({
    profile: Profile.iOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Vertical,
  })
  groups.telescopeDiameter.cutIslands({
    profile: Profile.jIn,
    layerStart: 0.625,
    layerEnd: 0.,
    amount: 1,
    selection: lsdmXCells,
    direction: Direction.Horizontal,
  })
  groups.telescopeDiameter.cutIslands({
    profile: Profile.rOut,
    layerStart: 0.75,
    layerEnd: 0.,
    amount: 1,
    selection: notLSDMXCells,
    direction: Direction.Horizontal,
  })

  FRAME.setBackGridGroup(0, true)





  // let grid2 = new Grid({
  //   protoParent: FRAME,
  //   gridSize: gridSize,
  //   insetScale: gridInsetScale,
  // })

  // grid2.svgElt.parent(FRAME.svgElt)

  // const groups2 = areciboPlus.map((indices, key) => {
  //   const group = GRID.groupFromIndices(indices)
  //   let dir = Direction.Cardinal
  //   let isMax = true
  //   console.error(key)
  //   // if (key.includes(`numbers`)
  //   //   || key.includes(`dna`)
  //   //   || key.includes(`nucleotides`)
  //   //   || key.includes(`helixBasePairs`)
  //   //   || key.includes(`Stick`)
  //   //   || key.includes(`humanHeight`)
  //   //   || key.includes(`humanPopulation`)
  //   //   || key.includes(`telescopeDiameter`)
  //   // ) {
  //   //   // console.log(`found match`, key)
  //   //   // dir = Direction.Vertical
  //   //   isMax = false
  //   // }

  //   group.createPerimiters(dir, isMax)
  //   return group
  // })
  // console.log(`groups2`, groups2)

  // grid2.nestleShapes(0)

  //MARK: NUMBERS SECTION
  // groups2.lsdmX.cutIslands({
  //   profile: Profile.rOut,
  //   layerStart: .5,
  //   layerEnd: 0.,
  //   amount: 1,
  // })


  // GRID.showCellsDebug(false)

  console.log(`Features`, FTS)
  console.log('all layers', S.allLayers)
  console.log(`GRID`, GRID)
  console.warn(`cellSize`, GRID.cellSize)
  console.warn(`GRID cells`, gridSize)
}


// MARK: Testing Functions
// FUNC: gridTests2()
function gridTests2() {
  //                                                                  //NOTE: 1. Calculate GridX
  let gridX = R.random_int(1, 10)
  // gridX = R.random_int(10, 20)
  gridX = 8
  //   
  let gridYMult = 4
  //NOTE: 2. Calculate GridY
  let gridSize = vert(gridX, round(gridX * gridYMult))
  // gridSize = vert(23, 73)
  //                                                                  //NOTE: 3. Calculate inset (bezel size)

  let insetMultiplier = round((gridYMult - 2) * (gridX) * 2)
  insetMultiplier = .125
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
  // let gridInset = R.random_num(0.75, 0.95)

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
    //   dashArray: OpArray.randomIntArray(R.random_int(3, 12), range(1, 9)).map((n, i) => i % 2 === 0 ? R.random_int(1, 3) : n)
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

    // group0 = GRID.groupFromIndices([0, 2, 10, 13, 16, 24, 26])


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

    // group4 = GRID.randGroup({ amount: 0.5 })
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

  globalOutset = 0.
  //                                                                     //NOTE: 9. (Calculate Each Group's Direction)  
  //NOTE: calc per group: possibleOrdinalConnections, current hor/vert islands, etc...
  //                                                                     //NOTE: 10. Create Perimeters for Each Group
  console.groupCollapsed(`createPerimiters`)
  group0?.createPerimiters(Direction.Cardinal)
  group1?.createPerimiters(Direction.All)
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
  //   layerStart: 62 / 64,
  //   layerEnd: 32 / 64,
  //   // dilationEnd: 1,
  //   amount: 1,
  //   loftScale: 8 / 8,
  //   // backing: true,
  //   // direction: Direction.Horizontal,
  // })
  group0?.cutIslands({
    profile: Profile.rOut,
    isOutsetCut: true,
    layerStart: 60 / 64,
    // layerEnd: 16 / 64,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.All
    // backing: true,
  })
  // group0?.cutIslands({
  //   profile: Profile.rOut,
  //   isOutsetCut: true,
  //   layerStart: 8 / 64,
  //   layerEnd: 0 / 64,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   direction: Direction.Vertical,
  // })
  // group0?.cutIslands({
  //   profile: Profile.jIn,
  //   isOutsetCut: true,
  //   layerStart: 0 / 64,
  //   layerEnd: -16 / 64,
  //   amount: 1,
  //   loftScale: 1 / 1,
  //   // direction: Direction.Vertical
  //   // backing: true,
  // })

  //MARK: group1
  // group1?.cutIslands({
  //   profile: Profile.jOut,
  //   // isOutsetCut: true,
  //   layerStart: 10 / 20,
  //   // layerEnd: 10 / 20,
  //   // dilationEnd: 1,
  //   amount: 1,
  //   loftScale: 8 / 8,
  //   // direction: Direction.Horizontal,
  //   // backing: true,
  // })

  group1?.cutIslands({
    profile: Profile.jIn,
    // isOutsetCut: true,
    layerStart: 60 / 64,
    // layerEnd: 0 / 20,
    // dilationEnd: 1,
    amount: 1,
    loftScale: 8 / 8,
    // direction: Direction.Horizontal,
    // backing: true,
  })


  //MARK: group2
  group2?.cutIslands({
    profile: Profile.jOut,
    // isOutsetCut: true,
    layerStart: 48 / 64,
    // layerEnd: 10 / 20,
    amount: 1,
    loftScale: 1,
    // direction: Direction.Horizontal
    // backing: true,
  })

  // group2?.cutIslands({
  //   profile: Profile.jOut,
  //   // isOutsetCut: true,
  //   layerStart: 5 / 20,
  //   // layerEnd: 0 / 20,
  //   amount: 1,
  //   loftScale: 1,
  //   // direction: Direction.Horizontal
  //   // backing: true,
  // })

  // group2?.cutIslands({
  //   profile: Profile.jIn,
  //   // isOutsetCut: true,
  //   layerStart: 2 / 20,
  //   // layerEnd: 10 / 20,
  //   amount: 1,
  //   loftScale: 1,
  //   // direction: Direction.Horizontal
  //   // backing: true,
  // })




  //MARK: group3
  group3?.cutIslands({
    profile: Profile.jOut,
    // isOutsetCut: true,
    layerStart: 32 / 64,
    // layerEnd: 0 / 20,
    amount: 1,
    loftScale: 1,
    // direction: Direction.Horizontal
    // backing: true,
  })
  group3?.cutIslands({
    profile: Profile.jIn,
    // isOutsetCut: true,
    layerStart: 16 / 64,
    // layerEnd: 0 / 20,
    amount: 1,
    loftScale: 1,
    direction: Direction.Vertical
    // backing: true,
  })


  //MARK: group4
  group4?.cutIslands({
    profile: Profile.rOut,
    // isOutsetCut: true,
    layerStart: 60 / 64,
    // layerEnd: 0 / 20,
    amount: 1,
    loftScale: 1 / 1,
    // direction: Direction.Vertical
  })

  // console.log(`takenCells`, GRID.takenCells.map(c => c.index))
  console.groupEnd()
  console.log(``)
  //                                                                        //NOTE: 14. set backGridGroup
  console.groupCollapsed(`setBackGridGroup`)
  FRAME.setBackGridGroup(R.random_int(0, 0), R.random_bool(1))
  console.groupEnd()
  console.log(``)

  // console.log(group1.perimeterIslands[1].subIslands[0].shapes[0].insetSubShapes)
  // FRAME.backGrid.showCellsDebug()
  // FRAME.backGrid.showShapesDebug()
  // GRID.showCellsDebug()
  // GRID.showShapesDebug()

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
  console.warn(`GRID cells`, gridSize)
  console.warn(`BGRID`, BGRID)
  console.warn(`GRID Ratio: ${gridRatio / 2}:1`)
  console.warn(`gridInsetScale:`, gridInsetScale)
  console.warn(`GRID.insetAmount.x:`, GRID.insetAmount.x)
  console.warn(`GRID size:`, GRID.insetSize)
  console.warn(`Groups OrdinalConnects`, GRID.groups.map(g => g.ordinalConnections))
  // console.error(`cellSpansBetween`, GRID.cellSpanBetween(0, 161))
  console.error(`filters`, S.Effects.db)

  console.warn(`FRAME.backGroup.padding:`, FRAME.backGroup.padding)
  // console.log(GRID.cellRows.flat().map(cell => cell.center))
}

// MARK: DRAWING FUNCS
// FUNC: globalAnimation()
function globalAnimation() {
  // let desiredFrameRate = 10
  // let frameDuration = 1000 / desiredFrameRate
  // let previousTime = 0

  // //ARROW:animate()
  // function animate(currentTime){
  //   if (currentTime - previousTime >= frameDuration) {
  //     // Update animation logic here
  //     console.log('Animating frame', currentTime)

  //     previousTime = currentTime
  //   }
  //   requestAnimationFrame(animate)
  // }

  // requestAnimationFrame(animate)



  globalControls.shadAngle = (millis() / (1000 * ROT)) * 360 % 360
  const shadeVect = createVector(1, 0).rotate(radians(globalControls.shadAngle))

  S.Effects.db.forEach((filter) => {
    filter = filter[1]
    filter.updateOffsets(shadeVect)
  })

  //create new shadows for every filter
  // update every filter with new shadows
  // updateDisplay for every shapeGroup


  // drawObjects()
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