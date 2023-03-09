//-------------------------------------------------------------------------
//FUNC: FUNCTION TESTS
function functionTestPrint() {
  // print(values16x16bit)
  // print(values21x12bit)

  print(tokenData.hash)

  // print(values32x8bit)
  // print(values64x4bit)

  // print(calculateFeatures(tokenData))
  // print(sortedGridIndex(4, 8))
  // print(gridRowIndices(4, 8))
  // print(gridColumnIndices(4, 8))
  // print(similarNeighborsIndices(8))
  // print(similarNeighborsIndices(16))
  // print(similarNeighborsIndices(32))
  // similarSlicedNeighborsIndices(16)
  // similarGridNeighbors(16)

  // NOTE: hash display
  // print(printInputToGridRows(values32x8bit, 4, 8))
  // print(pointsToHex5s(similarGridNeighbors(32, 4, 8, values32x8bit)))

  // print(Direction.UpRight.value)
  // let corner = Corner.TopLeft
  // corner = new Corner(1.5)
  // corner = new Corner(1.5)
  // print(corner)
  // print(rangeArray(2))

  // let init1 = [[3, 4], [6, 9]]
  // let init2 = [{ x: 6, y: 3 }, { x: 12, y: 8 }]
  // let init3 = [vert(4, 7), vert(12, 3)]
  // let init4 = { start: [6, 1], end: [9, 4] }
  // let init5 = { start: vert(23, 86), end: vert(17, 7) }
  // let init6 = { start: { x: 16, y: 33 }, end: { x: 26, y: 35 } }
  // let init7 = { start: { x: 16, y: 33 }, end: { x: 26, y: 35 } }

  // let segment10 = new Segment(init1)
  // print('segment10')
  // print(segment10)
  // let segment11 = new Segment(init2)
  // print('segment11')
  // print(segment11)
  // let segment12 = new Segment(init3)
  // print('segment12')
  // print(segment12)
  // let segment13 = new Segment(init4)
  // print('segment13')
  // print(segment13)
  // let segment14 = new Segment(init5)
  // print('segment14')
  // print(segment14)
  // let segment15 = new Segment(init6)
  // print('segment15')
  // print(segment15)
  // let segment16 = new Segment(...init1)
  // print('segment16')
  // print(segment16)
  // let segment17 = new Segment(...init2)
  // print('segment17')
  // print(segment17)
  // let segment18 = new Segment(...init3)
  // print('segment18')
  // print(segment18)

  // let startPoint = vert(1, 2)
  // let endPoint = vert(3, 4)
  // let segment20 = new Segment([startPoint, endPoint])
  // print('segment20')
  // print(segment20)
  // let segment2 = new Segment({ start: startPoint, end: endPoint })
  // print('segment2')
  // print(segment2)
  // print(segment2)

  // let rightMove = Direction.Right.moveCoord
  // print(rightMove)

  // let newVert = vert([4, 7])
  // print(newVert)
  // let newVert1 = vert(12, 4)
  // print(newVert1)
  // let newVert2 = vert({ x: 9, y: 13 })
  // print(newVert2)

  // let array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  // let slice = array.splice(3, 2)
  // print(array)
  // print(slice)
  // let array2 = [7, 45, 2, 8, 34, 5, 2, 7, 8]
  // print(array2)
  // let set = [...new Set(array2)]
  // print(set)
  // let opArray = OpArray.from(array)
  // print(opArray)
  // let opArray2 = new OpArray(5, 87, 6, 1)
  // print(opArray2)
  // print(opArray.lastIndex())
  // print(opArray2.lastIndex())
  // print(opArray.randomIndex)
  // print(opArray.randomElement)
  // let randArray = opArray.shuffle()
  // print(randArray)
  // let reducedArray = opArray.randomReduce(.2)
  // print(reducedArray)
  // print(opArray.randomIndex)
  // print(opArray.randomIndex)
  // print(opArray.randomIndex)
  // print(opArray.randomIndex)
  // print(opArray.randomIndex)

  const protoStyleOptions = {
    'None': 0.3,
    'Grid': 0.3,
    'Stacks': 0.2,
    'Complex': 0.3,
    'Object': 0.1,
    'Stripes': 0.1,
  }

  const protoGrammarOptions = [
    ['CombStart', 0.4, 'comb = random(keep, drop)'],
    ['PuzzleStart', 0.3, 'puzzle = random(points)'],
    ['SnakeStart', 0.2, 'snake = random(things)'],
    ['PillStart', 0.8],
  ]

  // NOTE: 2DArray Tests
  // print('2DArray Tests')
  // const upRad = -PI / 2
  // print(upRad)
  // let deg = radianToDegree(upRad)
  // print(deg)
  // deg = normalizeDegree(deg)
  // print(deg)
  // print(normRadToDeg(upRad))

  // const simpleGrid = OpArray.from([
  //   OpArray.from(['a', 'b', 'c']),
  //   OpArray.from(['d', 'e', 'f']),
  //   OpArray.from(['g', 'h', 'i']),
  // ])
  // print(simpleGrid)
  // print(simpleGrid.is2D)
  // print('rotations')
  // print(simpleGrid.rotated2D(90))
  // print(simpleGrid.rotated2D(180))
  // print(simpleGrid.rotated2D(270))
  // print('flips')
  // print(simpleGrid.flipped2D("horizontal"))
  // print(simpleGrid.flipped2D("vertical"))
  // print(simpleGrid.flipped2D("negOrdinal"))
  // print(simpleGrid.flipped2D("posOrdinal"))

  // const directionHor = Direction.Horizontal
  // const directionHor2 = Direction.All
  // print(Direction.None)
  // print(Direction.All)
  // print(Direction.Ordinal)
  // print(Direction.Cardinal)
  // print(directionHor)
  // print(directionHor2)

  // print(simpleGrid.flipped2D(Direction.Horizontal))
  // print(simpleGrid.flipped2D(Direction.Vertical))
  // print(simpleGrid.flipped2D(Direction.NegOrdinal))
  // print(simpleGrid.flipped2D(Direction.PosOrdinal))

  // print('OpArray equality test')
  // const simpleGridCopy = simpleGrid.copy
  // print(simpleGrid)
  // print(simpleGridCopy)

  // print(simpleGrid.equals(simpleGridCopy))

  // const ordered = OpArray.from([1, 2, 3, 4, 5])
  // const unordered = OpArray.from([3, 1, 4, 2, 5])
  // print(ordered.equals(unordered))
  // print(ordered.equalsSorted(unordered))


  // NOTE: Turn Enum Tests
  // print('Turn Enum Tests')
  // const leftTurn = Turn.L
  // const noTurn = Turn.S
  // const rightTurn = Turn.R
  // print(leftTurn)
  // print(noTurn)
  // print(rightTurn)

  // print('Turn.from()')
  // const seg1 = segment([0, 0], [1, 0])
  // const seg2 = segment([0, 0], [0, 1])
  // const segPair = [seg1, seg2]
  // const newTurn = Turn.from(segPair)
  // print(seg1.direction)
  // print(seg1.direction.next(2))
  // print(seg1.direction.previous(2))
  // print(seg2.direction.names)
  // print(seg2.direction.vals)
  // print(newTurn)

  // let protoGrammarEnum = new Option('Grammar Style', protoGrammarOptions)
  // print(protoGrammarEnum)
  // print(protoGrammarEnum.category)
  // print(protoGrammarEnum.feature(0.1))
  // print(protoGrammarEnum.name(0.3))
  // print(protoGrammarEnum.value(0.6))
  // print(protoGrammarEnum.chance('PillStart'))

  // let hash = R.random_hash()
  // print(hash)

  // print(S)

  // NOTE: Direction Multiples Tests
  // print('Direction Multiples Tests')
  // const dirA = Direction.Up
  // const dirB = Direction.DownRight
  // const dirC = Direction.Horizontal

  // print(dirA)
  // print(dirC)
  // print(dirA.directions)
  // print(dirC.directions)

  // print(dirA.isSingle)
  // print(dirC.isSingle)
  // print(dirA.name)
  // print(dirC.name)
  // print(dirA.names)
  // print(dirC.names)
  // print('')
  // print('value tests')
  // print(dirA.value)
  // print(dirC.value)
  // print(dirA.previous)
  // print(dirC.previous)
  // print(dirA.next)
  // print(dirC.next)
  // print(dirA.adjacents)
  // print(dirC.adjacents)
  // print('')
  // print('is tests')
  // print(dirA.isHorizontal)
  // print(dirC.isHorizontal)
  // print(dirA.isVertical)
  // print(dirC.isVertical)
  // print(dirA.isCardinal)
  // print(dirC.isCardinal)
  // print(dirA.isOrdinal)
  // print(dirC.isOrdinal)
  // print('')
  // print('allAre tests')
  // print(dirA.allAreHorizontal)
  // print(dirC.allAreHorizontal)
  // print(dirA.allAreVertical)
  // print(dirC.allAreVertical)
  // print(dirA.allAreCardinal)
  // print(dirC.allAreCardinal)
  // print(dirA.allAreOrdinal)
  // print(dirC.allAreOrdinal)
  // print('')
  // print('equals tests')
  // const dirD = Direction.DownRight
  // const dirE = Direction.Horizontal
  // const dirF = Direction.Cardinal

  // print(dirA)
  // print(dirB)
  // print(dirC)
  // print(dirD)
  // print(dirE)
  // print(dirF)
  // print(dirA.equals(dirF))
  // print(dirB.equals(dirD))
  // print(dirC.equals(dirE))

  // NOTE: Direction heading tests
  // print('Direction heading tests')
  // let dirUp = Direction.Up
  // let dirRight = Direction.Right
  // let dirDown = Direction.Down
  // let dirLeft = Direction.Left
  // let dirOrd = Direction.Ordinal
  // let dirCard = Direction.Cardinal
  // print(dirUp)
  // print(dirRight)
  // print(dirDown)
  // print(dirLeft)
  // print(dirCard)

  // print(dirUp.angle)
  // print(dirCard.angle)

  // let upPointingSegment = segment([0, 0], [0, 1])
  // let rightPointingSegment = segment([0, 0], [1, 0])
  // let downPointingSegment = segment([0, 0], [0, -1])
  // let leftPointingSegment = segment([0, 0], [-1, 0])
  // print(upPointingSegment.angle)
  // print(rightPointingSegment.angle)
  // print(downPointingSegment.angle)
  // print(leftPointingSegment.angle)
  // print(dirUp.angle === upPointingSegment.angle)
  // print(dirRight.angle === rightPointingSegment.angle)
  // print(dirDown.angle === downPointingSegment.angle)
  // print(dirLeft.angle === leftPointingSegment.angle)

  // print(((-(0) - 1) % 4) + 2)
  // print(((-(1) - 1) % 4) + 2)
  // print(((-(2) - 1) % 4) + 2)
  // print(((-(3) - 1) % 4) + 2)

  // NOTE: Direction Tests
  // let up = PI / 2
  // let right = 0
  // let downLeft = PI * -3 / 4
  // print('Direction Tests')
  // print(up)
  // print(Direction.atAngle(up))
  // print(Direction.atAngle(right))
  // print(Direction.atAngle(downLeft))
  // print(`Direction rotations:`)
  // print(Direction.Down.rotated(-135))
  // print(Direction.Horizontal.rotated(45))
  // print(Direction.Horizontal.rotated(90))
  // print(Direction.Cardinal.rotated(45))
  // print(Direction.None.rotated(-135))
  // print(Direction.Up.rotated(90))
  // print(Direction.Up.rotated(180))
  // print(Direction.Up.rotated(270))
  // print(Direction.Up.rotated(360))
  // print(``)
  // print(`Direction flips:`)
  // print('horizontal')
  // print(Direction.Up.flipped('horizontal'))
  // print('vertical')
  // print(Direction.Up.flipped('vertical'))
  // print('negOrdinal')
  // print(Direction.Up.flipped('negOrdinal'))
  // print('posOrdinal')
  // print(Direction.Up.flipped('posOrdinal'))


  // NOTE: OpArray.boolOp tests
  // print('')
  // print('')
  // print('OpArray.boolOp tests')
  // const drctnArrA = OpArray.from([Direction.Up, Direction.Right, Direction.DownRight])
  // const drctnArrB = OpArray.from([Direction.Up, Direction.Right])
  // const drctnArrC = OpArray.from([Direction.Up, Direction.UpRight])
  // const drctnArrD = OpArray.from([Direction.Right, Direction.Up])
  // print(`includesMany: ${drctnArrA.includesMany(drctnArrB, ['vals'])}`)
  // print(`equals: ${drctnArrB.equals(drctnArrD, ['vals'])}`)
  // print(`equalsSorted: ${drctnArrB.equalsSorted(drctnArrD, ['vals'])}`)


  // const objArrA = OpArray.from([
  //   { val: 1, col: 'red', },
  //   { val: 4, col: 'green', },
  //   { val: 7, col: 'blue', },
  //   { val: 12, col: 'red', },
  // ])
  // const objArrB = OpArray.from([
  //   { val: 2, col: 'red', },
  //   { val: 4, col: 'green', },
  //   { val: 13, col: 'red', },
  // ])
  // const objArrC = OpArray.from([
  //   { val: 1, col: 'red', },
  //   { val: 4, col: 'green', },
  // ])
  // print(objArrA)
  // print(objArrB)
  // print(objArrC)
  // print(objArrA.union(objArrB, ['val']))
  // print(objArrA.exclude(objArrB, ['val']))
  // print(objArrA.symDiff(objArrB, ['val']))
  // print(objArrA.intersect(objArrB, ['val']))
  // print(objArrA.includesMany(objArrB, ['val']))
  // print(objArrA.includesMany(objArrC, ['val']))

  // const arrA = OpArray.from([1, 4, 7, 12, 14, 17, 20])
  // const arrB = OpArray.from([2, 4, 13, 14, 17, 19])
  // const arrC = OpArray.from([2, 4, 13, 14, 17, 19])
  // print(arrA)
  // print(arrB)
  // print(arrC)
  // print('union')
  // print(arrA.boolOp('union', arrB))

  // print('exclude')
  // print(arrA.boolOp('exclude', arrB))
  // print('symDiff')
  // print(arrA.boolOp('symDiff', arrB))
  // print('intersect')
  // print(arrA.boolOp('intersect', arrB))

  // print('equals test')
  // const objArrD = OpArray.from([
  //   { val: 1, col: 'red', },
  //   { val: 4, col: 'green', },
  // ])

  // print(objArrC.equals(objArrD, ['col']))


  // print(arrA.boolOp('equals', arrB))
  // print(arrC.equals(arrB))

  // NOTE: anglebetween tests
  // print(`anglebetween tests`)
  // const upRight = Direction.UpRight.angle
  // const downRight = Direction.DownRight.angle
  // const upLeft = Direction.UpLeft.angle
  // const downLeft = Direction.DownLeft.angle
  // const upRight = vert(1, -1)
  // const downRight = vert(1, 1)
  // const upLeft = vert(-1, -1)
  // const downLeft = vert(-1, 1)
  // print(upRight)
  // print(downRight)
  // print(upLeft)
  // print(downLeft)
  // print(``)
  // const DR = downRight.angleBetween(downRight)
  // const DL = downLeft.angleBetween(downRight)
  // const UL = upLeft.angleBetween(downRight)
  // const UR = upRight.angleBetween(downRight)  

  // function rotCalc(vertex) {
  //   const angle = vert(1, 1).angleBetween(vertex)
  //   print(angle)
  //   return (4 - round(angle * 2 / PI)) % 4
  // }
  // print(rotCalc(downRight))
  // print(rotCalc(downLeft))
  // print(rotCalc(upLeft))
  // print(rotCalc(upRight))

  // print(``)

  // print(S.allLayers)
  // print(Look.test(vert(20, 20), 'frame'))
  // print(Vertex.mult(vert(4, 4), vert(2, 2)))
  // print(p5.Vector.mult(new p5.Vector(4, 4), new p5.Vector(2, 2)))

  // print(`frameWidth:${frameWidth}`)
  // print(`frameHeight:${frameHeight}`)
  // print(wix(1))
  // print(wixPx(2))

  // let protostyleEnum = new WeightedFeature('protoStyle', protoStyleOptions)
  // print(protostyleEnum)
  // print(protostyleEnum.none)
  // print(protostyleEnum.feature(0.9))
  // print(Object.hasOwn(protostyleEnum, 'options'))
  // print(protostyleEnum.hasOwnProperty('none'))
  // print('HERE')
  // print(multiplySVGCoords('M 0,0 L 5,0 L 3,1 L 4,3 L 3,3 L 5,5 L 2,4 L 1,5 L 2,2 L 0,3 L 1,1 Z', 100))
  // loopPath()
  // print(testShapeVerts[testShapeVerts.length - 1])
  // roundedCornerShape()
  // vertsToShape()
  // print(cuddle(3, "morph"))
  // print(px(53))
  // print(neuBoxShadowFactory())
  // print(gridStyle.enumChoice(2))
  // print(bxShCSS(1, 2, 3, 9, color(10), true));
  // print(txShCSS(1, 2, 3, color(20)));
  // print(drShCSS(1, 2, 3, color(40)));

  // print(neuBxShCSS(1, 2, color(30), color(80)));

  // print("neuBxShFX: " + neuBxShFX(backgroundColor, 16, 0.5, 100/16))
  // print("hiShSpreadfromCol: " + hiShSpreadfromCol(20));
  // print(range(0,4,1));
  // print(expSeries)
  // print("sliceExpSeries: " + sliceExpSeries(1,8))

  //NOTE: color slices tests
  // print('color slices tests')
  // print(createSlices(1, 30))
  // print(createSlices(5, 50))
  // print(createSlices(1, 100, 0.6))
  // print(cleanSlices(1, 200, 0.2))

  //NOTE: hiShSpreadfromCol() rewrite tests
  // print('hiShSpreadfromCol() rewrite tests')
  // let col = color(127)
  // print(col)
  // print(hiShSpreadfromCol())
  // print(complimentHighShadSpread())

  //NOTE: ProtoColor tests
  // print('ProtoColor tests')
  // let p5col = color(47, 128, 16)
  // print(p5col)
  // let protoCol = new ProtoColor(47, 128, 16)
  // print(protoCol)
  // print(protoCol.compliment)
  // let protoColHSB = protoColor('hsb(160, 100%, 50%)')
  // print('protoColHSB')
  // print(protoColHSB.red)
  // print(protoColHSB.green)
  // print(protoColHSB.blue)
  // print(protoColHSB.alpha)
  // print(protoColHSB.color)
  // print(protoColHSB.complement)
  // print(protoColHSB._getGreen())
  // print(protoColHSB._getRed())
  // print(protoColHSB.color)
  // print(red(protoColHSB))
  // print(green(protoColHSB))
  // print(blue(protoColHSB))
  // print(hue(protoColHSB))
  // print(saturation(protoColHSB))
  // print(brightness(protoColHSB))

  //NOTE: Shade tests
  // print('Shade tests')
  // print(Look.neuShade())
}

//-------------------------------------------------------------------------
//p Shape and Style TESTS

// FUNC: createPElements()
function createPElements() {
  // p4 = createDiv()
  // p1 = createDiv()
  // p2 = createDiv()
  // p3 = createDiv()
  // p5 = createDiv()
  // p6 = createDiv()
  // p7 = createDiv()
}

// FUNC: stylePElements()
function stylePElements() {
  // styleP4()
  // styleP1()
  // styleP2()
  // styleP3()
  // styleP5()
  // styleP7()
  // styleP6()
}

// FUNC: styleP4()
function styleP4() {
  p4.style("transform-style", "flat")
  p4.style(CS.rotate, "z 0deg")
  // p4.style("background", "linear-gradient(135deg, #c1c1c1, #e5e5e5)")
  p4.style(CS.boxShadow, neuBoxShadowFactory(backgroundColor, globalShadowVector, 8, 100 / 16))
  p4.style(CS.borderRadius, "30px / 50%")
  p4.size(300, 150)
  p4.position(50, 50)
}

function styleP1() {
  p1.style('background', acCol)
  // p1.style("background-blend-mode", "difference")
  p1.style(CS.boxShadow,
    neuBoxShadowCSS(16, 32, hiCol, shCol)
    + CS.comma +
    neuBoxShadowCSS(4, 4, acHiCol, acShCol, true)
  );
  // p1.style("background-blend-mode", "difference")
  p1.style(CS.borderRadius, "25px")
  p1.size(200, 100)
  p1.position(100, 75)
  // p.style(CS.filter, "blur(10px)")
  // p.style("border", "solid")
}

function styleP2() {
  p2.style(CS.rotate, "z 0deg")
  p2.style('background', "linear-gradient(145deg, #c1c1c1, #e5e5e5)")
  p2.style(CS.boxShadow, neuBoxShadowCSS(8, 16, acHiCol, acShCol))
  p2.style(CS.borderRadius, "25px")
  p2.size(100, 50)
  p2.position(150, 110)
}

function styleP3() {
  p3.style('background', bgCol)
  p3.style(CS.boxShadow, nmJ(4, 8, hiCol, shCol))
  p3.style(CS.borderRadius, "25px")
  p3.size(50, 10)
  p3.position(175, 90)
}

function styleP5() {
  p5.html("❖")
  p5.position(50, 350)
  p5.style(CS.textAlign, "center")
  p5.style(CS.fontSize, "250pt")
  // p5.style("background-image", "linear-gradient(145deg, #333333, #ffffff)")
  p5.style("background-clip", "text")
  p5.style("-webkit-background-clip", "text")
  p5.style('color', bgCol)
  // p5.style(CS.filter, "blur(10px)")
  // p5.style("text-shadow", neuBoxShadowFactory(backgroundColor, createVector(1, 1).setMag(32), 0.5, 100 / 16))
  p5.style(CS.textShadow, textShadowCSS(10, 10, 10, acShCol))
}

function styleP7() {
  p7.html("❖")
  p7.style('color', bgCol)
  p7.position(325, 750)
  p7.style(CS.textAlign, "center")
  p7.style(CS.fontSize, "250pt")
  // p7.style("text-shadow", neuBoxShadowFactory(backgroundColor, createVector(1, 1).setMag(32), 0.5, 100 / 16))
  p7.style(CS.textShadow, neuBxShFX(backgroundColor, 32, 0.5, 100 / 16))
  // p7.style(CS.filter, "blur(4px)")
  // p7.style('color', "#ff005588")
  // p7.style("CS.transform", "skewX(45deg)")
  // p7.style("mix-blend-mode", 'color')
}

function styleP6() {
  // p6.style(CS.rotate, "z 30deg")
  p6.style('background', bgCol)
  p6.style(CS.boxShadow,)
  p6.style(CS.borderRadius, "32px")
  p6.size(128, 128)
  p6.position(132, 620)
  p6.style(CS.boxShadow,
    join(
      [
        // bxShCSS(-0.5, 1, hiCol, shCol, true),
        // bxShCSS(-1, 1, hiCol, shCol, true),
        // bxShCSS(-2, 2, hiCol, shCol, true),
        // bxShCSS(-4, 4, hiCol, shCol, true),
        // bxShCSS(-8, 8, hiCol, shCol, true),
        // bxShCSS(-16, 16, hiCol, shCol, true),
        // bxShCSS(-32, 0, hiCol, shCol, true),
        // bxShCSS(-64, 128, hiCol, shCol, true),
        "8px 8px 16px #dddddd",
        // "-8px -8px 16px #ffffff",
        "inset 1px 1px 2px 0px #ffffff",
        // "inset 2px 2px 4px 0px #ffffff",
        // "inset 4px 4px 8px 0px #ffffff",
        "inset 8px 8px 16px 0px #ffffff",
        "inset -1px -1px 2px 0px #bbbbbb",
        "inset -8px -8px 16px 0px #bbbbbb",
        "inset 0px 0px 32px 16px #ffffff",
      ], CS.comma)
  );
}

//=========================================================================
// TODO: think about the significance of this again...
const directions = {
  IN: "in", OUT: "out",
}

function nmJ(direction = directions.out, offset, blurRadius = offset * 2, highlightColor, shadowColor) {


  switch (direction) {
    case directions.out:
      return nmBoxShadowCSS(offset, blurRadius, highlightColor, shadowColor)
    case directions.in:
      nmInsetBoxShadowCSS(offset, blurRadius, highlightColor, shadowColor)
  }
}

function drawSquiggle() {
  let svg = SVGElement
}

