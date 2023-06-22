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
    if (F) { F = featureSet }
    calcFeatures()
    return
  }

  class FeatureSet {
    // MARK: Calculated Feature Properties
    // grid dependencies
    x
    y
    layers = [] // actually a shader dependency - just here for logging purposes
    baseLayer
    cellAspect
    // shader dependencies
    layerTypes
    extraLayers
    layerCounts
    variableLayerStyles
    variableLayerLofts
    insetRatio
    insetVariability
    pyramidal
    // (layers)
    // group dependencies
    density
    weight
    seedStyle
    modifierStyle
    symmetryStyle
    // shape dependencies
    shapeInterpreter
    shrinkwrap

    // underlying storage (could be private?)
    r
    enums

    constructor(randomInstance) {
      this.r = randomInstance
      this.#initFeatureSets()
      this.#calcFeatures()
    }

    // MARK: Public Method
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

    // MARK: Private Methods
    // #region Private Methods
    //METH:
    #calcFeatures() {
      const r = this.r
      // grid dependencies
      this.x = this.#calcX(r)
      this.cellAspect = this.enums.cellAspect.feature(r)
      this.y = this.#calcY(r)
      this.baseLayer = this.#calcBaseLayer(r)
      console.log('baseLayer', this.baseLayer)
      // shader dependencies
      this.layerTypes = this.enums.layerTypes.feature(r)
      this.extraLayers = this.enums.extraLayers.feature(r)
      this.layerCounts = this.#calcLayerCounts(r)
      this.variableLayerStyles = this.enums.variableLayerStyles.feature(r) === 'True'
      this.variableLayerLofts = this.enums.variableLayerLofts.feature(r) === 'True'
      this.inset = this.enums.inset.feature(r)
      this.insetRatio = this.enums.insetRatio.feature(r)
      this.insetVariability = this.enums.insetVariability.feature(r)
      this.pyramidal = this.enums.pyramidal.feature(r) === 'True'
      this.layers = this.#calcLayers(r)
      // group dependencies
      this.density = this.enums.density.feature(r)
      this.weight = this.#calcWeight(r)
      this.seedStyle = this.enums.seedStyle.feature(r)
      this.gridTraversalStart = this.enums.startQuad.feature(r)
      this.gridTraversalDirection = this.enums.gridTraversalDirection.feature(r)
      this.modifierStyle = this.enums.modifierStyle.feature(r)
      this.symmetryStyle = this.enums.symmetryStyle.feature(r)
      this.symmetryStart = this.enums.startQuad.feature(r)
      // shape dependencies
      this.shapeInterpreter = this.enums.shapeInterpreter.feature(r)
      this.shrinkwrap = this.enums.shrinkWrap.feature(r) === 'True'
    }
    // #endregion
    // MARK: Grid Methods
    // #region Grid Methods
    //METH:
    #calcX(r) {
      const x = parseInt(this.enums.gridX.feature(r))
      if (x < 4) {
        this.enums.extraLayers.removeOptions(['2', '3'])
        this.enums.pyramidal.replaceOptions([['True', 0.5], ['False', 0.5]])
        this.enums.seedStyle.reduceOptions(['Noise', 'Random Comb'])
        this.enums.modifierStyle.reduceOptions(['None', 'Concentric',])
      }
      if (x > 7) {
        this.enums.density.replaceOptions([['So Lonely', 0.2], ['Some Availability', 0.4], ['At Capacity', 0.4],])
        this.enums.insetRatio.removeOptions(['3:2', '2:1'])
        this.enums.pyramidal.replaceOptions([['True', 0.2], ['False', 0.8]])
      }
      return x
    }

    //METH:
    #calcY(r) {
      const x = this.x
      const interpOpts = () => { this.enums.shapeInterpreter.replaceOptions([['v0', 0.05], ['v1', 0.95]]) }
      let y
      switch (this.cellAspect) {
        case 'Square':
          return 2 * x
        case 'Tall':
          interpOpts()
          return r.random_int(x, 2 * x)
        case 'Wide':
          interpOpts()
          return r.random_int(x / 2, x)
      }
    }
    // #endregion
    // MARK: Layer Methods
    // #region Layer Methods
    //METH:
    #calcBaseLayer(r) {
      const base = this.enums.baseLayer.feature(r)
      const inset = (min, max) => { return r.random_num(min, max) }
      switch (base) {
        case 'None':
          return 'None'
        case 'Additive':
          return this.#calcLayer(r, true, undefined, inset(0.7, 0.9))
        case 'Subtractive':
          return this.#calcLayer(r, false, undefined, inset(0.7, 0.9))
      }
    }
    //METH:
    #calcLayerCounts(r) {
      let adds = 0
      let subs = 0
      const types = this.layerTypes
      let extra = this.extraLayers

      if (types.includes('Additive')) { adds = 1 }
      if (types.includes('Subtractive')) {
        if (types === 'Subtractive') {
          this.enums.inset.removeOptions(['Maximum'])
          this.enums.insetRatio.replaceOptions([['1:1', 0.75]], false)
        }
        subs = 1
      }
      if (extra !== 'None') {
        extra = parseInt(extra)
        if (adds && subs) {
          for (let i = 0; i < extra; i++) {
            if (r.random_bool(.5)) { adds += 1 }
            else { subs += 1 }
          }
        } else {
          if (adds) { adds += extra }
          if (subs) { subs += extra }
        }
      }
      return { adds: adds, subs: subs }
    }
    //METH:
    #calcLayers(r) {
      let layers = []
      let adds = this.layerCounts.adds
      let subs = this.layerCounts.subs
      const total = adds + subs
      // insets
      const insets = this.#calcInsets(r)
      let toggle = false
      const inset = () => {
        toggle = !toggle
        return toggle ? insets[0] : insets[1]
      }
      //style
      let style
      if (!this.variableLayerStyles) {
        style = (adds >= subs) ? this.enums.additiveStyle : this.enums.subtractiveStyle
        style = style.feature(r)
      }
      for (let i = 0; i < subs; i++) { layers.push(this.#calcLayer(r, false, style, inset())) }
      for (let i = 0; i < adds; i++) { layers.push(this.#calcLayer(r, true, style, inset())) }

      return layers
    }
    //METH:
    #calcLayer(r, additive, style, inset) {
      // console.log('style', style)
      // console.log('inset', inset)
      if (!style) {
        style = additive ? this.enums.additiveStyle.feature(r) : this.enums.subtractiveStyle.feature(r)
      }
      // console.log('style2', style)
      let loft
      if (this.variableLayerLofts) {
        loft = additive ? this.enums.layerHeight : this.enums.layerDepth
        loft = loft.feature(r)
      } else { loft = 1 }

      return {
        type: additive ? 'Additive' : 'Subtractive',
        style: style,
        inset: inset,
        loft: loft,
      }
    }
    //METH:
    #calcInsets(r) {
      // console.log('Grid', [this.x, this.y])
      let scaleRange
      if (this.layerTypes === 'Additive') { scaleRange = [0.75, 0.85] }
      else { scaleRange = [0.8, 0.9] }
      scaleRange = scaleRange.map(sub => min(1, sub + (0.08 / sqrt(this.x))))
      // console.log('layerTypes', this.layerTypes)
      // console.log('scaleRange', scaleRange)
      let range
      // console.log('this.inset', this.inset)
      switch (this.inset) {
        case 'Maximum':
          range = [0, 0.3]
          break
        case 'Medium':
          range = [0.4, 0.7]
          break
        case 'Minimum':
          range = [0.8, 1]
      }

      // console.log('range', range)
      let insetLrg = r.random_num(range[0], range[1])
      // console.log('insetLrg', insetLrg)
      insetLrg = convertRange(insetLrg, [0, 1], scaleRange)
      const [a, b] = this.insetRatio.split(':').map(Number)
      const ratioVal = b / a
      const insetSml = insetLrg * ratioVal
      // console.log('insets', [insetLrg, insetSml])
      return [insetLrg, insetSml]
    }
    // #endregion
    // MARK: Group Methods
    // #region Group Methods
    //METH:
    #calcWeight(r) {
      const total = this.layerCounts.adds + this.layerCounts.subs
      switch (this.density) {
        case 'So Lonely':
          return ceil(total / r.random_num(0.2, 0.45))
        case 'Some Availability':
          return floor(total / r.random_num(0.5, 0.95))
        case 'At Capacity':
          return total
      }
    }
    //METH:
    #calcGroups(r) {

    }

    // #endregion
    // MARK: Init Methods
    // #region Init Methods
    //METH:
    #initFeatureSets() {
      const enums = {}
      Object.keys(this.#options).forEach((optionKey) => {
        const option = this.#options[optionKey]
        const { name: name, options: optionValues } = option
        const enumFeature = new EnumFeature(name, optionValues)
        enums[optionKey] = enumFeature
      })
      this.enums = enums
    }
    // #endregion
    // #endregion

    //MARK: Feature Options
    // #region Feature Options
    // MARK: Grid Dependencies
    // #region Grid Dependencies
    //Public: x cell width of grid
    #options = {
      gridX: {
        name: 'Columns',
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
      // Public: style of Base Layer
      baseLayerStyle: {
        name: 'Base Layer Style',
        options: [
          ['j', 0.2],
          ['v', 0.3],
          ['r', 0.3],
        ]
      },
      // #endregion
      // MARK: Shader Dependencies
      // #region Shader Dependencies
      // Public: layering options
      layerTypes: {
        name: 'Layer Types',
        options: [
          ['Additive', 0.15],
          ['Subtractive', 0.35],
          ['Additive and Subtractive', 0.5],
        ]
      },
      // Public: layering options
      variableLayerStyles: {
        name: 'Variable Layer Styles',
        options: [
          ['True', 0.4],
          ['False', 0.6],
        ]
      },
      // Public: layering options
      variableLayerLofts: {
        name: 'Variable Layer Lofts',
        options: [
          ['True', 0.6],
          ['False', 0.4],
        ]
      },
      // Public: amount of extra groups to create
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
          ['So Lonely', 0.05],
          ['Some Availability', 0.25],
          ['At Capacity', 0.7],
        ]
      },
      // Public: inset options
      inset: {
        name: 'Inset',
        options: [
          ['Minimum', 0.65],
          ['Medium', 0.25],
          ['Maximum', 0.1],
        ]
      },
      // Public: inset ratio options
      insetRatio: {
        name: 'Inset Ratio',
        options: [
          ['1:1', 0.15],
          ['5:4', 0.3],
          ['4:3', 0.25],
          ['3:2', 0.2],
          ['2:1', 0.1],
        ]
      },
      // Public: random variability of inset per shape
      insetVariability: {
        name: 'Inset Variability',
        options: [
          ['None', 0.8],
          ['Unhinged', 0.05],
          ['Lively', 0.05],
          ['Tame', 0.1],
        ]
      },
      // Public: pyramidal options
      pyramidal: {
        name: 'Pyramidal',
        options: [
          ['True', 0.3],
          ['False', 0.7],
        ]
      },
      // #endregion
      // MARK: Group Dependencies
      // #region Group Dependencies
      // Public: style of seed
      seedStyle: {
        name: 'Seed Style',
        options: [
          ['Noise', 0.3],
          ['Random Comb', 0.25],
          ['Rectangles', 0.2],
          ['Vertical Pattern', 0.1],
          ['Horizontal Pattern', 0.1],
          ['Ordinal Pattern', 0.05],
        ]
      },
      // Public: style of modifier
      modifierStyle: {
        name: 'Modifier Style',
        options: [
          ['None', 0.2],
          ['Concentric', 0.15],
          ['Double Concentric', 0.1],
          ['Triple Concentric', 0.05],
          ['Thick Concentric', 0.15],
          ['Inflate', 0.1],
          ['Inflate Horizontal', 0.1],
          ['Inflate Vertical', 0.1],
        ]
      },
      // Public: style of symmetry to apply to groups
      symmetryStyle: {
        name: 'Symmetry Style',
        options: [
          ['None', 0.6],
          ['Horizontal Reflection', .1],
          ['Vertical Reflection', .1],
          ['Quadrant Reflection', .06],
          ['Positive Ordinal Reflection', .02],
          ['Negative Ordinal Reflection', .02],
          ['Horizontal Rotation', .02],
          ['Vertical Rotation', .02],
          ['Quadrant Rotation', .02],
          ['Positive Ordinal Rotation', .02],
          ['Negative Ordinal Rotation', .02],
        ]
      },
      // #endregion
      // MARK: Shape Dependencies
      // #region Shape Dependencies
      // Public: shape interpretor version
      shapeInterpreter: {
        name: 'Shape Interpreter',
        options: [
          ['v0', 0.025],
          ['v1', 0.275],
          ['v2', 0.7],
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
      // #endregion
      // MARK: Private INSTANCE USE ENUMS
      // #region Private INSTANCE USE ENUMS
      // Private: direction that traversal functions
      gridTraversalDirection: {
        name: 'Grid Traversal Direction',
        options: [
          ['Horizontal', 0.5],
          ['Vertical', 0.5]
        ]
      },
      // Private: (INSTANCE USE) quadrant/corner to start from
      startQuad: {
        name: 'Starting Quadrant',
        options: [
          ['Top Left', 0.25],
          ['Top Right', 0.25],
          ['Bottom Right', 0.25],
          ['Bottom Left', 0.25]
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
          ['j', 0.7],
          ['i', 0.1],
          ['v', 0.175],
          ['r', 0.025],
        ]
      },
      // Private: (INSTANCE USE) (subtractive) depth of cutouts
      layerDepth: {
        name: 'Depth',
        options: [
          ['0.25', 0.025],
          ['0.5', 0.05],
          ['0.666', 0.075],
          ['0.75', 0.075],
          ['0.875', 0.1],
          ['1', 0.6],
          ['2', 0.075],
        ]
      },
      // Private: (INSTANCE USE) (additive) height of addons
      layerHeight: {
        name: 'Height',
        options: [
          ['0.25', 0.025],
          ['0.5', 0.075],
          ['0.666', 0.1],
          ['0.8', 0.2],
          ['1', 0.6],
        ]
      },
      // Private: (INSTANCE USE) pyramidal layer count options
      pyramidalLayerCount: {
        name: 'Pyramidal Layer Count',
        options: [
          ['All', 0.05],
          ['Most', 0.1],
          ['Few', 0.15],
          ['1', 0.7],
        ]
      },
      // Private: (INSTANCE USE) pyramidal layer count options
      pyramidStacks: {
        name: 'Pyramidal',
        options: [
          ['1', 0.4],
          ['2', 0.3],
          ['3', 0.2],
          ['4', 0.1],
        ]
      },
      // #endregion

      // MARK: Currently unused
      // #region UNUSED
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
    }
    // #endregion
    // #endregion
  }

  // TODO: OPTIMIZE by converting options.options from arrays to objects and refine methods accordingly
  // ENUM: EnumFeature 
  class EnumFeature {
    // FIXME: make options and weightedOptions private after fully tested 
    name
    options
    weightedOptions

    constructor(name, options = []) {
      this.name = name
      this.options = options
      this.weightedOptions = this.#weighOptions()
    }

    // MARK: Public Methods
    // #region Public Methods
    //METH:
    feature(r) { return this.#getFeature(this.#getFeatureIndex(r.random_dec())) }
    //METH:
    removeOptions(options) {
      const reduced = this.options.filter(opt => !options.includes(opt[0]))
      this.replaceOptions(reduced)
    }
    //METH:
    reduceOptions(toOptions) {
      const reduced = this.options.filter(opt => toOptions.includes(opt[0]))
      this.replaceOptions(reduced)
    }
    //METH:
    replaceOptions(withOptions, all = true) {
      if (all) {
        this.options = withOptions
      } else {
        withOptions.forEach(newOpt => {
          const oldOpt = this.options.find(opt => opt[0] === newOpt[0])
          if (oldOpt) { oldOpt[1] = newOpt[1] }
        })
      }
      this.weightedOptions = this.#weighOptions()
    }
    // #endregion
    // MARK: Private Methods
    // #region Private Methods
    //METH:
    #getFeature(index) {
      // console.log(this.name)
      // console.log(this.options)
      return this.options[index][0]
      // return [this.name, this.options[index][0]]
    }
    //METH:
    #getFeatureIndex(weight) { return this.weightedOptions.findIndex(e => between(weight, e[1])) }
    //METH:
    #totalWeight() {
      // console.log(this.name)
      // console.log(this.options)
      const weight = this.options
        .map(option => option[1])
        .reduce((a, b) => a + b, 0)
      // console.log(`total weight:`, weight)
      return weight
    }
    //METH:
    #weighOptions() {
      let p = []
      let currentWeight = 0
      let weightRange = [0, this.#totalWeight()]
      this.options.forEach(e => {
        let range = [currentWeight, currentWeight + e[1]]
        let normRange = normalizeSubRange(range, weightRange)
        currentWeight += e[1]
        p.push([e[0], normRange])
      })
      return p
    }
  }
  // #endregion
  // MARK: Helper Methods
  // #region Helper Methods
  function between(x, range = [0, 1]) { return x >= range[0] && x < range[1] }
  function convertRange(value, r1, r2) { return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0] }
  function normalize(value, range) { return convertRange(value, range, [0, 1]) }
  function normalizeSubRange(subrange, range) { return [normalize(subrange[0], range), normalize(subrange[1], range)] }
  // #endregion

  return calculateAll()
}








//MARK: UNUSED FEATURES
function unusedFeatures() {
  const lengths = {
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
  }
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