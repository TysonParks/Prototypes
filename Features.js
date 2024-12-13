
//TODO: Before submission, update FeatureSet and EnumFeature in ABFeatureScript.js!!!
//MARK: FeatureSet Class
class FeatureSet {
  // MARK: Calculated Feature Properties
  // grid dependencies
  gridStyle               // Magical / Flexible
  cellAspect              // Square / Portrait / Landscape
  cellOutset              // [0, .125, .2, .25, 1 / 3, .375, .5, .625, 2 / 3, .75, .875, 8 / 9]
  cellInset               // [Min, 2xMin, 3xMin, 4xMin]
  x                       // Int: 1-10
  y                       // Int: 1-40

  groups = []             // TODO: DEPRECATE : actually a shader dependency - just here for logging purposes 

  // group dependencies
  groupCount              // Two / Three / More
  density                 // So Lonely / Some Availability / At Capacity
  primarySeed             // Noise/ Random Comb / Rectangles / Squares / Simple Pattern / Complex Pattern / Snake / Snakes
  secondarySeed           // None, Noise/ Random Comb / Rectangles / Squares / Simple Pattern / Complex Pattern / Snake 
  shapeInterpreter        // 
  weight                  // TODO: DEPRECATE

  // cut dependencies
  cutStyles               // Variable / Scoop / Torus / Stairs
  cutDirections           // Additive / Subtractive / Both
  loftStyles              // Constant / Variable / Maximizing
  cascades                // None / One / Some

  // frame dependencies
  frameWidth              // None / Small / Medium / Large
  frameDivs               // Int: 1-5
  frameSpacing            // Whole / Thirds / Quarters / Fifths / Eighths / Ninths
  frameCascades           // None / One / Some



  modifierStyle           // TODO: DEPRECATE
  symmetryStyle           // TODO: DEPRECATE
  pyramidal               // TODO: DEPRECATE

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
      // grid features (6)
      gridStyle: this.gridStyle,
      cellColumns: this.x,
      cellRows: this.y,
      cellAspect: this.cellAspect,
      cellOutset: this.cellOutset,
      cellInset: this.cellInset,

      // group features (5)
      primarySeedStyle: this.primarySeed,
      secondarySeedStyle: this.secondarySeed,
      groupCount: this.groupCount,
      density: this.density,
      shapeInterpreter: this.shapeInterpreter,

      // cut features (4)
      cutStyles: this.cutStyles,
      cutDirections: this.cutDirections,
      loftStyles: this.loftStyles,
      cascades: this.cascades,

      // frame features (4)
      frameWidth: this.frameWidth,
      frameDivisions: this.frameDivs,
      frameSpacing: this.frameSpacing,
      frameCascades: this.frameCascades,

      // fail features (2)
      likelyFailures: this.likelyFailures,
      unlikelyFailures: this.unlikelyFailures,
    }
  }

  // MARK: Private Methods
  // #region Private Methods
  //METH:
  #calcFeatures() {
    // DeBug.groupCollapsed(`AB.calcFeatures`)
    DeBug.group(`AB.calcFeatures`)
    const r = this.r
    // grid dependencies

    this.#calcGridProps(r)
    this.x = this.#calcX(r)
    DeBug.log('Grid Style:', this.gridStyle)
    DeBug.log('Cell Aspect:', this.cellAspect)
    this.y = this.#calcY(r)
    this.#calcFrameProps(r)
    DeBug.log('Grid Size:', this.x, `x`, this.y)

    // shader dependencies
    this.cutDirections = this.enums.cutDirections.feature(r)
    this.groupCount = this.#calcGroupCounts(r)
    this.cutStyles = this.enums.cutStyles.feature(r) === 'True'
    this.loftStyles = this.enums.loftStyles.feature(r) === 'True'

    this.groups = this.#calcGroups(r)
    // group dependencies
    this.density = this.#calcDensity(r)
    this.weight = this.#calcWeight(r)
    this.primarySeed = this.enums.primarySeed.feature(r)
    this.secondarySeed = this.enums.secondarySeed.feature(r)
    this.modifierStyle = this.enums.modifierStyle.feature(r)

    this.pyramidal = this.enums.pyramidal.feature(r) === 'True'
    // shape dependencies
    this.shapeInterpreter = this.enums.shapeInterpreter.feature(r)


    DeBug.groupEnd()
  }
  // #endregion
  // MARK: Grid Methods
  // #region Grid Methods
  //METH: #calcGridProps()
  #calcGridProps(r) {
    this.gridStyle = this.enums.gridStyle.feature(r)
    if (this.gridStyle === `Magical`) {
      this.cellAspect = 'Square'                    // "Magical" only uses 'Square' cells
    } else {                                        // calculate cellAspect using native distributions
      this.cellAspect = this.enums.cellAspect.feature(r)
    }
    this.cellOutset = this.enums.cellOutset.feature(r)
    this.cellInset = this.enums.cellInset.feature(r)
  }
  //METH: #calcX()
  #calcX(r) {
    const enumX = this.gridStyle === `Magical` ? this.enums.gridXMagic : this.enums.gridXFlex
    const x = parseInt(enumX.feature(r))
    // if (x < 5) {
    //   this.enums.primarySeed.removeOptions(['Rectangles', 'Squares', 'Triangles'])// only 5-10 can pack more than 3 rects, squares, or triangles
    // }

    if (x < 4) {
      this.enums.pyramidal.replaceOptions([['True', 0.5], ['False', 0.5]])
      // this.enums.primarySeed.reduceOptions(['Noise', 'Thin Random Comb']) // not enough cells to support other styles
      // this.enums.symmetryStyle.replaceOptions([['None', 1.2]])
    }
    if (x > 4 && this.gridStyle === `Flexible`) {
      this.enums.frameWidth.removeOptions(['Large'])
    }
    if (x > 7) {

      this.enums.density.replaceOptions([['So Lonely', 0.2], ['Some Availability', 0.4], ['At Capacity', 0.4],])
      // this.enums.insetRatio.removeOptions(['3:2', '2:1'])
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
      const min = x * 2 + 1                                     // min is always double the columns plus one
      const maxes = [9, 14, 16, 19, 21, 22, 23, 26, 29, 31]     // maxes established in Magic Ratio Grid Calculator doc
      const wideMaxes = [6, 7, 9, 10, 12, 15, 17, 20, 22, 25]   // wide maxes hold ratio at 1:2.5 (except for 1=>1:3), producing less totem grids
      const chooseWide = R.random_bool(1 / 3)                   // lean towards wider ratios (from 0.26->0.33) 
      let max = chooseWide ? wideMaxes[x - 1] : maxes[x - 1]    // max taken from corresponding maxes entry
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
      this.enums.frameWidth.chosen = w
    } else {
      this.frameWidth = this.enums.frameWidth.feature(r)
    }
    DeBug.log(`frameWidth:`, this.frameWidth)

    const widthVal = this.enums.frameWidth.value
    DeBug.warn(`widthVal`, widthVal)
    if (widthVal < 3) {                                   // Medium or Less
      this.enums.frameDivs.removeOptions([`5`, `4`])
      this.enums.frameSpacing.removeOptions([`Ninths`, `Eighths`])
      this.enums.frameCascades.removeOptions([`Some`])
    }
    if (widthVal < 2) {                                   // Small or Less
      this.enums.frameDivs.removeOptions([`3`])
      this.enums.frameSpacing.removeOptions([`Fifths`, `Quarters`])
      this.enums.frameCascades.removeOptions([`One`])
    }
    if (widthVal < 1) {                                   // Minimum
      if (this.enums.cellOutset.value > .25) { this.enums.frameDivs.removeOptions([`2`]) }
      this.enums.frameSpacing.removeOptions([`Thirds`])
      // this.enums.frameCascades.removeOptions([`One`])
    }
    this.frameDivs = this.enums.frameDivs.feature(r)
    if (this.frameDivs > 4) { this.enums.frameSpacing.removeOptions([`Quarters`, `Thirds`]) }
    if (this.frameDivs < 3) { this.enums.frameCascades.removeOptions([`Some`]) }
    if (this.frameDivs === `1`) {
      this.enums.frameSpacing.removeOptions([`Quarters`, `Thirds`])
      this.enums.frameCascades.replaceOptions([['None', 0.5], ['One', 0.5]])
    }
    // if (this.frameDivs === `1`) {
    //   this.frameSpacing = `Whole`
    //   this.enums.frameSpacing.chosen = `Whole`
    // } else {
    this.frameSpacing = this.enums.frameSpacing.feature(r)
    // }

    this.frameCascades = this.enums.frameCascades.feature(r)
  }


  // #endregion
  // MARK: Group Methods
  // #region Group Methods
  //METH:
  #calcGroupCounts(r) {
    let adds = 0
    let subs = 0
    const types = this.cutDirections
    let extra = this.enums.extraGroups.feature(r)

    if (types.includes('Additive')) { adds = 1 }
    if (types.includes('Subtractive')) {
      if (types === 'Subtractive') {
        // this.enums.insetScale.removeOptions(['Maximum'])
        // this.enums.insetRatio.replaceOptions([['1:1', 0.75]], false)
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
    const groupWeight = adds + subs
    // if (groupWeight < 3) { this.enums.symmetryUse.removeOptions(['Some Groups']) }
    // if (groupWeight < 2) { this.enums.symmetryUse.removeOptions(['One Group']) }
    if (this.x > 3) {
      switch (groupWeight) {
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
  #calcGroups(r) {
    let groups = []
    let adds = this.groupCount.adds
    let subs = this.groupCount.subs
    const total = adds + subs
    // insets
    // const insets = this.#calcInsets(r)
    // let toggle = false
    // const inset = () => {
    //   toggle = !toggle
    //   return toggle ? insets[0] : insets[1]
    // }
    //style
    let style
    if (!this.cutStyles) {
      style = (adds >= subs) ? this.enums.additiveStyle : this.enums.subtractiveStyle
      style = style.feature(r)
    }
    for (let i = 0; i < subs; i++) {
      // groups.push(this.#calcGroup(r, false, style, inset()))
      const group = this.#calcGroup(r, false, style,
        //  inset()
      )
      DeBug.log('group', group)
      groups.push(group)
    }
    for (let i = 0; i < adds; i++) {
      // groups.push(this.#calcGroup(r, true, style, inset())) 
      const group = this.#calcGroup(r, true, style,
        //  inset()
      )
      DeBug.log('group', group)
      groups.push(group)
    }

    return groups
  }
  //METH:
  #calcGroup(r, additive, style,
    // inset
  ) {
    // DeBug.log('style', style)
    // DeBug.log('inset', inset)
    if (!style) {
      style = additive ? this.enums.additiveStyle.feature(r) : this.enums.subtractiveStyle.feature(r)
    }
    // DeBug.log('style2', style)
    let loft
    if (this.loftStyles) {
      loft = additive ? this.enums.groupHeight : this.enums.groupDepth
      loft = loft.feature(r)
    } else { loft = 1 }

    return {
      type: additive ? 'Additive' : 'Subtractive',
      style: style,
      // inset: inset,
      loft: loft,
    }
  }
  // //METH:
  // #calcInsets(r) {
  //   // DeBug.log('Grid', [this.x, this.y])
  //   let scaleRange
  //   if (this.cutDirections === 'Additive') {
  //     scaleRange = [0.75, 0.85]
  //   } else {
  //     scaleRange = [0.8, 0.9]
  //   }
  //   // DeBug.log('scaleRange 1', scaleRange)
  //   // NOTE: This tunes the scale to mostly hit 0.9 - 0.95 range for any grid
  //   scaleRange = scaleRange.map(sub => min(1, sub + (0.08 / sqrt(this.x))))
  //   // DeBug.log('cutDirections', this.cutDirections)
  //   // DeBug.log('scaleRange 2', scaleRange)
  //   let range
  //   // DeBug.log('this.insetScale', this.insetScale)
  //   switch (this.insetScale) {
  //     case 'Maximum':
  //       range = [0, 0.3]
  //       break
  //     case 'Medium':
  //       range = [0.4, 0.7]
  //       break
  //     case 'Minimum':
  //       range = [0.8, 1]
  //   }

  //   // DeBug.log('range', range)
  //   let insetLrg = r.random_num(range[0], range[1])
  //   DeBug.log('insetLrg', insetLrg)
  //   insetLrg = convertRange(insetLrg, [0, 1], scaleRange)
  //   const [a, b] = this.insetRatio.split(':').map(Number)
  //   const ratioVal = b / a
  //   const insetSml = insetLrg * ratioVal
  //   DeBug.log('insets', [insetLrg, insetSml])
  //   return [roundToDec(insetLrg), roundToDec(insetSml)]
  // }
  // #endregion
  // MARK: Group Methods
  // #region Group Methods
  //METH:
  #calcDensity(r) {
    const density = this.enums.density.feature(r)
    if (density !== 'At Capacity') {
      this.enums.modifierStyle.removeOptions(['Triple Concentric'])
      // this.enums.symmetryUse.removeOptions(['All', 'Empty Groups'])
    }
    return density
  }
  get groupWeight() { return this.groupCount.adds + this.groupCount.subs }
  get emptyWeight() { return this.weight - this.groupWeight }

  //METH:
  #calcWeight(r) {
    switch (this.density) {
      case 'So Lonely':
        return floor(this.groupWeight / r.random_num(0.1, 0.4))
      case 'Some Availability':
        return ceil(this.groupWeight / r.random_num(0.5, 0.9))
      case 'At Capacity':
        return max(2, this.groupWeight)
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
      const { name: name, options: options, values: values } = option
      const enumFeature = new EnumFeature(name, options, values, this.usageStore)
      enums[optionKey] = enumFeature
    })
    this.enums = enums
  }
  // #endregion
  // #endregion
}

//MARK: Feature Options
// #region Feature Options
const publicOptions = {
  // MARK: Grid Dependencies
  // #region Grid Dependencies
  //Public: Grid Style : "Magical/Fixed" or "Flexible/Shrinking"
  gridStyle: {
    name: 'Grid Style',
    options: [
      ['Magical', 2 / 3],       // 200 / 300 (Total)
      ['Flexible', 1 / 3],      // 100 / 300 (Total)
    ]
  },
  // Public: Cell Aspect
  cellAspect: {
    name: 'Cell Aspect',
    options: [
      ['Square', 0.3],          // 30 / 100 ("Flexible")
      ['Tall', 0.35],           // 35 / 100 ("Flexible")
      ['Wide', 0.35],           // 35 / 100 ("Flexible")
    ]
  },
  // Public: Cell Outset
  cellOutset: {
    name: 'Cell Outset',
    options: [
      ['None', .3],              // 90 / 300 (Total)
      ['Eighth', .03],           // 9  / 300 (Total)
      ['Fifth', .03],            // 9  / 300 (Total)
      ['Quarter', .06],          // 18 / 300 (Total)
      ['Third', .04],            // 9  / 300 (Total)
      ['Three Eighths', .03],    // 9  / 300 (Total)
      ['Half', .25],             // 60 / 300 (Total)
      ['Five Eighths', .03],     // 9  / 300 (Total)
      ['Two Thirds', .04],       // 9  / 300 (Total)
      ['Three Quarters', .06],   // 18 / 300 (Total)
      ['Seven Eighths', .1],     // 30 / 300 (Total)
      ['Eight Ninths', .03],     // 9  / 300 (Total)
    ],
    values: [0, .125, .2, .25, 1 / 3, .375, .5, .625, 2 / 3, .75, .875, 8 / 9],
  },
  // Public: Cell Inset
  cellInset: {
    name: 'Cell Inset',
    options: [
      ['Min', .7],               // 210 / 300 (Total)
      ['2x Min', .15],           // 45  / 300 (Total)
      ['3x Min', .1],            // 30  / 300 (Total)
      ['4x Min', .05],           // 15  / 300 (Total)
    ],
    values: [1, 2, 3, 4],
  },
  //Public: grid column amount
  gridXFlex: {
    name: 'Columns',
    options: [
      ['1', 0.04],              // 4  / 100 ("Flexible")
      ['2', 0.08],              // 5  / 100 ("Flexible")
      ['3', 0.12],              // 6  / 100 ("Flexible")
      ['4', 0.15],              // 15 / 100 ("Flexible")
      ['5', 0.15],              // 15 / 100 ("Flexible")
      ['6', 0.15],              // 15 / 100 ("Flexible")
      ['7', 0.1],               // 15 / 100 ("Flexible")
      ['8', 0.1],               // 6  / 100 ("Flexible")
      ['9', 0.06],              // 5  / 100 ("Flexible")
      ['10', 0.05],             // 4  / 100 ("Flexible")
    ]
  },
  //Public: grid column amount
  gridXMagic: {
    name: 'Columns',
    options: [
      ['1', .07],                 // 14  / 200 ("Magical")
      ['2', .1],                  // 20  / 200 ("Magical")
      ['3', .1],                  // 20  / 200 ("Magical")
      ['4', .11],                 // 22  / 200 ("Magical")
      ['5', .11],                 // 22  / 200 ("Magical")
      ['6', .1],                  // 10  / 200 ("Magical")
      ['7', .09],                 // 18  / 200 ("Magical")
      ['8', .1],                  // 20  / 200 ("Magical")
      ['9', .11],                 // 22  / 200 ("Magical")
      ['10', .11],                // 22  / 200 ("Magical")
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
  // Public: grouping options
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
  // Private: amount of extra groups to create
  extraGroups: {
    name: 'Extra Groups',
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
  primarySeed: {
    name: 'Primary Seed Style',
    options: [
      ['Noise', 0.05],                  // 15 / 300 (Total)
      ['Random Comb', 0.1],             // 30 / 300 (Total)
      ['Rectangles', 0.15],             // 45 / 300 (Total)   // Pills
      ['Squares', 0.2],                 // 60 / 300 (Total)   // Spheres
      ['Simple Pattern', 0.05],         // 15 / 300 (Total)
      ['Complex Pattern', 0.25],        // 90 / 300 (Total)
      ['Snake', 0.1],                   // 30 / 300 (Total)
      ['Snakes', 0.1],                  // 30 / 300 (Total)
      // ['Triangles', 0.1],
    ]
  },
  // Public: style of seed
  secondarySeed: {
    name: 'Secondary Seed Style',
    options: [
      ['None', 0.45],                   // 135 / 300 (Total)
      ['Noise', 0.025],                 // 8   / 300 (Total)
      ['Random Comb', 0.025],           // 8   / 300 (Total)
      ['Rectangles', 0.1],              // 30  / 300 (Total)   // Pills
      ['Squares', 0.1],                 // 30  / 300 (Total)   // Spheres
      ['Simple Pattern', 0.1],          // 30  / 300 (Total)
      ['Complex Pattern', 0.1],         // 30  / 300 (Total)
      ['Snake', 0.1],                   // 30  / 300 (Total)
    ]
  },
  // Public: style of modifier
  modifierStyle: {
    name: 'Modifier Style',
    options: [
      ['Inflate Single Direction', 0.2], // 20 / 100
      ['Inflate Some Directions', 0.5],  // 50 / 100
      ['Concentric', 0.2],               // 20 / 100
      ['Concentric Thick', 0.1],         // 10 / 100
    ]
  },

  // MARK: Frame Dependencies
  // #region Frame Dependencies
  // Public: Frame Width
  frameWidth: {
    name: 'Frame Width',
    options: [
      ['Minimum', 0.15],        // 15 / 100 ("Flexible")     10 / 300 (Total)
      ['Small', 0.4],           // 40 / 100 ("Flexible")
      ['Medium', 0.25],         // 25 / 100 ("Flexible")
      ['Large', 0.2],           // 20 / 100 ("Flexible")
    ],
    values: [0, 1, 2, 3],
  },
  // Public: Frame Divisions
  frameDivs: {
    name: 'Frame Divisions',
    options: [
      ['1', 0.3],               // 90  / 300 (Total)
      ['2', 0.35],              // 105  / 300 (Total)
      ['3', 0.2],               // 60  / 300 (Total)
      ['4', 0.1],               // 30 / 300 (Total)
      ['5', 0.05],              // 15  / 300 (Total)       
    ]
  },
  // Public: Frame Divisions
  frameSpacing: {
    name: 'Frame Spacing',
    options: [
      ['Whole', 0.2],            // 120 / 300 (Total)
      ['Thirds', 0.15],          // 30  / 300 (Total)
      ['Quarters', 0.2],         // 60  / 300 (Total)
      ['Fifths', 0.15],          // 30  / 300 (Total)  
      ['Eighths', 0.15],         // 30  / 300 (Total)     
      ['Ninths', 0.15],          // 30  / 300 (Total)   
    ],
    values: [1, 3, 4, 5, 8, 9],
  },
  // Public: Frame Stairs
  frameCascades: {
    name: 'Frame Stairs',
    options: [
      ['None', 0.65],            // 195 / 300 (Total)
      ['One', 0.3],              // 90  / 300 (Total)
      ['Some', 0.05],            // 15  / 300 (Total)
    ],
    values: [0, 1, 2],
  },
  // Private: Frame Profiles
  frameProfiles: {
    name: 'Frame Profiles',
    options: [
      ['Flat', 0.05],            // 15 / 300 (Total)
      ['iIn', 0.025],             // 15 / 300 (Total)
      ['iOut', 0.025],            // 15 / 300 (Total)
      ['jIn', 0.25],             // 75 / 300 (Total)
      ['jOut', 0.2],            // 45 / 300 (Total)
      ['rIn', 0.15],             // 45 / 300 (Total)
      ['rOut', 0.3],             // 90 / 300 (Total)
    ]
  },
  // #endregion

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
  //     ['Empty Groups', .1], // removed if (Density === 'At Capacity') in #calcDensity()
  //     ['Assigned Groups', .2],// removed if (Density === 'At Capacity') in #calcDensity()
  //     ['One Group', .1], // removed if (groupsCount < 2) in #calcGroupCounts()
  //     ['Some Groups', .1], // removed if (groupsCount < 3) in #calcGroupCounts()
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
      ['i', 0.1],
      ['j', 0.4],
      ['r', 0.5],
      // ['v', 0.3],
    ]
  },
  // Private: (INSTANCE USE) style of subtractive cut
  subtractiveStyle: {
    name: 'Subtractive Style',
    options: [
      ['i', 0.1],
      ['j', 0.5],
      ['r', 0.4],
      // ['v', 0.175],
    ]
  },
  // Private: (INSTANCE USE) (subtractive) depth of cutouts
  groupDepth: {
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
  groupHeight: {
    name: 'Height',
    options: [
      ['0.25', 0.025],
      ['0.5', 0.075],
      ['0.666', 0.1],
      ['0.8', 0.2],
      ['1', 0.6],
    ]
  },
  // Private: (INSTANCE USE) cascade group count options
  cascadeGroups: {
    name: 'Cascade Group Amount',
    options: [
      ['One', 0.75],
      ['Some', 0.2],
      ['All', 0.05],
    ]
  },
  // Private: (INSTANCE USE) pyramidal group count options
  cascadeSteps: {
    name: 'Cascade Step Amount',
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
  values
  weightedOptions
  usageStore

  chosen

  constructor(name, options = [], values, usageStore) {
    this.name = name
    this.options = options
    this.values = values
    this.usageStore = usageStore
    this.weightedOptions = this.#weighOptions()
  }

  get length() { return this.options.length }

  // MARK: Public Methods
  // #region Public Methods
  //METH:
  feature(r) {
    this.chosen = this.#getFeature(this.#getFeatureIndex(r.random_dec()))
    return this.chosen
  }
  //METH:
  addOptions(options) {
    // DeBug.log('addOptions called')
    // DeBug.log('options', options)
    // options = OpArray.format(options)
    // DeBug.log('options', options)
    // const oldOpts = OpArray.format(this.options)
    const newOpts = [...options, ...this.options]
    // DeBug.log('newOpts', newOpts)
    if (newOpts) { this.replaceOptions(newOpts) }
  }
  //METH:
  removeOptions(options) {
    // DeBug.warn(`removeOptions`, this.name)
    // DeBug.log(`options before`, this.options)
    // DeBug.log(`values before`, this.values)
    // DeBug.log(`options to remove`, options)
    let vals
    if (this.values) { vals = options.map(opt => this.valueOf(opt)) }
    // DeBug.log(`vals to remove`, vals)
    const reduced = this.options.filter(opt => !options.includes(opt[0]))
    // DeBug.log(`reduced`, reduced)
    if (reduced) { this.replaceOptions(reduced) }
    if (this.values) {
      const reducedVals = this.values.filter(val => !vals.includes(val))
      // DeBug.log(`reducedVals`, reducedVals)
      if (reducedVals) { this.values = reducedVals }
    }
    // DeBug.log(`options after`, this.options)
    // DeBug.log(`values after`, this.values)
  }
  //METH:
  reduceOptions(toOptions) {
    const reduced = this.options.filter(opt => toOptions.includes(opt[0]))
    if (reduced) { this.replaceOptions(reduced) }
  }
  //METH:
  replaceOptions(withOptions, all = true) {
    let vals
    // DeBug.warn(`replaceOptions`)
    // DeBug.log(this)
    // DeBug.log(`original options`, this.options)
    // DeBug.log(`withOptions`, withOptions)

    // if (!all) { 
    //   const hasOptions = withOptions.filter(newOpt => this.options.some(oldOpt => oldOpt[0] === newOpt[0])) 
    //   if (hasOptions) {
    //     withOptions.forEach(newOpt => {
    //             const oldOpt = this.options.find(opt => opt[0] === newOpt[0])
    //             if (oldOpt) { oldOpt[1] = newOpt[1] }
    //           })}
    // }
    // DeBug.log(`withOptions`, withOptions)

    // this.options = withOptions
    // if (this.values) {
    //   vals = withOptions.map(opt => this.valueOf(opt))
    //   const reducedVals = this.values.filter(val => !vals.includes(val))
    //   // DeBug.log(`reducedVals`, reducedVals)
    //   if (reducedVals) { this.values = reducedVals }
    // }


    if (all) {
      this.options = withOptions
      // if (this.values) {
      //   const reducedVals = this.values.filter(val => !vals.includes(val))
      //   // DeBug.log(`reducedVals`, reducedVals)
      //   if (reducedVals) { this.values = reducedVals }
      // }
    } else {
      // withOptions = withOptions.filter(newOpt=> this.options.some(oldOpt=> oldOpt[0]=== newOpt[0]))


      withOptions.forEach(newOpt => {
        const oldOpt = this.options.find(opt => opt[0] === newOpt[0])
        if (oldOpt) { oldOpt[1] = newOpt[1] }
      })
    }
    this.weightedOptions = this.#weighOptions()
  }
  indexOf(option) { return this.options.findIndex(opt => opt[0] === option) }
  valueOf(option) { return this.values[this.indexOf(option)] }
  get index() { return this.indexOf(this.chosen) }
  get value() { return this.values[this.index] }
  // #endregion
  // MARK: Private Methods
  // #region Private Methods
  //METH:
  #getFeature(index) {
    // DeBug.log(this)
    const result = this.options[index][0]
    if (result) { return result }
    else {
      // DeBug.log(this.index)
      // DeBug.log(this.options)
    }
  }
  //METH:
  #getFeatureIndex(weight) { return this.weightedOptions.findIndex(e => between(weight, e[1])) }
  //METH: sum of option weights
  #totalWeight() {
    let weight = this.options
      .map(option => option[1])
      .reduce((a, b) => a + b, 0)
    if (roundToDec(weight) !== 1) DeBug.error(`weight != 1`, this.name, weight)
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