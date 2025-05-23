//ENUM: Profile : Cut Profile Descriptor
// SIZE: 92 lines
class Profile {
  breed
  type
  cutIn
  halfCurve
  frameEdge

  constructor(type, cutIn = true, frameEdge = false, halfCurve = false) {
    this.type = type
    this.cutIn = cutIn
    this.frameEdge = frameEdge
    this.halfCurve = halfCurve
    this.breed = this.description
  }

  //MARK: Static 
  static breed(breed) {
    const
      type = breed[0],
      cutIn = breed.slice(1) === 'In'
    return new Profile(type, cutIn)
  }

  static iIn = new Profile(`i`)
  static iOut = new Profile(`i`, false)
  static jIn = new Profile(`j`)
  static jOut = new Profile(`j`, false)
  static rIn = new Profile(`r`)
  static rOut = new Profile(`r`, false)
  static fIn = new Profile(`s`)
  static fOut = new Profile(`s`, false)
  static vIn = new Profile(`v`)
  static vOut = new Profile(`v`, false)

  static AllTypes = [`i`, `j`, `r`]     // Add `s`  and `v` when implemented
  static CurveTypes = [`j`, `r`]        // Add `s` when implemented
  static FlatTypes = [`i`]              // Add `v` when implemented

  static CurveOptions = [Profile.jIn, Profile.jOut, Profile.rIn, Profile.rOut]


  //MARK: Computed
  get isI() { return this.type === `i` }                    // is `i` type
  get isJ() { return this.type === `j` }                    // is `j` type
  get isR() { return this.type === `r` }                    // is `r` type
  get isS() { return this.type === `s` }                    // is `s` type
  get isV() { return this.type === `v` }                    // is `v` type

  get isIIn() { return this.isI && this.isCutIn }
  get isIOut() { return this.isI && this.isCutOut }
  get isJIn() { return this.isJ && this.isCutIn }
  get isJOut() { return this.isJ && this.isCutOut }
  get isRIn() { return this.isR && this.isCutIn }
  get isROut() { return this.isR && this.isCutOut }

  get isCutIn() { return this.cutIn }
  get isCutOut() { return !this.cutIn }

  get hasInsetShade() { return this.isIIn || this.isJIn || this.isROut }
  get hasOutsetShade() { return this.isIOut || this.isJOut || this.isRIn }
  get hasCastShadow() { return this.isIOut || this.isROut }

  get isCurve() { return this.CurveTypes.includes(this.type) } // is in CurveTypes
  get isFlat() { return this.FlatTypes.includes(this.type) }   // is in FlatTypes
  get isSingleDepth() {                                        // only requires single filter / offsets in single direction
    return this.isI || this.isJ || this.frameEdge || this.halfCurve
  }
  get isInset() { return this.isRType ? !this.cutIn : this.cutIn }       // filter insets from shape border (use cutRange.start)

  get wave() { return new Profile(this.type === `r` ? `j` : `r`, !this.cutIn) }
  get channel() { return new Profile(this.type, !this.cutIn) }
  get cyma() { return new Profile(this.type === `r` ? `j` : `r`, this.cutIn) }

  get insetDepth() {
    if (this.isR) return this.cutIn ? 0.35 : 0.45
    else return 1
  }
  get outsetDepth() {
    if (isSingleDepth) return 0
    else return 1
  }
  get description() {
    const inOut = this.cutIn ? `In` : `Out`
    return this.type + inOut
  }
  //METH: equals()
  equals(profile) {
    return this.type === profile.type
      && this.cutIn === profile.cutIn
      && this.halfCurve === profile.halfCurve
      && this.frameEdge === profile.frameEdge
  }
}

//MARK: PROTOCUT CLASS
// SIZE: 157 lines
class ProtoCut {
  id
  breed
  profile           // Profile: cut profile: [i,j,r,f,v] combined with [in, out]
  depth             // (end) depth
  start
  extHighDepth      // limiter on external highlight depth
  useExtHighDepth
  angleOffset = 0   // offset angle from global vector
  shapeGroups = new OpArray
  filters = new OpArray

  constructor({
    profile,
    depth,
    start,
    extHighDepth,
    useExtHighDepth = true,
    angleOffset = 0,
  }) {
    this.profile = profile
    this.depth = depth
    this.start = start
    this.extHighDepth = extHighDepth
    this.useExtHighDepth = useExtHighDepth
    this.angleOffset = angleOffset
    this.breed = this.description
    const match = S.Cuts.find(item => item.breed === this.breed)  // use equivalent cut if already exists
    if (match) {
      DeBug.warn(`USING EXISTING CUT!!`, match)
      return match
    }
    this.storeObject(S.Cuts, true)
    this.#createFilters()
  }

  //MARK: Computed
  get spread() { return this.profile.isSingleDepth ? this.depth : this.depth + this.depth2 }
  get padding() { return vert(this.depth * 2) }
  get description() {
    const
      p = this.profile,
      prime = p.breed,
      half = p.halfCurve ? `-half` : ``,
      edge = p.frameEdge ? `-frameEdge` : ``,
      dep = roundToDec(this.depth / GRID.cellRadius, 4),
      start = roundToDec(this.start, 4)
    return `${prime}${half}${edge}-${dep}xCellRadius`
    // return `${prime}${half}${edge}-${dep}xCellRadius-${start}start`
  }
  get maxLayout() {
    let [xMax, yMax, widthMax, heightMax] = [0, 0, 0, 0]
    this.shapeGroups.forEach(grp => {
      const
        [size, padding] = [grp.insetSize, grp.padding],
        //  finalSize = grp.finalSize,
        padSize = Vertex.div(padding, size),
        anchor = Vertex.mult(padSize, -100),
        newSize = Vertex.mult(padSize, 200).add(vert(100))

      xMax = min(anchor.x, xMax)
      yMax = min(anchor.y, yMax)
      widthMax = max(newSize.x, widthMax)
      heightMax = max(newSize.y, heightMax)
    })
    return { x: xMax, y: yMax, width: widthMax, height: heightMax }
  }

  //MARK: Public Methods
  //METH: setLayout() : null : 
  setLayouts() {
    const layout = this.maxLayout
    this.filters.forEach(f => {
      f.filter
        .attribute("x", `${layout.x}%`)
        .attribute("y", `${layout.y}%`)
        .attribute("width", `${layout.width}%`)
        .attribute("height", `${layout.height}%`)
    })
  }
  //METH: curve() : type :
  curve(layer) {
    if (this.profile.isR) return layer === 0 ? `r` : `r2`
    if (this.profile.isS) return layer === 0 ? `j` : `r`
    return this.profile.type
  }

  //MARK: Private Methods

  //METH: createFilters() : null : create filters for each cut type
  #createFilters() {
    // if (abs(this.depth) < 0.25 / FRAME.pixToUserUnits) { return }     // don't create filters for 1/4 pixel depth or less
    const inset = this.profile.hasInsetShade
    if (this.profile.isSingleDepth) {
      if (this.profile.isI) {
        if (inset) {
          this.#createShader(`high`)
        } else {
          this.#createShader(`high`)
        }

        this.#createShader(`shad`)
      } else {
        this.#createShader(`combo`)
      }
    }

    if (this.profile.isR) {
      if (inset) {
        this.#createShader(`combo`, `r`, this.depth)
        if (this.useExtHighDepth) {
          this.#createShader(`high`, `r2`, this.extHighDepth)
        } else {
          this.#createShader(`high`, `r2`, -this.depth)
        }
        this.#createShader(`shad`, `r2`, -this.depth)
      } else {
        this.#createShader(`combo`, `r`, this.depth)
        this.#createShader(`high`, `r2`, this.extHighDepth)
        this.#createShader(`shad`, `r2`, -this.depth)
        // this.#createShader(`combo`, `r2`, -this.depth)
      }
    }

    if (this.profile.isS) DeBug.error(`ProtoCut "s" profile not yet implemented`)
    if (this.profile.isV) DeBug.error(`ProtoCut "v" profile not yet implemented`)
  }
  //METH: createShader() : null : create shader for each cut type
  #createShader(shadeType, curve = this.profile.type, mag = this.depth) {
    const
      cutIn = this.profile.cutIn ? 1 : -1,
      r = curve === `r` ? -1 : 1,
      r2 = curve === `r2` ? 1 : -1,
      angle = curve === `r` ? this.angleOffset + 180 : this.angleOffset
    mag = mag * cutIn * r * r2
    DeBug.warn({ curve: curve, cut: this.profile.cutIn ? `in` : `out`, shadeType, mag: mag / FRAME.pixToUserUnits, rotOffset: angle })
    const stack = Shade.neuShadeSVGFactory({
      shadeType: shadeType,
      curve: curve,
      cutIn: this.profile.cutIn,
      mag: mag,
      rotOffset: angle
    })
    DeBug.error(`stack`, stack)

    const filter = createFilter().shade(stack, shadeType)
    this.filters.push(filter)
  }
  //METH: equals() : boolean : compare two cuts
  equals(cut) { return this.breed === cut.breed }

  //TODO: implement createPerimeter()
  //METH: createChannelShader() : null : create channel shader for cut
  #createChannelShader() {
    // to be implemented utilizing an SVG stroke mask, similar to 'v' cut eventual implementation
  }
}
Object.assign(ProtoCut.prototype, IdentifiableStored)


// CLASS: Shade
// SIZE: 379 lines
class Shade {
  //METH: shadVect( ): null : create vector from Angle + Offset
  static shadVect(angle = globalControls.shadAngle) { return createVector(1, 0).rotate(radians(angle)) }

  //METH: dropShadeSVG() : dropShade Object : create drop shade object for SVG
  static dropShadeSVG({ lighten = true, invert = false, vector, mag, blurRad = 0, col = frameColor, inset = false } = {}) {
    return { lighten: lighten, invert: invert, vector: vector, mag: mag, blur: blurRad, color: col, inset: inset }
  }
  //METH: neuShadeSVG() : [dropShade] : create dropShade objects for SVG
  static neuShadeSVG(shadeType, vector = this.shadVect(), mag, highBlurRad, shadBlurRad, highCol, shadCol, inset = false, blur = true, curve = 'j', highOffsetRatio = 1, blurRatio = 1) {
    //NOTE: FAKE IRIDESCENT
    //NOTE: ----------------------------------
    // const randomLCH = (l) => {
    //   const
    //     chroma = 1 / 8,
    //     hue = R.random_num(0, 360)
    //   return `oklch(${l} ${chroma} ${hue})`
    // }
    // highCol = randomLCH(.98)
    // shadCol = randomLCH(0.7)
    //NOTE: ----------------------------------

    // highCol = achromic(1)
    // shadCol = achromic(0.7)

    const
      invert = curve === `r`,
      iCutHighMagMult = curve === `i` ? .75 : 1,
      r2CutHighMagMult = curve === `r2` ? .5 : 1,
      jCutMagMult = curve === `j` ? .75 : 1,
      highMag = iCutHighMagMult * r2CutHighMagMult * jCutMagMult * highOffsetRatio * mag

    let highlight, shadow
    if (shadeType !== `shad`) {
      highlight = this.dropShadeSVG({
        invert: invert,
        vector: vector,
        mag: highMag,
        blurRad: (blur ? 1 : 0) * (curve === `i` ? 4 : 1) * (curve === `r2` ? 2 : 1) * jCutMagMult * highBlurRad * blurRatio,
        col: highCol,
        inset: inset
      })
    }

    if (shadeType !== `high`) {
      const r2CutMagMult = curve === `r2` ? .5 : 1
      // const shadowCol = shadeType === `shad` ? achromic(0.9) : shadCol
      const shadowCol = shadeType === `shad` ? achromic(0.5) : shadCol
      shadow = this.dropShadeSVG({
        lighten: false,
        invert: invert,
        vector: vector,
        mag: jCutMagMult * r2CutMagMult * mag,
        blurRad: (blur ? 1 : 0) * jCutMagMult * r2CutMagMult * shadBlurRad * blurRatio,
        col: shadowCol,
        inset: inset
      })
    }
    return OpArray.format([shadow, highlight]).compacted
  }
  //METH: neuShadeSVGFactory() : [dropShade] : create dropShade objects for SVG
  static neuShadeSVGFactory({
    curve = 'j',                            // type of cut/curve : [i, j, r, r2, f, v]
    cutIn,
    shadeType,
    mag,                                    // magnitude of shade offset, corresponds to depth/loft of shade effect
    vector = Shade.shadVect(),               // direction of light
    rotOffset = 0,                          // deg rotation offset, used for dif shade types and CHAOS
    pixToUserUnits = FRAME.pixToUserUnits,  // CONSTANT used to convert mag (given in userUnits) to pixel units
    baseCol = frameColor,                   // highlights and shadows spread out from baseColor, always frameColor
    colSpread = 25,                         // distance(8-bit) to spread shades from baseColor, always 26 (256-30 = 26)
    start = 0,                              // determine start of layers kept, always 0
    blur = true,                            // apply blur to shades, always true
    type = 'multiShade',                    // always use 'multishade' : ['multiShade', 'multiAlpha', 'flat']
    count = 3,                              // used to calculate 'multiAlpha' type layer density/alpha, always 3
    sort = false,                           // end sorts all highlights over shadows (or opposite), always false
  } = {}) {
    vector = Vertex.cleanRotate(vector, 0)
    if (!mag) { mag = vector.mag() }
    const inset = mag > 0 ? false : true    // inset in this case means the effect is masked to inside the shape
    mag = 2 * abs(mag) //mag remains pos+ as light direction holds to vector, only change is where shade falls (inside/outside)
    DeBug.log(``)
    DeBug.groupCollapsed(`neuShadeSVGFactory`, vector)
    DeBug.log(`mag`, mag)

    //MARK: "J" and "R" Cuts

    //ARROW: keep() : [number] : Optimization to reduce neuShades stack size based upon mag using Shadow Layer Decay chart
    const keep = () => {
      const root = sqrt(mag)
      if (root >= 88) return 14               // mag >= 7744
      if (root >= 62) return 13               // mag >= 3844
      if (root >= 44) return 12               // mag >= 1936
      if (root >= 31) return 11               // mag >= 961
      if (root >= 22) return 10               // mag >= 484
      if (root >= 16) return 9 + 1            // mag >= 256
      if (root >= 11) return 8 + 1            // mag >= 121
      if (root >= 8) return 7 + 1             // mag >= 64
      if (root >= 6) return 6 + 1             // mag >= 36
      if (root >= 3) return floor(root) + 1   // mag >= 9
      return 3
    }

    //ARROW: rounding(): [number] : preserve precision of lower offsets, reduce duplicates for larger offsets
    const rounding = (e) => {
      if (e < 4) return roundToDec(e)  // roundToDec values below 4, to preserve precision for small shade depths
      else return floor(e)       // floor values at 4 and above to reduce duplicate shades for larger depths
    }

    //ARROW: createOffsets() : [OpArray] : create offsets for shade layers
    const createOffsets = () => {
      let current = mag,
        array = OpArray.from([mag * .75])
      array = OpArray.from([current, mag * .75])
      while (current > 1) {
        current = max(.5, floor(current / 2))
        array.push(current)
      }
      // array = array.numSorted.reversed
      DeBug.warn(`full array`, array)
      let mod = floor(array.length / 2)
      // if (array.length > 4) array = OpArray.from([...array.slice(0, mod), mod, 1]) // reduce layers to 4, keeping first and last 3 layers

      if (array.length > 4) {
        array = OpArray.from([...array.slice(0, mod), mod]) // reduce layers to 4, keeping first and last 3 layers
        if (curve === 'j') array.push(1)
      }

      DeBug.warn(`reduced array`, array)
      return array
    }
    let offsets
    offsets = OpArray.from([    // offsets for shade layers
      1,            // these fixed magnitudes insure edge remains crisp and poppy at higher resolutions
      mag,          // these first 3
      mag / 2,      // these first 3
      2,            // these fixed magnitudes insure edge remains crisp and poppy at higher resolutions
      mag * 3 / 4,  //  
      4,            // these fixed magnitudes insure edge remains crisp and poppy at higher resolutions
      mag / 4,      //
      mag / 8,      //
      mag / 16,     //
      mag / 32,     //
      mag / 64,     //
      mag / 128,    //
      mag / 256,    //
      mag / 512,    //
    ])
      .slice(start, keep())       // reduce layers based upon start and keep()
    // offsets = createOffsets()

    DeBug.error('offsets', offsets)
    offsets = offsets
      .map(e => rounding(e))      // round offsets
      .filter(e => e > 0)         // remove negatives (shouldn't be necessary!)
      .numSorted                  // sort small-large
      .unique()                   // remove duplicates

    DeBug.error('offsets filter-sort', offsets)
    let neuShades
    //NOTE: "multiShade" is the only/final choice for j-cuts 
    if (type === 'multiShade') {
      const offsetRange = range(offsets[0], offsets.last)   // range from offsets

      //ARROW: easeInCircNormalized : number : normalizes and shifts value using circular easing
      const easeInCircNormalized = (x, exp = 2) => 1 - sqrt(1 - pow(offsetRange.normalize(x), exp))
      const easeOutCircNormalized = (x, exp = 2) => sqrt(1 - pow(offsetRange.normalize(x), exp))
      const easeInExpoNormalized = (x, exp = 2) => x === 0 ? 0 : pow(2, 10 * offsetRange.normalize(x) - 10)
      const easeInOutCircNormalized = (x, exp = 2) => {
        x = offsetRange.normalize(x)
        return x < 0.5 ? (1 - sqrt(1 - pow(2 * x, exp))) / 2
          : (sqrt(1 - pow(-2 * x + 2, exp)) + 1) / 2
      }

      // frameColor = achromic(0.9)
      const shadColSpread = 0.25

      //MARK: "I" Cut
      if (curve === 'i' || curve === 'r2') {
        const
          highColSpread = 0.04,                             // spread up from base (0.9) to max highlight luma (1!)
          //  shadColSpread = curve === 'r2' ? 0.25 : .25,  // spread down from base (0.9) to min shadow luma (0.7)
          maxHighlight = 0.9 + highColSpread,               // 0.9 + 0.04 = 0.94
          minShadow = (0.9 - shadColSpread),                // 0.9 - 0.25 = 0.65
          perceptualDivisor = curve === 'i' ? 4 : 16,       // compensates for blur, etc to get visually correct result
          highOffsetRatio = curve === 'i' ? 1 : 1 / 16

        // blur = true
        neuShades = offsets
          .map((offset, i) => {
            mag = offset / pixToUserUnits * 1               // convert pixelUnit to userUnit magnitude
            mag = curve === 'i' ? mag * 1 : mag * 1.2
            const
              iBlurRadius = (mag - 1 * offsets[0] / pixToUserUnits) * 1 / 6,  //
              r2BlurRadius = (mag - 1 * offsets[0] / pixToUserUnits) * 1 / 6,  //
              blurRadius = curve === 'i' ? iBlurRadius : r2BlurRadius,
              highColLuma = maxHighlight - (highColSpread * easeInCircNormalized(offset, 2) / perceptualDivisor),
              shadColLuma1 = minShadow + (shadColSpread * easeInOutCircNormalized(offset, 3) / perceptualDivisor),
              shadColLuma2 = minShadow + (4 * shadColSpread * easeOutCircNormalized(offset, 2) / perceptualDivisor),

              highCol = achromic(highColLuma),
              shadCol1 = achromic(shadColLuma1)

            let shades = new OpArray
            DeBug.log(`mag`, mag)
            DeBug.log(`vector`, vector)
            DeBug.log(`rotOffset`, rotOffset)
            const shadeVector = Vertex.cleanRotate(vector, radians(rotOffset)).setMag(mag)

            // DeBug.log(`angleMode`, _angleMode)
            // DeBug.log(`shadeVector`, shadeVector)
            // DeBug.log(`shadeVector.x ${shadeVector.x}, shadeVector.y ${shadeVector.y}`)
            // DeBug.log(`rotOffset`, rotOffset)

            const shades1 = this.neuShadeSVG(shadeType, shadeVector, mag, blurRadius, blurRadius, highCol, shadCol1, inset, blur, curve, highOffsetRatio)
            shades.push(shades1)

            DeBug.log(`${curve} shades`, shades)
            return shades.flat()
          }).flat()
      }

      if (curve === 'j' || curve === 'r') {
        let reflLightRange
        // rotOffset = rotOffset + PI
        const rangeSize = mag                             // shadow range
        reflLightRange = rangeSize / 2.2                  // visual observation shows relfLight to be about 1/5 the shadow
        // DeBug.log(`reflLightRange`, reflLightRange)
        if (!offsets.includes(reflLightRange)) {          // if necessary, add extra shade layer at reflLightRange
          offsets.push(reflLightRange)
          offsets = offsets.numSorted
        }

        const
          highColSpread = 0.1,                            // spread up from base (0.9) to max highlight luma (1!)
          //  shadColSpread = 0.25,                       // spread down from base (0.9) to min shadow luma (0.7)
          reflHighMult = 0.6,                             // 
          reflShadMult = 1,                               //
          reflHighSpread = reflHighMult * shadColSpread,  // spread down from base (0.9) to min shadow luma (0.65)
          maxHighlight = 1,                                                         // 0.9 + 0.1 = 1!
          reflHighlight = (1 - highColSpread - reflHighSpread),                     // 0.9 -0.1 - 0.2  = .7
          //  reflHighlight = (1 - highColSpread - reflHighSpread) - shadowReducer,  // 0.9 -0.1 - 0.2  = .7
          perceptualDivisor = 16                          // compensates for blur, etc to get visually correct result

        let shadowReducer = curve === 'r' ? min(0.2, (20 / (mag * mag * pixToUserUnits))) : 0
        // shadowReducer = curve === 'r' ? (1 / (mag * pixToUserUnits) * 5) : 0
        // shadowReducer = 0
        const minShadow = (1 - highColSpread - shadColSpread) + shadowReducer       // 0.9 -0.1 - 0.25 = .65

        DeBug.log(``)
        DeBug.warn(`offsets`, offsets)
        neuShades = offsets
          .map(offset => {
            let mag = offset / pixToUserUnits             // convert pixelUnit to userUnit magnitude
            mag = curve === 'j' ? mag * 1 : mag * .65
            let
              isSCurve = false,
              highBlurRad = mag * 1,
              shadBlurRad = mag * 1,
              blurRadius = mag
            blurRadius = isSCurve ? mag - offsets[0] / pixToUserUnits * .5
              : mag - offsets[0] / pixToUserUnits * 1 // subtract 1pix so thin layers full value at ~0 blur
            highBlurRad = blurRadius

            let highColLuma, shadColLuma

            // "r" curve
            if (curve === 'r') {
              highColLuma =
                !isSCurve ?
                  maxHighlight - (highColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                  : 1 * maxHighlight - (highColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              if (offset <= reflLightRange * 1.) {               // add relfective highlight to shadow
                shadColLuma =
                  !isSCurve ?
                    reflHighlight + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                    : .915 * reflHighlight + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              } else {
                shadColLuma =
                  !isSCurve ?
                    minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                    : 1.2 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              }
              // "j" curve
            } else if (curve === 'j') {
              // blur = false
              highColLuma = maxHighlight - (highColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
              if (offset <= reflLightRange * .625) {
                shadColLuma =
                  !isSCurve ?
                    minShadow + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
                    : .865 * reflHighlight + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
              } else {
                shadColLuma =
                  // !isSCurve ?
                  1 * minShadow + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
                // 1.4 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                // : 1.4 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
              }
            }

            const
              highCol = achromic(highColLuma),
              shadCol = achromic(shadColLuma),
              shadeVector = Vertex.cleanRotate(vector, rotOffset).setMag(mag)

            // DeBug.log(`vector`, vector)
            // DeBug.log(`vectorX: ${vector.x}, vectorY: ${vector.y}, vectorZ: ${vector.z}`)
            // DeBug.log(`calculation`, Vertex.rotate(vector, radians(rotOffset)))
            // DeBug.log(`calculation`, Vertex.rotate(vector, PI))
            DeBug.log(`mag`, mag)
            DeBug.log(`vector`, vector)
            DeBug.log(`rotOffset`, rotOffset)
            DeBug.log(`shadeVector`, shadeVector)
            // DeBug.log(`shadeVector.x ${shadeVector.x}, shadeVector.y ${shadeVector.y}`)

            let shades = this.neuShadeSVG(shadeType, shadeVector, mag, highBlurRad, shadBlurRad, highCol, shadCol, inset, blur, curve)
            DeBug.log(`${curve} ${shadeType} shades`, shades)
            return shades
          })
          .flat()
      }
      //NOTE: These other options unused except for FAIL/Error outputs
    } else {
      // let color1, color2
      // //NOTE: AVOID - 'multiAlpha' causes extreme banding artifacts in my implementation
      // if (type === 'multiAlpha') {
      //   color1 = protoColor(255, 256 / count)
      //   color2 = protoColor(0, 256 / count)
      // }
      // //NOTE: AVOID - 'flat' isn't quite convincing and loses the crisp outlines of 'multishade'
      // if (type === 'flat') {
      //   const cols = baseCol.highShadComplementSpread(colSpread)
      //   color1 = cols[0]
      //   color2 = cols[1]
      // }

      // neuShades = offsets
      //   .map(o => {
      //     const mag = o / pixToUserUnits
      //     const blurRadius = mag / sqrt(2)
      //     const shades = this.neuShadeSVG(
      // shadeType,
      //       vector.setMag(mag).rotate(radians(rotOffset)),

      //       blurRadius, 
      //       blurRadius,
      //       color1,
      //       color2,
      //       inset,
      //       blur,
      //       curve
      //     )
      //     return shades
      //   })
      //   .flat()
    }

    if (sort) {
      const
        lighten = neuShades.filter(shad => shad.lighten),
        darken = neuShades.filter(shad => !shad.lighten)
      neuShades = OpArray.from([...lighten, ...darken])
      // neuShades = OpArray.from([...darken, ...lighten])
    }
    DeBug.error(`neuShades`, neuShades)
    // DeBug.error(`vect`, neuShades.map(ns => [ns.dx, ns.dy]))
    // DeBug.error(`colorSpread`, neuShades.map(ns => ns.colorSpread))
    // DeBug.error(`${curve} colors`, neuShades.map(ns => ns.color.levels[0]))
    DeBug.groupEnd()
    return neuShades
  }
}

// CLASS: ProtoColor
// SIZE: 87 lines
function protoColor() {
  if (arguments[0] instanceof p5.Color || arguments[0] instanceof ProtoColor)
    return arguments[0] // Do nothing if argument is already a color object.

  const args = arguments[0] instanceof Array ? arguments[0] : arguments
  return new ProtoColor(this, args)
}
function achromic(l) { return ProtoColor.achromic(l) }
class ProtoColor extends p5.Color {

  constructor(pInt, args) {
    super(pInt, args)
  }

  get color() { return color(this.red, this.green, this.blue, this.alpha) }

  get red() { return this._getRed() }
  get green() { return this._getGreen() }
  get blue() { return this._getBlue() }
  get alpha() { return this._getAlpha() }

  get hue() { return this._getHue() }
  get saturation() { return this._getSaturation() }
  get brightness() { return this._getBrightness() }
  get lightness() { return this._getLightness() }
  get hsb() {
    return {
      h: this.hue,
      s: this.saturation,
      b: this.brightness,
    }
  }

  get complement() {
    return protoColor(`hsba(${this.complementHue}, ${this.saturation}%, ${this.brightness}%, ${this.alpha})`)
  }
  get complementHue() { return (this.hue + 180 % 360) }

  //METH: setAlpha() : ProtoColor : set alpha value
  setAlpha(alpha) { return protoColor(`hsba(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${alpha})`) }
  //METH: setSaturation() : ProtoColor : set saturation value
  setSaturation(sat) { return protoColor(`hsba(${this.hue}, ${sat}%, ${this.brightness}%, ${this.alpha})`) }
  //METH: highShadComplementSpread() : [ProtoColor] : create highlight and shadow colors with complementary hues
  highShadComplementSpread(spread = 16) {
    spread = spread / 2.56
    const
      h = this.hue,
      s = this.saturation,
      b = this.brightness,
      // DeBug.log('brightness', b)
      high = [h, s, constrain(b + spread, 0, 100)],
      shad = [this.complementHue, s, constrain(b - 2.5 * spread, 0, 100)]
    // DeBug.log('cols:', high, shad)
    let cols = [high, shad]
      .map(hsb => `hsb(${hsb[0]}, ${hsb[1]}%, ${hsb[2]}%)`)
      .map(dscrpt => color(dscrpt))
    return cols
  }
  //METH: highShadSpread() : [ProtoColor] : create achromic highlight and shadow colors 
  highShadSpread(spread = 16) {
    let
      b = this.brightness,
      bPair = [round(b + spread), round(b - 1.3 * spread)],
      // DeBug.log('bPair', bPair)
      cols = bPair
        .map(b => `hsb(${this.hue}, ${this.saturation}%, ${b}%)`)
        .map(dscrpt => protoColor(dscrpt))
    return cols
  }
  //METH: randomHighHue() : ProtoColor : create highlight color with random hue
  static randomHighHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 100%)`)
  }
  //METH: randomShadHue() : ProtoColor : create shadow color with random hue
  static randomShadHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 50%)`)
  }
  //METH: okLCH() : ProtoColor : create okLCH color
  static okLCH(l, c, h) {
    const rgbColor = oklch2rgb([l, c, h])
    // DeBug.log(`okLCH 2 RGB:`, rgbColor)
    return protoColor(rgbColor)
  }
  //METH: achromic() : ProtoColor : create achromic color
  static achromic(l) { return protoColor(l * 255) }
}