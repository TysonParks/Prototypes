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