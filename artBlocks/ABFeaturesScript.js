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



  //MARK: Options
  // cut layering options
  const cutOptions = [
    ['additive single', 0.2],
    ['subtractive single', 0.2],
    ['additive and subtractive', 0.2],
    ['additive pyramidal', 0.2],
    ['subtractive pyramidal', 0.2],
  ]
  // how densely the grid is filled with shapes
  const densityOptions = [
    ['so lonely', 0.1],
    ['some availability', 0.15],
    ['at capacity', 0.75],
  ]
  // depth of cutouts
  const depthOptions = [
    ['puddle', 0.05],
    ['kiddie', 0.15],
    ['backyard', 0.25],
    ['olympic', 0.35],
    ['dynamic', 0.2],
  ]
  // x cell width of grid
  const gridXOptions = [
    ['None', 0.0],
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
  const gridYOptions = [
    ['2x', 0.8],
    ['stretch Horizontal', 0.1],
    ['stretch Vertical', 0.1],
  ]
  // amount of groups to create
  const groupCountOptions = [
    ['2', 0.4],
    ['3', 0.3],
    ['4', 0.2],
    ['5', 0.1],
  ]
  // height of addons
  const heightOptions = [
    ['plate', 0.2],
    ['curb', 0.35],
    ['loading dock', 0.35],
    ['roof drop', 0.1],
  ]
  // inset options
  const insetRatioOptions = [
    ['1:1', 0.4],
    ['2:1', 0.3],
    ['3:1', 0.2],
    ['5:1', 0.1],
  ]
  // lucky numbers trigger special shape instructions
  const luckyNumberOptions = [
    ['7', 0.75],
    ['13', 0.75],
    ['23', 0.75],
    ['69', 0.1],
    ['420', 0.15],
  ]
  // shape interpretor version
  const shapeInterpeterOptions = [
    ['v0', 0.025],
    ['v1', 0.375],
    ['v2', 0.6],
  ]
  // block wraps to design
  const shrinkWrapOptions = [
    ['true', 0.2],
    ['false', 0.8],
  ]
  //



  const protoStyleOptions = [
    ['Grid', 0.3],
    ['Stacks', 0.2],
    ['Complex', 0.3],
    ['Object', 0.1],
    ['Stripes', 0.1],
  ]

  const stripeStyleOptions = [
    ['None', 0.0],
    ['Vertical', 0.4],
    ['Horizontal', 0.6],
  ]




  const complexStyleOptions = [
    ['None', 0.0],
    ['Vertical Dyad', 0.3],
    ['Vertical Triad', 0.45],
    ['Horizontal Dyad', 0.25],
  ]

  const symmetryStyleOptions = [
    ['None', 0.0],
    ['Circular', 0.2],
    ['Harmonic', 0.2],
    ['Fibonacci', 0.2],
    ['Palindromic Reflectional', 0.2],
    ['Flipped', 0.2],
    ['Radial', 0.2],
    ['Glide Reflection', 0.2],
  ]




  // Enums
  let protoStyle,
    stripeStyle,
    gridStyle,
    complexStyle,
    roundingStyle,
    animStyle,
    lightStyle,
    material,
    troubleStyle

  function initFeatures() {
    protoStyle = new EnumFeature("Prototype Style", protoStyleOptions)
    stripeStyle = new EnumFeature("Stripe Style", stripeStyleOptions)
    gridStyle = new EnumFeature("Grid Style", gridStyleOptions)
    complexStyle = new EnumFeature("Complex Style", complexStyleOptions)

    roundingStyle = new EnumFeature("Rounding Style", roundingStyleOptions)
    animStyle = new EnumFeature("Animation Style", animStyleOptions)
    lightStyle = new EnumFeature("Lighting Style", lightStyleOptions)
    material = new EnumFeature("Material", materialOptions)
    troubleStyle = new EnumFeature("Trouble Style", troubleStyleOptions)
  }

  function calcFeatures() {

  }

  function calculateAll() {
    initFeatures()
    calcFeatures()
    return troubleStyle.none()
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
    feature(weight) { return this.#getFeature(this.#getFeatureIndex(weight)) }
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