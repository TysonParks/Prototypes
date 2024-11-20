
//TODO: Before submission, update FeatureSet and EnumFeature in ABFeatureScript.js!!!
//MARK: FeatureSet Class
class FeatureSet {
  // MARK: Calculated Feature Properties
  // grid dependencies
  gridStyle               // Magical / Flexible
  cellAspect              // Square / Portrait / Landscape
  x                       // Int, 1-10
  y                       // Int, 1-40
  frameWidth               // None / Small / Medium / Large
  frameDivs
  frameSpacing
  frameStairs
  layers = []             // TODO: DEPRECATE : actually a shader dependency - just here for logging purposes 
  baseLayer               // Layer: backing/base/frame
  // shader dependencies
  cutStyles               // Variable / Scoop / Torus / Stairs
  cutDirections           // Additive / Subtractive / Both
  loftStyles              // Constant / Variable / Maximizing
  insetStyles             // Minimum / Variable / Maximum
  outset                  // None / Minimal / Perfect / Maximal
  groupCount             // One / Two / Three / More
  insetScale              // TODO: DEPRECATE
  insetRatio              // TODO: DEPRECATE
  // group dependencies
  density                 // So Lonely / Some Availability / At Capacity
  weight                  // 
  seedStyle        // Noise(random) / Smears(hor randComb) / Drips(vert randComb) / Ellipses(squares) / Patterns(comb/comb2)\



  modifierStyle           // TODO: DEPRECATE
  symmetryStyle           // TODO: DEPRECATE
  insetVariability        // TODO: DEPRECATE
  pyramidal               // TODO: DEPRECATE
  // groups
  // shape dependencies
  shapeInterpreter        // 
  blockStyle              // TODO: DEPRECATE

  // underlying storage (could be private?)
  r
  enums
  #options
  usageStore = []

  constructor(randomInstance) {
    this.r = randomInstance
    this.#options = publicOptions
    this.#initFeatureSets()
    this.#calcFeatures()
  }

  // MARK: Public Method
  //TODO: complete implementation after all else is tuned
  get publicFeatures() {
    return {
      // grid: `${this.x} x ${this.y}`,
      gridStyle: this.gridStyle,
      cellColumns: this.x,
      cellRows: this.y,
      cellAspect: this.cellAspect,
      cutDirections: this.cutDirections,
      loftStyles: this.loftStyles,
      // frameStyle:this.frameStyle,
      frameSize: this.frameSize,


      baseLayer: this.baseLayer,
      additiveLayers: this.groupCount.adds,
      subtractiveLayers: this.groupCount.subs,
      density: this.density,

    }
  }

  // MARK: Private Methods
  // #region Private Methods
  //METH:
  #calcFeatures() {
    // console.groupCollapsed(`AB.calcFeatures`)
    console.group(`AB.calcFeatures`)
    const r = this.r
    // grid dependencies

    this.#calcGridProps(r)
    this.x = this.#calcX(r)
    console.log('Grid Style:', this.gridStyle)
    console.log('Cell Aspect:', this.cellAspect)
    this.y = this.#calcY(r)
    this.#calcFrameProps(r)
    console.log('Grid Size:', this.x, `x`, this.y)


    this.baseLayer = this.#calcBaseLayer(r)
    console.log('baseLayer', this.baseLayer)
    // shader dependencies
    this.cutDirections = this.enums.cutDirections.feature(r)
    this.groupCount = this.#calcLayerCounts(r)
    this.cutStyles = this.enums.cutStyles.feature(r) === 'True'
    this.loftStyles = this.enums.loftStyles.feature(r) === 'True'
    this.insetScale = this.enums.insetScale.feature(r)
    this.insetRatio = this.enums.insetRatio.feature(r)

    this.layers = this.#calcLayers(r)
    // group dependencies
    this.density = this.#calcDensity(r)
    this.weight = this.#calcWeight(r)
    this.seedStyle = this.enums.seedStyle.feature(r)
    // this.gridTraversalStart = this.enums.startQuad.feature(r)
    // this.gridTraversalDirection = this.enums.gridTraversalDirection.feature(r)
    this.modifierStyle = this.enums.modifierStyle.feature(r)
    // this.groups = this.#calcGroups(r)
    // this.symmetryStyle = this.#calcSymmetry(r)                                           //UNUSED:
    this.insetVariability = this.enums.insetVariability.feature(r)
    this.pyramidal = this.enums.pyramidal.feature(r) === 'True'
    // shape dependencies
    this.shapeInterpreter = this.enums.shapeInterpreter.feature(r)
    this.blockStyle = this.enums.blockStyle.feature(r)

    console.groupEnd()
  }
  // #endregion
  // MARK: Grid Methods
  // #region Grid Methods
  //METH: #calcGridProps()
  #calcGridProps(r) {
    this.gridStyle = this.enums.gridStyle.feature(r)
    if (this.gridStyle === `Magical`) {
      this.enums.gridX.replaceOptions([             // replace gridX with "Magical" distributions
        ['1', 6 / 84],                 // 14  / 200 ("Magical")
        ['2', 9 / 84],                 // 21  / 200 ("Magical")
        ['3', 9 / 84],                 // 21  / 200 ("Magical")
        ['4', 10 / 84],                // 24  / 200 ("Magical")
        ['5', 9 / 84],                 // 21  / 200 ("Magical")
        ['6', 8 / 84],                 // 19  / 200 ("Magical")
        ['7', 7 / 84],                 // 17  / 200 ("Magical")
        ['8', 8 / 84],                 // 19  / 200 ("Magical")
        ['9', 9 / 84],                 // 21  / 200 ("Magical")
        ['10', 9 / 84],                // 21  / 200 ("Magical")
      ])
      this.cellAspect = 'Square'                    // "Magical" only uses 'Square' cells
    } else {                                        // calculate cellAspect using native distributions
      this.cellAspect = this.enums.cellAspect.feature(r)
    }
  }
  //METH: #calcX()
  #calcX(r) {
    const x = parseInt(this.enums.gridX.feature(r))
    // if (x < 5) {
    //   this.enums.seedStyle.removeOptions(['Rectangles', 'Squares', 'Triangles'])// only 5-10 can pack more than 3 rects, squares, or triangles
    // }

    if (x < 4) {
      this.enums.pyramidal.replaceOptions([['True', 0.5], ['False', 0.5]])
      // this.enums.seedStyle.reduceOptions(['Noise', 'Thin Random Comb']) // not enough cells to support other styles
      // this.enums.symmetryStyle.replaceOptions([['None', 1.2]])
    }
    if (x > 4) {
      this.enums.frameWidth.removeOptions(['Large'])
    }
    if (x > 7) {

      this.enums.density.replaceOptions([['So Lonely', 0.2], ['Some Availability', 0.4], ['At Capacity', 0.4],])
      this.enums.insetRatio.removeOptions(['3:2', '2:1'])
      this.enums.pyramidal.replaceOptions([['True', 0.2], ['False', 0.8]])
      // this.enums.symmetryStyle.replaceOptions([['None', 0.4], ['Quadrant Reflection', .1], ['Quadrant Rotation', .1]])
    }
    return x
  }
  //METH: #calcY(r)
  #calcY(r) {
    const x = this.x
    // const interpOpts = () => { this.enums.shapeInterpreter.replaceOptions([['v0', 0.05], ['v1', 0.95]]) }
    if (this.gridStyle === 'Magical') {      // "Magical" gridStyle
      const min = x * 2 + 1                                 // min is always double the columns plus one
      const maxes = [9, 14, 16, 19, 20, 21, 22, 25, 28, 30] // maxes established in Magic Ratio Grid Calculator doc
      const max = maxes[x - 1]                              // max taken from corresponding maxes entry
      return r.random_int(min, max)
    } else {
      switch (this.cellAspect) {             // "Flexible" gridStyle uses cellAspect to multiply column count
        case 'Square':
          return 2 * x
        case 'Tall':
          return x
        case 'Wide':
          return 4 * x
      }
    }
  }
  //METH: #calcFrameProps()
  #calcFrameProps(r) {
    if (this.gridStyle === 'Magical') {
      const ratio = this.y / this.x
      let w = `Medium`
      if (ratio < 2.3) { w = `Small` }
      if (ratio > 3) { w = `Large` }
      this.frameWidth = w
    } else {
      this.frameWidth = this.enums.frameWidth.feature(r)
    }
    console.log(`frameWidth:`, this.frameWidth)

    const widthVal = this.enums.frameWidth.getIndex(this.frameWidth)
    console.warn(`widthVal`, widthVal)
    if (widthVal < 3) {
      this.enums.frameDivs.removeOptions([`5`, `4`])
      this.enums.frameSpacing.removeOptions([`Ninths`, `Eighths`])
      this.enums.frameStairs.removeOptions([`Some`])
    }
    if (widthVal < 2) {
      this.enums.frameDivs.removeOptions([`3`])
      this.enums.frameSpacing.removeOptions([`Fifths`, `Quarters`])
      this.enums.frameStairs.removeOptions([`One`])
    }
    if (widthVal < 1) {
      this.enums.frameSpacing.removeOptions([`Thirds`])
    }
    this.frameDivs = this.enums.frameDivs.feature(r)
    this.frameSpacing = this.enums.frameSpacing.feature(r)
    this.frameStairs = this.enums.frameStairs.feature(r)
  }

  // #endregion
  // MARK: Layer Methods
  // #region Layer Methods
  //METH:
  #calcBaseLayer(r) {
    const base = this.enums.baseLayer.feature(r)
    const inset = roundToDec(r.random_num(0.8, 0.95))
    // const noShrinkWrap = () => this.enums.blockStyle.removeOptions(['True'])
    switch (base) {
      case 'None':
        return 'None'
      case 'Additive':
        // noShrinkWrap()
        //TODO: If these value remain the same, just make a property instead of arrow function
        return this.#calcLayer(r, true, undefined, inset)
      case 'Subtractive':
        // noShrinkWrap()
        //TODO: If these value remain the same, just make a property instead of arrow function
        return this.#calcLayer(r, false, undefined, inset)
    }
  }
  //METH:
  #calcLayerCounts(r) {
    let adds = 0
    let subs = 0
    const types = this.cutDirections
    let extra = this.enums.extraGroups.feature(r)

    if (types.includes('Additive')) { adds = 1 }
    if (types.includes('Subtractive')) {
      if (types === 'Subtractive') {
        this.enums.insetScale.removeOptions(['Maximum'])
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
    const layerWeight = adds + subs
    // if (layerWeight < 3) { this.enums.symmetryUse.removeOptions(['Some Layers']) }
    // if (layerWeight < 2) { this.enums.symmetryUse.removeOptions(['One Layer']) }
    if (this.x > 3) {
      switch (layerWeight) {
        case 5:
        case 4:
          this.enums.modifierStyle.addOptions([['Triple Concentric', 0.05]])
        case 3:
          this.enums.modifierStyle.addOptions([['Double Concentric', 0.1]])
        case 2:
          if (this.x < 7) { this.enums.modifierStyle.addOptions([['Seed', 0.2]]) }
          this.enums.modifierStyle.addOptions([['Concentric', 0.15], ['Thick Concentric', 0.15]])
        case 1:
      }
    }

    return { adds: adds, subs: subs }
  }
  //METH:
  #calcLayers(r) {
    let layers = []
    let adds = this.groupCount.adds
    let subs = this.groupCount.subs
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
    if (!this.cutStyles) {
      style = (adds >= subs) ? this.enums.additiveStyle : this.enums.subtractiveStyle
      style = style.feature(r)
    }
    for (let i = 0; i < subs; i++) {
      // layers.push(this.#calcLayer(r, false, style, inset()))
      const layer = this.#calcLayer(r, false, style, inset())
      console.log('layer', layer)
      layers.push(layer)
    }
    for (let i = 0; i < adds; i++) {
      // layers.push(this.#calcLayer(r, true, style, inset())) 
      const layer = this.#calcLayer(r, true, style, inset())
      console.log('layer', layer)
      layers.push(layer)
    }

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
    if (this.loftStyles) {
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
    if (this.cutDirections === 'Additive') {
      scaleRange = [0.75, 0.85]
    } else {
      scaleRange = [0.8, 0.9]
    }
    // console.log('scaleRange 1', scaleRange)
    // NOTE: This tunes the scale to mostly hit 0.9 - 0.95 range for any grid
    scaleRange = scaleRange.map(sub => min(1, sub + (0.08 / sqrt(this.x))))
    // console.log('cutDirections', this.cutDirections)
    // console.log('scaleRange 2', scaleRange)
    let range
    // console.log('this.insetScale', this.insetScale)
    switch (this.insetScale) {
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
    console.log('insetLrg', insetLrg)
    insetLrg = convertRange(insetLrg, [0, 1], scaleRange)
    const [a, b] = this.insetRatio.split(':').map(Number)
    const ratioVal = b / a
    const insetSml = insetLrg * ratioVal
    console.log('insets', [insetLrg, insetSml])
    return [roundToDec(insetLrg), roundToDec(insetSml)]
  }
  // #endregion
  // MARK: Group Methods
  // #region Group Methods
  //METH:
  #calcDensity(r) {
    const density = this.enums.density.feature(r)
    if (density !== 'At Capacity') {
      this.enums.modifierStyle.removeOptions(['Triple Concentric'])
      // this.enums.symmetryUse.removeOptions(['All', 'Empty Layers'])
    }
    return density
  }
  get layerWeight() { return this.groupCount.adds + this.groupCount.subs }
  get emptyWeight() { return this.weight - this.layerWeight }

  //METH:
  #calcWeight(r) {
    switch (this.density) {
      case 'So Lonely':
        return floor(this.layerWeight / r.random_num(0.1, 0.4))
      case 'Some Availability':
        return ceil(this.layerWeight / r.random_num(0.5, 0.9))
      case 'At Capacity':
        return max(2, this.layerWeight)
    }
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
      const enumFeature = new EnumFeature(name, optionValues, this.usageStore)
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
  // #options = {
  //   //Public: Grid Style : "Magical/Fixed" or "Flexible/Shrinking"
  //   gridStyle: {
  //     name: 'Grid Style',
  //     options: [
  //       ['Magical', 2 / 3],       // 200  / 300 (Total)
  //       ['Flexible', 1 / 3],      // 100  / 300 (Total)
  //     ]
  //   },
  //   // Public: Cell Aspect
  //   cellAspect: {
  //     name: 'Cell Aspect',
  //     options: [
  //       ['Square', 0.3],         // 30 / 100 ("Flexible")
  //       ['Tall', 0.35],          // 35 / 100 ("Flexible")
  //       ['Wide', 0.35],          // 35 / 100 ("Flexible")
  //     ]
  //   },
  //   //Public: grid column amount
  //   gridX: {
  //     name: 'Columns',
  //     options: [
  //       ['1', 0.01],              // 1  / 100 ("Flexible")
  //       ['2', 0.05],              // 5  / 100 ("Flexible")
  //       ['3', 0.08],              // 8  / 100 ("Flexible")
  //       ['4', 0.15],              // 15 / 100 ("Flexible")
  //       ['5', 0.15],              // 15 / 100 ("Flexible")
  //       ['6', 0.15],              // 15 / 100 ("Flexible")
  //       ['7', 0.15],              // 15 / 100 ("Flexible")
  //       ['8', 0.1],               // 10 / 100 ("Flexible")
  //       ['9', 0.1],               // 10 / 100 ("Flexible")
  //       ['10', 0.06],             // 6  / 100 ("Flexible")
  //     ]
  //   },
  //   // Public: Frame Width
  //   frameWidth: {
  //     name: 'Frame Width',
  //     options: [
  //       ['Minimum', 0.15],        // 15 / 100 ("Flexible")     10 / 300 (Total)
  //       ['Small', 0.4],           // 40 / 100 ("Flexible")
  //       ['Medium', 0.25],         // 25 / 100 ("Flexible")
  //       ['Large', 0.2],           // 20 / 100 ("Flexible")
  //     ]
  //   },
  //   // Public: Frame Divisions
  //   frameDivs: {
  //     name: 'Frame Divisions',
  //     options: [
  //       ['1', 0.2],               // 60  / 300 (Total)
  //       ['2', 0.2],               // 60  / 300 (Total)
  //       ['3', 0.25],              // 75  / 300 (Total)
  //       ['4', 0.35],              // 105 / 300 (Total)
  //       ['5', 0.1],               // 30  / 300 (Total)       
  //     ]
  //   },
  //   // Public: Frame Divisions
  //   frameSpacing: {
  //     name: 'Frame Spacing',
  //     options: [
  //       ['Whole', 0.4],           // 120 / 300 (Total)
  //       ['Thirds', 0.1],          // 30  / 300 (Total)
  //       ['Quarters', 0.2],        // 60  / 300 (Total)
  //       ['Fifths', 0.1],          // 30  / 300 (Total)  
  //       ['Eighths', 0.1],         // 30  / 300 (Total)     
  //       ['Ninths', 0.1],          // 30  / 300 (Total)   
  //     ]
  //   },
  //   // Public: Frame Stairs
  //   frameStairs: {
  //     name: 'Frame Stairs',
  //     options: [
  //       ['None', 0.1],            // 150 / 300 (Total)
  //       ['One', 0.4],             // 90  / 300 (Total)
  //       ['Some', 0.5],            // 60  / 300 (Total)
  //     ]
  //   },
  //   // Private: Frame Profiles
  //   frameProfiles: {
  //     name: 'Frame Profiles',
  //     options: [
  //       ['jIn', 0.1],            // 150 / 300 (Total)
  //       ['jOut', 0.4],           // 90  / 300 (Total)
  //       ['rIn', 0.5],            // 60  / 300 (Total)
  //       ['rOut', 0.5],           // 60  / 300 (Total)
  //     ]
  //   },
  //   // Public: (TRANSLATED) base is layer framing the grid
  //   baseLayer: {
  //     name: 'Base Layer',
  //     options: [
  //       ['Flat', 0.1],
  //       ['Additive', 0.5],
  //       ['Subtractive', 0.4],
  //     ]
  //   },
  //   // Public: style of Base Layer
  //   baseLayerStyle: {
  //     name: 'Base Layer Style',
  //     options: [
  //       ['j', 0.3],
  //       // ['v', 0.3],
  //       ['r', 0.4],
  //     ]
  //   },
  //   // #endregion
  //   // MARK: Shader Dependencies
  //   // #region Shader Dependencies
  //   // Public: group options
  //   cutStyles: {
  //     name: 'Variable Group Styles',
  //     options: [
  //       ['True', 0.7],
  //       ['False', 0.3],
  //     ]
  //   },
  //   // Public: layering options
  //   cutDirections: {
  //     name: 'Cut Directions',
  //     options: [
  //       ['Additive', 0.3],
  //       ['Subtractive', 0.2],
  //       ['Additive and Subtractive', 0.5],
  //     ]
  //   },
  //   // Public: group options
  //   loftStyles: {
  //     name: 'Group Loft Styles',
  //     options: [
  //       ['True', 0.6],
  //       ['False', 0.4],
  //     ]
  //   },
  //   // TODO: insetStyles
  //   // TODO: groupCount
  //   // Public: amount of extra groups to create
  //   extraGroups: {
  //     name: 'Extra Layers',
  //     options: [
  //       ['None', 0.05],
  //       ['1', 0.3],
  //       ['2', 0.3],
  //       ['3', 0.2],
  //       ['4', 0.15],
  //     ]
  //   },

  //   // Public: how densely the grid is filled with shapes
  //   density: {
  //     name: 'Density',
  //     options: [
  //       ['So Lonely', 0.05],
  //       ['Some Availability', 0.25],
  //       ['At Capacity', 0.7],
  //     ]
  //   },
  //   // Public: inset options
  //   insetScale: {
  //     name: 'Inset Scale',
  //     options: [
  //       ['Minimum', 0.65],
  //       ['Medium', 0.25],
  //       ['Maximum', 0.1],
  //     ]
  //   },
  //   // Public: inset ratio options
  //   insetRatio: {
  //     name: 'Inset Ratio',
  //     options: [
  //       ['Min', 0.3],   // 0.025
  //       ['1:20', 0.1],   // 0.05
  //       // ['1:16', 0.15],   // 0.0625
  //       // ['1:12', 0.15],   // 0.0833
  //       ['1:10', 0.1],    // 0.1
  //       ['1:8', 0.1],    // 0.125
  //       // ['1:6', 0.25],    // 0.1667
  //       ['1:5', 0.1],     // 0.2
  //       ['1:4', 0.1],     // 0.25
  //       ['1:3', 0.05],    // 0.333
  //       ['1:2', 0.05],     // 0.5
  //       ['Max', 0.05],   // 0.025
  //     ],
  //     // options: [
  //     //   ['1:96', 0.1],   // 0.01041667
  //     //   ['1:64', 0.3],   // 0.015625
  //     //   ['1:48', 0.1],   // 0.0208333
  //     //   ['1:32', 0.1],   // 0.03125
  //     //   ['1:24', 0.15],   // 0.041667
  //     //   ['1:16', 0.15],   // 0.0625
  //     //   ['1:12', 0.15],   // 0.0833
  //     //   ['1:8', 0.15],   // 0.0833
  //     // ],
  //     // options: [
  //     //   ['1:1', 0.15],
  //     //   ['5:4', 0.3],
  //     //   ['4:3', 0.25],
  //     //   ['3:2', 0.2],
  //     //   ['2:1', 0.1],
  //     // ]
  //   },
  //   // Public: random variability of inset per shape
  //   insetVariability: {
  //     name: 'Inset Variability',
  //     options: [
  //       ['None', 0.8],
  //       ['Unhinged', 0.05],
  //       ['Lively', 0.05],
  //       ['Tame', 0.1],
  //     ]
  //   },
  //   // Public: pyramidal options
  //   pyramidal: {
  //     name: 'Pyramidal',
  //     options: [
  //       ['True', 0.3],
  //       ['False', 0.7],
  //     ]
  //   },
  //   // #endregion
  //   // MARK: Group Dependencies
  //   // #region Group Dependencies
  //   // Public: style of seed
  //   seedStyle: {
  //     name: 'Seed Style',
  //     options: [
  //       ['Noise', 0.2],
  //       ['Thick Random Comb', 0.1],
  //       ['Thin Random Comb', 0.1],
  //       // ['Rectangles', 0.1],
  //       ['Squares', 0.2],
  //       // ['Triangles', 0.1],
  //       ['Pattern Simple', 0.1],
  //       ['Pattern Complex', 0.1],
  //       // ['Ordinal Pattern', 0.1],
  //       // ['Snake', 0.1],
  //     ]
  //   },
  //   // Public: style of modifier
  //   modifierStyle: {
  //     name: 'Modifier Style',
  //     options: [
  //       ['Inflate', 0.1],
  //       ['Inflate Horizontal', 0.1],
  //       ['Inflate Vertical', 0.1],
  //       ['Concentric', 0.15],
  //       ['Thick Concentric', 0.15],
  //       ['Double Concentric', 0.1],
  //       ['Triple Concentric', 0.05],

  //     ]
  //   },
  //   // Public: style of symmetry to apply to groups
  //   // symmetryStyle: {                                                                 //UNUSED:
  //   //   name: 'Symmetry Style',
  //   //   options: [
  //   //     ['None', 0.6],
  //   //     ['Horizontal Reflection', .1],
  //   //     ['Vertical Reflection', .1],
  //   //     ['Quadrant Reflection', .08],
  //   //     ['Horizontal Rotation', .04],
  //   //     ['Vertical Rotation', .04],
  //   //     ['Quadrant Rotation', .04],
  //   //     // ['Positive Ordinal Reflection', .02],
  //   //     // ['Negative Ordinal Reflection', .02],
  //   //     // ['Positive Ordinal Rotation', .02],
  //   //     // ['Negative Ordinal Rotation', .02],
  //   //   ]
  //   // },
  //   // Public: the way symmetry is used
  //   // symmetryUse: {
  //   //   name: 'Symmetry Use',
  //   //   options: [
  //   //     ['All', 0.5],
  //   //     ['Empty Layers', .1], // removed if (Density === 'At Capacity') in #calcDensity()
  //   //     ['Assigned Layers', .2],// removed if (Density === 'At Capacity') in #calcDensity()
  //   //     ['One Layer', .1], // removed if (layersCount < 2) in #calcLayerCounts()
  //   //     ['Some Layers', .1], // removed if (layersCount < 3) in #calcLayerCounts()
  //   //   ]
  //   // },
  //   // #endregion
  //   // MARK: Shape Dependencies
  //   // #region Shape Dependencies
  //   // Public: shape interpretor version
  //   shapeInterpreter: {
  //     name: 'Shape Interpreter',
  //     options: [
  //       ['v0', 0.025],
  //       ['v1', 0.275],
  //       ['v2', 0.7],
  //     ]
  //   },
  //   // Public: block wraps to design
  //   blockStyle: {
  //     name: 'Block Style',
  //     options: [
  //       ['v0', 0.2],    // early iPhone style, maintains 2:1 aspect using top and bottom bezels
  //       ['v1', 0.8],    // modern 'shrinkwrap' style that conforms to corner shape curves
  //       ['v2', 0.0],    // enhanced 'shrinkWrap' style that has cutouts for uninhabited cells
  //       // ['v3', 0.0],    // further enhanced uses diagonal and tangent cuts on uninhabited cells
  //     ]
  //   },
  //   // #endregion
  //   // MARK: Private INSTANCE USE ENUMS
  //   // #region Private INSTANCE USE ENUMS
  //   // Private: direction that traversal functions
  //   gridTraversalDirection: {
  //     name: 'Grid Traversal Direction',
  //     options: [
  //       ['Horizontal', 0.5],
  //       ['Vertical', 0.5]
  //     ]
  //   },
  //   // Private: (INSTANCE USE) quadrant/corner to start from
  //   startQuad: {
  //     name: 'Starting Quadrant',
  //     options: [
  //       ['Top Left', 0.25],
  //       ['Top Right', 0.25],
  //       ['Bottom Right', 0.25],
  //       ['Bottom Left', 0.25]
  //     ]
  //   },
  //   // Private: (INSTANCE USE) style of additive cut
  //   additiveStyle: {
  //     name: 'Additive Style',
  //     options: [
  //       ['j', 0.2],
  //       ['i', 0.2],
  //       // ['v', 0.3],
  //       ['r', 0.3],
  //     ]
  //   },
  //   // Private: (INSTANCE USE) style of subtractive cut
  //   subtractiveStyle: {
  //     name: 'Subtractive Style',
  //     options: [
  //       ['j', 0.7],
  //       ['i', 0.1],
  //       // ['v', 0.175],
  //       ['r', 0.025],
  //     ]
  //   },
  //   // Private: (INSTANCE USE) (subtractive) depth of cutouts
  //   layerDepth: {
  //     name: 'Depth',
  //     options: [
  //       ['0.25', 0.025],
  //       ['0.5', 0.05],
  //       ['0.666', 0.075],
  //       ['0.75', 0.075],
  //       ['0.875', 0.1],
  //       ['1', 0.6],
  //       ['2', 0.075],
  //     ]
  //   },
  //   // Private: (INSTANCE USE) (additive) height of addons
  //   layerHeight: {
  //     name: 'Height',
  //     options: [
  //       ['0.25', 0.025],
  //       ['0.5', 0.075],
  //       ['0.666', 0.1],
  //       ['0.8', 0.2],
  //       ['1', 0.6],
  //     ]
  //   },
  //   // Private: (INSTANCE USE) pyramidal layer count options
  //   pyramidalLayerCount: {
  //     name: 'Pyramidal Layer Count',
  //     options: [
  //       ['All', 0.05],
  //       ['Most', 0.1],
  //       ['Few', 0.15],
  //       ['1', 0.7],
  //     ]
  //   },
  //   // Private: (INSTANCE USE) pyramidal layer count options
  //   pyramidStacks: {
  //     name: 'Pyramidal',
  //     options: [
  //       ['1', 0.4],
  //       ['2', 0.3],
  //       ['3', 0.2],
  //       ['4', 0.1],
  //     ]
  //   },
  //   // #endregion

  // }
  // #endregion
  // #endregion
}
const publicOptions = {
  //Public: Grid Style : "Magical/Fixed" or "Flexible/Shrinking"
  gridStyle: {
    name: 'Grid Style',
    options: [
      ['Magical', 2 / 3],       // 200  / 300 (Total)
      ['Flexible', 1 / 3],      // 100  / 300 (Total)
    ]
  },
  // Public: Cell Aspect
  cellAspect: {
    name: 'Cell Aspect',
    options: [
      ['Square', 0.3],         // 30 / 100 ("Flexible")
      ['Tall', 0.35],          // 35 / 100 ("Flexible")
      ['Wide', 0.35],          // 35 / 100 ("Flexible")
    ]
  },
  //Public: grid column amount
  gridX: {
    name: 'Columns',
    options: [
      ['1', 0.01],              // 1  / 100 ("Flexible")
      ['2', 0.05],              // 5  / 100 ("Flexible")
      ['3', 0.08],              // 8  / 100 ("Flexible")
      ['4', 0.15],              // 15 / 100 ("Flexible")
      ['5', 0.15],              // 15 / 100 ("Flexible")
      ['6', 0.15],              // 15 / 100 ("Flexible")
      ['7', 0.15],              // 15 / 100 ("Flexible")
      ['8', 0.1],               // 10 / 100 ("Flexible")
      ['9', 0.1],               // 10 / 100 ("Flexible")
      ['10', 0.06],             // 6  / 100 ("Flexible")
    ]
  },
  // Public: Frame Width
  frameWidth: {
    name: 'Frame Width',
    options: [
      ['Minimum', 0.15],        // 15 / 100 ("Flexible")     10 / 300 (Total)
      ['Small', 0.4],           // 40 / 100 ("Flexible")
      ['Medium', 0.25],         // 25 / 100 ("Flexible")
      ['Large', 0.2],           // 20 / 100 ("Flexible")
    ]
  },
  // Public: Frame Divisions
  frameDivs: {
    name: 'Frame Divisions',
    options: [
      ['1', 0.2],               // 60  / 300 (Total)
      ['2', 0.2],               // 60  / 300 (Total)
      ['3', 0.25],              // 75  / 300 (Total)
      ['4', 0.35],              // 105 / 300 (Total)
      ['5', 0.1],               // 30  / 300 (Total)       
    ]
  },
  // Public: Frame Divisions
  frameSpacing: {
    name: 'Frame Spacing',
    options: [
      ['Whole', 0.4],           // 120 / 300 (Total)
      ['Thirds', 0.1],          // 30  / 300 (Total)
      ['Quarters', 0.2],        // 60  / 300 (Total)
      ['Fifths', 0.1],          // 30  / 300 (Total)  
      ['Eighths', 0.1],         // 30  / 300 (Total)     
      ['Ninths', 0.1],          // 30  / 300 (Total)   
    ]
  },
  // Public: Frame Stairs
  frameStairs: {
    name: 'Frame Stairs',
    options: [
      ['None', 0.1],            // 150 / 300 (Total)
      ['One', 0.4],             // 90  / 300 (Total)
      ['Some', 0.5],            // 60  / 300 (Total)
    ]
  },
  // Private: Frame Profiles
  frameProfiles: {
    name: 'Frame Profiles',
    options: [
      ['jIn', 0.1],            // 150 / 300 (Total)
      ['jOut', 0.4],           // 90  / 300 (Total)
      ['rIn', 0.5],            // 60  / 300 (Total)
      ['rOut', 0.5],           // 60  / 300 (Total)
    ]
  },
  // Public: (TRANSLATED) base is layer framing the grid
  baseLayer: {
    name: 'Base Layer',
    options: [
      ['Flat', 0.1],
      ['Additive', 0.5],
      ['Subtractive', 0.4],
    ]
  },
  // Public: style of Base Layer
  baseLayerStyle: {
    name: 'Base Layer Style',
    options: [
      ['j', 0.3],
      // ['v', 0.3],
      ['r', 0.4],
    ]
  },
  // #endregion
  // MARK: Shader Dependencies
  // #region Shader Dependencies
  // Public: group options
  cutStyles: {
    name: 'Variable Group Styles',
    options: [
      ['True', 0.7],
      ['False', 0.3],
    ]
  },
  // Public: layering options
  cutDirections: {
    name: 'Cut Directions',
    options: [
      ['Additive', 0.3],
      ['Subtractive', 0.2],
      ['Additive and Subtractive', 0.5],
    ]
  },
  // Public: group options
  loftStyles: {
    name: 'Group Loft Styles',
    options: [
      ['True', 0.6],
      ['False', 0.4],
    ]
  },
  // TODO: insetStyles
  // TODO: groupCount
  // Public: amount of extra groups to create
  extraGroups: {
    name: 'Extra Layers',
    options: [
      ['None', 0.05],
      ['1', 0.3],
      ['2', 0.3],
      ['3', 0.2],
      ['4', 0.15],
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
  insetScale: {
    name: 'Inset Scale',
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
      ['Min', 0.3],   // 0.025
      ['1:20', 0.1],   // 0.05
      // ['1:16', 0.15],   // 0.0625
      // ['1:12', 0.15],   // 0.0833
      ['1:10', 0.1],    // 0.1
      ['1:8', 0.1],    // 0.125
      // ['1:6', 0.25],    // 0.1667
      ['1:5', 0.1],     // 0.2
      ['1:4', 0.1],     // 0.25
      ['1:3', 0.05],    // 0.333
      ['1:2', 0.05],     // 0.5
      ['Max', 0.05],   // 0.025
    ],
    // options: [
    //   ['1:96', 0.1],   // 0.01041667
    //   ['1:64', 0.3],   // 0.015625
    //   ['1:48', 0.1],   // 0.0208333
    //   ['1:32', 0.1],   // 0.03125
    //   ['1:24', 0.15],   // 0.041667
    //   ['1:16', 0.15],   // 0.0625
    //   ['1:12', 0.15],   // 0.0833
    //   ['1:8', 0.15],   // 0.0833
    // ],
    // options: [
    //   ['1:1', 0.15],
    //   ['5:4', 0.3],
    //   ['4:3', 0.25],
    //   ['3:2', 0.2],
    //   ['2:1', 0.1],
    // ]
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
      ['Noise', 0.2],
      ['Thick Random Comb', 0.1],
      ['Thin Random Comb', 0.1],
      // ['Rectangles', 0.1],
      ['Squares', 0.2],
      // ['Triangles', 0.1],
      ['Pattern Simple', 0.1],
      ['Pattern Complex', 0.1],
      // ['Ordinal Pattern', 0.1],
      // ['Snake', 0.1],
    ]
  },
  // Public: style of modifier
  modifierStyle: {
    name: 'Modifier Style',
    options: [
      ['Inflate', 0.1],
      ['Inflate Horizontal', 0.1],
      ['Inflate Vertical', 0.1],
      ['Concentric', 0.15],
      ['Thick Concentric', 0.15],
      ['Double Concentric', 0.1],
      ['Triple Concentric', 0.05],

    ]
  },
  // Public: style of symmetry to apply to groups
  // symmetryStyle: {                                                                 //UNUSED:
  //   name: 'Symmetry Style',
  //   options: [
  //     ['None', 0.6],
  //     ['Horizontal Reflection', .1],
  //     ['Vertical Reflection', .1],
  //     ['Quadrant Reflection', .08],
  //     ['Horizontal Rotation', .04],
  //     ['Vertical Rotation', .04],
  //     ['Quadrant Rotation', .04],
  //     // ['Positive Ordinal Reflection', .02],
  //     // ['Negative Ordinal Reflection', .02],
  //     // ['Positive Ordinal Rotation', .02],
  //     // ['Negative Ordinal Rotation', .02],
  //   ]
  // },
  // Public: the way symmetry is used
  // symmetryUse: {
  //   name: 'Symmetry Use',
  //   options: [
  //     ['All', 0.5],
  //     ['Empty Layers', .1], // removed if (Density === 'At Capacity') in #calcDensity()
  //     ['Assigned Layers', .2],// removed if (Density === 'At Capacity') in #calcDensity()
  //     ['One Layer', .1], // removed if (layersCount < 2) in #calcLayerCounts()
  //     ['Some Layers', .1], // removed if (layersCount < 3) in #calcLayerCounts()
  //   ]
  // },
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
  blockStyle: {
    name: 'Block Style',
    options: [
      ['v0', 0.2],    // early iPhone style, maintains 2:1 aspect using top and bottom bezels
      ['v1', 0.8],    // modern 'shrinkwrap' style that conforms to corner shape curves
      ['v2', 0.0],    // enhanced 'shrinkWrap' style that has cutouts for uninhabited cells
      // ['v3', 0.0],    // further enhanced uses diagonal and tangent cuts on uninhabited cells
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
      // ['v', 0.3],
      ['r', 0.3],
    ]
  },
  // Private: (INSTANCE USE) style of subtractive cut
  subtractiveStyle: {
    name: 'Subtractive Style',
    options: [
      ['j', 0.7],
      ['i', 0.1],
      // ['v', 0.175],
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

}
//TODO: Paste in final EnumFeature class before submission!!!
// TODO: OPTIMIZE by converting options.options from arrays to objects and refine methods accordingly
// ENUM: EnumFeature 
class EnumFeature {
  // FIXME: make options and weightedOptions private after fully tested 
  name
  options
  weightedOptions
  usageStore

  constructor(name, options = [], usageStore) {
    this.name = name
    this.options = options
    this.usageStore = usageStore
    this.weightedOptions = this.#weighOptions()
  }

  get length() { return this.options.length }

  // MARK: Public Methods
  // #region Public Methods
  //METH:
  feature(r) { return this.#getFeature(this.#getFeatureIndex(r.random_dec())) }
  //METH:
  addOptions(options) {
    // console.log('addOptions called')
    // console.log('options', options)
    // options = OpArray.format(options)
    // console.log('options', options)
    // const oldOpts = OpArray.format(this.options)
    const newOpts = [...options, ...this.options]
    // console.log('newOpts', newOpts)
    if (newOpts) { this.replaceOptions(newOpts) }
  }
  //METH:
  removeOptions(options) {
    const reduced = this.options.filter(opt => !options.includes(opt[0]))
    if (reduced) { this.replaceOptions(reduced) }
  }
  //METH:
  reduceOptions(toOptions) {
    const reduced = this.options.filter(opt => toOptions.includes(opt[0]))
    if (reduced) { this.replaceOptions(reduced) }
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
  //METH: getIndex(option)
  getIndex(option) {
    console.error(`getIndex`)
    console.error(`this.options`, this.options)
    return this.options.findIndex(opt => opt[0] === option)
  }
  // #endregion
  // MARK: Private Methods
  // #region Private Methods
  //METH:
  #getFeature(index) {
    const result = this.options[index][0]
    if (result) { return result }
    else {
      console.log(this.index)
      console.log(this.options)
    }
  }
  //METH:
  #getFeatureIndex(weight) { return this.weightedOptions.findIndex(e => between(weight, e[1])) }
  //METH: sum of option weights
  #totalWeight() {
    let weight = this.options
      .map(option => option[1])
      .reduce((a, b) => a + b, 0)
    // if (roundToDec(weight) !== 1) console.error(`weight != 1`, this.name, weight)
    return weight
  }
  //METH:
  #weighOptions() {
    let p = []
    let currentWeight = 0
    const weightRange = [0, this.#totalWeight()]
    this.options.forEach(e => {
      let range = [currentWeight, currentWeight + e[1]]
      let normRange = normalizeSubRange(range, weightRange)
      currentWeight += e[1]
      p.push([e[0], normRange])
    })
    return p
  }
}