// MARK: CONSTANTS
const nonAdjRows = [[3, 4], [7, 8], [11, 12], [15, 16], [19, 20], [23, 24], [27, 28]]
const nonAdjColumns = [[28, 1], [29, 2], [30, 3]]


const originalMap = [
  0, 1, 2, 3,
  4, 5, 6, 7,
  8, 9, 10, 11,
  12, 13, 14, 15,
  16, 17, 18, 19,
  20, 21, 22, 23,
  24, 25, 26, 27,
  28, 29, 30, 31
]
const columnSort = [
  0, 4, 8, 12, 16, 18, 24, 28,
  1, 5, 9, 13, 17, 21, 25, 29,
  2, 6, 10, 14, 18, 22, 26, 30,
  3, 7, 11, 15, 19, 23, 27, 31
]

// const columnRemap = [
//   0, 8, 16, 24,
//   1, 9, 17, 25,
//   2, 10, 18, 26,
//   3, 11, 19, 27,
//   4, 12, 20, 28,
//   5, 13, 21, 29,
//   6, 14, 22, 30,
//   7, 15, 23, 31,
// ]

const testInput = [
  60, 16, 24,
  30, 31, 37,
  45, 63, 30
]

const testLayoutX = 3
const testLayoutY = 3
const testIndices = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]

// TODO: integrate with Grid and GridGroup Classes

// MARK: Newer Grid Layout Functions

// create ordered index slices for each row in a grid layout
function gridRowIndices(x, y) {
  let rows = [...Array(y).keys()]
  let baseRow = [...Array(x).keys()]
  return rows.map(e => {
    return baseRow.map(f => f + (e * x))
  })
}
// create ordered index slices for each column in a grid layout
function gridColumnIndices(x, y) {
  let columns = [...Array(x).keys()]
  let baseColumn = [...Array(y).keys()].map(e => e * x)
  return columns.map(e => {
    return baseColumn.map(f => e + f)
  })
}
// map an array to an array of sliced indices
function inputToIndices(input = testInput, indices = testIndices) {
  return indices.map(e => { return e.map(f => input[f]) })
}

function inputToGridRows(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
  let indices = gridRowIndices(gridX, gridY)
  return inputToIndices(input, indices)
}

function printInputToGridRows(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
  let rows = inputToGridRows(input, gridX, gridY)
  rows.forEach((e, i) => {
    // print('hi')
    // print(`row ${i}`)
    print(e ? e : 'empty')
  })
}

function inputToGridColumns(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
  let indices = gridColumnIndices(gridX, gridY)
  return inputToIndices(input, indices)
}

// find index pairs of similar neighbors in an array
function similarNeighborsIndices(threshold, input = testIndices) {
  let pairs = []
  for (let i = 0; i < (input.length - 1); i++) {
    if (abs(input[i] - input[i + 1]) <= threshold) {
      pairs.push([i, i + 1])
    }
  }
  return pairs
}
// find similar neighbor index pairs in multiple slices
function similarSlicedNeighborsIndices(threshhold, input = testInput, indices = testIndices) {
  let slices = inputToIndices(input, indices)
  let neighbors = slices.map((e, i) => {
    let localNeighbors = similarNeighborsIndices(threshhold, e)
    // print(`localNeighbors[${i}]:${localNeighbors}`)
    let reindexedNeighbors = localNeighbors.map(f => {
      return f.map(g => indices[i][g])
    })
    // print(`reindexedNeighbors:${reindexedNeighbors}`)
    return reindexedNeighbors
  })
  // print(neighbors.flat())
  return neighbors.flat()
}
// find all similar neighbor index pairs in a grid
function similarGridNeighbors(threshold, gridX = testLayoutX, gridY = testLayoutY, input = testInput) {
  let rowsIndex = gridRowIndices(gridX, gridY)
  let columnsIndex = gridColumnIndices(gridX, gridY)
  let rowNeighbors = similarSlicedNeighborsIndices(threshold, input, rowsIndex)
  let columnNeighbors = similarSlicedNeighborsIndices(threshold, input, columnsIndex)
  // print(`rowNeighbors: ${rowNeighbors}`)
  // print(`columnNeighbors: ${columnNeighbors}`)
  // print([[...rowNeighbors], [...columnNeighbors]].flat())
  return [[...rowNeighbors], [...columnNeighbors]].flat()
}

// TODO: DEPRECATE
// MARK: OG LAYOUT FUNCTIONS
function createBaseDivs(array = [1, 2, 3, 4]) {
  divs = []
  // create square divs using rns
  if (array.length == 32) {
    divs = array.forEach((e, i) => createSquareBase(e, i))
  }

  // create rect divs using rns64
  if (array.length == 64) {
    divs = array.forEach(
      (e, i) => {
        if (!(i % 2)) {
          createRectBase(e, array[i + 1], (i / 2))
        }
      }
    )
  }
  return divs
}

function createCnctDivs(array = [1, 2, 3, 4]) {
  divs = []
}

function createSquareBase(e, i) {
  let randomSize = map(e, 0, 255, 4, 30) + "%";
  let iHex5 = hex5[i]
  let name = iHex5 + '\n' + e

  let div = createDiv(name);
  div.style("color", "#ffffff");
  div.style("background-color", "#666666");
  // div.style("transform", "rotate(" + random(-90, 90) + "deg)");
  div.style("padding", randomSize);
  div.style("text-align", "center");
  div.style("border-radius", "20%");
  div.id("div" + i);
  div.parent(b4);
  return div
}


function createRectBase(x, y, i) {
  let iHex5 = hex5[i]
  let xMap = floor(map(x, 0, 15, 0, 100))
  let yMap = floor(map(y, 0, 15, 0, 100))
  let xSize = xMap + "px";
  let ySize = yMap + "px";
  let randomSize = xSize + " " + ySize;
  // let baseName = 
  let radius = min(xMap, yMap) / 1 + "px"

  let div = createDiv();
  div.id("div:" + iHex5);
  div.parent(b4);

  if (min(x, y) > 1) {
    div.style("color", "#ffffff")
    div.style("background-color", "#666666");
    // div.style("transform", "rotate(" + random(-180, 180) + "deg)");
    div.style("width", xSize)
    div.style("height", ySize)
    // div.style("padding", randomSize);
    // div.style("display", "flex");
    div.style("line-height", ySize)
    div.style("text-align", "center");
    div.style("justify-items", "center");
    div.style("align-items", "center");
    div.style("border-radius", radius);

    // createDiv(iHex5 + ':' + x + 'x' + y)
    //  .parent(div);
  }
  return div
}

// TODO:DEPRECATE - DOES NOT WORK! I think I've already replaced all of this somewhere
// MARK: HASH SEED FUNCTIONS
// function allConnects(threshold, input = [1, 2, 3, 4], remap = []) {
//   let rowConnects = pointsToHex5s(adjacentPairs(threshold, input, nonAdjRows));
//   let columnConnects = pointsToHex5s(adjacentPairs(threshold, input, nonAdjColumns, remap));
//   rowConnects.push(...columnConnects);
//   return rowConnects
// }

// function adjacentPairs(threshold, input = [1, 2, 3, 4], exclude = [], remap = []) {
//   let previous = -300
//   let pairs = []
//   let array = remapByIndex(input, remap)
//   for (let i = 0; i < array.length; i++) {
//     let e = array[i]
//     if (abs(e - previous) <= threshold) {
//       let match = [i - 1, i]
//       if (exclude.includes(match) == false) {
//         pairs.push(match)
//       }
//     }
//     previous = e
//   }
//   // pairs
//   return pairs
// }
