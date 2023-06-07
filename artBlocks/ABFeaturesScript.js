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
    // MARK: Random Instance
    r

    // MARK: EnumFeatures 
    gridXEnum = new EnumFeature('GridX', this.gridXOptions)
    cellAspectEnum = new EnumFeature('Cell Aspect', this.cellAspectOptions)

    baseLayerEnum = new EnumFeature('Base Layer', this.baseLayerOptions)

    layeringEnum = new EnumFeature('Layering', this.layeringOptions)
    extraLayersEnum = new EnumFeature('Extra Layers', this.extraLayersOptions)

    additiveStyleEnum = new EnumFeature('Additive Style', this.additiveStyleOptions)
    subtractiveStyleEnum = new EnumFeature('Subtractive Style', this.subtractiveStyleOptions)

    layerDepthEnum = new EnumFeature('Layer Depth', this.depthOptions)
    layerHeightEnum = new EnumFeature('Layer Height', this.heightOptions)

    densityEnum = new EnumFeature('Density', this.densityOptions)
    pyramidalEnum = new EnumFeature('Pyramidal', this.pyramidalOptions)

    variableInsetEnum = new EnumFeature('Variable Inset', this.variableInsetOptions)
    insetRatioEnum = new EnumFeature('Inset Ratio', this.insetRatioOptions)

    luckyNumberEnum = new EnumFeature('Lucky Number', this.luckyNumberOptions)

    shapeInterpeterEnum = new EnumFeature('Shape Interpeter', this.shapeInterpeterOptions)
    shrinkWrapEnum = new EnumFeature('Shrinkwrap', this.shrinkWrapOptions)

    // MARK: Calculated Feature Properties
    x
    y
    cellAspect
    baseLayer
    layerCounts
    layers = []
    density

    constructor(randomInstance) { this.r = randomInstance }

    // MARK: Calculated Properties
    // #region Calculated Properties
    get publicFeatures() {
      return {
        // grid: `${this.x} x ${this.y}`,
        cellColumns: this.x,
        cellRows: this.y,
        cellAspect: this.cellAspect,
        baseLayer: this.baseLayer,
        additiveLayers: this.layerCounts.adds,
        subtractiveLayers: this.layerCounts.subs,
        density: this.density,

      }
    }
    get privateFeatures() {
      return {
        x: this.x,
        y: this.y,
        cellAspect: this.cellAspect,
        baseLayer: this.baseLayer,
        layerCounts: this.layerCounts,
        density: this.density,
        layers: this.layers,
      }
    }
    // #endregion

    // MARK: Methods
    // #region Methods
    //METH:
    #calcFeatures() {
      const r = this.r
      this.x = parseInt(this.gridXEnum.feature(r))
      this.cellAspect = this.cellAspectEnum.feature(r)
      this.y = this.#calcY(r)
      this.baseLayer = this.#calcBaseLayer(r)
      this.layerCounts = this.#calcLayerCounts(r)
      this.layers = this.#calcLayers(r)
      this.density = this.densityEnum.feature(r)

    }
    //METH:
    #calcY(r) {
      const x = this.x
      let y
      switch (this._cellAspect) {
        case 'Square':
          y = 2 * x
        case 'Tall':
          y = r.random_int(x, 2 * x)
        case 'Wide':
          y = r.random_int(x / 2, x)
      }
      return y
    }
    //METH:
    #calcBaseLayer(r) {
      const base = this.baseEnum.feature(r)
      switch (base) {
        case 'None':
          return 'None'
        case 'Additive':
          return this.#calcLayer(r, true)
        case 'Subtractive':
          return this.#calcLayer(r, false)
      }
    }
    //METH:
    #calcLayerCounts(r) {
      let adds, subs
      const layering = this.layeringEnum.feature(r)
      const extraGroups = this.extraGroupsEnum.feature(r)
      if (layering.includes('Additive')) { adds = 1 }
      if (layering.includes('Subtractive')) { subs = 1 }
      if (extraGroups !== 'None') {
        const extra = parseInt(extraGroups)
        if (adds && subs) {
          for (i = 0; i < extra; i++) {
            if (r.random_bool(.5)) { adds += 1 }
            else { subs += 1 }
          }
        }
        if (adds) { adds += extra }
        if (subs) { subs += extra }
      }
      return {
        'adds': adds,
        'subs': subs,
      }
    }
    //METH:
    #calcLayers(r) {
      let layers = []
      const adds = this.layerCounts.adds
      const subs = this.layerCounts.subs
      for (i = 0; i < adds; i++) { layers.push(this.#calcLayer(r, true)) }
      for (i = 0; i < subs; i++) { layers.push(this.#calcLayer(r, false)) }
      return layers
    }
    //METH:
    #calcLayer(r, additive) {
      const styleEnum = additive ? this.additiveStyleEnum : this.subtractiveStyleEnum
      const lengthEnum = additive ? this.layerHeightEnum : this.layerDepthEnum
      return {
        'type': additive ? "Additive" : "Subtractive",
        style: styleEnum.feature(r),
        length: lengthEnum.feature(r),
      }
    }
    //METH:
    #describeLayer(layer) {
      const length = layer.type === "Additive" ? "high" : "deep"
      return `${layer.length} ${length} ${layer.style}-style`
    }
    // #endregion

    //MARK: Feature Options
    // #region Feature Options
    //Public: x cell width of grid
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
    // Public: y cell height of grid
    cellAspectOptions = [
      ['Square', 0.8],
      ['Tall', 0.1],
      ['Wide', 0.1],
    ]
    // Public: (TRANSLATED) base is layer framing the grid
    baseLayerOptions = [
      ['None', 0.4],
      ['Additive', 0.35],
      ['Subtractive', 0.25],
    ]

    // Private: layering options
    layeringOptions = [
      ['Additive', 0.15],
      ['Subtractive', 0.3],
      ['Additive and Subtractive', 0.45],
    ]
    // Private: pyramidal options
    pyramidalOptions = [
      ['True', 0.3],
      ['False', 0.7],
    ]
    // Private: amount of extra groups to create
    extraLayersOptions = [
      ['None', 0.5],
      ['1', 0.35],
      ['2', 0.125],
      ['3', 0.025],
    ]

    // Public: how densely the grid is filled with shapes
    densityOptions = [
      ['So Lonely', 0.1],
      ['Some Availability', 0.15],
      ['At Capacity', 0.75],
    ]

    // Public: inset options
    insetRatioOptions = [
      ['1:1', 0.4],
      ['2:1', 0.3],
      ['3:1', 0.2],
      ['5:1', 0.1],
    ]
    // Public: lucky numbers trigger special shape instructions
    luckyNumberOptions = [
      ['7', 0.75],
      ['13', 0.75],
      ['23', 0.75],
      ['69', 0.1],
      ['420', 0.15],
    ]
    // Public: shape interpretor version
    shapeInterpeterOptions = [
      ['v0', 0.025],
      ['v1', 0.375],
      ['v2', 0.6],
    ]
    // Public: block wraps to design
    shrinkWrapOptions = [
      ['True', 0.2],
      ['False', 0.8],
    ]
    // Public:  
    variableInsetOptions = [
      ['None', 0.8],
      ['Unhinged', 0.05],
      ['Lively', 0.05],
      ['Tame', 0.8],
    ]

    // Private: (INSTANCE USE) style of additive cut
    additiveStyleOptions = [
      ['j', 0.2],
      ['i', 0.2],
      ['v', 0.3],
      ['r', 0.3],
    ]
    // Private: (INSTANCE USE) style of subtractive cut
    subtractiveStyleOptions = [
      ['j', 0.5],
      ['i', 0.15],
      ['v', 0.3],
      ['r', 0.05],
    ]
    // Private: (INSTANCE USE) (additive) height of addons
    heightOptions = [
      ['Plate', 0.15],
      ['Curb', 0.2],
      ['Bench', 0.25]
      ['Loading Dock', 0.35],
      ['Roof Drop', 0.05],
    ]
    // Private: (INSTANCE USE) (subtractive) depth of cutouts
    depthOptions = [
      ['Puddle', 0.05],
      ['Kiddie Pool', 0.15],
      ['Backyard Pool', 0.25],
      ['Olympic Pool', 0.35],
      ['Dynamic', 0.2],
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

  // MARK: Helper Methods
  // #region Helper Methods
  function between(x, range = [0, 1]) { return x >= range[0] && x <= range[1] }
  function convertRange(value, r1, r2) { return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0] }
  function normalize(value, range) { return convertRange(value, range, [0, 1]) }
  function normalizeSubRange(subrange, range) { return [normalize(subrange[0], range), normalize(subrange[1], range)] }
  // #endregion

  return calculateAll()
}








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