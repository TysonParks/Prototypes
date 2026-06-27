
//TODO: Before submission, update FeatureSet and EnumFeature in ABFeatureScript.js!!!
//MARK: FeatureSet Class
// SIZE: 664 lines
class FeatureSet {
  // MARK: Calculated Feature Properties
  // grid dependencies
  gridStyle               // Magical / Flexible
  cellAspect              // Square / Portrait / Landscape
  cellOutset              // [0, .125, .2, .25, 1 / 3, .375, .5, .625, 2 / 3, .75, .875, 8 / 9]
  cellInset               // [Min, 2xMin, 3xMin, 4xMin]
  x                       // Int: 1-10
  y                       // Int: 1-40
  gridInsetScale          // Vert: 0-1
  cellSize                // Vert: 0-100

  groups = []             // TODO: DEPRECATE : actually a shader dependency - just here for logging purposes 

  // group dependencies
  groupCount              // Two / Three / More
  density                 // So Lonely / Some Availability / At Capacity
  seed1                   // Noise/ Random Comb / Rectangles / Squares / Simple Pattern / Complex Pattern / Snake
  seed2                   // None, Noise/ Random Comb / Rectangles / Squares / Simple Pattern / Complex Pattern / Snake 
  weight                  // Int: 2-10

  // cut dependencies
  uniformCuts             // Variable / Scoop / Torus / Stairs
  uniformCutsStyle        // 
  cutDirections           // Additive / Subtractive / Both
  uniformLofts            // Constant / Variable / Maximizing       
  insideCuts              // True / False
  insideCutStyle          // Cascades / Waves / Channel / Cyma Recta / Mixed
  linearCuts            // None / One / Some

  // insideCutAmount         // Small / Medium / Large

  // frame dependencies
  frameWidth              // None / Small / Medium / Large
  frameDivs               // Int: 1-5
  frameSpacing            // Whole / Thirds / Quarters / Fifths / Eighths / Ninths
  frameCascades           // None / One / Some

  // internal rarity metrics (analytical, not marketplace occurrence rarity)
  enumerativeRarityMagnitude
  programmedRarityMagnitude
  spatialPossibilityMagnitude
  programmedRaritySkew
  totalPossibilityMagnitude



  // modifierStyle           // TODO: DEPRECATE
  // symmetryStyle           // TODO: DEPRECATE

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
      gridWidth: this.x,
      gridHeight: this.y,
      cellAspect: this.cellAspect,
      cellOutset: this.cellOutset,
      cellInset: this.cellInset,

      // group features (5)
      primarySeedStyle: this.seed1,
      secondarySeedStyle: this.seed2,
      groupCountAdditive: this.groupCount.adds,
      groupCountSubtractive: this.groupCount.subs,
      groupDensity: this.density,

      // cut features (6–7)
      uniformCuts: this.uniformCuts,
      cutDirections: this.cutDirections,
      uniformLofts: this.uniformLofts,
      linearCuts: this.linearCuts,
      insideCuts: this.insideCuts,
      insideCutStyle: this.insideCutStyle,
      ...(this.uniformCuts ? { cutStyleCount: this.#cutStyleCount() } : {}),

      // frame features (4)
      frameWidth: this.frameWidth,
      frameDivisions: this.frameDivs,
      frameSpacing: this.frameSpacing,
      frameCascades: this.frameCascades,

      // Internal Rarity Metrics (5) — system structure, not occurrence rarity
      'Enumerative Rarity Magnitude': this.enumerativeRarityMagnitude,
      'Programmed Rarity Magnitude': this.programmedRarityMagnitude,
      'Spatial Possibility Magnitude': this.spatialPossibilityMagnitude,
      'Programmed Rarity Skew': this.programmedRaritySkew,
      'Total Possibility Magnitude': this.totalPossibilityMagnitude,
    }
  }

  get groupWeight() { return this.groupCount.adds + this.groupCount.subs }

  //METH: #cutStyleCount() : Number : map uniformCutsStyle to public cutStyleCount 1–4
  #cutStyleCount() {
    const map = { rOut: 1, jIn: 2, rIn: 3, jOut: 4 }
    return map[this.uniformCutsStyle] ?? null
  }

  //METH: #calcRarityMetrics() : null : aggregate internal rarity magnitudes from usageStore
  #calcRarityMetrics() {
    const records = this.usageStore.filter(r => r.contributesToRarity)
    let enumSum = 0
    let progSum = 0
    records.forEach(rec => {
      if (rec.modifiedOptionCount > 0) enumSum += Math.log10(rec.modifiedOptionCount)
      if (rec.selectedWeight > 0 && rec.modifiedWeightSum > 0) {
        const p = rec.selectedWeight / rec.modifiedWeightSum
        progSum += Math.log10(1 / p)
      }
    })
    this.enumerativeRarityMagnitude = Math.floor(enumSum)
    this.programmedRarityMagnitude = Math.floor(progSum)
    const cellCount = this.x * this.y
    const groupCount = this.groupCount.adds + this.groupCount.subs
    this.spatialPossibilityMagnitude = Math.floor(cellCount * Math.log10(groupCount + 1))
    this.programmedRaritySkew = this.programmedRarityMagnitude - this.enumerativeRarityMagnitude
    this.totalPossibilityMagnitude = this.programmedRarityMagnitude + this.spatialPossibilityMagnitude
  }

  get emptyWeight() { return this.weight - this.groupWeight }
  get minCellSize() { return Math.min(this.cellSize.x, this.cellSize.y) }
  get gridInsetSize() { return 100 * this.gridInsetScale.x }
  get minInsetAmount() {
    // DeBug.log('this.minCellSize', this.minCellSize)                                      //LOGGING:
    // DeBug.log('this.enums.cellInset.value', this.enums.cellInset)                        //LOGGING:
    return Math.max(.05, 1 / this.minCellSize * this.enums.cellInset.value)
  }
  get calcdFrameWidth() { return ((100 - this.gridInsetSize) - (this.minInsetAmount * this.minCellSize)) / 2 }

  // MARK: Private Methods
  // #region Private Methods
  //METH:
  #calcFeatures() {
    // DeBug.groupCollapsed(`AB.calcFeatures`)                                              //LOGGING:
    DeBug.group(`AB.calcFeatures`)                                                          //LOGGING:
    const r = this.r

    // grid dependencies
    DeBug.groupCollapsed(`calcGridProps`)                                                   //LOGGING:
    // DeBug.group(`calcGridProps`)                                                         //LOGGING:
    this.#calcGridProps(r)
    DeBug.groupEnd()                                                                        //LOGGING:

    // cut dependencies
    this.#calcUniformCuts(r)

    this.cellInset = this.enums.cellInset.feature(r)
    this.#recalcFrameWidth(r)

    this.groupCount = this.#calcGroupCounts(r)
    this.#calcInsideCuts(r)
    this.#calcLinearCuts(r)

    this.uniformLofts = this.enums.uniformLofts.feature(r) === 'True'

    // group dependencies
    this.#calcDensity(r)
    this.#calcWeight(r)
    this.seed1 = this.enums.seed1.feature(r)
    if (this.seed1 === 'Noise') {
      this.enums.seed2.removeOptions(['Noise'])
      this.enums.modifierStyle.removeOptions(['Noise'])
    }
    this.seed2 = this.enums.seed2.feature(r)
    this.#calcGroups(r)

    this.#calcRarityMetrics()

    DeBug.groupEnd()                                                        //LOGGING:
  }
  // #endregion
  // MARK: Grid Methods
  // #region Grid Methods
  //METH: #calcGridProps()
  #calcGridProps(r) {
    DeBug.groupCollapsed(`calcGrid`)                                        //LOGGING:
    // DeBug.group(`calcGrid`)                                              //LOGGING:
    this.#calcGridStyle(r)
    this.#calcX(r)
    this.#calcY(r)
    DeBug.groupEnd()                                                        //LOGGING:

    DeBug.groupCollapsed(`calcFrameProps`)                                  //LOGGING:
    // DeBug.group(`calcFrameProps`)                                        //LOGGING:
    this.#calcFrameProps(r)
    DeBug.groupEnd()                                                        //LOGGING:
    this.#calcGridInset(r)
  }
  //METH: #calcGridStyle() : null : calculate gridStyle and cellAspect
  #calcGridStyle(r) {
    this.gridStyle = this.enums.gridStyle.feature(r)
    if (this.gridStyle === `Magical`) this.cellAspect = 'Square'        // "Magical" only uses 'Square' cells
    else this.cellAspect = this.enums.cellAspect.feature(r)             // calculate cellAspect using native distributions
  }
  //METH: #calcX() : null : calculate X, the number of columns in the grid
  #calcX(r) {
    const
      enumX = this.gridStyle === `Magical` ? this.enums.gridXMagic : this.enums.gridXFlex,
      x = parseInt(enumX.feature(r))

    if (x < 10) {
      this.enums.extraGroups.removeLastOption(Math.min(3, 10 - x))           // remove '6' from extraGroups
    }
    if (x < 9) {

    }
    if (x < 8) {

    }
    if (x < 7) {

    }
    if (x < 5) {
      this.enums.extraGroups.removeLastOption()                         // remove '2' from extraGroups
    }
    if (x < 2) {
      this.enums.seed1.replaceOptions([['Noise', 1]])
      this.enums.seed2.replaceOptions([['Modifier', 1]])
    }
    if (x > 9) {

    }
    if (x > 8) {
      this.enums.extraGroups.removeOptions(['1'])
    }
    if (x > 7) {

    }
    if (x > 6) {

    }
    if (x > 5) {

    }
    if (x > 4) {
      if (this.gridStyle === `Flexible`) {
        this.enums.cellOutset.removeLastOption()
        this.enums.frameWidth.removeOptions(['Large'])
      }
    }
    if (x > 3) {
      this.enums.cellOutset.removeLastOption(Math.min(7, x - 3))
    }
    if (x > 2) {
      if (this.gridStyle === `Flexible` && this.cellAspect === 'Wide') {
        this.enums.cellOutset.removeLastOption()
      }
    }

    this.cellOutset = this.enums.cellOutset.feature(r)
    this.x = x
  }
  //METH: #calcY(r) : null : calculate Y, the number of rows in the grid
  #calcY(r) {
    const x = this.x
    //ARROW: y() : Number : calculate Y, the number of rows in the grid
    const y = () => {
      if (this.gridStyle === 'Magical') {                       // "Magical" gridStyle
        const
          min = x * 2 + 1,                                      // min is always double the columns plus one
          maxes = [9, 14, 16, 19, 21, 22, 23, 26, 29, 31],      // maxes established in Magic Ratio Grid Calculator doc
          wideMaxes = [6, 7, 9, 10, 12, 15, 17, 20, 22, 25],    // wide maxes hold ratio at 1:2.5 (except for 1=>1:3), producing less totem grids
          chooseWide = R.random_bool(1 / 2)                     // lean towards wider ratios (from 0.26->0.33) 
        let max = chooseWide ? wideMaxes[x - 1] : maxes[x - 1]  // max taken from corresponding maxes entry
        return r.random_int(min, max || min + 1)
        // return r.random_int(min, min + 1)
      } else {
        switch (this.cellAspect) {                              // "Flexible" gridStyle uses cellAspect to multiply column count
          case 'Square':
            return 2 * x
          case 'Tall':
            return x
          case 'Wide':
            return 4 * x
        }
      }
    }
    this.y = y()
  }
  //METH: #calcFrameProps() : null : calculate frameWidth, frameDivs, frameSpacing, and frameCascades
  #calcFrameProps(r) {
    //NOTE: calc frameWidth: function of cellOutset and gridStyle
    if (this.gridStyle === 'Magical') {
      DeBug.log(`cellOutset`, this.enums.cellOutset.value)                                        //LOGGING:
      this.#calcGridInset(r)
      const
        outset = this.enums.cellOutset.value,
        ratio = this.y / this.x
      let w = `Medium`

      if (ratio < 2.3) w = outset < 0.5 ? `Small` : `Minimum`
      if (ratio > 3) w = outset < 0.5 ? `Large` : `Medium`
      w = outset < 0.5 ? `Medium` : `Small`
      if (outset > .75) w = `Minimum`

      this.frameWidth = w
      this.enums.frameWidth.chosen = w
    }
    else {
      DeBug.log(`cellOutset`, this.enums.cellOutset.value)
      if (this.enums.cellOutset.value > 0.7) this.enums.frameWidth.removeLastOption()
      if (this.enums.cellOutset.value > 0.8) this.enums.frameWidth.removeLastOption()
      this.frameWidth = this.enums.frameWidth.feature(r)
    }
    DeBug.log(`frameWidth:`, this.frameWidth)                                                     //LOGGING:
    this.#calcGridInset(r)

    const widthVal = this.enums.frameWidth.value
    DeBug.warn(`widthVal`, widthVal)                                                              //LOGGING:
    this.#calcGridInset(r)

    if (widthVal < 3) {                                   // Medium or Less
      this.enums.frameDivs.removeOptions([`5`, `4`, `3`])
      this.enums.frameSpacing.removeOptions([`Ninths`, `Eighths`])
      this.enums.frameCascades.removeOptions([`Some`])
    }
    if (widthVal < 2) {                                   // Small or Less
      this.enums.frameDivs.removeOptions([`2`])
      this.enums.frameSpacing.removeOptions([`Fifths`, `Quarters`])
      this.enums.frameCascades.removeOptions([`One`])
    }
    if (widthVal < 1) {                                   // Minimum
      this.enums.frameSpacing.removeOptions([`Thirds`])
    }
    //NOTE: calc frameDivs
    this.frameDivs = this.enums.frameDivs.feature(r)
    if (this.frameDivs > 4) this.enums.frameSpacing.removeOptions([`Quarters`, `Thirds`])
    if (this.frameDivs < 3) this.enums.frameCascades.removeOptions([`Some`])
    if (this.frameDivs === `1`) {
      this.enums.frameSpacing.removeOptions([`Quarters`, `Thirds`])
      this.enums.frameCascades.replaceOptions([['None', 0.7, 0], ['One', 0.3, 1]])
    }
    //NOTE: calc frameSpacing, frameCascades
    this.frameSpacing = this.enums.frameSpacing.feature(r)
    this.frameCascades = this.enums.frameCascades.feature(r)
  }
  //METH: calcGridInset() : null : calculate gridInsetScale and cellSize
  #calcGridInset(r) {
    const
      isFlex = this.gridStyle === `Flexible`,
      x = this.x,
      y = this.y,
      gridYMult = y / x

    //ARROW: calcRatio(x) : Number : calculate ratio which properly sizes the grid
    const calcRatio = () => {
      if (x <= 1) return 9
      if (x <= 2) return 4.5
      if (x <= 3) return 3
      if (x > 3) return 2
      if (x > 8) return 1
      if (x > 15) return 0.5
    }

    let ratio = calcRatio()
    DeBug.log(`x`, x)                                                       //LOGGING:
    DeBug.log(`ratio`, ratio)                                               //LOGGING:

    const cellOutset = this.enums.cellOutset.value

    //ARROW: calcFrameWidth() : [Number] : calculate frameWidth divisor
    const calcFrameWidth = () => {
      //ARROW: widths() : [Number] : calculate frameWidth divisors based on frameWidth property
      const widths = () => {
        DeBug.log(`frameWidth:`, this.frameWidth)                           //LOGGING:
        switch (this.frameWidth) {
          case `Minimum`:
            return [40]
          case `Small`:
            return [20, 15, 10, 8]
          case `Medium`:
            return [6, 5, 4, 3]
          case `Large`:
            return [2, 1.5, 1.25, 1]
        }
      }
      return 1 - (1 / r.random_choice(widths()))
    }

    //ARROW: calcInset(x) : lilVert : calculate gridInsetScale based on gridStyle
    const calcInset = () => {
      if (isFlex) {
        DeBug.log(`cellOutset`, cellOutset)                                                   //LOGGING:
        const
          gridCellBoundsSize = lilVert(x, y),
          gridBoundsSize = lilVert(100, 200),
          initCellSize = LilVert.div(gridBoundsSize, gridCellBoundsSize),
          // DeBug.log(`initCellSize`, initCellSize)                                          //LOGGING:
          // const
          initMinCellWidth = Math.min(initCellSize.x, initCellSize.y),
          // DeBug.log(`initMinCellWidth`, initMinCellWidth)                                  //LOGGING:
          // cellAspectRatio = initCellSize.x / initCellSize.y,
          // const
          outsetCellSize = LilVert.add(lilVert(cellOutset * initMinCellWidth), initCellSize),
          // DeBug.log(`outsetCellSize`, outsetCellSize)                                      //LOGGING:
          // const
          initGridSize = LilVert.add(LilVert.mult(LilVert.sub(gridCellBoundsSize, lilVert(1)), initCellSize), outsetCellSize),

          normInset = LilVert.div(gridBoundsSize, initGridSize),
          minNormInset = Math.min(normInset.x, normInset.y),
          normCellSize = LilVert.mult(initCellSize, minNormInset),
          minNormCellWidth = Math.min(normCellSize.x, normCellSize.y),
          normOutsetCellSize = LilVert.add(lilVert(cellOutset * minNormCellWidth), normCellSize),
          // normGridSize = LilVert.add(LilVert.mult(LilVert.sub(gridCellBoundsSize, vert(1)), normCellSize), normOutsetCellSize),

          frameWidth = calcFrameWidth(),
          targetWidth = (100 - frameWidth * 100) * 2,
          insetAmount = normOutsetCellSize.x < targetWidth ?
            ceil(targetWidth / normOutsetCellSize.x)
            : 1 / ceil(normOutsetCellSize.x / targetWidth),
          insetScale = (100 / (100 + normOutsetCellSize.x * insetAmount)) * minNormInset

        DeBug.log(``)                                                                         //LOGGING:
        DeBug.log(`initCellSize`, initCellSize)                                               //LOGGING:
        DeBug.log(`initMinCellWidth`, initMinCellWidth)                                       //LOGGING:
        // DeBug.log(`cellAspectRatio`, cellAspectRatio)                                      //LOGGING:
        DeBug.log(`outsetCellSize`, outsetCellSize)                                           //LOGGING:
        DeBug.log(`initGridSize`, initGridSize)                                               //LOGGING:
        DeBug.log(``)                                                                         //LOGGING:
        DeBug.log(`normInset`, normInset)                                                     //LOGGING:
        DeBug.log(`minNormInset`, minNormInset)                                               //LOGGING:
        DeBug.log(`normCellSize`, normCellSize)                                               //LOGGING:
        DeBug.log(`minNormCellWidth`, minNormCellWidth)                                       //LOGGING:
        DeBug.log(`normOutsetCellSize`, normOutsetCellSize)                                   //LOGGING:
        // DeBug.log(`normGridSize`, normGridSize)                                            //LOGGING:
        DeBug.log(``)                                                                         //LOGGING:
        DeBug.log(`frameWidth`, frameWidth)                                                   //LOGGING:
        DeBug.log(`targetWidth`, targetWidth)                                                 //LOGGING:
        DeBug.log(`insetAmount`, insetAmount)                                                 //LOGGING:
        DeBug.log(`insetScale`, insetScale)                                                   //LOGGING:

        return lilVert(insetScale)
      } else {
        let insetRatio
        insetRatio = ratio / multiplier
        this.gridRatio = 1 / insetRatio
        DeBug.warn(`GRID Ratio: ${this.gridRatio}:1`)                                         //LOGGING:
        return lilVert((100 - (100 / (x * insetRatio + 1))) / 100)
      }
    }

    DeBug.log(`gridYMult`, gridYMult)                                                         //LOGGING:
    let multiplier = isFlex ?
      ((1 / 10) + (cellOutset / (x * 2))) * x * ratio
      : ceil((gridYMult - 2) * (x)) * ratio
    DeBug.log(`ratio`, ratio)                                                                 //LOGGING:
    DeBug.log(`multiplier`, multiplier)                                                       //LOGGING:
    this.gridInsetScale = calcInset()
    this.cellSize = LilVert.div(lilVert(100, 200).mult(this.gridInsetScale), lilVert(x, y))

    if (this.cellSize.x < 9 || this.cellSize.y < 9) this.enums.uniformCutsStyle.removeOptions(['rIn', 'jOut'])

    DeBug.log(`gridInsetScale`, this.gridInsetScale)                                          //LOGGING:
    DeBug.warn(`cellOutset`, this.cellOutset, cellOutset)                                     //LOGGING:

    const outset = this.enums.cellOutset.value
    DeBug.log('outset', this.cellOutset)                                                      //LOGGING:

    if (outset > 1 / 4 || this.minCellSize < 10) this.enums.cellInset.removeOptions(['4x Min'])
    if (outset > 1 / 2 || this.minCellSize < 7.5) this.enums.cellInset.removeOptions(['3x Min'])
    if (outset > 3 / 4 || this.minCellSize < 5) this.enums.cellInset.removeOptions(['2x Min'])
  }
  // #endregion
  // MARK: Group Methods
  // #region Group Methods
  //METH: #calcUniformCuts() : null : calculate uniformCuts and cutDirections
  #calcUniformCuts(r) {
    this.uniformCuts = this.enums.uniformCuts.feature(r) === 'True'

    if (this.uniformCuts) {
      this.uniformCutsStyle = this.enums.uniformCutsStyle.feature(r)
      if (this.uniformCutsStyle === 'rOut') {
        this.enums.seed1.removeOptions(['Random Comb', 'Simple Pattern', 'Complex Pattern', 'Noise'])
        this.enums.seed2.removeOptions(['Random Comb', 'Simple Pattern', 'Complex Pattern', 'Noise'])
        this.enums.modifierStyle.removeOptions(['Noise'])

        if (this.cellOutset < 1 / 7) this.enums.seed1.replaceOptions(['Snake', .5])
      }
      if (this.uniformCutsStyle === 'jIn') this.enums.cellInset.removeOptions(['4x Min', '3x Min'])
      //FIXME: the following should replace everything with 'none'
      if (this.uniformCutsStyle !== 'jIn' && this.uniformCutsStyle !== 'rOut') this.enums.cellInset.removeOptions(['4x Min', '3x Min', '2x Min'])
      this.cutDirections = this.uniformCutsStyle.includes('Out') ? 'Additive' : 'Subtractive'
    } else {
      this.enums.cutDirections.removeOptions(['Additive', 'Subtractive'])
      this.cutDirections = this.enums.cutDirections.feature(r)
    }
  }
  //METH: #recalcFrameWidth(r) : null : recalculate frameWidth for Magical gridStyle
  #recalcFrameWidth(r) {
    if (this.gridStyle === 'Magical') {
      DeBug.log(`calcdFrameWidth`, this.calcdFrameWidth)                    //LOGGING:
      const width = this.calcdFrameWidth
      // const widthVal = Math.min(3, Math.floor(this.calcdFrameWidth / 8))
      // DeBug.log(`widthVal`, widthVal)                                    //LOGGING:
      let name
      if (width < 2) name = 'Minimum'
      if (width >= 2) name = 'Small'
      if (width > 8) name = 'Medium'
      if (width > 25) name = 'Large'
      DeBug.log(`name`, name)                                               //LOGGING:

      this.enums.frameWidth.chosen = name
      this.frameWidth = name
      this.#recordMagicalFrameWidthRarity()
    }
  }
  //METH: #recordMagicalFrameWidthRarity() : null : synthetic rarity record for derived Magical frameWidth
  #recordMagicalFrameWidthRarity() {
    this.usageStore.push({
      name: 'frameWidth',
      chosen: this.frameWidth,
      originalOptionCount: this.enums.frameWidth.ogOptions.length,
      modifiedOptionCount: 1,
      originalWeightSum: 1,
      modifiedWeightSum: 1,
      selectedWeight: 1,
      contributesToRarity: true,
    })
  }
  //METH: calcGroupCounts(r) : null : calculate groupCount and groupWeight
  #calcGroupCounts(r) {
    const
      x = this.x,
      dirs = this.cutDirections
    let
      adds = 0,
      subs = 0

    if (dirs === 'Additive and Subtractive') {
      adds = 1, subs = 1
    } else {
      this.enums.extraGroups.removeOptions(['None'])
      if (dirs === 'Subtractive') subs = 1
      if (dirs === 'Additive') adds = 1
    }
    if (dirs.includes('Additive')) adds = 1               // if Additive is present, set adds to 1
    if (dirs.includes('Subtractive')) {                   // if Subtractive is present, set subs to 1
      if (dirs === 'Subtractive') {
        // this.enums.insetScale.removeOptions(['Maximum'])
        // this.enums.insetRatio.replaceOptions([['1:1', 0.75]], false)
      }
      subs = 1
    }

    DeBug.error('extraGroups options', this.enums.extraGroups.options)      //LOGGING:
    this.extraGroups = this.enums.extraGroups.feature(r)
    let extra = this.extraGroups

    if (extra !== 'None') {                                // if extra is not 'None', add extra groups
      extra = parseInt(extra)
      if (adds && subs) {
        for (let i = 0; i < extra; i++) {
          if (r.random_bool(.5)) adds += 1
          else subs += 1
        }
      } else {
        if (adds) adds += extra
        if (subs) subs += extra
      }
    }

    const groupWeight = adds + subs

    if (groupWeight < 4) this.enums.density.removeOptions(['So Lonely'])
    if (groupWeight < 3) this.enums.density.removeOptions(['Some Availability'])


    return { adds: adds, subs: subs }
  }
  //METH: calcInsideCuts() : null : calculate insideCuts and insideCutStyle
  #calcInsideCuts(r) {
    if (this.cellAspect !== 'Square') this.enums.insideCuts.removeOptions(['True'])
    this.insideCuts = this.enums.insideCuts.feature(r)

    if (this.insideCuts === 'True') this.insideCutStyle = this.enums.insideCutStyle.feature(r)
    else {
      this.enums.insideCutStyle.chosen = 'None'
      this.insideCutStyle = 'None'
    }
  }
  //METH: calcLinearCuts() : null : calculate linearCuts
  #calcLinearCuts(r) {
    if (this.groupWeight < 3) this.enums.linearCuts.removeOptions(['Some'])
    if (this.x < 4 || this.cellAspect !== 'Square') this.enums.linearCuts.removeOptions(['One', 'Some'])
    this.linearCuts = this.enums.linearCuts.feature(r)
  }
  //METH: calcGroups() : null : calculate groups
  #calcGroups(r) {
    const adds = new Array(this.groupCount.adds).fill(`+`), subs = new Array(this.groupCount.subs).fill(`-`)
    let
      style,
      groups = new OpArray(...adds, ...subs)
    groups = groups.randShuffle(r)
    // DeBug.log(`#calcGroups adds`, adds)                                  //LOGGING:
    // DeBug.log(`#calcGroups subs`, subs)                                  //LOGGING:
    // DeBug.log(`#calcGroups groups`, groups)                              //LOGGING:
    // DeBug.log('this.groupWeight', this.groupWeight)                      //LOGGING:

    if (this.uniformCuts) style = this.uniformCutsStyle[0]

    let base = 1 / this.groupWeight, used = 0

    groups.forEach((group, i) => {
      const additive = group === `+`
      let coverage = r.random_choice([base * 1 / 2, base * 2 / 3, base])
      used += coverage
      if (i === groups.lastIndex) coverage = 1 - used
      const newGroup = this.#calcGroup(i + 1, r, additive, style, coverage)
      // DeBug.log('new group', newGroup)                                   //LOGGING:
      this.groups.push(newGroup)
    })
    DeBug.log('used', used)                                                 //LOGGING:
    DeBug.log('groups', groups)                                             //LOGGING:
  }
  //METH: calcGroup() : null : calculate group properties
  #calcGroup(i, r, additive, style, coverage) {
    const count = this.groupWeight
    // DeBug.log('count', count)                                            //LOGGING:
    // DeBug.log('style', i, additive, style)                               //LOGGING:
    if (!style) {
      style = additive ? this.enums.additiveStyle.feature(r) : this.enums.subtractiveStyle.feature(r)
    }
    // DeBug.log('style2', style)                                           //LOGGING:
    let loft
    // if (this.uniformLofts) {
    //   loft = additive ? this.enums.groupHeight : this.enums.groupDepth
    //   loft = loft.feature(r)
    // } else { loft = 1 }

    let method = 'Empty'
    if (i === 1) method = this.seed1
    if (i === 2 && count > 2) {
      method = this.seed2 === 'Modifier' ? this.enums.modifierStyle.feature(R) : this.seed2
      if (method === 'Outlines') {
        method = 'Outline'
        // DeBug.log(`this.groups`, this.groups)                            //LOGGING:
        this.groups[0].coverage = .5 / this.groupWeight
        this.enums.modifierStyle.replaceOptions([['Outline', 1]], true)
      } else this.enums.modifierStyle.removeLastOption()
    }
    if (i === count) {
      if (this.density === 'At Capacity') method = 'Group Available'
      else method = 'Empty'
    }
    else if (i > 2 && i <= count) method = this.enums.modifierStyle.feature(R)

    if (method === 'Noise') this.enums.modifierStyle.removeOptions(['Noise'])
    const isRectangular = method.includes('Rect') || method.includes('Square')
    let minSize, overlap

    if (isRectangular) {
      this.enums.rectOverlap.feature(r)
      overlap = this.enums.rectOverlap.value
      if (this.x > 3) minSize = overlap === 1 ? 1 : r.random_int(1, Math.floor(this.x / 2))
    }

    return {
      type: additive ? 'Additive' : 'Subtractive',
      style: style,
      loft: loft,
      method: method,
      coverage: coverage,
      minSize: minSize,
      overlapping: overlap,
    }
  }
  // #endregion
  // MARK: Group Methods
  // #region Group Methods
  //METH: calcDensity() : null : calculate density
  #calcDensity(r) {
    const density = this.enums.density.feature(r)
    // if (density !== 'At Capacity')
    // return density
    this.density = density
  }
  //METH: calcWeight() : null : calculate weight
  #calcWeight(r) {
    //ARROW: weight() : Number : calculate weight based on density
    const weight = () => {
      switch (this.density) {
        case 'So Lonely':
          return floor(this.groupWeight / r.random_num(0.1, 0.4))
        case 'Some Availability':
          return ceil(this.groupWeight / r.random_num(0.5, 0.9))
        case 'At Capacity':
          return max(2, this.groupWeight)
      }
    }
    this.weight = weight()
  }
  // #endregion
  // MARK: Init Methods
  // #region Init Methods
  //METH: #initFeatureSets() : null : initialize feature sets
  #initFeatureSets() {
    const enums = {}
    Object.keys(this.#options).forEach((optionKey) => {
      const
        option = this.#options[optionKey],
        { name: name, options: options } = option,
        enumFeature = new EnumFeature(optionKey, name, options, this.usageStore)
      enumFeature.rarityEligible = RARITY_ENUM_KEYS.has(optionKey)
      enums[optionKey] = enumFeature
    })
    this.enums = enums
  }
  // #endregion
  // #endregion
}

//MARK: Feature Options
// SIZE: 439 lines
// #region Feature Options
const RARITY_ENUM_KEYS = new Set([
  'gridStyle', 'cellAspect', 'gridXMagic', 'gridXFlex', 'cellOutset', 'frameWidth',
  'frameDivs', 'frameSpacing', 'frameCascades', 'cellInset', 'uniformCuts',
  'uniformCutsStyle', 'cutDirections', 'insideCuts', 'insideCutStyle', 'extraGroups',
  'linearCuts', 'uniformLofts', 'density', 'seed1', 'seed2',
])

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
      ['None', .25, 0],               // 75 / 300 (Total)
      ['Eighth', .03, .125],          // 9  / 300 (Total)
      ['Fifth', .03, .2],             // 9  / 300 (Total)
      ['Quarter', .07, .25],          // 21 / 300 (Total)
      ['Third', .05, 1 / 3],          // 15 / 300 (Total)
      ['Three Eighths', .04, .375],   // 12 / 300 (Total)
      ['Half', .2, .5],               // 60 / 300 (Total)
      ['Five Eighths', .04, .625],    // 12 / 300 (Total)
      ['Two Thirds', .06, 2 / 3],     // 18 / 300 (Total)
      ['Three Quarters', .07, .75],   // 21 / 300 (Total)
      ['Seven Eighths', .08, .875],   // 24 / 300 (Total)
      ['Eight Ninths', .08, 8 / 9],   // 24 / 300 (Total)
    ],
    // values: [0, .125, .2, .25, 1 / 3, .375, .5, .625, 2 / 3, .75, .875, 8 / 9],
  },
  // Public: Cell Inset
  cellInset: {
    name: 'Cell Inset',
    options: [
      // ['0.5x Min', .3],          // 210 / 300 (Total)
      ['Min', .7, 1],               // 210 / 300 (Total)
      ['2x Min', .15, 2],           // 45  / 300 (Total)
      ['3x Min', .1, 3],            // 30  / 300 (Total)
      ['4x Min', .05, 4],           // 15  / 300 (Total)
    ],
  },
  //Private: grid column amount
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
      // ['15', 0.05],             // 4  / 100 ("Flexible")
      // ['20', 0.05],             // 4  / 100 ("Flexible")
      // ['30', 0.05],             // 4  / 100 ("Flexible")
    ]
  },
  //Private: grid column amount
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
      // ['15', .11],                // 22  / 200 ("Magical")
      // ['20', .11],                // 22  / 200 ("Magical")
    ]
  },
  // #endregion



  // MARK: Shader Dependencies
  // #region Shader Dependencies
  //Private: uniformCuts : Publicly revealed as cutStyleCount (1,2,3,4)
  uniformCuts: {
    name: 'Uniform Cuts',
    options: [
      ['True', 2 / 3],            // 200 / 300 (Total)  
      ['False', 1 / 3],           // 100 / 300 (Total)  
    ]
  },
  //Private: uniformCuts : Publicly revealed as cutStyleCount (1,2,3,4)
  uniformCutsStyle: {
    name: 'Uniform Cuts Style',
    options: [
      ['rOut', 1 / 2],            // 100 / 200 (Uniform)
      ['jIn', 1 / 4],             // 50  / 200 (Uniform)
      ['rIn', 1 / 8],             // 25  / 200 (Uniform)
      ['jOut', 1 / 8],            // 25  / 200 (Uniform)
    ]
  },
  //Public: cutDirections
  cutDirections: {
    name: 'Cut Directions',
    options: [
      ['Additive', 0.3],
      ['Subtractive', 0.2],
      ['Additive and Subtractive', 0.5],
    ]
  },
  //Public: uniformLofts
  uniformLofts: {
    name: 'Uniform Loft Depths',
    options: [
      ['True', 0.2],
      ['False', 0.8],
    ]
  },
  // Public: insideCuts : Inside Cuts only apply to "Square Aspect" outputs
  insideCuts: {
    name: 'Inside Cuts',
    options: [
      ['True', 0.4, true],        // 92  / 230 (Square Aspect) 
      ['False', 0.6, false],      // 138 / 230 (Square Aspect) 
    ]
  },
  //Public: insideCutStyle
  insideCutStyle: {
    name: 'Inside Cut Style',
    options: [
      ['None', 0.0],              // 0  / 69 (Inside Cuts)
      ['Cascades', 0.35],         // 24 / 69 (Inside Cuts)
      ['Waves', 0.2],             // 14 / 69 (Inside Cuts)
      // ['Cyma Recta', 0.2],        //  7 / 69 (Inside Cuts)
      // ['Mixed', 0.25],            // 17 / 69 (Inside Cuts)
      // ['Channel', 0.1],         //  7 / 69 (Inside Cuts)
    ]
  },
  //Private: insideCutAmount INSTANCE USE
  insideCutAmount: {
    name: 'Inside Cut Amount',
    options: [
      ['None', 0.0, 0],           // 0  / 69 (Inside Cuts)
      ['Two', 0.0,],              // 0  / 69 (Inside Cuts)
      ['Small', 0.35, 4],         // 24 / 69 (Inside Cuts)
      ['Medium', 0.4, 3],         // 28 / 69 (Inside Cuts)
      ['Large', 0.25, 2],         // 17 / 69 (Inside Cuts)
    ]
  },
  // Public: linearCuts
  linearCuts: {
    name: 'Linear Cuts',
    options: [
      ['None', 0.7, 0],           // 70 / 100
      ['One', 0.2, 1],            // 20 / 100
      ['Some', 0.1, 2],           // 10 / 100
    ]
  },
  // Private: amount of extra groups to create
  extraGroups: {
    name: 'Extra Groups',
    options: [
      ['None', 0.05],             // 15 / 300 (Total)
      ['1', 0.05],                // 30 / 300 (Total)
      ['2', 0.05],                // 90 / 300 (Total)      
      ['3', 0.2],                 // 45 / 300 (Total)
      ['4', 0.2],                 // 45 / 300 (Total)
      ['5', 0.25],                // 45 / 300 (Total)
      ['6', 0.25],                // 45 / 300 (Total)
    ]
  },

  // Public: how densely the grid is filled with shapes
  density: {
    name: 'Grid Density',
    options: [
      ['So Lonely', 0.01],            // 3 / 300 (Total)
      ['Some Availability', 0.04],    // 12 / 300 (Total)
      ['At Capacity', 0.95],          // 285 / 300 (Total)
    ]
  },
  // #endregion
  // MARK: Group Dependencies
  // #region Group Dependencies
  // Public: style of seed
  seed1: {
    name: 'Primary Grid Seed Style',
    options: [
      ['Noise', .075],                 // 23 / 300 (Total)
      ['Random Comb', .075],           // 23 / 300 (Total)
      ['Squares', .1],                 // 30 / 300 (Total)   // Spheres
      ['Rectangles', .1],              // 30 / 300 (Total)   // Pills
      ['Squares and Rectangles', .1],  // 30 / 300 (Total)   // Pills
      ['Simple Pattern', .125],        // 37 / 300 (Total)
      ['Complex Pattern', .225],       // 67 / 300 (Total)
      ['Snake', .2],                   // 60 / 300 (Total)
      // ['Snakes', 0.1],                  // 30 / 300 (Total)
      // ['Triangles', 0.1],
    ]
  },
  // Public: style of seed
  seed2: {
    name: 'Secondary GridSeed Style',
    options: [
      ['Modifier', 0.45],               // 135 / 300 (Total)
      ['Noise', 0.025],                 // 8   / 300 (Total)
      ['Random Comb', 0.025],           // 8   / 300 (Total)
      ['Squares', 0.1],                 // 30  / 300 (Total)   // Spheres
      ['Rectangles', 0.1],              // 30  / 300 (Total)   // Pills
      ['Simple Pattern', 0.1],          // 30  / 300 (Total)
      ['Complex Pattern', 0.1],         // 30  / 300 (Total)
      ['Snake', 0.1],                   // 30  / 300 (Total)
    ]
  },

  // Private: Instance rectOverlap of rect type seed
  rectOverlap: {
    name: 'Rectangular Overlap',
    options: [
      ['Never', 0.6, 0],                      // 60 / 100
      ['Always', 0.1, 1],                     // 10 / 100
      ['Sometimes', 0.3, 2],                  // 30 / 100 
    ],
  },
  // Private: Instance style of modifier
  modifierStyle: {
    name: 'Modifier Style',
    options: [
      ['Noise', 0.1],                     // 10 / 100
      ['Snake', 0.25],                     // 10 / 100 
      ['Outline Single Direction', 0.15], // 15 / 100
      ['Outline Some Directions', 0.1],   // 40 / 100
      ['Outline', 0.1],                   // 20 / 100
      ['Outlines', 0.3],                  // 10 / 100
      // ['Double Concentric', 0.1],        // 10 / 100
    ]
  },




  // MARK: Frame Dependencies
  // #region Frame Dependencies
  // Public: Frame Width
  frameWidth: {
    name: 'Frame Width',
    options: [
      ['Minimum', 0.15, 0],        // 15 / 100 ("Flexible")     10 / 300 (Total)
      ['Small', 0.4, 1],           // 40 / 100 ("Flexible")
      ['Medium', 0.25, 2],         // 25 / 100 ("Flexible")
      ['Large', 0.2, 3],           // 20 / 100 ("Flexible")
    ],
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
      ['Whole', 0.2, 1],            // 120 / 300 (Total)
      ['Thirds', 0.15, 3],          // 30  / 300 (Total)
      ['Quarters', 0.2, 4],         // 60  / 300 (Total)
      ['Fifths', 0.15, 5],          // 30  / 300 (Total)  
      ['Eighths', 0.15, 8],         // 30  / 300 (Total)     
      ['Ninths', 0.15, 9],          // 30  / 300 (Total)   
    ],
    // values: [1, 3, 4, 5, 8, 9],
  },
  // Public: Frame Cascades
  frameCascades: {
    name: 'Frame Cascades',
    options: [
      ['None', 0.75, 0],            // 195 / 300 (Total)
      ['One', 0.2, 1],              // 90  / 300 (Total)
      ['Some', 0.05, 2],            // 15  / 300 (Total)
    ],
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
      // ['i', 0.1],
      ['j', 0.4],
      ['r', 0.5],
      // ['v', 0.3],
    ]
  },
  // Private: (INSTANCE USE) style of subtractive cut
  subtractiveStyle: {
    name: 'Subtractive Style',
    options: [
      // ['i', 0.1],
      ['j', 0.5],
      ['r', 0.4],
      // ['v', 0.175],
    ]
  },
  // Private: (INSTANCE USE) (subtractive) depth of cutouts
  // groupDepth: {
  //   name: 'Depth',
  //   options: [
  //     ['0.25', 0.025],
  //     ['0.5', 0.05],
  //     ['0.666', 0.075],
  //     ['0.75', 0.075],
  //     ['0.875', 0.1],
  //     ['1', 0.6],
  //     // ['2', 0.075],
  //   ]
  // },
  // Private: (INSTANCE USE) (additive) height of addons
  // groupHeight: {
  //   name: 'Height',
  //   options: [
  //     ['0.25', 0.025],
  //     ['0.5', 0.075],
  //     ['0.666', 0.1],
  //     ['0.8', 0.2],
  //     ['1', 0.6],
  //   ]
  // },

  // // Private: (INSTANCE USE) cascade step count options
  // cascadeSteps: {
  //   name: 'Cascade Step Amount',
  //   options: [
  //     ['1', 0.4],
  //     ['2', 0.3],
  //     ['3', 0.2],
  //     ['4', 0.1],
  //   ]
  // },
  // #endregion

}

//TODO: Paste in final EnumFeature class before submission!!!
//TODO: OPTIMIZE by converting options.options from arrays to objects and refine methods accordingly
// ENUM: EnumFeature 
// SIZE: 133 lines
class EnumFeature {
  // FIXME: make options and weightedOptions private after fully tested 
  optionKey
  name
  ogOptions
  modOptions
  weightedOptions
  usageStore
  rarityEligible = false

  chosen

  constructor(optionKey, name, options = [], usageStore) {
    this.optionKey = optionKey
    this.name = name
    this.options = options
    this.usageStore = usageStore
    this.weightedOptions = this.#weighOptions()
  }

  get options() { return this.modOptions ? this.modOptions : this.ogOptions }
  set options(opts) {
    this.ogOptions = opts
    this.modOptions = opts
    this.weightedOptions = this.#weighOptions()
  }
  get length() { return this.options.length }

  // MARK: Public Methods
  // #region Public Methods
  //METH:
  feature(r) {
    const index = this.#getFeatureIndex(r.random_dec())
    this.chosen = this.#getFeature(index)
    if (this.rarityEligible) {
      const modifiedWeightSum = this.#totalWeight()
      const originalWeightSum = this.ogOptions.reduce((sum, opt) => sum + opt[1], 0)
      this.usageStore.push({
        name: this.optionKey,
        chosen: this.chosen,
        originalOptionCount: this.ogOptions.length,
        modifiedOptionCount: this.options.length,
        originalWeightSum,
        modifiedWeightSum,
        selectedWeight: this.options[index][1],
        contributesToRarity: true,
      })
    }
    return this.chosen
  }
  //METH: addOptions()
  // addOptions(options) {                                                                 //UNUSED:
  //   // DeBug.log('addOptions called')                                                 //LOGGING:
  //   // DeBug.log('options', options)                                                  //LOGGING:
  //   // options = OpArray.format(options)
  //   // DeBug.log('options', options)                                                  //LOGGING:
  //   // const oldOpts = OpArray.format(this.options)
  //   const newOpts = [...options, ...this.options]
  //   // DeBug.log('newOpts', newOpts)                                                  //LOGGING:
  //   if (newOpts) this.replaceOptions(newOpts)
  // }
  //METH: removeOptions()
  removeOptions(options) {
    if (this.options.length < 2) return
    // DeBug.warn(`removeOptions`, this.name)                                         //LOGGING:
    // DeBug.log(`options before`, this.options)                                      //LOGGING:
    // DeBug.log(`options to remove`, options)                                        //LOGGING:
    const reduced = this.options.filter(opt => !options.includes(opt[0]))
    // DeBug.log(`reduced`, reduced)                                                  //LOGGING:
    if (reduced) this.replaceOptions(reduced)
    // DeBug.log(`options after`, this.options)                                       //LOGGING:
  }
  //METH: removeLast()
  removeLastOption(amount = 1) {
    // DeBug.log('removeLastOption', amount, this)                                    //LOGGING:
    const last = this.options.slice(-amount).map(opt => opt[0])
    // DeBug.log('last', last)                                                        //LOGGING:
    this.removeOptions(last)
  }
  // //METH: reduceOptions()
  // reduceOptions(toOptions) {
  //   const reduced = this.options.filter(opt => toOptions.includes(opt[0]))
  //   if (reduced) this.replaceOptions(reduced)
  // }
  //METH: replaceOptions()
  replaceOptions(withOptions, all = true) {
    // DeBug.warn(`replaceOptions`)                                                   //LOGGING:
    // DeBug.log(this)                                                                //LOGGING:
    // DeBug.log(`original options`, this.options)                                    //LOGGING:
    // DeBug.log(`withOptions`, withOptions)                                          //LOGGING:

    if (all) {
      this.options = withOptions
      this.modOptions = withOptions
    } else {
      withOptions.forEach(newOpt => {
        const oldOpt = this.options.find(opt => opt[0] === newOpt[0])
        if (oldOpt) oldOpt[1] = newOpt[1]
      })
      withOptions.forEach(newOpt => {
        const oldOpt = this.modOptions.find(opt => opt[0] === newOpt[0])
        if (oldOpt) oldOpt[1] = newOpt[1]
      })
    }
    this.weightedOptions = this.#weighOptions()
  }

  indexOf(option) { return this.options.findIndex(opt => opt[0] === option) }

  get index() { return this.indexOf(this.chosen) }
  get value() { return this.options[this.index][2] }
  // #endregion
  // MARK: Private Methods
  // #region Private Methods
  //METH: getFeature(index)
  #getFeature(index) {
    const result = this.options[index][0]
    if (result) return result
  }
  //METH: getFeatureIndex(weight)
  #getFeatureIndex(weight) { return this.weightedOptions.findIndex(e => between(weight, e[1])) }
  //METH: sum of option weights
  #totalWeight() {
    let weight = this.options
      .map(option => option[1])
      .reduce((a, b) => a + b, 0)
    if (roundToDec(weight) !== 1) DeBug.error(`weight != 1`, this.name, weight)                         //LOGGING:
    return weight
  }
  //METH: weighOptions()
  #weighOptions() {
    let
      p = [],
      currentWeight = 0
    const weightRange = [0, this.#totalWeight()]

    this.options.forEach(e => {
      let
        ogRange = [currentWeight, currentWeight + e[1]],
        normRange = normalizeSubRange(ogRange, weightRange)
      currentWeight += e[1]
      p.push([e[0], normRange])
    })
    return p
  }
}

//MARK: Helpers

// MARK: LilVert CLASS: little Vertex class
//SIZE: 35 lines
function lilVert(x, y) {
  if (arguments.length === 1) y = x
  return new LilVert(x, y)
}
class LilVert {

  constructor(x, y) {
    this.x = x
    this.y = y
  }

  //MARK: Static Methods
  static add(a, b) { return lilVert(a.x + b.x, a.y + b.y) }
  static sub(a, b) { return lilVert(a.x - b.x, a.y - b.y) }
  static mult(a, b) {
    DeBug.log('mult', a, b)                                                   //LOGGING:
    b = LilVert.coerce(b)
    return lilVert(a.x * b.x, a.y * b.y)
  }
  static div(a, b) {
    b = LilVert.coerce(b)
    return lilVert(a.x / b.x, a.y / b.y)
  }
  static coerce(vert) {
    if (vert instanceof LilVert) return vert
    if (typeof vert === 'number' && !isNaN(vert)) return lilVert(vert, vert)
    if (Array.isArray(vert)) return lilVert(vert[0], vert[1])
  }

  //MARK: Instance Methods
  add(vert) { return LilVert.add(this, vert) }
  sub(vert) { return LilVert.sub(this, vert) }
  mult(vert) { return LilVert.mult(this, vert) }
  div(vert) { return LilVert.div(this, vert) }
}

//MARK: range funcs
function between(x, range = [0, 1]) { return x >= range[0] && x <= range[1] }
function convertRange(value, r1, r2) { return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0] }
function normalize(value, range) { return convertRange(value, range, [0, 1]) }
function normalizeSubRange(subrange, range) { return [normalize(subrange[0], range), normalize(subrange[1], range)] }