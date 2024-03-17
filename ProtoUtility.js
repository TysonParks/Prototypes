// ENUM: Aspect
// SIZE: 30 lines
class Aspect {
  static Square = new Aspect(0)
  static Portrait = new Aspect(1)
  static Landscape = new Aspect(2)

  name
  value

  constructor(number) {
    this.value = number
    this.name = this.#getName(number)
  }

  get isSquare() { return this.value === 0 }
  get isPortrait() { return this.value === 1 }
  get isLandscape() { return this.value === 2 }

  #getName(number) { return this.#descriptions[number] }

  static fromRatio(ratio) {
    if (ratio === 1) { return Aspect.Square }
    if (ratio < 1) { return Aspect.Portrait }
    if (ratio > 1) { return Aspect.Landscape }
  }

  #descriptions = [
    'square',     // 0
    'portrait',   // 1
    'landscape',  // 2
  ]
}

// ENUM: Corner
// SIZE: 27 lines
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

  #descriptions = [
    'upLeft',  // 0
    'upRight', // 1
    'downRight', // 2
    'downLeft',  // 3
  ]
}

// ENUM: Direction
// SIZE: 231 lines
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


  get directions() { return OpArray.from(this.vals.map(a => new Direction(a))) }
  get names() { return OpArray.from(this.vals.map(a => this.#getName(a))) }
  get value() { return this.valOp(a => a) }

  get moveCoord() { return this.directOp(a => this.#moveCoords[a.name]) }
  // get angle() { return this.valOp(a => ((((a * -1) - 1) % 4) + 2) * PI / 2) }
  get angle() { return this.directOp(a => this.#angles[a.name]) }
  get angleDegrees() { return radianToDegree(this.angle) }

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

  get isAll() { return this.vals.length === 8 }
  get isNone() { return this.vals.length === 0 }

  get isSingle() { return this.vals.length === 1 }
  get isDouble() { return this.vals.length === 2 }
  get isTwoOpposites() { return this.isDouble && this.equals(this.andOpposites) } //is Horizontal, Vertical, PosOrdinal, or NegOrdinal

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
  get allAreCardinal() { return this.directions.every(a => a.isEachHorizontal || a.isEachVertical) }
  get allAreOrdinal() { return this.vals.every(a => a % 1 === 0.5) }

  get someAreHorizontal() { return this.vals.some(a => a % 2 === 1) }
  get someAreVertical() { return this.vals.some(a => a % 2 === 0) }
  get someAreCardinal() { return this.directions.some(a => a.isEachHorizontal || a.isEachVertical) }
  get someAreOrdinal() { return this.vals.some(a => a % 1 === 0.5) }

  get angleKeys() { return Object.keys(this.#angles) }

  get toLeft() { return this.previous(2) }
  get toRight() { return this.next(2) }

  random(amount = 1) {
    const reducer = min(amount / this.vals.length, 0.999999)
    //NOTE: when 'copy' is removed here it creates a cool shadow stacking effect with findIslands (see Aug 2,2023 captures)
    return new Direction(this.vals.copy.randReduce(reducer))
    return new Direction(this.vals.randReduce(reducer))
  }

  previous(steps = 1) { return this.valOp(a => new Direction((a + 4 - (0.5 * steps)) % 4)) }
  next(steps = 1) { return this.valOp(a => new Direction((a + (0.5 * steps)) % 4)) }
  rotated(degree = 90) { return new Direction(this.vals.map(e => this.#normalizeVals(e + degree / 90)).numSorted) }
  flipped(direction = 'negOrdinal') {
    const coords = this.#matrixValCoords
    const flippedMatrix = this.#matrix.flipped2D(direction)
    // print(coords.map(e => e.string))
    // print(flippedMatrix)
    const newVals = coords.map(e => flippedMatrix.valueAt2DCoords(e))
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
      // print('valid candidates')
      if (direction.equals(this.toLeft)) { return Turn.L }
      if (direction.equals(this)) { return Turn.S }
      if (direction.equals(this.toRight)) { return Turn.R }
    } else {
      throw new Error("Invalid turn. Can only turn from a single direction.")
    }
  }

  static atAngle(angle) {
    angle = constrainAngle(angle)
    let direction = Direction.Up
    let name = direction.angleKeys.find(key => direction.#angles[key] === angle)
    let index = direction.#descriptions.findIndex(e => e === name)
    return new Direction(index / 2)
  }

  valOp(fn) {
    if (this.isSingle) { return fn(this.vals[0]) }
    return OpArray.from(this.vals.map(e => fn(e)))
  }
  //NOTE: some functions that use this might error as they previously always received just a value
  directOp(fn) {
    if (this.isSingle) { return fn(this.directions[0]) }
    return OpArray.from(this.directions.map(e => fn(e)))
  }

  equals(direction) { return this.vals.equalsSorted(direction.vals) }

  #getName(number) {
    if (number instanceof Array) {
      if (number.length === 0) { return 'none' }
      if (number.length === 1) { number = number[0] } else {
        return Object
          .keys(this.#generalNames)
          .find(key => OpArray.from(this.#generalNames[key]).equalsSorted(OpArray.from(number)))
      }
      if (number.length > 1) { return number.map(n => this.#descriptions[n * 2]).join(', ') }
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

// ENUM: Turn
// SIZE: 58 lines
class Turn {
  static Left = new Turn(-1)
  static Straight = new Turn(0)
  static Right = new Turn(1)
  static L = new Turn(-1)
  static S = new Turn(0)
  static R = new Turn(1)

  // static UL = new Turn(-2)     // U-Turn Left 
  // static HL = new Turn(-1.5)   // Hard Left 
  // static SL = new Turn(-0.5)   // Soft Left 
  // static SR = new Turn(0.5)    // Soft Right
  // static HR = new Turn(1.5)    // Hard Right
  // static UR = new Turn(2)      // U-Turn Right

  static from(segPair) {
    if (segPair.length !== 2) { console.error('expected 2 segments') }
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

  get normalRotAngle() {
    switch (this.value) {
      case -1: // Left
        return PI * 3 / 4
      case 0: // Straight
        return PI / 2
      case 1: // Right
        return PI / 4
    }
  }

  #getName(value) { return this.#name[`${this.value}`] }

  #name = {
    '-1': 'Left',
    '0': 'Straight',
    '1': 'Right',
  }
  #letterName = {
    '-1': 'L',
    '0': 'S',
    '1': 'R',
  }
}

// ENUM: EdgePart
// SIZE: 102 lines
class EdgePart {
  // static Flat = new EdgePart(0)     // SS
  // static Corner = new EdgePart(10)  // LS, RS, SL, SR
  // static Stair = new EdgePart(20)    // RL, LR
  // static UTurn = new EdgePart(30)   // RR, LL

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

  get isUTurn() { return this.isBaseType('UTurn') }
  get isUTurnIn() { return this.isType('UI') }        // LL
  get isUTurnOut() { return this.isType('UO') }       // RR

  get isStair() { return this.isBaseType('Stair') }
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

  static fromTurns(turns) {
    // console.log('turns', turns)
    // console.log('turnPatterns', this.turnPatterns)
    if (turns.length === 2) { return this.from2(turns) }
  }

  static from2(turns) {
    // console.error(`from2(turns): `, turns)
    // console.error(turns.map(t => t.shortName))
    const pair = turns.map(e => e.shortName).join('')
    const name = getKeyByValue(this.turnPatterns, pair)
    return new EdgePart(name)
  }
}

// MARK: Utility
// FUNC: gridPointIndex() calculates 2D array index given coords(x,y) and array width
function gridPointIndex(x, y, width) { return x + y * (width) }

// FUNC: gridCoords() calculates coords(x,y) given and index and array width
function gridCoords(index, width) {
  const x = index % width
  const y = floor(index / width)
  return vert(x, y)
}

// FUNC: rotateCoords() calculates rotated coords(x,y) given coords(x,y) and degree of rotation
function rotateCoords(x, y, degree) {
  switch (degree) {
    case 90:
      return [y, -x]
    case 180:
      return [-x, -y]
    case 270:
      return [-y, x]
    default:
      throw new Error("Invalid degree. Must be 90, 180, or 270.")
  }
}

// FUNC: radiansToDegrees() convert radians to degrees
function radianToDegree(radians) {
  return (radians * 180) / PI
}

// FUNC: normalizeDegree() normalize any positive or negative degree to 0-360 range
function normalizeDegree(degree) {
  // return range(0, 359).normalize(degree)
  return ((degree % 360) + 360) % 360
}

// FUNC: normRadToDeg() convert rad to normalized degrees
function normRadToDeg(radians) {
  const radPipe = pipe(radianToDegree, normalizeDegree)
  return radPipe(radians)
}

// NOTE: https://itnext.io/write-better-javascript-function-composition-with-pipe-and-compose-93cc39ab16ee
// FUNC: compose() compose multiple functions that executes from right to left
const compose = (...fns) => x => fns.reduceRight((res, fn) => fn(res), x)

// FUNC: pipe() same as compose() but executes from left to right
const pipe = (...fns) => x => fns.reduce((res, fn) => fn(res), x)

// FUNC: reduce() reduces initial to % if reducer is 0-1, and to target count if reducer >=1
function reduce(initial, reducer) {
  if (reducer < 1) { return initial * (1 - reducer) }
  else { return initial - reducer }
}

// FUNC: getKeyByValue() get key by value in any object
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

//MARK: Number Utilities
// FUNC: constrainAngle(angle) : keep angle between -PI and PI
function constrainAngle(angle) {
  angle = angle % (2 * PI)
  if (angle > PI) { angle -= 2 * PI }
  if (angle <= -PI) { angle += 2 * PI }
  return angle
}

//NOTE: made with ChatGPT 4.0 June30.2023
// FUNC: getDivisors() get array of prime divisors
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
  if (prime) {
    return divisors.filter((divisor) => isPrime(divisor)).sort((a, b) => a - b)
  }
  return divisors.sort((a, b) => a - b)
}
//NOTE: made with ChatGPT 4.0 June30.2023
// FUNC: isPrime() 
function isPrime(number) {
  if (number < 2) { return false }
  for (let i = 2; i <= Math.sqrt(number); i++) {
    if (number % i === 0) { return false }
  }
  return true
}

// FUNC: roundToDec() round to number of decimal places
function roundToDec(number, decimalPlaces) {
  return approxToDec(number, decimalPlaces)
}

// FUNC: approxToDec() round/floor/ceil to number of decimal places
function approxToDec(number, decimalPlaces = 2, mode = 0) {
  const factor = 10 ** decimalPlaces
  const mult = number * factor
  switch (mode) {
    case 0: // round
      return round(mult) / factor
    case 1: // floor
      return floor(mult) / factor
    case 2: // ceiling
      return ceil(mult) / factor
  }
}

// FUNC: equalsRoundedDec() round to number of decimal places
function equalsRoundedDec(num1, num2, decimalPlaces) {
  num1 = roundToDec(num1, decimalPlaces)
  num2 = roundToDec(num2, decimalPlaces)
  return num1 === num2
}

// TODO: consider the intersection with the DOM Range interface
// CLASS: Range
// SIZE: 27 lines
function range(start = 0, end = 1) { return new Range(start, end) }
class Range {
  constructor(start = 0, end = 1) {
    if (arguments.length === 1) {
      if (start instanceof Array) {
        this.start = start[0], this.end = start[1]
      } else {
        this.start = start, this.end = start
      }
    } else {
      this.end = end, this.start = start
    }
  }
  get size() { return abs(this.end - this.start) + 1 }

  array(step = 1) {
    return OpArray.from({ length: (this.end - this.start) / step + 1 }, (_, i) => this.start + (i * step))
  }
  forEach(callbackFn) { return this.array().forEach(callbackFn) }
  between(x) { return x >= this.start && x <= this.end }
  convertRange(x, range2) {
    return (x - this.start) * (range2.end - range2.start) / (this.end - this.start) + range2.start
  }
  normalize(x) { return this.convertRange(x, range()) }
  normalizeSubRange(subrange) {
    return range(normalize(subrange.start, this), normalize(subrange.end, this))
  }
  cycle(x) { return ((x - this.start) % this.size + this.size) % this.size + this.start }
}

// Sequence generator function (commonly referred to as "range", e.g. Clojure, PHP etc)
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
function rangeArray(start, stop, step = 1) { return OpArray.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step)) }

//TODO: DEPRECATE? - included in ABFeatureScript.js - actually no, because they are wrapped in calculateFeatures()
// MARK: Helper Methods
function between(x, range = [0, 1]) { return x >= range[0] && x <= range[1] }
function convertRange(value, r1, r2) { return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0] }
function normalize(value, range) { return convertRange(value, range, [0, 1]) }
function normalizeSubRange(subrange, range) {
  return [normalize(subrange[0], range), normalize(subrange[1], range)]
}






