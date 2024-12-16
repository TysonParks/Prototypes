// MARK: INITIALIZATION
// import { Direction } from './ProtoUtility.js'

//MARK: Constants
const PI = Math.PI

// CLASS: OpArray
// SIZE: 296 lines
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
  static fromObjectValues(obj) {
    return OpArray.format(Object.values(obj))
  }

  get copy() { return OpArray.from([...this]) }

  get isEmpty() { return this.length === 0 }
  get randomIndex() { return R.random_int(0, this.lastIndex) }
  get middleIndex() { return floor(this.length / 2) }
  get middle() { return this.at(this.middleIndex) }
  get randomElement() { return this.at(this.randomIndex) }
  get idMap() { return this.map(e => e.id) }
  get sum() {
    if (this.isEmpty) { return 0 }
    return this.reduce((a, b) => a + b)
  }

  get compacted() { return this.filter(e => e !== undefined && e !== null && e !== '') } // from lodash?
  get reversed() { return this.copy.reverse() }
  get numSorted() { return this.copy.sort((a, b) => a - b) }
  get gridVertSorted() { return this.copy.sort((a, b) => a.y - b.y || a.x - b.x) } // sort by y then x values
  get counterGridVertSorted() { return this.copy.sort((a, b) => a.y - b.y || b.x - a.x) } // sort by y then -x values

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

  get cornerElements() {
    const sorted = this.gridVertSorted
    const counterSorted = this.counterGridVertSorted
    return {
      upLeft: sorted.first,
      upRight: counterSorted.first,
      downRight: sorted.last,
      downLeft: counterSorted.last
    }

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

  // MARK: Key Value / Boolean
  kvArray(props) {
    if (this.isEmpty) { return new OpArray }
    const clean = this.compacted
    props = OpArray.format(props).compacted
    // DeBug.log(`props`, props)
    return clean.map(e => {
      let key
      if (props.isEmpty) {
        const isObject = Object.prototype.toString.call(e) === '[object Object]'
        key = isObject ? Object.values(e).join('-') : e
      } else {
        key = props.map(k => e[k]).join('-')
      }

      return [key, e]
    })
  }

  kvMap(props) { return new Map(this.kvArray(props)) }

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

  // NOTE: implemented with ChatGPT 4o on Jul 9. 2024
  valueCountMap(props) {
    const counts = new Map()
    // const 
    this.kvArray(props).forEach(kv => {
      if (counts.has(kv[0])) {
        counts.set(kv[0], counts.get(kv[0]) + 1)
      } else {
        counts.set(kv[0], 1)
      }
    })
    return counts
  }

  duplicates(props) {
    const counts = this.valueCountMap(props)
    const duplicates = new OpArray

    counts.forEach((count, key) => {
      if (count > 1) {
        const obj = this.kvArray(props).find(ob => ob[0] === key)
        duplicates.push(obj[1])
      }
    })

    return duplicates
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

  //METH: checks if this array contains any elements from another array
  includesAny(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => b.some(e => { return a.includes(e) })
    )
  }
  //METH: checks if this array contains all elements from another array
  includesMany(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => b.every(e => { return a.includes(e) })
    )
  }
  // MARK: BOOLEAN Operators
  // https://en.wikipedia.org/wiki/Venn_diagram
  //METH: A ⋃ B: return union or all unique values in both sets
  // [a,b,c] union [b,c,d] = [a,b,c,d]
  union(vals, props) {
    if (!vals || vals.isEmpty) { return this }
    return this.boolOp(vals, props,
      (a, b) => [...new Set([...a, ...b])]
    )
  }
  //METH: A ⋂ B: returns intersection or values that both sets have in common
  // [a,b,c] intersect [b,c,d] = [b,c]
  intersect(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a.filter(e => b.includes(e))
    )
  }
  //METH: A △ B: return difference or values that are not in common, opposite result of intersect()
  // [a,b,c] symDiff [b,c,d] = [a,d]
  symDiff(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a
        .filter(e => !b.includes(e))
        .concat(b.filter(f => !a.includes(f)))
    )
  }
  //METH: A - B: return Relative Compliment or A minus any common values that B has
  // [a,b,c] exclude [b,c,d] = [a]
  exclude(vals, props) {
    return this.boolOp(vals, props,
      (a, b) => a.filter(e => !b.includes(e))
    )
  }

  boolOp(vals, props, fn) {
    vals = OpArray.format(vals)
    props = OpArray.format(props)
    const isObjectArray = (this[0] instanceof Object)
    let a, b, kv, res
    if (isObjectArray) {
      kv = this.kvObj(vals, props)
      // DeBug.log('kv', kv)
      a = kv.aKeys
      b = kv.bKeys
    } else {
      a = this
      b = vals
    }
    res = fn(a, b)
    if (typeof res === 'boolean') { return res }
    res.sort((a, b) => a - b)
    if (isObjectArray) {
      return OpArray.from(res.map(f => kv.unionMap.get(f)))
    }
    return OpArray.from(res)
  }
  // MARK: Shifting and reduction Methods
  shifted(index) {
    const shiftedIndex = index >= 0 ? index : this.length + index
    const firstSlice = this.slice(shiftedIndex) // Extract the first slice
    const secondSlice = this.slice(0, shiftedIndex)                // The remaining part is the second slice
    return firstSlice.concat(secondSlice)   // Concatenate the second slice with the first slice
  }
  //TODO: complete implementation and test
  // apply to numeric arrays 
  reduceLength(reducer, fn) {
    let array = this.unique().numSorted
    // DeBug.log('this', this)
    // DeBug.log('array', array)
    let remove = round(reduce(array.length, reducer))
    if (remove < 1 || !fn) { return array }

    while (remove > 0) {
      array = fn(array)
      remove -= 1
    }
    return array
  }

  randReduce(reducer) {
    const remove = round(reduce(this.length, reducer))
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
  // combReduce( dashArray, start = 0 ) {
  //   let remove
  //   if (drop) { remove = drop } else { remove = keep }
  //   let period = keep + remove
  //   let offset = this.length % period - start
  //   for (let i = this.lastIndex; i > 0; i--) {
  //   }
  // }
  //NOTE: Implemented with ChatGPT o1-preview on Sept 16, 2024
  combReduce(dashArray) {
    // DeBug.log()
    // Step 1: Normalize the dashArray
    if (dashArray.length % 2 !== 0) {
      dashArray = dashArray.concat(dashArray)                // normalize the dashArray
    }

    const reduced = new OpArray

    let dashIndex = 0 // Index in the dashArray
    let isOn = true // Current state: true for "on", false for "off"
    let lengthRemaining = dashArray[0] // Length remaining in the current dash/gap

    // Check for zero-length segments and adjust accordingly
    while (lengthRemaining === 0) {
      dashIndex = (dashIndex + 1) % dashArray.length
      isOn = !isOn
      lengthRemaining = dashArray[dashIndex]
    }

    // Iterate over elements
    for (let i = 0; i < this.length; i++) {
      if (isOn) { reduced.push(this[i]) }                    // If the current state is "on", include the element
      lengthRemaining -= 1                                   // Update the length remaining in the current segment

      while (lengthRemaining <= 0) {                         // If lengthRemaining is zero or less, switch to the next segment
        dashIndex = (dashIndex + 1) % dashArray.length       // Move to the next segment in dashArray
        isOn = !isOn
        lengthRemaining = dashArray[dashIndex]

        while (lengthRemaining === 0) {                      // Skip zero-length segments
          dashIndex = (dashIndex + 1) % dashArray.length
          isOn = !isOn
          lengthRemaining = dashArray[dashIndex]
        }
      }
    }
    return reduced
  }


  randCombReduce({ keepRange, dropRange, start = 0 }) {
    let thisArray = this.copy
    if (start !== 0) { thisArray = thisArray.shifted(start) }
    let removeRange
    if (dropRange) { removeRange = dropRange } else { removeRange = keepRange }

    for (let i = 0; i < thisArray.lastIndex; i++) {
      let keep = R.random_int(keepRange.start, keepRange.end)
      let remove = R.random_int(removeRange.start, removeRange.end)
      let removeIndex
      for (let j = 0; j < remove; j++) {
        removeIndex = i + keep + j
        if (removeIndex < thisArray.length) {
          thisArray[removeIndex] = null
        } else {
          j = remove
        }
      }
      i = removeIndex
    }

    let filtered = thisArray.filter(e => e !== null)
    thisArray.splice(0, thisArray.length, ...filtered)
    return thisArray
  }

  static randomIntArray(length, range) {
    DeBug.log(`length`, length)
    let array = OpArray.format(new Array(length))
    array.forEach((n, i) => array[i] = R.random_int(range.start, range.end))
    return array
  }
}

// CLASS: Array EXTENSIONS
// SIZE: 13 lines
// #region Array EXTENSIONS
// // PROTOTYPE: Array extension `first` property
Object.defineProperty(Array.prototype, 'first', {
  get: function () {
    if (!this.isEmpty) { return this[0] }
  }
})

// PROTOTYPE: Array extension `last` property
Object.defineProperty(Array.prototype, 'last', {
  get: function () { if (!this.isEmpty) { return this[this.lastIndex] } }
})

// PROTOTYPE: Array extension 'lastIndex' property
Object.defineProperty(Array.prototype, 'lastIndex', {
  get: function () {
    // if (!this.isEmpty) {
    return this.length - 1
    // }
  }
})
// #endregion 

// CLASS: Set EXTENSIONS
// SIZE:  4 lines
Set.prototype.equals = function (set, props) {
  const thisArray = OpArray.from(this)
  const thatArray = OpArray.from(set)
  return thisArray.equals(thatArray, props)
}

// CLASS: Object EXTENSIONS
// SIZE: 11 lines
// PROTOTYPE: Object extension map() function
Object.prototype.map = function (callback) {
  const result = {}

  for (const key in this) {
    if (this.hasOwnProperty(key)) {
      const mappedValue = callback(this[key], key, this)
      result[key] = mappedValue
    }
  }

  return result
}