// TESTING from https://github.com/ArtBlocks/artblocks-docs
// function random_hash() {
//   let x = "0123456789abcdef", hash = '0x'
//   for (let i = 64; i > 0; --i) {
//     hash += x[Math.floor(Math.random() * x.length)]
//   }
//   return hash
// }

// const tokenData = {
//   "hash": random_hash(),
//   "tokenId": "123000456"
// }


// MARK: Singular AB Feature Script - Everything must go in here
// MARK:

// TODO: please investigate and make notes about best practices for storing ENUM constants in Arrays vs Objects. 
// NOTE: From investigation:  arrays and objects can be translated <->, so it's is more about the following:
// NOTE: •Objects are like Sets, so keys are unique, which we want here
// NOTE: •Objects use 2 less characters per line and are likely more readable

// FUNC: calculateFeatures
function calculateFeatures(token = tokenData) {
  // Action

  let features

  function calcFeatures() {

  }

  function calculateAll() {
    // initFeatures()
    features = new FeatureSet()
    console.log('features', features)
    calcFeatures()
    return
  }


  class FeatureSet {
    gridX = new EnumFeature('GridX', this.gridXOptions)
    cellAspect = new EnumFeature('Cell Aspect', this.cellAspectOptions)

    base = new EnumFeature('Base', this.baseOptions)

    layering = new EnumFeature('Layering', this.layeringOptions)
    extraGroups = new EnumFeature('Extra Groups', this.extraGroupsOptions)
    layerDepth = new EnumFeature('Layer Depth', this.depthOptions)
    layerHeight = new EnumFeature('Layer Height', this.heightOptions)

    density = new EnumFeature('Density', this.densityOptions)

    variableInset = new EnumFeature('Variable Inset', this.variableInsetOptions)
    insetRatio = new EnumFeature('Inset Ratio', this.insetRatioOptions)

    luckyNumber = new EnumFeature('Lucky Number', this.luckyNumberOptions)

    shapeInterpeter = new EnumFeature('Shape Interpeter', this.shapeInterpeterOptions)
    shrinkWrap = new EnumFeature('Shrinkwrap', this.shrinkWrapOptions)


    r

    constructor(randomInstance) { this.r = randomInstance }

    getfeatures() {
      const r = this.r
      const features = {
        x: this.gridX.feature(r),
        y: this.gridY.feature(r),
        cellAspect: this.cellAspect.feature(r),
      }
      return features
    }

    #calcFeatures() {
      const r = this.r
      this._x = parseInt(this.gridX.feature(r))
      this._cellAspect = this.cellAspect.feature(r)
      this._y = this.#calcGrid(r)
      this._base = this.base.feature(r)
      this._layering = this.cutLayering.feature(r)
    }

    #calcGrid(r) {
      const x = this._x
      let y
      switch (this._cellAspect) {
        case 'Square':
          y = 2 * x
        case 'Tall':
          y = r.random_int(x, 2 * x)
        case 'Wide':
          y = r.random_int(x / 2, x)
      }
    }

    //MARK: Options
    // #region Options
    // x cell width of grid
    gridXOptions = [
      ['10', 0.025],
      ['9', 0.05],
      ['8', 0.05],
      ['7', 0.1],
      ['6', 0.2],
      ['5', 0.2],
      ['4', 0.2],
      ['3', 0.1],
      ['2', 0.05],
      ['1', 0.025],
    ]
    // y cell height of grid
    cellAspectOptions = [
      ['square', 0.8],
      ['tall', 0.1],
      ['wide', 0.1],
    ]
    // base is layer framing the grid
    baseOptions = [
      ['None', 0.4],
      ['Additive', 0.35],
      ['Subtractive', 0.25],
    ]

    // cut layering options
    layeringOptions = [
      ['Single additive', 0.25],
      ['Single subtractive', 0.25],
      ['Additive and Subtractive', 0.2],
      ['Additive Pyramidal', 0.1],
      ['Subtractive Pyramidal', 0.1],
      ['Additive and Subtractive Pyramidal', 0.1],
    ]
    // how densely the grid is filled with shapes
    densityOptions = [
      ['So Lonely', 0.1],
      ['Some Availability', 0.15],
      ['At Capacity', 0.75],
    ]
    // amount of extra groups to create
    extraGroupsOptions = [
      ['None', 0.5],
      ['1', 0.35],
      ['2', 0.125],
      ['3', 0.025],
    ]

    // depth of cutouts
    depthOptions = [
      ['Puddle', 0.05],
      ['Kiddie', 0.15],
      ['Backyard', 0.25],
      ['Olympic', 0.35],
      ['Dynamic', 0.2],
    ]
    // height of addons
    heightOptions = [
      ['Plate', 0.2],
      ['Curb', 0.35],
      ['Loading Dock', 0.35],
      ['Roof Drop', 0.1],
    ]

    // inset options
    insetRatioOptions = [
      ['1:1', 0.4],
      ['2:1', 0.3],
      ['3:1', 0.2],
      ['5:1', 0.1],
    ]
    // lucky numbers trigger special shape instructions
    luckyNumberOptions = [
      ['7', 0.75],
      ['13', 0.75],
      ['23', 0.75],
      ['69', 0.1],
      ['420', 0.15],
    ]
    // shape interpretor version
    shapeInterpeterOptions = [
      ['v0', 0.025],
      ['v1', 0.375],
      ['v2', 0.6],
    ]
    // block wraps to design
    shrinkWrapOptions = [
      ['True', 0.2],
      ['False', 0.8],
    ]
    // 
    variableInsetOptions = [
      ['None', 0.8],
      ['Unhinged', 0.05],
      ['Lively', 0.05],
      ['Tame', 0.8],
    ]





    stripeStyleOptions = [
      ['None', 0.0],
      ['Vertical', 0.4],
      ['Horizontal', 0.6],
    ]




    complexStyleOptions = [
      ['None', 0.0],
      ['Vertical Dyad', 0.3],
      ['Vertical Triad', 0.45],
      ['Horizontal Dyad', 0.25],
    ]

    symmetryStyleOptions = [
      ['None', 0.0],
      ['Circular', 0.2],
      ['Harmonic', 0.2],
      ['Fibonacci', 0.2],
      ['Palindromic Reflectional', 0.2],
      ['Flipped', 0.2],
      ['Radial', 0.2],
      ['Glide Reflection', 0.2],
    ]
    // #endregion
  }

  // TODO: this could probably be refined with new understanding of ENUMS in js
  // ENUM: EnumFeature 
  class EnumFeature {
    #category
    #options
    #weightedOptions

    constructor(category, options = []) {
      this.#category = category
      this.#options = options
      this.#weightedOptions = this.#weighOptions()
    }

    // public methods
    feature(r) { return this.#getFeature(this.#getFeatureIndex(r.random_dec())) }
    // none() { return this.#getFeature(0) }
    none() {
      if (this.#options.some(e => e[0] === 'None')) {
        let index = this.#weightedOptions.findIndex(e => e[0] === "None")
        return this.#getFeature(index)
      }
      // return this.#options.some(e => e[0] === 'None')
    }

    // private methods
    #getFeature(index) { return [this.#category, this.#options[index][0]] }
    #getFeatureIndex(weight) { return this.#weightedOptions.findIndex(e => between(weight, e[1])) }
    #totalWeight() {
      return this.#options
        .map(option => option[1])
        .reduce((a, b) => a + b, 0)
    }
    #weighOptions() {
      let p = []
      let currentWeight = 0
      let weightRange = [0, this.#totalWeight()]
      this.#options.forEach(e => {
        let range = [currentWeight, currentWeight + e[1]]
        let normRange = normalizeSubRange(range, weightRange)
        currentWeight += e[1]
        p.push([e[0], normRange])
      })
      return p
    }
  }

  // helper methods
  function between(x, range = [0, 1]) { return x >= range[0] && x <= range[1] }
  function convertRange(value, r1, r2) { return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0] }
  function normalize(value, range) { return convertRange(value, range, [0, 1]) }
  function normalizeSubRange(subrange, range) {
    return [normalize(subrange[0], range), normalize(subrange[1], range)]
  }

  return calculateAll()
}

// class FeatureImplementation(feature) {

// }

//MARK: UNUSED FEATURES

function unusedFeatures() {

  const protoStyleOptions = [
    ['Grid', 0.3],
    ['Stacks', 0.2],
    ['Complex', 0.3],
    ['Object', 0.1],
    ['Stripes', 0.1],
  ]
  const animStyleOptions = [
    ['None', 0.0],
    ['Rotate Light', 0.2],
    ['Rotate Hue', 0.2],
    ['Bounce', 0.2],
  ]
  const interactionStyleOptions = [
    ['None', 0.0],
    ['Trigger', 0.2],
    ['Mix', 0.2],
    ['Switch', 0.2],
  ]
  const lightStyleOptions = [
    ['Monochrome', 0.2],
    ['Chromatic', 0.2],
    ['Fake Chroma', 0.2],
    ['Hot', 0.2],
  ]
  const materialOptions = [
    ['White Paper', 0.2],
    ['Gray Paper', 0.2],
    ['Gradient Paper', 0.2],
    ['Black Plastic', 0.2],
  ]
  const troubleStyleOptions = [
    ['TRS', 0.2],
    ['Blurred', 0.2],
    ['Print Alignment', 0.2],
    ['None', 0.0],
  ]
  const roundingStyleOptions = [
    ['Monad', 0.2],
    ['Dyad', 0.2],
    ['Triad', 0.2],
    ['Quad', 0.2],
    ['Hexad', 0.2],
    ['Octad', 0.2],
  ]
}