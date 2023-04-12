// MARK: INITIALIZATION
// import { Direction } from './ProtoUtility.js'


// CLASS: Array
// PROTOTYPE: Array extension last() function
Array.prototype.last = function () { return this.at(-1) }

// PROTOTYPE: Array extension 'lastIndex' property
Object.defineProperty(Array.prototype, 'lastIndex', {
  get: function () {
    return this.length - 1
  }
})

// CLASS: OpArray
class OpArray extends Array {
  constructor(...args) {
    super(...args)
  }

  // take a single value, or an array/OpArray and make/ensure its an OpArray
  static format(values) {
    if (!(values instanceof OpArray)) {
      if (!(values instanceof Array)) {
        values = [values]
      }
      values = OpArray.from(values)
    }
    return values
  }

  get copy() { return OpArray.from([...this]) }

  get isEmpty() { return this.length === 0 }
  get randomIndex() { return R.random_int(0, this.lastIndex) }
  get randomElement() { return this[this.randomIndex] }
  get idMap() { return this.map(e => e.id) }
  get sum() {
    if (this.isEmpty) { return 0 }
    return this.reduce((a, b) => a + b)
  }

  get compacted() { return this.filter(e => e !== undefined && e !== null && e !== '') } // from lodash?
  get reversed() { return this.copy.reverse() }
  get numSorted() { return this.copy.sort((a, b) => a - b) }

  // MARK: 2D operations
  get is2D() {
    for (let i = 0; i < this.length; i++) {
      if (!Array.isArray(this[i])) { }
    }
    return true
  }

  get size2D() {
    if (!this.is2D) { return -1 }
    return vert(this[0].length, this.length)
  }

  coords2D(value) {
    if (!this.is2D) { return -1 }
    const flat = this.flat()
    const index = flat.findIndex(e => e === value)
    if (index) { return gridCoords(index, this.size2D.x) }
    return -1
  }

  valueAt2DCoords(x, y) {
    if (!this.is2D) { return }
    if (arguments.length === 1) {
      y = x.y
      x = x.x
    }
    return this[y][x]
  }

  rotated2D(degree = 90) {
    if (!this.is2D) { return this }
    const deg = normalizeDegree(degree)
    if (deg === 0) { return this }
    const rotated = new OpArray
    for (let i = 0; i < this[0].length; i++) {
      rotated.push(new OpArray)
      for (let j = this.length - 1; j >= 0; j--) {
        rotated[i].push(this[j][i]);
      }
    }
    switch (deg) {
      case 90:
        return rotated
      case 180:
        return rotated.rotated2D()
      case 270:
        return rotated.rotated2D(180)
      default:
        throw new Error("Invalid degree. Must be 90, 180, or 270.")
    }
  }

  flipped2D(direction) {
    if (!this.is2D) { return this }
    if (direction instanceof Direction) { direction = direction.name }
    switch (direction) {
      case "horizontal":
        return this.map(e => e.reversed)
      case "vertical":
        return this.reversed
      case "negOrdinal":
        return this.rotated2D().flipped2D("horizontal")
      case "posOrdinal":
        return this.rotated2D().flipped2D("vertical")
      default:
        throw new Error("Invalid direction. Must be 'horizontal', 'vertical', 'negOrdinal', or 'posOrdinal'.")
    }
  }



  // MARK: Key Value
  kvMap(props) {
    if (this.isEmpty) { return new Map() }
    props = OpArray.format(props)
    let clean = this.compacted
    const kvArray = clean.map(el => {
      // print(clean)
      // print(props)
      const key = props.map(k => el[k]).join('-')
      return [key, el]
    })
    return new Map(kvArray)
  }

  kvObj(values, props) {
    const aMap = this.kvMap(props)
    const bMap = values.kvMap(props)
    const unionMap = new Map([...aMap, ...bMap])
    return {
      aMap: aMap,
      bMap: bMap,
      unionMap: unionMap,
      aKeys: OpArray.from(aMap.keys()),
      bKeys: OpArray.from(bMap.keys()),
      unionKeys: OpArray.from(unionMap.keys()),
    }
  }

  // NOTE: implementation from: https://stackoverflow.com/a/49222733
  unique(props) {
    if (arguments.length === 0) { return OpArray.from(new Set(this)) }
    return OpArray.from(this.kvMap(props).values())
  }



  equals(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a.length === b.length && a.toString() === b.toString(),
    )
  }
  equalsSorted(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a.length === b.length && a.numSorted.toString() === b.numSorted.toString(),
    )
  }
  exclude(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a.filter(e => !b.includes(e))
    )
  }
  includesMany(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => b.every(e => { return a.includes(e) })
    )
  }
  intersect(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a.filter(e => b.includes(e))
    )
  }

  symDiff(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a
        .filter(e => !b.includes(e))
        .concat(b.filter(f => !a.includes(f)))
    )
  }
  union(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => [...new Set([...a, ...b])]
    )
  }

  boolOp(vals, props, fn) {
    // print('using boolOp')
    vals = OpArray.format(vals)
    props = OpArray.format(props)
    const isObjectArray = (this[0] instanceof Object)
    let a, b, kv, res
    if (isObjectArray) {
      kv = this.kvObj(vals, props)
      // print(kv)
      a = kv.aKeys
      b = kv.bKeys
    } else {
      a = this
      b = vals
    }
    // print(kv)
    // print(`a: ${a}, b: ${b}`)
    // print(a, b)
    res = fn(a, b)
    // print(res)
    if (typeof res === 'boolean') { return res }
    res.sort((a, b) => a - b)
    if (isObjectArray) {
      return OpArray.from(res.map(f => kv.unionMap.get(f)))
    }
    return OpArray.from(res)
  }

  randReduce(reducer) {
    // let remove = 0
    // if (reducer < 1) {
    //   remove = round(this.length * (1 - reducer))
    // } else {
    //   remove = this.length - reducer
    // }
    let remove = round(reduce(this.length, reducer))
    for (let i = remove; i > 0; i--) {
      this.splice(this.randomIndex, 1)
    }
    return this
  }

  randShuffle() {
    for (let i = this.lastIndex; i > 0; i--) {
      const j = floor(R.random_dec() * (i + 1))
      let temp = this[i]
      this[i] = this[j]
      this[j] = temp
    }
    return this
  }

  // TODO: complete implementation
  combReduce({ keep, drop, start = 0 } = {}) {
    let remove
    if (drop) { remove = drop } else { remove = keep }
    let period = keep + remove
    let offset = this.length % period - start
    for (let i = this.lastIndex; i > 0; i--) {
    }
  }

  randCombReduce({ keepRange, dropRange, start = 0 }) {
    let removeRange
    if (dropRange) { removeRange = dropRange } else { removeRange = keepRange }

    for (let i = start; i < this.lastIndex; i++) {
      let keep = R.random_int(keepRange.start, keepRange.end)
      let remove = R.random_int(removeRange.start, removeRange.end)
      // print(`i: ${i}`)
      // print(`keep: ${keep}`)
      // print(`remove: ${remove}`)
      let removeIndex
      for (let j = 0; j < remove; j++) {
        removeIndex = i + keep + j
        if (removeIndex < this.length) {
          this[removeIndex] = null
        } else {
          j = remove
        }
        // print(`j: ${j}`)
        // print(`removeIndex: ${removeIndex}`)
        // print(`remove: ${remove}`)
      }
      i = removeIndex
    }
    // print(this)
    let filtered = this.filter(e => e !== null)
    this.splice(0, this.length, ...filtered)
    // print(filtered)
    return this
  }
}