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
  let featureSet

  function calcFeatures() {

  }

  function calculateAll() {
    featureSet = new FeatureSet(R)
    console.log('featureSet', featureSet)
    calcFeatures()
    return
  }

  class FeatureSet {
    // MARK: Random Instance
    r
    // MARK: Calculated Feature Properties
    x
    y
    cellAspect
    baseLayer
    layerCounts
    layers = []
    density

    enums
    options

    constructor(randomInstance) {
      this.r = randomInstance
      this.#initFeatureSets()
      this.#calcFeatures()
    }

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
      this.x = parseInt(this.enums.gridX.feature(r))
      this.cellAspect = this.enums.cellAspect.feature(r)
      this.y = this.#calcY(r)
      this.baseLayer = this.#calcBaseLayer(r)
      this.layerCounts = this.#calcLayerCounts(r)
      this.layers = this.#calcLayers(r)
      this.density = this.enums.density.feature(r)

    }
    //METH:
    #calcY(r) {
      const x = this.x
      let y
      switch (this.cellAspect) {
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
      const base = this.enums.baseLayer.feature(r)
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
      const layering = this.enums.layering.feature(r)
      const extraGroups = this.enums.extraLayers.feature(r)
      if (layering.includes('Additive')) { adds = 1 }
      if (layering.includes('Subtractive')) { subs = 1 }
      if (extraGroups !== 'None') {
        const extra = parseInt(extraGroups)
        if (adds && subs) {
          for (let i = 0; i < extra; i++) {
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
      for (let i = 0; i < adds; i++) { layers.push(this.#calcLayer(r, true)) }
      for (let i = 0; i < subs; i++) { layers.push(this.#calcLayer(r, false)) }
      return layers
    }
    //METH:
    #calcLayer(r, additive) {
      const style = additive ? this.enums.additiveStyle : this.enums.subtractiveStyle
      const length = additive ? this.enums.layerHeight : this.enums.layerDepth
      return {
        'type': additive ? "Additive" : "Subtractive",
        style: style.feature(r),
        length: length.feature(r),
      }
    }
    //METH:
    #describeLayer(layer) {
      const length = layer.type === "Additive" ? "high" : "deep"
      return `${layer.length} ${length} ${layer.style}-style`
    }
    //METH:
    #initFeatureSets() {
      const enums = {}
      Object.keys(this.options).forEach((optionKey) => {
        const option = this.options[optionKey]
        const { name: name, options: optionValues } = option
        const enumFeature = new EnumFeature(name, optionValues)
        enums[optionKey] = enumFeature
      })

      this.enums = enums
    }
    // #endregion

    //MARK: Feature Options
    // #region Feature Options
    //Public: x cell width of grid
    options = {
      gridX: {
        name: 'GridX',
        options: [
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
      },
      // Public: y cell height of grid
      cellAspect: {
        name: 'Cell Aspect',
        options: [
          ['Square', 0.8],
          ['Tall', 0.1],
          ['Wide', 0.1],
        ]
      },
      // Public: (TRANSLATED) base is layer framing the grid
      baseLayer: {
        name: 'Base Layer',
        options: [
          ['None', 0.4],
          ['Additive', 0.35],
          ['Subtractive', 0.25],
        ]
      },
      // Private: layering options
      layering: {
        name: 'Layering',
        options: [
          ['Additive', 0.2],
          ['Subtractive', 0.3],
          ['Additive and Subtractive', 0.5],
        ]
      },
      // Private: pyramidal options
      pyramidal: {
        name: 'Pyramidal',
        options: [
          ['True', 0.3],
          ['False', 0.7],
        ]
      },
      // Private: amount of extra groups to create
      extraLayers: {
        name: 'Extra Layers',
        options: [
          ['None', 0.5],
          ['1', 0.35],
          ['2', 0.125],
          ['3', 0.025],
        ]
      },

      // Public: how densely the grid is filled with shapes
      density: {
        name: 'Density',
        options: [
          ['So Lonely', 0.1],
          ['Some Availability', 0.15],
          ['At Capacity', 0.75],
        ]
      },
      // Public: grid corner that traversal functions start at
      gridTraversalStart: {
        name: 'Grid Traversal Start',
        options: [
          ['Top Left', 0.3],
          ['Top Right', 0.3],
          ['Bottom Right', 0.2],
          ['Bottom Left', 0.2]
        ]
      },
      // Public: direction that traversal functions
      gridTraversalDirection: {
        name: 'Grid Traversal Direction',
        options: [
          ['Horizontal', 0.6],
          ['Vertical', 0.4]
        ]
      },

      // Public: inset options
      insetRatio: {
        name: 'Inset Ratio',
        options: [
          ['1:1', 0.4],
          ['2:1', 0.3],
          ['3:1', 0.2],
          ['5:1', 0.1],
        ]
      },
      // Public: lucky numbers trigger special shape instructions
      luckyNumber: {
        name: 'Lucky Number',
        options: [
          ['7', 0.75],
          ['13', 0.75],
          ['23', 0.75],
          ['69', 0.1],
          ['420', 0.15],
        ]
      },
      // Public: shape interpretor version
      shapeInterpeter: {
        name: 'Shape Interpreter',
        options: [
          ['v0', 0.025],
          ['v1', 0.375],
          ['v2', 0.6],
        ]
      },
      // Public: block wraps to design
      shrinkWrap: {
        name: 'Shrink Wrap',
        options: [
          ['True', 0.2],
          ['False', 0.8],
        ]
      },
      // Public:  
      variableInset: {
        name: 'Variable Inset',
        options: [
          ['None', 0.8],
          ['Unhinged', 0.05],
          ['Lively', 0.05],
          ['Tame', 0.1],
        ]
      },

      // Private: (INSTANCE USE) style of additive cut
      additiveStyle: {
        name: 'Additive Style',
        options: [
          ['j', 0.2],
          ['i', 0.2],
          ['v', 0.3],
          ['r', 0.3],
        ]
      },
      // Private: (INSTANCE USE) style of subtractive cut
      subtractiveStyle: {
        name: 'Subtractive Style',
        options: [
          ['j', 0.5],
          ['i', 0.15],
          ['v', 0.3],
          ['r', 0.05],
        ]
      },
      // Private: (INSTANCE USE) (subtractive) depth of cutouts
      layerDepth: {
        name: 'Depth',
        options: [
          ['Puddle', 0.05],
          ['Kiddie Pool', 0.15],
          ['Backyard Pool', 0.25],
          ['Olympic Pool', 0.35],
          ['Dynamic', 0.2],
        ]
      },
      // Private: (INSTANCE USE) (additive) height of addons
      layerHeight: {
        name: 'Height',
        options: [
          ['Plate', 0.15],
          ['Curb', 0.2],
          ['Bench', 0.25],
          ['Loading Dock', 0.35],
          ['Roof Drop', 0.05],
        ]
      },


      // MARK: Currently unused
      stripeStyle: {
        name: 'Stripe Style',
        options: [
          ['None', 0.0],
          ['Vertical', 0.4],
          ['Horizontal', 0.6],
        ]
      },
      complexStyle: {
        name: 'Complex Style',
        options: [
          ['None', 0.0],
          ['Vertical Dyad', 0.3],
          ['Vertical Triad', 0.45],
          ['Horizontal Dyad', 0.25],
        ]
      },
      symmetryStyle: {
        name: 'Symmetry Style',
        options: [
          ['None', 0.0],
          ['Circular', 0.2],
          ['Harmonic', 0.2],
          ['Fibonacci', 0.2],
          ['Palindromic Reflectional', 0.2],
          ['Flipped', 0.2],
          ['Radial', 0.2],
          ['Glide Reflection', 0.2],
        ]
      },
    }
    // #endregion
  }

  // TODO: this could probably be refined with new understanding of ENUMS in js
  // ENUM: EnumFeature 
  class EnumFeature {
    #category
    #options
    #weightedOptions

    constructor(category, options = []) {
      // console.log('category', category)
      // console.log('options', options)
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
    #getFeature(index) {
      // console.log(this.#category)
      // console.log(this.#options)
      return this.#options[index][0]
      // return [this.#category, this.#options[index][0]]
    }
    #getFeatureIndex(weight) { return this.#weightedOptions.findIndex(e => between(weight, e[1])) }
    #totalWeight() {
      console.log(this.#category)
      // console.log(this.#options)
      const weight = this.#options
        .map(option => option[1])
        .reduce((a, b) => a + b, 0)
      console.log(`total weight:`, weight)
      return weight
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