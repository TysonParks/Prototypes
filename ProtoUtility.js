//MARK: Memoization
//NOTE: Created with ChatGPT4 on April 17, 2024
const memoCache = new WeakMap()           // WeakMap to hold private cache data across instances
// FUNC: memoize() : helper that defines memoized getters with integrated reset
function memoize(getter, key) {
  const symbolKey = Symbol.for(key)
  return function () {
    let cache = memoCache.get(this)
    if (!cache) {
      cache = {}
      memoCache.set(this, cache)
    }
    if (!(symbolKey in cache)) cache[symbolKey] = getter.call(this)
    return cache[symbolKey]
  }
}
// FUNC: resetMemoized() : resets memoized property values on instances using keys
function resetMemoized(instance, ...keys) {
  const cache = memoCache.get(instance)
  if (cache) {
    keys.forEach(key => {
      const symbolKey = Symbol.for(key)
      if (symbolKey in cache) { delete cache[symbolKey] }
    })
  }
}

//MARK: Aspect
// ENUM: Aspect : Represents the aspect ratio of a shape
// SIZE: 30 lines
class Aspect {
  static Square = new Aspect(0)
  static Portrait = new Aspect(1)
  static Landscape = new Aspect(2)

  name
  value
  ratio

  constructor(number, ratio) {
    this.value = number
    this.name = this.#getName(number)
    this.ratio = ratio
  }

  get isSquare() { return this.value === 0 }
  get isPortrait() { return this.value === 1 }
  get isLandscape() { return this.value === 2 }
  get isVertical() { return this.value === 1 }
  get isHorizontal() { return this.value === 2 }

  #getName(number) { return this.#descriptions[number] }

  static fromRatio(ratio) {
    if (ratio === 1) return Aspect.Square
    if (ratio < 1) return new Aspect(1, ratio)
    if (ratio > 1) return new Aspect(2, ratio)
  }

  #descriptions = [
    'square',     // 0
    'portrait',   // 1
    'landscape',  // 2
  ]
}

//MARK: Direction
// ENUM: Direction : Represents a direction in 2D space
// SIZE: 308 lines
class Direction {

  static None = new Direction()
  // single Directions
  static Up = new Direction(0)
  static UpRight = new Direction(0.5)
  static Right = new Direction(1)
  static DownRight = new Direction(1.5)
  static Down = new Direction(2)
  static DownLeft = new Direction(2.5)
  static Left = new Direction(3)
  static UpLeft = new Direction(3.5)
  // 2 directions
  static Vertical = new Direction([0, 2])
  static Horizontal = new Direction([1, 3])
  static PosOrdinal = new Direction([0.5, 2.5])
  static NegOrdinal = new Direction([1.5, 3.5])
  // 4 directions
  static Cardinal = new Direction([0, 1, 2, 3])
  static Ordinal = new Direction([0.5, 1.5, 2.5, 3.5])
  // 8 directions
  static All = new Direction([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
  // 3 directions
  static Cartesian = new Direction([1, 1.5, 2]) // frequently used for square/rect creation, equivalent: DownRight.andAdjacents

  name
  vals

  constructor(number) {
    if (number instanceof Array) {
      this.name = this.#getName(number)
      this.vals = number
    }
    else {
      this.name = this.#getName(number)
      this.vals = [number]
    }
    if (number === undefined) {
      this.name = 'none'
      this.vals = []
    }
    this.vals = OpArray.from(this.vals)
  }

  get names() { return OpArray.from(this.vals.map(a => this.#getName(a))) }
  get value() { return this.valOp(a => a) }

  get moveCoord() {
    return memoize(() => {
      return this.directOp(a => Direction.moveCoordFromAngle(a.angle))
    }, `moveCoord`).call(this)
  }

  // get angle() { return this.valOp(a => ((((a * -1) - 1) % 4) + 2) * PI / 2) }
  get angle() { return this.directOp(a => Direction.valueToAngle(a.value)) }
  get angleDegrees() { return this.directOp(a => degrees(a.angle)) }

  get lineVector() { if (this.isSingle) { return this.moveCoord.normalize() } }

  get directions() {
    return memoize(() => {
      return OpArray.from(this.vals.map(a => new Direction(a)))
    }, `directions`).call(this)
  }
  get cardinalsValues() {
    return memoize(() => {
      return this.vals.filter(a => a % 1 === 0)
    }, `cardinals`).call(this)
  }
  get ordinalsValues() {
    return memoize(() => {
      return this.vals.filter(a => a % 1 === 0.5)
    }, `ordinals`).call(this)
  }
  get cardinalsDirection() {
    return memoize(() => {
      return new Direction(this.cardinalsValues)
    }, `cardinalsDirection`).call(this)
  }
  get ordinalsDirection() {
    return memoize(() => {
      return new Direction(this.ordinalsValues)
    }, `ordinalsDirection`).call(this)
  }
  get valuesCount() {
    return memoize(() => {
      return this.vals.length
    }, `valuesCount`).call(this)
  }
  get cardinalsCount() {
    return memoize(() => {
      return this.cardinalsValues.length
    }, `cardinalCount`).call(this)
  }
  get ordinalsCount() {
    return memoize(() => {
      return this.ordinalsValues.length
    }, `ordinalCount`).call(this)
  }

  //MARK: -Ominoes : Finding possible shapes in the 3x3 Grid of a Direction Object
  //NOTE: Traditionally, all cell connections are orthogonal (cardinal), so each must have at least one cardinal direction
  //NOTE: Internal (None) Direction counts as 1, so counts are all +1, ie: hasTetraCount = 3 outer directions ( + internal None)

  //NOTE: Triominoes
  get hasTriCount() { return this.isDouble && this.cardinalsCount > 0 }                   // has 2 directions with at least one cardinal
  get isIShape() { return this.isHorizontal || this.isVertical }                          // 2 directions are either horizontal or vertical

  //NOTE: Tetrominoes : Tetris shapes!
  get hasTetraCount() { return this.valuesCount === 3 && this.cardinalsCount > 0 }        // has 3 directions with at least one cardinal

  get hasCommonTetraCount() { return this.hasTetraCount && this.cardinalsCount === 2 }    // has 3 directions with 2 cardinals (covers O, S, L Tetronimoes)
  get isOShape() {
    return this.hasCommonTetraCount && this.equals(this.ordinalsValues[0].andAdjacents)   // is a 2x2 square shape (1 ordinal direction and its adjacents)
  }
  get isSShape() {
    return this.hasCommonTetraCount                                                       // has common tetromino count
      && this.cardinalsDirection.isTwoPerpendiculars                                      // cardinal directions are perpindicular 
      && this.cardinalsValues.some(c => abs(c - this.ordinalsValues[0]) === 0.5)          // ordinal direction is adjacent (45deg) to one of the cardinal directions (absDif is 0.5)
      && !this.isOShape                                                                   // is not an OShape
  }
  get isLShape() {
    return this.hasCommonTetraCount                                                       // has common tetromino count
      && this.cardinalsDirection.isTwoOpposites                                           // cardinal directions are opposite /parallel
  }
  get isTetraTShape() {
    if (this.hasTetraCount) {
      if (this.cardinalsCount === 1)
        return this.equals(this.cardinalsValues[0].andAdjacents)                          // Minor T shape hugging edge
      else return this.cardinalsCount === 3                                               // Minor T shape hugging middle  
    }
    return false
  }

  get isCardYShape() {
    return this.hasTetraCount && this.cardinalsCount === 1                               // has 3 directions with 2 cardinals
      && this.ordinalsValues.every(o => abs(this.cardinalsValues[0] - o)) // both ord directions adjacent to one of the cards
  }

  //NOTE: Pentominoes
  get hasPentaCount() { return this.valuesCount === 4 && this.cardinalsCount > 0 }        // has 4 directions with at least one cardinal

  get isPentaTShape() {                                                                   // Major T shape
    return this.hasPentaCount                                                             // has penta count
      && this.cardinalsDirection.isTwoOpposites                                           // has opposite cardinal directions
      && this.ordinalsValues.some(o => this.cardinalsValues.every(c => abs(c - o) === 0.5)) // both ord directions adjacent to one of the cards
  }
  get isPlusShape() { return this.hasPentaCount && this.cardinalsCount === 4 }            // has only 4 cardinal directions

  //NOTE: Ominoes Extras
  get isTShape() { return this.isTetraTShape || this.isPentaTShape || this.isPlusShape }  // 3 T Shape variants
  get isHShape() {
    return this.cardinalsCount === 2                                                      // has only 2 cardinal directions
      && abs(this.cardinalsValues[0] - this.cardinalsValues[1]) === 2                       // cardinal directions parallel (180deg) to each other (absDif is 2)
      && this.ordinalsCount > 2                                                           // has 3-4 ordinal directions
  }
  get isXShape() { return this.cardinalsCount === 0 && this.ordinalsCount === 4 }            // has 4 ordinal directions

  get isAllSquareShape() { return this.isAll }                                            // is a 3x3 square shape (all directions)
  get isSquareShape() { return this.isOShape || this.isAllSquareShape }                   // is a square shape (OShape (2x2) or All (3x3))


  get needsMask() {                                                                    // cell with groupNeighborsDirection will need mask for 'r' Shade
    if (this.valuesCount < 3 || this.cardinalsCount < 1) return false                     // 2 or less total or no cardinals always false 
    if (this.valuesCount > 4 || this.cardinalsCount > 2) return true                      // 5 or more total or 3-4 cardinals always true
    if (this.cardinalsDirection.hasTwoPerpindiculars) return true       // 2 or more cardinals are perpindicular (contains S, middleMinorT, or ordinalY shape)
    if (this.hasThreeAdjacents) return true                                               // 3 or more directions are adjacent ( contains O or edgeMinorT shape)
    return false
  }

  get canInset() { return this.hasOShape }                                                // cell with groupNeighborsDirection can inset (contains O shape)

  get adjacents() {
    const directionsVals = this.directOp(a => OpArray.from([a.previous(), a.next()]))
      .map(d => d.value)
    return new Direction(directionsVals)
  }
  get andAdjacents() {
    const directionsVals = this.directOp(a => OpArray.from([a.previous(), a, a.next()]))
      .map(d => d.value)
    return new Direction(directionsVals)
  }
  get opposites() {
    const directionsVals = this.directOp(a => a.rotated(180))
    if (directionsVals instanceof Direction) {
      return directionsVals
    } else {
      const vals = directionsVals
        .map(d => d.value)
        .numSorted
      return new Direction(vals)
    }
  }
  get andOpposites() { return new Direction(this.vals.union(this.opposites.vals, 'vals')) }
  get perpindiculars() {
    if (this.allAreHorizontal) return Direction.Vertical
    if (this.allAreVertical) return Direction.Horizontal
    if (this.allArePosOrdinal) return Direction.NegOrdinal
    if (this.allAreNegOrdinal) return Direction.PosOrdinal
  }

  get isAll() { return this.valuesCount === 8 }
  get isNone() { return this.valuesCount === 0 }

  get isSingle() { return this.valuesCount === 1 }
  get isDouble() { return this.valuesCount === 2 }
  get isTwoOpposites() { return this.isDouble && this.equals(this.andOpposites) } //is Horizontal, Vertical, PosOrdinal, or NegOrdinal
  get isTwoPerpendiculars() { return this.isDouble && isOdd(abs(this.values[0] - this.values[1])) }
  get isTwoAdjacent() { return this.isDouble && abs(this.values[0] - this.values[1]) === 0.5 }

  get isUp() { return this.equals(Direction.Up) }
  get isRight() { return this.equals(Direction.Right) }
  get isDown() { return this.equals(Direction.Down) }
  get isLeft() { return this.equals(Direction.Left) }

  get isHorizontal() { return this.equals(Direction.Horizontal) }
  get isVertical() { return this.equals(Direction.Vertical) }
  get isCardinal() { return this.equals(Direction.Cardinal) }
  get isOrdinal() { return this.equals(Direction.Ordinal) }

  get isEachHorizontal() { return this.valOp(a => a % 2 === 1) }
  get isEachVertical() { return this.valOp(a => a % 2 === 0) }
  get isEachCardinal() { return this.directOp(a => a.isEachHorizontal || a.isEachVertical) }
  get isEachOrdinal() { return this.valOp(a => a % 1 === 0.5) }

  get allAreHorizontal() { return this.vals.every(a => a % 2 === 1) }
  get allAreVertical() { return this.vals.every(a => a % 2 === 0) }
  get allArePosOrdinal() { return this.vals.every(a => (a + .5) % 2 === 1) }
  get allAreNegOrdinal() { return this.vals.every(a => (a + .5) % 2 === 0) }
  get allAreCardinal() { return this.directions.every(a => a.isEachHorizontal || a.isEachVertical) }
  get allAreOrdinal() { return this.vals.every(a => a % 1 === 0.5) }
  get allAreCartesian() { return this.vals.every(a => [1, 1.5, 2].some(v => v === a)) }

  get someAreHorizontal() { return this.vals.some(a => a % 2 === 1) }
  get someAreVertical() { return this.vals.some(a => a % 2 === 0) }
  get someAreCardinal() { return this.directions.some(a => a.isEachHorizontal || a.isEachVertical) }
  get someAreOrdinal() { return this.vals.some(a => a % 1 === 0.5) }

  get angleKeys() { return Object.keys(this.#angles) }

  get toLeft() { return this.previous(2) }
  get toRight() { return this.next(2) }

  get hierarchy() {
    if (this.isAll) return 3
    if (this.isCardinal) return 2
    if (this.isTwoOpposites) return 1
    if (this.isNone) return 0
    DeBug.error('Undefined directionHierachy')
  }

  get hasTwoPerpindiculars() { return this.#hasConsecutiveDirections(2, true) }
  get hasThreeAdjacents() { return this.#hasConsecutiveDirections(3) }
  get hasOShape() { return this.#hasConsecutiveDirections(3, false, 1) }

  //METH: hasConsecutiveDirections() : Boolean : checks if the direction contains a min amount of consecutive (sub)directions
  //NOTE: modes: 0 = all directions, 1 = cardinal directions, 2 = ordinal directions
  #hasConsecutiveDirections(amount, perpindicular = false, mode = 0) {
    if (this.isSingle) return false                             // single direction can't have consecutive directions
    if (this.isAll) return true                                 // 'All' directions are completely consecutive

    const dif = perpindicular ? 1 : .5                          // difference between consecutive directions
    // DeBug.log(``)
    // DeBug.warn(`hasConsecutiveDirections!`, this.vals)
    // DeBug.warn(` dif: ${dif}, amount: ${amount}, mode: ${mode}`)
    let maxConsec = 1,
      testVals = mode === 0 ? this.vals : mode === 1 ? this.cardinalsValues : this.ordinalsValues
    testVals.numSorted.forEach(val => {
      // DeBug.warn(`value: ${val}, dif: ${dif}`)
      let testVal = val, consec = 1
      while (testVal < 4) {
        // DeBug.log(`testVal:`, testVal)
        if (this.vals.some(v => v === testVal + dif)) {
          // DeBug.log(`found: ${testVal + dif}`)
          testVal = testVal + dif
          consec++
        }
        else {
          // DeBug.log(`not found: ${testVal + dif}`)
          testVal = 4
        }
      }
      maxConsec = max(consec, maxConsec)
      // DeBug.error(`maxConsec:`, maxConsec)
    })
    // DeBug.warn(` final maxConsec: ${maxConsec}, amount: ${amount}`)
    return maxConsec >= amount
  }

  random(amount = 1) {
    const reducer = min(amount / this.valuesCount, 0.999999)
    //NOTE: when 'copy' is removed here it creates a cool shadow stacking effect with findIslands (see Aug 2,2023 captures)
    return new Direction(this.vals.copy.randReduce(reducer))
    return new Direction(this.vals.randReduce(reducer))
  }

  previous(steps = 1) { return this.valOp(a => new Direction((a + 4 - (0.5 * steps)) % 4)) }
  next(steps = 1) { return this.valOp(a => new Direction((a + (0.5 * steps)) % 4)) }
  rotated(degree = 90) { return new Direction(this.vals.map(e => this.#normalizeVals(e + degree / 90)).numSorted) }
  flipped(direction = 'negOrdinal') {
    const
      coords = this.#matrixValCoords,
      flippedMatrix = this.#matrix.flipped2D(direction),
      newVals = coords.map(e => flippedMatrix.valueAt2DCoords(e))
    return new Direction(newVals)
  }

  #matrix = OpArray.from([
    OpArray.from([3.5, 0, 0.5]),      //  [3.5,  0,  0.5]
    OpArray.from([3, -1, 1]),         //  [3,   -1,  1  ]
    OpArray.from([2.5, 2, 1.5]),      //  [2.5,  2,  1.5]
  ])

  get #matrixValCoords() { return this.vals.map(e => this.#matrix.coords2D(e)) }

  #normalizeVals(vals) { return (vals % 4 + 4) % 4 }

  turnTo(direction) {
    if (this.isSingle && direction.isSingle) {
      if (direction.equals(this.toLeft)) return Turn.L
      if (direction.equals(this.previous())) return Turn.SL
      if (direction.equals(this)) return Turn.S
      if (direction.equals(this.next())) return Turn.SR
      if (direction.equals(this.toRight)) return Turn.R
    } else {
      throw new Error("Invalid turn. Can only turn to/from a single direction.")
    }
  }

  static atAngle(angle, decimal = 2) {
    angle = constrainAngle(angle)
    const
      direction = Direction.None,
      name = direction.angleKeys.find(key => equalsRoundedDec(direction.#angles[key], angle, decimal))
    if (!name) {
      const value = Direction.angleToValue(angle)
      return new Direction(value)
    }
    const index = direction.#descriptions.findIndex(e => e === name)
    return new Direction(index / 2)
  }

  static angleToValue(angle) { return (((2 * (roundToDec(angle / PI, 4)) + 1) % 4) + 4) % 4 }

  static valueToAngle(value) { return PI * (((value + 0.5) % 4) - 1.5) / 2 }

  static fromMoveCoord(moveCoord) {
    const
      dir = Direction.None,
      dirs = Object
        .keys(dir.#moveCoords)
        .filter(key => dir.#moveCoords[key].equals(moveCoord))
        .map(name => Direction.named(name))
    return dirs.length === 1 ? dirs[0] : dirs
  }

  static moveCoordFromAngle(angle) {
    let
      [x, y] = [cos(angle), sin(angle)],
      [absX, absY] = [abs(x), abs(y)]

    // const epsilon = 0.0001 // Small threshold for floating-point comparison

    // // Normalize values: if close enough to 1 or -1, round it off
    // if (abs(x - 1) < epsilon) { x = 1 }
    // if (abs(x + 1) < epsilon) { x = -1 }
    // if (abs(y - 1) < epsilon) { y = 1 }
    // if (abs(y + 1) < epsilon) { y = -1 }

    if (absX > absY) {
      x = x >= 0 ? 1 : -1
      y = y / absX
    } else {
      y = y >= 0 ? 1 : -1
      x = x / absY
    }
    // if (x - round(x) < .03) { x = round(x) }
    // if (y - round(y) < .03) { y = round(y) }
    return vert(roundToDec(x, 4), roundToDec(y, 4))
  }

  valOp(fn) {
    if (this.isSingle) return fn(this.vals[0])
    return OpArray.from(this.vals.map(e => fn(e)))
  }
  //NOTE: some functions that use this might error as they previously always received just a value
  directOp(fn) {
    if (this.isSingle) return fn(this.directions[0])
    return OpArray.from(this.directions.map(e => fn(e)))
  }

  equals(direction) { return this.vals.equalsSorted(direction.vals) }

  get obj() {
    return {
      up: this.values.some(v => v === 0),
      upRight: this.values.some(v => v === 0.5),
      right: this.values.some(v => v === 1),
      downRight: this.values.some(v => v === 1.5),
      down: this.values.some(v => v === 2),
      downLeft: this.values.some(v => v === 2.5),
      left: this.values.some(v => v === 3),
      upLeft: this.values.some(v => v === 3.5),
    }
  }

  static named(name) {
    if (name === `up`) return Direction.Up
    const
      dir = Direction.None,
      index = dir.#descriptions.findIndex(e => e === name)
    if (index) return new Direction(index / 2)
  }

  #getName(number) {
    if (number instanceof Array) {
      if (number.length === 0) return 'none'
      if (number.length === 1) number = number[0]
      else {
        return Object
          .keys(this.#generalNames)
          .find(key => OpArray.from(this.#generalNames[key]).equalsSorted(OpArray.from(number)))
      }
      if (number.length > 1) return number.map(n => this.#descriptions[n * 2]).join(', ')
    }
    return this.#descriptions[number * 2]
  }

  #generalNames = {
    'vertical': [0, 2],
    'horizontal': [1, 3],
    'posOrdinal': [0.5, 2.5],
    'negOrdinal': [1.5, 3.5],
    'cardinal': [0, 1, 2, 3],
    'ordinal': [0.5, 1.5, 2.5, 3.5],
    'all': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
  }

  #descriptions = [
    'up',         // 0
    'upRight',    // 0.5
    'right',      // 1
    'downRight',  // 1.5
    'down',       // 2
    'downLeft',   // 2.5
    'left',       // 3
    'upLeft',     // 3.5
  ]

  #moveCoords = {
    'up': vert(0, -1),
    'upRight': vert(1, -1),
    'right': vert(1, 0),
    'downRight': vert(1, 1),
    'down': vert(0, 1),
    'downLeft': vert(-1, 1),
    'left': vert(-1, 0),
    'upLeft': vert(-1, -1),
  }

  #angles = {
    'up': (PI / -2),
    'upRight': (PI / -4),
    'right': (0),
    'downRight': (PI / 4),
    'down': (PI / 2),
    'downLeft': (PI * 3 / 4),
    'left': (PI),
    'upLeft': (PI * -3 / 4),
  }
}

//MARK: Directions
// ENUM: Directions : Represents a set of directions in 2D space
// class Directions {
//   static Direction = new Directions(Direction.All.directions)

//   values

//   constructor(values, indexSorted = false) {
//     if (values instanceof Array) {
//       if (indexSorted) {
//         [values[3], values[4]] = [values[4], values[3]]
//         this.values = values
//       }
//       this.values = OpArray.format(values)
//     } else if (isDirectionObj(values)) {
//       this.values = [
//         values.up,
//         values.upRight,
//         values.right,
//         values.downRight,
//         values.down,
//         values.downLeft,
//         values.left,
//         values.upLeft,
//       ]
//     } else DeBug.error(`Directions failed to initialize`)
//     this.values = OpArray.format(this.values)
//     if (this.values.length !== 4) DeBug.error(`Directions expects 4 values: expect problems!`)
//   }

//   get up() { return this.values[0] }
//   get upRight() { return this.values[1] }
//   get right() { return this.values[2] }
//   get downRight() { return this.values[3] }
//   get down() { return this.values[4] }
//   get downLeft() { return this.values[5] }
//   get left() { return this.values[6] }
//   get upLeft() { return this.values[7] }

//   get obj() {
//     return {
//       up: this.up,
//       upRight: this.upRight,
//       right: this.right,
//       downRight: this.downRight,
//       down: this.down,
//       downLeft: this.downLeft,
//       left: this.left,
//       upLeft: this.upLeft,
//     }
//   }
// }

//MARK: Corner
// ENUM: Corner : Represents a corner in 2D space
// SIZE: 32 lines
class Corner {
  static UpLeft = new Corner(0)
  static UpRight = new Corner(1)
  static DownRight = new Corner(2)
  static DownLeft = new Corner(3)

  constructor(number) {
    this.value = number
  }

  get name() { return this.#descriptions[this.value] }
  get isUpLeft() { return this.value === 0 }
  get isUpRight() { return this.value === 1 }
  get isDownRight() { return this.value === 2 }
  get isDownLeft() { return this.value === 3 }

  get isUp() { return this.value < 2 }
  get isRight() { return this.isUpRight || this.isDownRight }
  get isDown() { return !this.isUp }
  get isLeft() { return !this.isRight }

  get direction() { return new Direction(this.value - .5) }

  //METH: equals()
  equals(corner) { return this.value === corner.value }

  #descriptions = [
    'upLeft',     // 0
    'upRight',    // 1
    'downRight',  // 2
    'downLeft',   // 3
  ]
}

//MARK: Corners
// ENUM: Corners : Represents a rectangular set of corners in 2D space
// SIZE: 70 lines
class Corners {
  static Directions = new Corners(Direction.Ordinal.directions.shifted(-1))   // Corner of corresponding directions. Requires shifting to match

  values

  constructor(values) {
    if (values instanceof Segment) values = [values.start, values.end]
    if (values instanceof Array) {
      if (values.length === 2 && values.every(v => v instanceof Vertex))
        values = this.#valuesFromBoundsVerts(values[0], values[1])
      if (values.length === 4) this.values = values
    } else if (isCornerObj(values))
      values = [values.upLeft, values.upRight, values.downRight, values.downLeft]
    else DeBug.error(`Corners failed to initialize`)
    this.values = OpArray.format(values)
    if (this.values.length !== 4) DeBug.error(`Corners expects 4 values: expect problems!`)
  }

  get upLeft() { return this.values[0] }
  get upRight() { return this.values[1] }
  get downRight() { return this.values[2] }
  get downLeft() { return this.values[3] }

  get posOrdinals() { return [this.upRight, this.downLeft] }
  get negOrdinals() { return [this.downRight, this.upLeft] }

  get bounds() { return findBounds(this.upLeft, this.downRight) }

  get obj() {
    return {
      upLeft: this.upLeft,
      upRight: this.upRight,
      downRight: this.downRight,
      downLeft: this.downLeft
    }
  }

  get sides() {
    let sideVals
    if (this.values.every(v => v instanceof Vertex)) {
      sideVals = [
        segment(this.upLeft, this.upRight),
        segment(this.upRight, this.downRight),
        segment(this.downRight, this.downLeft),
        segment(this.downLeft, this.upLeft)
      ]
    } else {
      sideVals = [
        [this.upLeft, this.upRight],
        [this.upRight, this.downRight],
        [this.downRight, this.downLeft],
        [this.downLeft, this.upLeft]
      ]
    }
    return new Sides(sideVals)
  }

  //METH: atIndex()
  atIndex(index) { return this.values[index] }

  //METH: #valuesFromBoundsVerts()
  #valuesFromBoundsVerts(vert1, vert2) {
    const verts = OpArray.format([vert1, vert2]).gridVertSorted
    return [
      verts[0],
      vert(verts[1].x, verts[0].y),
      verts[1],
      vert(verts[0].x, verts[1].y)
    ]
  }
}

//MARK: Sides
// ENUM: Sides : Represents a set of rectangular sides in 2D space
// SIZE: 32 lines
class Sides {
  static Directions = new Sides(Direction.Cardinal.directions)

  values

  constructor(values) {
    if (values instanceof Array) values = values
    else if (isSideObj(values)) values = [values.up, values.right, values.down, values.left]
    else DeBug.error(`Sides require an array to initialize`, values)
    this.values = OpArray.format(values)
    if (this.values.length !== 4) DeBug.error(`Sides expects 4 values: expect problems!`)
  }

  get up() { return this.values[0] }
  get right() { return this.values[1] }
  get down() { return this.values[2] }
  get left() { return this.values[3] }

  get verticals() { return [this.up, this.down] }
  get horizontals() { return [this.right, this.left] }
  get all() { return this.values }

  get direction() { return new Direction(this.value) }

  get obj() {
    return {
      up: this.up,
      right: this.right,
      down: this.down,
      left: this.left
    }
  }
}

//MARK: Turn
// ENUM: Turn : Represents a turn in 2D space ( 2 connected segments )
// SIZE: 64 lines
class Turn {
  static Left = new Turn(-1)
  static Straight = new Turn(0)
  static Right = new Turn(1)
  static L = new Turn(-1)
  static S = new Turn(0)
  static R = new Turn(1)

  // static UL = new Turn(-2)     // U-Turn Left 
  // static HL = new Turn(-1.5)   // Hard Left 
  static SL = new Turn(-0.5)   // Soft Left 
  static SR = new Turn(0.5)    // Soft Right
  // static HR = new Turn(1.5)    // Hard Right
  // static UR = new Turn(2)      // U-Turn Right

  static from(segPair) {
    if (segPair.length !== 2) DeBug.error('expected 2 segments')
    let d1 = segPair[0].direction
    let d2 = segPair[0].direction
    return d1.turnTo(d2)
  }

  name
  value

  constructor(value) {
    this.value = value
    this.name = this.#getName(value)
  }

  get shortName() { return this.#letterName[`${this.value}`] }
  get isLeft() { return this.value === -1 }
  get isStraight() { return this.value === 0 }
  get isRight() { return this.value === 1 }
  get isSoftLeft() { return this.value === -0.5 }
  get isSoftRight() { return this.value === 0.5 }

  get direction() {
    switch (this.value) {
      case -1: return Direction.Left        // Left
      case -0.5: return Direction.UpLeft    // Soft Left
      case 0: return Direction.Up           // Straight
      case 0.5: return Direction.UpRight    // Soft Right
      case 1: return Direction.Right        // Right
    }
  }
  get normalRotAngle() { return PI * (0.5 - this.value / 4) }

  #getName(value) { return this.#name[`${value}`] }

  #name = {
    '-1': 'Left',
    '-0.5': 'Soft Left',
    '0': 'Straight',
    '0.5': 'Soft Right',
    '1': 'Right',
  }
  #letterName = {
    '-1': 'L',
    '-0.5': 'SL',
    '0': 'S',
    '0.5': 'SR',
    '1': 'R',
  }
}

//MARK: EdgePart
// ENUM: EdgePart : Represents a part of a shape's edge in 2D space ( 2 connected turns / 3 connected segments )
// SIZE: 97 lines
class EdgePart {
  // static Flat = new EdgePart(0)        // SS
  // static Corner = new EdgePart(10)     // LS, RS, SL, SR
  // static Stair = new EdgePart(20)      // RL, LR
  // static UTurn = new EdgePart(30)      // RR, LL

  static F = new EdgePart('F')         // SS              --> 'Flat'

  // static C = new EdgePart('C')         // LS, RS, SL, SR  --> 'Corner'
  // static S = new EdgePart('S')         // RL, LR          --> 'Stair'
  // static U = new EdgePart('U')         // RR, LL          --> 'U-Turn'

  // static CI = new EdgePart('CI')       // LS, SL          --> 'Corner Inside'
  // static CO = new EdgePart('CO')       // RS, SR          --> 'Corner Outside'
  // static CS = new EdgePart('CS')       // LS, RS          --> 'Corner Start'
  // static CE = new EdgePart('CE')       // SL, SR          --> 'Corner End'

  static CSI = new EdgePart('CSI')     // SL              --> 'Corner Start Inside'
  static CSO = new EdgePart('CSO')     // SR              --> 'Corner Start Outside'
  static CEI = new EdgePart('CEI')     // LS              --> 'Corner End Inside'
  static CEO = new EdgePart('CEO')     // RS              --> 'Corner End Outside'
  static StI = new EdgePart('StI')     // RL              --> 'Stair In'
  static StO = new EdgePart('StO')     // LR              --> 'Stair Out'
  static UI = new EdgePart('UI')       // LL              --> 'U-Turn Inside'
  static UO = new EdgePart('UO')       // RR              --> 'U-Turn Outside'

  static from(turns) { return this.fromTurns(turns) }
  value
  name

  constructor(value) {
    this.value = value
    this.name = this.#getName(value)
  }

  get isFlat() { return this.isBaseType('Flat') }

  get isUTurn() { return this.isBaseType('UTurn') }   // LL / RR
  get isUTurnIn() { return this.isType('UI') }        // LL
  get isUTurnOut() { return this.isType('UO') }       // RR

  get isStair() { return this.isBaseType('Stair') }   // RL / LR
  get isStairIn() { return this.isType('StI') }       // RL
  get isStairOut() { return this.isType('StO') }      // LR

  get isCorner() { return this.isBaseType('Corner') }
  get isCornerStart() { return this.value === 'CSI' || this.value === 'CSO' }
  get isCornerEnd() { return this.value === 'CEI' || this.value === 'CEO' }

  #getName(value) { return this.#turnNames[value] }

  isType(type) { return this.value === type }

  isBaseType(baseType) {
    const types = this.#baseTypes[baseType]
    return types.some(t => this.value === t)
  }

  #baseTypes = {
    'Flat': ['F'],
    'Corner': ['CEI', 'CEO', 'CSI', 'CSO'],
    'Stair': ['StI', 'StO'],
    'UTurn': ['UO', 'UI'],
  }

  #turnNames = {
    'F': 'Flat',
    'CSI': 'Corner Start In',
    'CSO': 'Corner Start Out',
    'CEI': 'Corner End In',
    'CEO': 'Corner End Out',
    'StI': 'Stair In',
    'StO': 'Stair Out',
    'UI': 'U-Turn In',
    'UO': 'U-Turn Out',
  }

  static turnPatterns = {
    'F': 'SS',
    'CSI': 'SL',
    'CSO': 'SR',
    'CEI': 'LS',
    'CEO': 'RS',
    'StI': 'RL',
    'StO': 'LR',
    'UI': 'LL',
    'UO': 'RR',
  }

  static fromTurns(turns) { if (turns.length === 2) return this.from2(turns) }

  static from2(turns) {
    const
      pair = turns.map(e => e.shortName).join(''),
      name = getKeyByValue(this.turnPatterns, pair)
    return new EdgePart(name)
  }
}

//MARK: Bounds
// SIZE: 122 lines
// #region Bounds
//TODO: Make this into a class and incorporate SelectionBounds, possibly making it a subclass of Bounds?
// FUNC: isBoundsObj() : BOOL : checks if object has bounds properties
function isBoundsObj(obj, every = true) { return hasProperties(obj, [`xMin`, `xMax`, `yMin`, `yMax`], every) }

// FUNC: isCoordsObj() : BOOL : checks if object has coords properties
function isCoordsObj(obj, every = true) { return hasProperties(obj, [`x`, `y`], every) }

// FUNC: isCornerObj() : BOOL : checks if object has corner properties
function isCornerObj(obj, every = true) { return hasProperties(obj, [`upLeft`, `upRight`, `downRight`, `downLeft`], every) }

// FUNC: isSideObj() : BOOL : checks if object has side properties 
function isSideObj(obj, every = true) { return hasProperties(obj, [`up`, `right`, `down`, `left`], every) }

// FUNC: isDirectionObj() : BOOL : checks if object has direction properties
function isDirectionObj(obj, every = true) { return hasProperties(obj, [`upLeft`, `up`, `upRight`, `right`, `downRight`, `down`, `downLeft`, `left`], every) }

// FUNC: findBounds() : {BoundsObject} : get bounds for combos of [segments, verts] or objects that contain bounds props
function findBounds(...geo) {
  let boundsVerts, xMin, xMax, yMin, yMax
  //ARROW: bounds() : {BoundsObject}  :assemble bounds obj from mins & maxes
  const bounds = () => { return { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax } }

  if (geo.length === 1 && isBoundsObj(geo[0])) {                        // geo is obj with mins & maxes
    xMin = geo[0].xMin
    xMax = geo[0].xMax
    yMin = geo[0].yMin
    yMax = geo[0].yMax
    return bounds()
  } else {                                                              // geo is rest param array
    boundsVerts = geo
  }

  boundsVerts = OpArray.format(boundsVerts).flat(Infinity).compacted
    .map(e => {                                                         // map segs to verts
      if (e instanceof Segment) return [e.start, e.end]
      if (e instanceof Vertex) return e
      //TODO: I could also check for bounds objects and arrays here to unpack all combos of madness
      DeBug.error(`findBounds failed: geo contains item  of unrecognized type`, e)
    }).flat()
  const xVals = boundsVerts.map(v => v.x)
  const yVals = boundsVerts.map(v => v.y)
  xMin = min(xVals)                                                     // calculate mins and maxes
  xMax = max(xVals)
  yMin = min(yVals)
  yMax = max(yVals)
  return bounds()
}

// FUNC: vertIsWithinBounds() : BOOL : finds if vert is within bounds of boundsVerts
//NOTE: boundsVerts can be any number of verts above zero, the bounds of those points is calculated with min/max
function vertIsWithinBounds(vert, bounds, includeBorder = true, accuracy = 3, deviation = 0) {
  if (!vert || !bounds) return false
  let report = false                                                                                        //LOGGING:
  // if (bounds.xMin === 25 && bounds.xMax === 100) report = true                                              //LOGGING:
  if (report) DeBug.log('vertIsWithinBounds deviation', deviation)                                          //LOGGING:
  const
    x = roundToDec(vert.x, accuracy),
    y = roundToDec(vert.y, accuracy)
  bounds = findBounds(bounds).map(val => roundToDec(val, accuracy))

  const { xMin, xMax, yMin, yMax } = bounds
  if (report) DeBug.log('vertIsWithinBounds', { x, y, xMin, xMax, yMin, yMax })                             //LOGGING:
  let result

  if (report) DeBug.log('vertIsWithinBounds', x >= xMin, x <= xMax, y >= yMin, y <= yMax)                   //LOGGING:
  if (includeBorder) {
    result = x >= xMin
      && x <= xMax
      && y >= yMin
      && y <= yMax
  } else {
    result = x > xMin
      && x < xMax
      && y > yMin
      && y < yMax
  }
  if (report) DeBug.log('vertIsWithinBounds', abs(x - xMin), abs(x - xMax), abs(y - yMin), abs(y - yMax))   //LOGGING:
  if (deviation > 0) {
    result = abs(x - xMin) < deviation
      && abs(x - xMax) < deviation
      && abs(y - yMin) < deviation
      && abs(y - yMax) < deviation
  }
  return result
}

// FUNC: boundsIsWithinTestBounds() : BOOL : finds if bounds is within testBounds
function boundsIsWithinTestBounds(bounds, testBounds, includeBorder = true, justOverlaps = false, accuracy = 2) {
  bounds = findBounds(bounds)
  const boundsVerts = [
    vert(bounds.xMin, bounds.yMin),
    vert(bounds.xMax, bounds.yMin),
    vert(bounds.xMax, bounds.yMax),
    vert(bounds.xMin, bounds.yMax),
  ]
  testBounds = findBounds(testBounds)
  if (justOverlaps) return boundsVerts.some(v => vertIsWithinBounds(v, testBounds, includeBorder, accuracy))
  else return boundsVerts.every(v => vertIsWithinBounds(v, testBounds, includeBorder, accuracy))
}

// FUNC: boundsOverlap() : BOUNDS : finds overlap of two pieces of GEO
function boundsOverlap({ geo, accuracy = 3 } = {}) {
  let boundsArray

  if (Array.isArray(geo[0])) boundsArray = geo[0]
  else boundsArray = geo

  //ARROW: overlap(geo1, geo2)
  const overlap = (geo1, geo2) => {

    const
      bounds1 = findBounds(geo1).map(v => roundToDec(v, accuracy)),
      bounds2 = findBounds(geo2).map(v => roundToDec(v, accuracy)),
      minOverlap = vert(max(bounds1.xMin, bounds2.xMin), max(bounds1.yMin, bounds2.yMin)),
      maxOverlap = vert(min(bounds1.xMax, bounds2.xMax), min(bounds1.yMax, bounds2.yMax))

    if (minOverlap.x > maxOverlap.x || minOverlap.y > maxOverlap.y) return   // no overlap
    return findBounds(minOverlap, maxOverlap)
  }
  if (boundsArray.length === 0) return          // no bounds

  const
    initialBounds = boundsArray[0],             // Initial bounds should be the first geo's bounds
    result = boundsArray                        // Reduce over the geo array to find the cumulative overlap
      // .slice(1)                                    //TODO: this might be breaking things, re-enable if so
      .reduce((prevBounds, currentGeo) => {
        if (!prevBounds) return null
        return overlap(prevBounds, currentGeo)
      }, initialBounds)

  if (!result) return
  return result
}
// #endregion

// MARK: Loop Utilities
//FUNC: safeWhile() : null : executes actionFunc() while conditionFunc() is true, up to maxIterations  
//NOTE: this is used to prevent infinite loops in cases where the conditionFunc() is not guaranteed to eventually return false
function safeWhile(conditionFunc, actionFunc, maxIterations = 10) {
  let iterations = 0
  while (conditionFunc() && iterations < maxIterations) {
    actionFunc()
    iterations++
  }
  if (iterations >= maxIterations) DeBug.error('Reached the maximum iteration limit of ' + maxIterations)
}
//FUNC: safeArrayWhile() : null : executes actionFunc() while conditionArrayFunc() is true, up to maxIterations
//NOTE: this is a more complex version of safeWhile() that checks for changes in the array length
function safeArrayWhile(conditionArrayFunc, actionFunc, arrayMin = 0, maxRepeats = 5) {
  let
    repeats = 0,
    minCount = Infinity,  // Initialize minCount to a very large number
    currentCount
  while (conditionArrayFunc().length > arrayMin && repeats < maxRepeats) {
    currentCount = conditionArrayFunc().length

    if (currentCount < minCount) minCount = currentCount

    actionFunc()
    let newCount = conditionArrayFunc().length
    if (newCount >= minCount) repeats++
    else {
      minCount = newCount // Update minCount since we found a new lower count
      repeats = 0
    }
  }
  if (repeats >= maxRepeats) DeBug.error('Reached the maximum iteration limit of ' + maxRepeats)
}

//MARK: Geometry, Angles and Rotation
// FUNC: gridPointIndex() : [Vertex] : calculates 2D array index given coords(x,y) and array width
function gridPointIndex(x, y, width, offset = 0) { return (x + y * width) + offset }

// FUNC: gridCoords() : Vertex : calculates coords(x,y) given and index and array width
function gridCoords(index, width, offset = 0) {
  index = index - offset
  const
    x = index % width,
    y = floor(index / width)
  return vert(x, y)
}

// FUNC: rotateCoords() : [x,y] : calculates rotated coords(x,y) given coords(x,y) and degree of rotation
function rotateCoords(x, y, degree) {
  switch (degree) {
    case 90: return [y, -x]
    case 180: return [-x, -y]
    case 270: return [-y, x]
    default: throw new Error("Invalid degree. Must be 90, 180, or 270.")
  }
}

// FUNC: constrainAngle(angle) : RADIAN angle (Number) : keep angle between -PI and PI
function constrainAngle(angle) {
  angle = angle % (2 * PI)
  if (angle > PI) angle -= 2 * PI
  if (angle < -PI) angle += 2 * PI
  if (equalsRoundedDec(angle, -PI, 3)) angle = PI
  return angle
}

// FUNC: normalizeDegree() : DEGREES angle (number) : normalize any positive or negative degree to 0-360 range
function normalizeDegree(degree) { return ((degree % 360) + 360) % 360 }

// FUNC: normRadToDeg() : DEGREES angle (number) : convert RADIAN angle to normalized DEGREES angle
function normRadToDeg(radians) {
  const radPipe = pipe(degrees, normalizeDegree)
  return radPipe(radians)
}

//FUNC: cosDeg() : DEGREES angle (number) : calculate cosine of angle in DEGREES
function cosDeg(deg) { return cos(deg * PI / 180) }

//FUNC: sinDeg()  : DEGREES angle (number) : calculate sine of angle in DEGREES
function sinDeg(deg) { return sin(deg * PI / 180) }

//MARK: Function Composition
// NOTE: https://itnext.io/write-better-javascript-function-composition-with-pipe-and-compose-93cc39ab16ee
// FUNC: compose() compose multiple functions that executes from right to left
const compose = (...fns) => x => fns.reduceRight((res, fn) => fn(res), x)

// FUNC: pipe() same as compose() but executes from left to right
const pipe = (...fns) => x => fns.reduce((res, fn) => fn(res), x)

// FUNC: reduce() reduces initial to % if reducer is 0-1, and to target count if reducer >=1
function reduce(initial, reducer) {
  if (reducer < 1) return initial * (1 - reducer)
  else return initial - reducer
}

//MARK: Object Utilities
// FUNC: getKeyByValue() : Key : get key by value in any object
function getKeyByValue(object, value) { return Object.keys(object).find(key => object[key] === value) }

//FUNC: isObject() : BOOL : checks to see if obj is really an object
function isObject(obj) { return obj !== null && typeof obj === 'object' }

//FUNC: hasProperties() : BOOL : checks to see if obj is really an object and has certain named properties
function hasProperties(obj, props, every = true) {
  if (isObject(obj)) return every ? props.every(prop => prop in obj) : props.some(prop => prop in obj)
  return false
}

//MARK: Math Utilities

// FUNC: getDivisors() : [Number] : get array of prime divisors
//NOTE: made with ChatGPT 4.0 June30.2023
function getDivisors(number, prime = false) {
  const divisors = []
  for (let i = 2; i <= sqrt(number); i++) {
    if (number % i === 0) {
      divisors.push(i)
      if (i !== number / i) {
        divisors.push(number / i)
      }
    }
  }
  if (prime) return divisors.filter((divisor) => isPrime(divisor)).sort((a, b) => a - b)
  return divisors.sort((a, b) => a - b)
}

// FUNC: isPrime() : BOOL : check if number is prime
//NOTE: made with ChatGPT 4.0 June30.2023
function isPrime(number) {
  if (number < 2) return false
  for (let i = 2; i <= Math.sqrt(number); i++) {
    if (number % i === 0) return false
  }
  return true
}
//FUNC: isEven() : BOOL : check if number is even
function isEven(number) { return number % 2 === 0 }
//FUNC: isOdd() : BOOL : check if number is odd
function isOdd(number) { return number % 2 !== 0 }
// FUNC: roundToDec() : Number : round to number of decimal places
function roundToDec(number, decimalPlaces) { return approxToDec(number, decimalPlaces) }

// FUNC: approxToDec() : Number : round/floor/ceil to number of decimal places
function approxToDec(number, decimalPlaces = 2, mode = 0) {
  const
    factor = 10 ** decimalPlaces,
    mult = number * factor
  switch (mode) {
    case 0: return round(mult) / factor     // round
    case 1: return floor(mult) / factor     // floor
    case 2: return ceil(mult) / factor      // ceiling   
  }
}

// FUNC: swapLets() swap values of `let` variables
//FIXME: this won't work, only possible with arrays or objects. ask chat for implementation
// function swapVals(a, b) {
//   const temp = a
//   a = b
//   b = temp
// }

// FUNC: equalsRoundedDec() : Number : round to number of decimal places
function equalsRoundedDec(num1, num2, accuracy) {
  num1 = roundToDec(num1, accuracy)
  num2 = roundToDec(num2, accuracy)
  return num1 === num2
}

// TODO: consider the intersection with the DOM Range interface
// CLASS: Range
// SIZE: 52 lines
function range(start = 0, end = 1) { return new Range(start, end) }
class Range {
  start
  end

  constructor(start = 0, end = 1) {
    if (arguments.length === 1) {
      if (start instanceof Array) this.start = start[0], this.end = start[1]
      else this.start = start, this.end = start
    }
    else this.end = end, this.start = start
  }

  //MARK: Computed
  get usesIntegers() { return Number.isInteger(this.start) && Number.isInteger(this.end) }
  get size() { return abs(this.end - this.start) }
  get cycleSize() { return this.size + 1 }

  //MARK: Methods
  //METH: array() : [Number] : creates an array of numbers within range given the step size
  array(step = 1) {
    return OpArray.from({ length: (this.end - this.start) / step + 1 }, (_, i) => this.start + (i * step))
  }
  //METH: forEach() : null : executes callback function for each number in range (like a for loop)
  forEach(callbackFn) { return this.array().forEach(callbackFn) }             //UNUSED:
  //METH: between() : BOOL : checks if number is between start and end of range
  between(x) { return x >= this.start && x <= this.end }                      //UNUSED: -only used in ABFeaturesScript
  //METH: convertRange() : Number : converts a number from one range to another
  convertRange(x, range2) {
    return (x - this.start) * (range2.end - range2.start) / (this.end - this.start) + range2.start
  }
  //METH: normalize() : Number : normalizes a number to a range of 0-1
  normalize(x) { return this.convertRange(x, range()) }
  //METH: normalizeSubRange() : Range : normalizes a subrange to a range of 0-1
  normalizeSubRange(subrange) {
    return range(this.normalize(subrange.start), this.normalize(subrange.end))
  }
  //METH: cycle() : Number : cycles a number within the range
  cycle(x) { return ((x - this.start) % this.cycleSize + this.cycleSize) % this.cycleSize + this.start }
  //METH: subRanges() : [Range] : splits the range into subranges of equal size
  subRanges(amount) {
    // if (amount === 1) { return OpArray.from([this]) }
    const subSize = this.size / amount
    // DeBug.log(`subRanges subSize`, subSize)
    return new OpArray(amount).fill(0).map((u, i) => {
      const
        start = this.start + i * subSize,
        end = start + subSize
      // DeBug.log(`subRanges start/end`, start, end)
      return range(start, end)
    })
  }
}