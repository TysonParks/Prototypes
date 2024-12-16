//-------------------------------------------------------------------------
//FUNC: FUNCTION TESTS
function functionTestPrint() {
  DeBug.log('hash', tokenData.hash)

  DeBug.groupCollapsed(`TestMess`)


  //NOTE: p5.js vector tests
  // const vert1 = vert(1, 0)
  // const vert2 = vert(0, 1)
  // const vert1Vert2angle = vert1.angleBetween(vert2)
  // DeBug.log(`vert1Vert2angle`, vert1Vert2angle)

  //NOTE: modulo tests
  // DeBug.log(1.4 % 1)
  // DeBug.log(1.69 % 1)

  //NOTE: primeDivisors() test
  // DeBug.log('prime divisors 8', getDivisors(8))
  // DeBug.log('prime divisors 18', getDivisors(18))
  // DeBug.log('prime divisors 32', getDivisors(32))
  // DeBug.log('prime divisors 30', getDivisors(30))
  // DeBug.log('prime divisors 50', getDivisors(50))
  // DeBug.log('prime divisors 72', getDivisors(72))
  // DeBug.log('prime divisors 98', getDivisors(98))
  // DeBug.log('prime divisors 128', getDivisors(128))
  // DeBug.log('prime divisors 162', getDivisors(162))
  // DeBug.log('prime divisors 200', getDivisors(200))

  //NOTE: OpArray.shift() test
  // const arrayOne = OpArray.from([1, 2, 3, 4, 5])
  // const shiftArray = arrayOne.shifted(2)
  // const shiftArray2 = arrayOne.shifted(-2)
  // DeBug.log('shiftArray', shiftArray)
  // DeBug.log('shiftArray2', shiftArray2)

  // print(values16x16bit)
  // print(values21x12bit)

  //NOTE: Bounds Tests
  // DeBug.log(`Bounds Tests`)
  // const vert0 = vert(0, 0)
  // const vert1 = vert(1, 1)
  // const vert2 = vert(2, 2)
  // const vert3 = vert(3, 3)
  // const vert01 = vert(0, 1)
  // const vert10 = vert(1, 0)
  // const vert12 = vert(1, 2)
  // const vert23 = vert(2, 3)

  // const seg01 = segment(vert0, vert1)
  // DeBug.log(`seg01`, seg01)
  // const seg02 = segment(vert0, vert2)
  // DeBug.log(`seg02`, seg02)
  // const seg12 = segment(vert1, vert2)
  // DeBug.log(`seg12`, seg12)
  // const seg23 = segment(vert2, vert3)
  // DeBug.log(`seg23`, seg23)
  // const seg0112 = segment(vert01, vert12)
  // DeBug.log(`seg0112`, seg0112)
  // const seg0123 = segment(vert01, vert23)
  // DeBug.log(`seg0123`, seg0123)

  // const bounds0 = findBounds(vert0)
  // DeBug.log(`bounds0`, bounds0)
  // const boundsNested = findBounds(bounds0)
  // DeBug.log(`boundsNested`, boundsNested)
  // const bounds01 = findBounds(seg01)
  // DeBug.log(`bounds01`, bounds01)
  // const bounds02 = findBounds(seg02)
  // DeBug.log(`bounds02`, bounds02)
  // const bounds12 = findBounds(seg12)
  // DeBug.log(`bounds12`, bounds12)

  // const vert0InBounds01 = vertIsInsideBounds(vert0, bounds01)
  // DeBug.log(`vert0InBounds01`, vert0InBounds01)
  // const vert0InBounds01NotBorder = vertIsInsideBounds(vert0, bounds01, false)
  // DeBug.log(`vert0InBounds01NotBorder`, vert0InBounds01NotBorder)

  // const bounds01InBounds02 = boundsIsWithinTestBounds(bounds01, bounds02)
  // DeBug.log(`bounds01InBounds02`, bounds01InBounds02)
  // const bounds01InBounds12 = boundsIsWithinTestBounds(bounds01, bounds12)
  // DeBug.log(`bounds01InBounds12`, bounds01InBounds12)
  // const bounds01OverlapsBounds12 = boundsIsWithinTestBounds(bounds01, bounds12, true, true)
  // DeBug.log(`bounds01OverlapsBounds12`, bounds01OverlapsBounds12)

  // DeBug.log(`seg01.lineVector`, seg01.lineVector)
  // DeBug.log(`seg02.lineVector`, seg02.lineVector)
  // DeBug.log(`seg12.lineVector`, seg12.lineVector)

  // const seg01IsOverlappingSeg02 = seg01.isOverlappingWith({ seg: seg02 })
  // DeBug.log(`seg01IsOverlappingSeg02`, seg01IsOverlappingSeg02)

  // const seg01IntrsctSeg02 = seg01.intersectionWith(seg02)
  // DeBug.log(`seg01IntrsctSeg02`, seg01IntrsctSeg02)
  // const seg01INFIntrsctSeg02 = seg01.intersectionWith(seg02, true)
  // DeBug.log(`seg01INFIntrsctSeg02`, seg01INFIntrsctSeg02)

  // const seg01IntrsctSeg12 = seg01.intersectionWith(seg12)
  // DeBug.log(`seg01IntrsctSeg12`, seg01IntrsctSeg12)
  // const seg01INFIntrsctSeg12 = seg01.intersectionWith(seg12, true)
  // DeBug.log(`seg01INFIntrsctSeg12`, seg01INFIntrsctSeg12)

  // const seg01CollinearWithSeg02 = seg01.isCollinearWith(seg02)
  // DeBug.log(`seg01CollinearWithSeg02`, seg01CollinearWithSeg02)   // expect: true
  // const seg01CollinearWithSeg23 = seg01.isCollinearWith(seg23)
  // DeBug.log(`seg01CollinearWithSeg23`, seg01CollinearWithSeg23)   // expect: true
  // const seg01CollinearWithSeg0112 = seg01.isCollinearWith(seg0112)
  // DeBug.log(`seg01CollinearWithSeg0112`, seg01CollinearWithSeg0112)   // expect: false
  // const seg0112CollinearWithSeg0123 = seg0112.isCollinearWith(seg0123)
  // DeBug.log(`seg0112CollinearWithSeg0123`, seg0112CollinearWithSeg0123)   // expect: true

  // const vert0OrientToSeg01 = seg01.vertOrientation(vert0)
  // DeBug.log(`vert0OrientToSeg01`, vert0OrientToSeg01.name)
  // const vert1OrientToSeg01 = seg01.vertOrientation(vert1)
  // DeBug.log(`vert1OrientToSeg01`, vert1OrientToSeg01.name)

  // const vert01OrientToSeg01 = seg01.vertOrientation(vert01)
  // DeBug.log(`vert01OrientToSeg01`, vert01OrientToSeg01.name)
  // const vert10OrientToSeg01 = seg01.vertOrientation(vert10)
  // DeBug.log(`vert10OrientToSeg01`, vert10OrientToSeg01.name)

  //NOTE: OpArray Tests
  // DeBug.log(`OpArray Tests`)

  // let array = [`a`, `b`, `c`, `d`]
  // let opArray01 = OpArray.format(array)
  // DeBug.log(`array`, array)
  // DeBug.log(`opArray01`, opArray01)

  // let word = 'cell40'

  // let opArray02 = OpArray.format(word)
  // DeBug.log(`word`, word)
  // DeBug.log(`opArray02`, opArray02)

  // let union = opArray01.union(opArray02)
  // DeBug.log(`union`, union)
  // let idBoy1 = { name: `bro`, id: `b01` }
  // let idBoy2 = { name: `dude`, id: `b02` }
  // let idBoy3 = { name: `bruh`, id: `b03` }
  // let idBoy4 = { name: `boieee`, id: `b04` }


  // const idBoy1Values = Object.values(idBoy1).join('-')
  // DeBug.log(`idBoy1Values`, idBoy1Values)
  // DeBug.log(`idBoy1.values.string`, idBoy1Values.join('-'))

  // let boyToy1 = { start: idBoy1, end: idBoy2 }
  // let boyToy2 = { start: idBoy1, end: idBoy2 }
  // let boyToy3 = { start: idBoy3, end: idBoy4 }

  // let boyColxn1 = OpArray.format(boyToy1)
  // let boyColxn2 = OpArray.format(boyToy2)
  // let boyColxn3 = OpArray.format(boyToy3)

  // let boyColxn4 = boyColxn1.union(boyColxn2, `start`)
  // DeBug.log(`boyColxn4`, boyColxn4)
  // let boyColxn5 = boyColxn1.union(boyColxn3, `start`)
  // DeBug.log(`boyColxn5`, boyColxn5)

  // const boysWithNoRepeats = OpArray.format([idBoy1, idBoy2, idBoy3, idBoy4])
  // DeBug.log(`boysWithNoRepeats`, boysWithNoRepeats)
  // const boysWithRepeats = OpArray.format([idBoy1, idBoy2, idBoy3, idBoy4, idBoy2])
  // DeBug.log(`boysWithRepeats`, boysWithRepeats)
  // DeBug.log(`boysWithRepeats.kvArray`, boysWithRepeats.kvArray([`name`, 'id']))
  // DeBug.log(`boysWithRepeats.kvArray2`, boysWithRepeats.kvArray())
  // DeBug.log(`boysWithRepeats.kvMap`, boysWithRepeats.kvMap([`name`, 'id']))
  // DeBug.log(`boysWithRepeats.vcMap`, boysWithRepeats.valueCountMap([`name`, 'id']))

  // DeBug.log(`findDuplicateObjs01`, boysWithNoRepeats.duplicates(`id`)) // expect: []
  // DeBug.log(`findDuplicateObjs02`, boysWithRepeats.duplicates(`id`)) // expect: [idBoy2]
  // DeBug.log(`findDuplicateObjs03`, boysWithRepeats.duplicates([`name`, 'id'])) // expect: [idBoy2]

  // const numberArray01 = OpArray.format([3, 7, 4, 2, 6])
  // DeBug.log(`numberArray01`, numberArray01)
  // DeBug.log(`findDuplicateNumbers01`, numberArray01.duplicates()) // expect: []
  // const numberArray02 = OpArray.format([3, 7, 4, 2, 6, 7])
  // DeBug.log(`numberArray02`, numberArray02)
  // DeBug.log(`findDuplicateNumbers01`, numberArray02.duplicates()) // expect: [7]

  // const stringsArray01 = OpArray.format(['cow', 'dog', 'pig'])
  // DeBug.log(`stringsArray01`, stringsArray01)
  // DeBug.log(`findDuplicateStringss01`, stringsArray01.duplicates()) // expect: []
  // const stringsArray02 = OpArray.format(['cow', 'dog', 'pig', 'cow'])
  // DeBug.log(`stringsArray02`, stringsArray02)
  // DeBug.log(`findDuplicateStringss02`, stringsArray02.duplicates()) // expect: ['cow']


  // NOTE: ProtoSegment Tests
  // DeBug.log(`ProtoSegment Tests`)

  // const vert0 = vert(0, 0)
  // const vert1 = vert(1, 0)
  // const vert2 = vert(.25, 0)
  // const vert3 = vert(.75, 0)
  // const vert4 = vert(.75, 1)
  // const seg1 = protoSegment({ start: vert0, end: vert1, id: `seg1` })
  // const seg2 = protoSegment({ start: vert0, end: vert2, id: `seg2` })
  // const seg3 = protoSegment({ start: vert3, end: vert1, id: `seg3` })
  // seg1.assignCubicVert(vert2)
  // seg1.assignCubicVert(vert3)
  // DeBug.log(`seg1`, seg1)
  // DeBug.log(`seg1.cubicVerts`, seg1.cubicVerts)

  // DeBug.log(`subtest01`, vert0.sub(vert1).mag())
  // DeBug.log(`subtest02`, vert1.sub(vert0).mag())
  // DeBug.log(`vert2 is on line? (true)`, seg1.vertIsOnLine(vert2))
  // DeBug.log(`vert3 is on line? (true)`, seg1.vertIsOnLine(vert3))
  // DeBug.log(`vert4 is on line? (false)`, seg1.vertIsOnLine(vert4))

  // DeBug.log(`seg2 is collinear with seg3? (true)`, seg2.isCollinearWith(seg3))

  // DeBug.log(`distance between vert0 and vert1 (1)`, vert0.dist(vert1))
  // DeBug.log(`distance between vert1 and vert2 (0.75)`, vert1.dist(vert2))
  // DeBug.log(`current angleMode`, _angleMode)
  // angleMode(DEGREES)
  // DeBug.log(`current angleMode`, _angleMode)

  // NOTE: hash display
  // print(printInputToGridRows(values32x8bit, 4, 8))
  // print(pointsToHex5s(similarGridNeighbors(32, 4, 8, values32x8bit)))

  //NOTE: Direction Tests
  // DeBug.log(`Direction Tests`)

  // const dir1 = Direction.fromMoveCoord(vert(0, -1))
  // DeBug.log(`dir1 (expect up)`, dir1)
  // const dir2 = Direction.fromMoveCoord(vert(-1, 0))
  // DeBug.log(`dir2 (expect left)`, dir2)
  // const dir3 = Direction.fromMoveCoord(vert(1, 1))
  // DeBug.log(`dir3 (expect downRight)`, dir3)
  // const dir4 = Direction.fromMoveCoord(vert(-1, 1))
  // DeBug.log(`dir4 (expect downLeft)`, dir4)

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

  // const pi = PI
  // DeBug.log(`pi`, pi)
  // const sinCosPi = [sin(pi), cos(pi)]
  // DeBug.log(`sinCosPi`, sinCosPi)

  // const upRightAngle = PI * -1 / 4
  // DeBug.log(`upRightAngle`, upRightAngle)
  // const sinCosUpRightAngle = [sin(upRightAngle), cos(upRightAngle)]
  // DeBug.log(`sinCosUpRightAngle`, sinCosUpRightAngle)

  // const upToUpRightAngle = PI * -3 / 8
  // DeBug.log(`upToUpRightAngle`, upToUpRightAngle)
  // const sinCosUpToUpRightAngle = [sin(upToUpRightAngle), cos(upToUpRightAngle)]
  // DeBug.log(`sinCosUpToUpRightAngle`, sinCosUpToUpRightAngle)


  // const up = Direction.Up
  // DeBug.warn(`up`, up)
  // const upRadian = up.angle
  // DeBug.warn(`upRadian`, upRadian)
  // const upRadToValue = Direction.angleToValue(upRadian)
  // DeBug.log(`upRadToValue`, upRadToValue)
  // const upRadMovCoord = Direction.moveCoordFromAngle(upRadian)
  // DeBug.log(`upRadMovCoord`, upRadMovCoord)
  // DeBug.error(`upRadInternalMovCoord`, up.moveCoord)

  // const upRight = Direction.UpRight
  // DeBug.warn(`upRight`, upRight)
  // const upRightRadian = upRight.angle
  // DeBug.warn(`upRightRadian`, upRightRadian)
  // const upRightRadToValue = Direction.angleToValue(upRightRadian)
  // DeBug.log(`upRightRadToValue`, upRightRadToValue)
  // const upRightRadMovCoord = Direction.moveCoordFromAngle(upRightRadian)
  // DeBug.log(`upRightRadMovCoord`, upRightRadMovCoord)
  // DeBug.error(`upRightRadInternalMovCoord`, upRight.moveCoord)

  // const right = Direction.Right
  // DeBug.warn(`right`, right)
  // const rightRadian = right.angle
  // DeBug.warn(`rightRadian`, rightRadian)
  // const rightRadToValue = Direction.angleToValue(rightRadian)
  // DeBug.log(`rightRadToValue`, rightRadToValue)
  // const rightRadMovCoord = Direction.moveCoordFromAngle(rightRadian)
  // DeBug.log(`rightRadMovCoord`, rightRadMovCoord)
  // DeBug.error(`rightRadInternalMovCoord`, right.moveCoord)

  // const downRight = Direction.DownRight
  // DeBug.warn(`downRight`, downRight)
  // const downRightRadian = downRight.angle
  // DeBug.warn(`downRightRadian`, downRightRadian)
  // const downRightRadToValue = Direction.angleToValue(downRightRadian)
  // DeBug.log(`downRightRadToValue`, downRightRadToValue)
  // const downRightRadMovCoord = Direction.moveCoordFromAngle(downRightRadian)
  // DeBug.log(`downRightRadMovCoord`, downRightRadMovCoord)
  // DeBug.error(`downRightRadInternalMovCoord`, downRight.moveCoord)

  // const downRadian = Direction.Down.angle
  // DeBug.warn(`downRadian`, downRadian)
  // const downRadToValue = Direction.angleToValue(downRadian)
  // DeBug.log(`downRadToValue`, downRadToValue)
  // const downRadMovCoord = Direction.moveCoordFromAngle(downRadian)
  // DeBug.log(`downRadMovCoord`, downRadMovCoord)

  // const downLeftRadian = Direction.DownLeft.angle
  // DeBug.warn(`downLeftRadian`, downLeftRadian)
  // const downLeftRadToValue = Direction.angleToValue(downLeftRadian)
  // DeBug.log(`downLeftRadToValue`, downLeftRadToValue)
  // const downLeftRadMovCoord = Direction.moveCoordFromAngle(downLeftRadian)
  // DeBug.log(`downLeftRadMovCoord`, downLeftRadMovCoord)

  // const leftRadian = Direction.Left.angle
  // DeBug.warn(`leftRadian`, leftRadian)
  // const leftRadToValue = Direction.angleToValue(leftRadian)
  // DeBug.log(`leftRadToValue`, leftRadToValue)
  // const leftRadMovCoord = Direction.moveCoordFromAngle(leftRadian)
  // DeBug.log(`leftRadMovCoord`, leftRadMovCoord)

  // const upLeftRadian = Direction.UpLeft.angle
  // DeBug.warn(`upLeftRadian`, upLeftRadian)
  // const upLeftRadToValue = Direction.angleToValue(upLeftRadian)
  // DeBug.log(`upLeftRadToValue`, upLeftRadToValue)
  // const upLeftRadMovCoord = Direction.moveCoordFromAngle(upLeftRadian)
  // DeBug.log(`upLeftRadMovCoord`, upLeftRadMovCoord)

  // //Inter-Axial
  // const upToUpRight = new Direction(0.25)
  // DeBug.warn(`upToUpRight`, upToUpRight)
  // const upToUpRightRadian = -3 / 8 * PI
  // DeBug.warn(`upToUpRightRadian`, upToUpRightRadian)
  // const upToUpRightRadToValue = Direction.angleToValue(upToUpRightRadian)
  // DeBug.log(`upToUpRightRadToValue`, upToUpRightRadToValue)
  // const upToUpRightRadMovCoord = Direction.moveCoordFromAngle(upToUpRightRadian)
  // DeBug.log(`upToUpRightRadMovCoord`, upToUpRightRadMovCoord)
  // DeBug.error(`upRadInternalMovCoord`, upToUpRight.moveCoord)

  // const upRightToRight = new Direction(0.75)
  // DeBug.warn(`upRightToRight`, upRightToRight)
  // const upRightToRightRadian = upRightToRight.angle
  // // const upRightToRightRadian = -1 / 8 * PI
  // DeBug.warn(`upRightToRightRadian`, upRightToRightRadian)
  // const upRightToRightRadToValue = Direction.angleToValue(upRightToRightRadian)
  // DeBug.log(`upRightToRightRadToValue`, upRightToRightRadToValue)
  // const upRightToRightRadMovCoord = Direction.moveCoordFromAngle(upRightToRightRadian)
  // DeBug.log(`upRightToRightRadMovCoord`, upRightToRightRadMovCoord)
  // DeBug.error(`upRadInternalMovCoord`, upRightToRight.moveCoord)

  // const rightToDownRightRadian = 1 / 8 * PI
  // DeBug.warn(`rightToDownRightRadian`, rightToDownRightRadian)
  // const rightToDownRightRadToValue = Direction.angleToValue(rightToDownRightRadian)
  // DeBug.log(`rightToDownRightRadToValue`, rightToDownRightRadToValue)

  // const downRightToDownRadian = 3 / 8 * PI
  // DeBug.warn(`downRightToDownRadian`, downRightToDownRadian)
  // const downRightToDownRadToValue = Direction.angleToValue(downRightToDownRadian)
  // DeBug.log(`downRightToDownRadToValue`, downRightToDownRadToValue)

  // const downToDownLeftRadian = 5 / 8 * PI
  // DeBug.warn(`downToDownLeftRadian`, downToDownLeftRadian)
  // const downToDownLeftRadToValue = Direction.angleToValue(downToDownLeftRadian)
  // DeBug.log(`downToDownLeftRadToValue`, downToDownLeftRadToValue)

  // const downLeftToLeftRadian = 7 / 8 * PI
  // DeBug.warn(`downLeftToLeftRadian`, downLeftToLeftRadian)
  // const downLeftToLeftRadToValue = Direction.angleToValue(downLeftToLeftRadian)
  // DeBug.log(`downLeftToLeftRadToValue`, downLeftToLeftRadToValue)

  // const leftToUpLeftRadian = -7 / 8 * PI
  // DeBug.warn(`leftToUpLeftRadian`, leftToUpLeftRadian)
  // const leftToUpLeftRadToValue = Direction.angleToValue(leftToUpLeftRadian)
  // DeBug.log(`leftToUpLeftRadToValue`, leftToUpLeftRadToValue)

  // const upLeftToUpRadian = -5 / 8 * PI
  // DeBug.warn(`upLeftToUpRadian`, upLeftToUpRadian)
  // const upLeftToUpRadToValue = Direction.angleToValue(upLeftToUpRadian)
  // DeBug.log(`upLeftToUpRadToValue`, upLeftToUpRadToValue)

  // const allDir = Direction.All
  // DeBug.log(`allDir`, allDir)
  // const allDirections = allDir.directions
  // DeBug.log(`allDirections`, allDirections)
  // const allAngles = allDir.angle
  // DeBug.log(`allAngles`, allAngles)
  // const allAnglesDeg = allDir.angleDegrees
  // DeBug.log(`allAnglesDeg`, allAnglesDeg)

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
  // DeBug.log('Direction Multiples Tests')
  // const dirA = Direction.Up
  // const dirB = Direction.Vertical
  // const dirC = Direction.Horizontal
  // const dirD = Direction.Cardinal

  // DeBug.log('dirA: ', dirA.name, dirA.vals)
  // DeBug.log('dirB: ', dirB.name, dirB.vals)
  // DeBug.log('dirC: ', dirC.name, dirC.vals)
  // DeBug.log('dirD: ', dirD.name, dirD.vals)
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
  // DeBug.log('dirA.isHorizontal', dirA.isHorizontal)
  // DeBug.log('dirB.isHorizontal', dirB.isHorizontal)
  // DeBug.log('dirC.isHorizontal', dirC.isHorizontal)
  // DeBug.log('dirD.isHorizontal', dirD.isHorizontal)
  // DeBug.log('dirA.isEachHorizontal', dirA.isEachHorizontal)
  // DeBug.log('dirB.isEachHorizontal', dirB.isEachHorizontal)
  // DeBug.log('dirC.isEachHorizontal', dirC.isEachHorizontal)
  // DeBug.log('dirD.isEachHorizontal', dirD.isEachHorizontal)
  // DeBug.log('dirA.isVertical', dirA.isVertical)
  // DeBug.log('dirC.isVertical', dirC.isVertical)
  // DeBug.log('dirA.isCardinal', dirA.isCardinal)
  // DeBug.log('dirC.isCardinal', dirC.isCardinal)
  // DeBug.log('dirD.isCardinal', dirD.isCardinal)
  // DeBug.log('dirA.equals Cardinal', dirA.equals(Direction.Cardinal))
  // DeBug.log('dirC.equals Cardinal', dirC.equals(Direction.Cardinal))
  // DeBug.log('dirD.equals Cardinal', dirD.equals(Direction.Cardinal))

  // DeBug.log('dirA.isTwoOpposites', dirA.isTwoOpposites)
  // DeBug.log('dirB.isTwoOpposites', dirB.isTwoOpposites)
  // DeBug.log('dirC.isTwoOpposites', dirC.isTwoOpposites)
  // DeBug.log('dirD.isTwoOpposites', dirD.isTwoOpposites)

  // DeBug.log('dirA.opposites', dirA.opposites)
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

  DeBug.groupEnd()
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

// NOTE: Migrated following funcs from sketch.js on June 15, 2023
// MARK: Recent Test Functions
// #region Recent Test Functions
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
// #endregion


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

// NOTE: Removed from Frame on July 4th, 2023
// MARK: DeprecatedFrameMethods
class DeprecatedFrameMethods {
  //METH: 
  testElementsSetup() {
    this.testRect = createSVGElt('rect').id('testRect')
    this.testCircle1 = createSVGElt('circle').id('testCircle1')
    this.testCircle2 = createSVGElt('circle').id('testCircle2')
    this.testCircle3 = createSVGElt('circle').id('testCircle3')

    this.dropShadow1 = createFilter()
    this.dropShadow2 = createFilter()
    this.dropShadow3 = createFilter()
  }
  //METH: 
  testElementsDraw() {
    //COLORIZED
    // const shadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(0, 160, 0), inset: false };
    // const shadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(0, 255, 0), inset: false };
    // const shadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(0, 100, 100), inset: false };
    // const shadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(0, 255, 255), inset: false };
    // const shadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(140, 0, 140), inset: false };
    // const shadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 0, 250), inset: false };
    // const shadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(180, 180, 0), inset: false };
    // const shadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 0), inset: false };
    // const shadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 0, 0), inset: false };
    // const shadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 0, 0), inset: false };

    // const insetShadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(0, 160, 0), inset: true };
    // const insetShadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(0, 255, 0), inset: true };
    // const insetShadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(0, 100, 100), inset: true };
    // const insetShadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(0, 255, 255), inset: true };
    // const insetShadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(140, 0, 140), inset: true };
    // const insetShadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 0, 250), inset: true };
    // const insetShadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(180, 180, 0), inset: true };
    // const insetShadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 0), inset: true };
    // const insetShadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 0, 0), inset: true };
    // const insetShadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 0, 0), inset: true };

    // MONO
    const shadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(160, 160, 160), inset: false };
    const shadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(255, 255, 255), inset: false };
    const shadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(160, 160, 160), inset: false };
    const shadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(255, 255, 255), inset: false };
    const shadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(175, 175, 175), inset: false };
    const shadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 250, 250), inset: false };
    const shadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(190, 190, 190), inset: false };
    const shadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 245), inset: false };
    const shadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 205, 205), inset: false };
    const shadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 240, 240), inset: false };

    const insetShadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(160, 160, 160), inset: true };
    const insetShadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(255, 255, 255), inset: true };
    const insetShadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(160, 160, 160), inset: true };
    const insetShadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(255, 255, 255), inset: true };
    const insetShadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(175, 175, 175), inset: true };
    const insetShadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 250, 250), inset: true };
    const insetShadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(190, 190, 190), inset: true };
    const insetShadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 245), inset: true };
    const insetShadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 205, 205), inset: true };
    const insetShadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 240, 240), inset: true };

    this.dropShadow1
      .dropShadow([
        insetShadow8,
        insetShadow7,
        insetShadow6,
        insetShadow5,
        insetShadow4,
        insetShadow3,
        insetShadow2,
        insetShadow1,
        // insetShadow0,
        // insetShadow01,
        shadow8,
        shadow7,
        shadow6,
        shadow5,
        shadow4,
        shadow3,
        shadow2,
        shadow1,
        // shadow0,
        // shadow01,
      ])
    // .applyFilterToElement(this.testCircle2)

    this.dropShadow2
      .dropShadow([
        shadow8,
        shadow7,
        shadow6,
        shadow5,
        shadow4,
        shadow3,
        shadow2,
        shadow1,
        shadow0,
        shadow01,
      ])
    // .applyFilterToElement(this.testCircle1)
    // .applyFilterToElement(this.testCircle2)

    this.dropShadow3
      .dropShadow([
        // sh  insetShadow8,
        // insetShadow7,
        insetShadow6,
        insetShadow5,
        insetShadow4,
        insetShadow3,
        insetShadow2,
        insetShadow1,
        // insetShadow0,
        // insetShadow01,
      ])

    this.testRect
      .attribute('x', `${2}`)
      .attribute('y', `${2}`)
      .attribute('width', `${96}`)
      .attribute('height', `${196}`)
      .attribute('rx', `${18}`)
      .attribute('ry', `${18}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '1')
      // .attribute('stroke-width', '1')
      // .attribute('stroke-linejoin', 'round')
      .parent(this.svgElt)
      .applyFilter(this.dropShadow3)

    this.testCircle1
      .attribute('cx', `${50}`)
      .attribute('cy', `${40}`)
      .attribute('r', `${20}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '1')
      // .attribute('stroke', protoColor(230))
      // .attribute('stroke-width', '4')
      // .attribute('stroke-linejoin', 'round')
      .parent(this.svgElt)
      .applyFilter(this.dropShadow1, 2)

    this.testCircle2
      .attribute('cx', `${50}`)
      .attribute('cy', `${100}`)
      .attribute('r', `${20}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '1')
      .attribute('stroke', protoColor(230))
      .attribute('stroke-opacity', '1')
      .attribute('stroke-width', '6')
      .attribute('pathLength', '360')
      .attribute('stroke-dashoffset', '18')
      .attribute('stroke-dasharray', `${180 / 6} `)
      .attribute('stroke-linejoin', 'round')
      .attribute('stroke-linecap', 'round')
      .parent(this.svgElt)
      .applyFilter(this.dropShadow2)


    this.testCircle3
      .attribute('cx', `${50}`)
      .attribute('cy', `${160}`)
      .attribute('r', `${20}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '1')
      // .attribute('stroke', protoColor(230))
      // .attribute('stroke-opacity', '.125')
      // .attribute('stroke-width', '6')
      // .attribute('pathLength', '360')
      // .attribute('stroke-dashoffset', '18')
      // .attribute('stroke-dasharray', `${180 / 16} `)
      // .attribute('stroke-linejoin', 'round')
      // .attribute('stroke-linecap', 'round')
      .parent(this.svgElt)
    // .applyFilter(this.dropShadow3, 3)
    // .applyFilter(this.dropShadow1, 3, 4)

    // DeBug.log('circle3', this.testCircle3)
    this.testCircle3
      .applyFilter(this.dropShadow2, 3)
    // DeBug.log('circle3', this.testCircle3)
    // this.testCircle3
    // .applyFilter(this.dropShadow3, 3, 3000)


  }
}

