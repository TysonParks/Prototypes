let
  gui,

  testingControls = {
    hashNumber: 1487,
    lastHash: true,
    blackMode: false,
  },

  globalControls = {
    shadAngle: 90,
    animated: false,
  }

//FUNC: createGUI() : void : creates the GUI using dat.GUI
function createGUI() {
  gui = new dat.GUI()
  gui.close()

  let testingGUI = gui.addFolder('Testing')
  testingGUI.open()
  testingGUI.add(testingControls, 'hashNumber', 0, 2, 1).onChange(redrawAll).listen()
  testingGUI.add(testingControls, 'lastHash').onChange(redrawAll)
  testingGUI.add(testingControls, 'blackMode').onChange(redrawAll)

  let globalGUI = gui.addFolder('Global Controls')
  globalGUI.open()
  globalGUI.add(globalControls, 'shadAngle', 0, 360, 5).onChange(drawObjects).listen()
  globalGUI.add(globalControls, 'animated').onChange(drawObjects)
}

// MARK: Keyboard UI
//NOTE: Create with GPT-4 on April 15,2023
//FUNC: keyPressed() p5js overload for PNG saving
function keyPressed() {
  console.log(`[keyPressed] key='${key}' keyCode=${keyCode}`)
  if (key === 's') {
    console.log('s pressed')
    const scale = 1
    // const rez = vert(500, 900)
    // const rez = vert(569, 1024)
    // const rez = vert(1000, 1800)
    // const rez = vert(1138, 2048)
    // const rez = vert(2000, 3600)
    const rez = vert(3000, 5400)
    // const rez = vert(2276, 4096)
    // const rez = vert(4000, 7200) // MY DEFAULT
    // const rez = vert(4551, 8192)
    // const rez = vert(8000, 14400)
    // const rez = vert(9102, 16384) 
    // const rez = vert(10000, 18000) // MAX RESOLUTION
    const scaledRez = rez.mult(scale)
    const rezString = `${scaledRez.x}x${scaledRez.y}`
    const date = getCurrentDateString()
    const time = getCurrentTime()
    const hash = tokenData.hash
    // const trimmedHash = `${hash.slice(0, 4)}\u2026${hash.slice(-4)}`
    const name = `Prototypes-${hash}-${date}-${rezString}.png`

    Export.exportPNG(FRAME.svgMarkup, name, rez.x, rez.y, scale)
  }
  if (key === 'v') {
    // Export video frames — full 360° light rotation
    Export.exportFrames({
      size: vert(533, 960),       // lower rez for speed; swap to vert(4000, 7200) for final
      totalFrames: 900,             // 360 frames = 1° per frame
      scale: 1,
      startAngle: 90,
      useDirectoryPicker: true,     // will prompt for folder in Chrome/Edge; falls back to downloads
    })
  }
  if (key === 'b') {
    // Batch animation export — edit the hashes array below to queue work
    const batchHashes = [
      // '0x3d682a55c571eedddf21e1d278ad2f882798558ecc0de9220fe3213c8be96196',
      // '0x583a68366d00c17746db3da574b0660d0c8e86393ae7516f24134e6610a19dad',
      // '0x842b0ab457eb22032b51eaf8522064e4df39e0b3242c6aa327ae0bae56fb6556',
      // '0x2610fa1d45bf324e92f30706b2b2f4e4793b3cd6a2245ba574a2c0f2118f109d',
      // '0x18cc6c2b1f25cb80170eb71524493689dd5ca126b55da6fe58bd34a8a958da39',
      // '0x40eb66ccff015e7f163b55f5a894791850f9ee8a48455bd94a124e6ea3678e8d',
      // '0x1d81414ac17aa7a54ed00937fe649dce0f6b38c07c1310c09ecbeba314489534',
      // '0x5d6464f56393f303a54aaceb0d039b694df2ee33dfe720e345bf60f4b493053f',
      // '0x174d3047ec0164b6e3cb4619ebe90b09b01d4d126f8f11e01dded62865b898ac',
      // '0x6874d9d4421f93005cf371a46a8cb99bb3b92dc3fef5a9bee3b488833f0009c7',
      // '0x42129fff10e716a7b14f9f5c46016d6f86c8d84a0276bbc60bf3e86f6c605772',
      // '0x39146d6949d098e1b12a899cd6ec1faf7ccec30f071fed5723c552b3c6a954de',
      // '0x9daf92de6d3fe04c7c8ac1321cf0a10be38373bb6b24352bb478733d58d01694',
      // '0xf37745d9160c5dcce4edb2da4fa223c891920725a3dcf5338be85ef2cbcb96eb',
      // '0x66fdd2a41ae8a55948fb51cb38a71f7d2f2942d4db32805945a7a0c31f394461',
      // '0xef5c61830cc6b9c46519acb9fe067b3dbecd9bc2477d6c25f8d570af7b306dfd',
      // '0x160e74d6db644c656f4e15bb993ae34660b677763240faaee23f24590e001562',
      '0x33cf0b21d30a6538731f0521f5594ed7cfb1b7a6e4c76f5b93222f2a3f30548c',
    ]
    if (batchHashes.length === 0) {
      console.warn(`No hashes in batch list — add hashes to gui.js batchHashes array`)
    } else {
      protoBatch.batchAnimationExport({
        hashes: batchHashes,
        size: vert(1600, 2880),
        totalFrames: 1885,
        scale: 1,
        startAngle: 90,
      })
    }
  }
  if (key === 'n') {
    // Generate a new random seed and rebuild
    protoBatch.buildFromNewSeed()
  }
  if (key === 't') {
    // Generate wrapper test contact sheet
    protoBatch.testContactSheet()
  }
  if (key === 'd') {
    // Toggle wrapper debug overlay on current render
    WrapperDebugOverlay.toggle(GRID)
  }
  if (key === 'l') {
    // use for cornerScale animation
  }
  if (key === 'o') {
    // use for shade blurScale animation
  }

  // ---------------------------------------------------------------------------
  // SAFARI B1 EXPERIMENT 1 — Filter / Mask strip on failing groups
  // (Apr 28 2026, temporary — remove after diagnosis)
  // Press '1' = strip filter from failing shpGrps  (visible+unshaded => filter is culprit)
  // Press '2' = strip mask   from failing shpGrps  (visible           => mask   is culprit)
  // Press '3' = strip BOTH                                            (last-resort isolation)
  // Press '0' = list failing groups currently in DOM (sanity check)
  // To restore: reload the page (no rebuild — protoBatch.rebuild triggered the export loop).
  // Edit FAILING_IDS to match the hash under test.
  // ---------------------------------------------------------------------------
  if (key === '0' || key === '1' || key === '2' || key === '3') {
    console.log(`[B1 EXP1] keypress detected: '${key}'`)
    const FAILING_IDS = ['shpGrp00', 'shpGrp01', 'shpGrp02', 'shpGrp09', 'shpGrp10', 'shpGrp11']

    // Sanity check first — confirm the targeted IDs actually exist in the DOM
    const existing = FAILING_IDS.map(id => {
      const svg = document.getElementById(id)
      if (!svg) return { id, found: false }
      const filteredGs = svg.querySelectorAll('g[filter]')
      const maskedEls = svg.querySelectorAll('[mask]')
      return {
        id,
        found: true,
        tag: svg.tagName,
        filteredGCount: filteredGs.length,
        maskedElCount: maskedEls.length,
        ownFilterAttr: svg.getAttribute('filter'),
        ownMaskAttr: svg.getAttribute('mask'),
      }
    })
    console.group(`[B1 EXP1] sanity check — failing groups in DOM`)
    console.table(existing)
    console.groupEnd()
    if (key === '0') return  // sanity-check only

    const stripFilter = key === '1' || key === '3'
    const stripMask = key === '2' || key === '3'
    const log = []
    FAILING_IDS.forEach(id => {
      const svg = document.getElementById(id)
      if (!svg) { log.push({ id, status: 'NOT FOUND in DOM' }); return }

      if (stripFilter) {
        // Filter could be on the <svg> itself (rare) or on an inner <g>
        if (svg.hasAttribute('filter')) {
          log.push({ id, target: id, removed: 'filter (on svg)', was: svg.getAttribute('filter') })
          svg.removeAttribute('filter')
        }
        svg.querySelectorAll('g[filter]').forEach(g => {
          log.push({ id, target: g.id || g.tagName, removed: 'filter (on g)', was: g.getAttribute('filter') })
          g.removeAttribute('filter')
        })
      }
      if (stripMask) {
        if (svg.hasAttribute('mask')) {
          log.push({ id, target: id, removed: 'mask (on svg)', was: svg.getAttribute('mask') })
          svg.removeAttribute('mask')
        }
        svg.querySelectorAll('[mask]').forEach(el => {
          log.push({ id, target: el.id || el.tagName, removed: 'mask (on el)', was: el.getAttribute('mask') })
          el.removeAttribute('mask')
        })
      }
    })
    console.group(`[B1 EXP1] strip results (filter=${stripFilter}, mask=${stripMask})`)
    console.table(log)
    console.groupEnd()
    if (log.length === 0) console.warn(`[B1 EXP1] NOTHING was stripped — check FAILING_IDS or selectors`)
  }

  // ---------------------------------------------------------------------------
  // SAFARI B1 EXPERIMENT 2 — Force-fill paths in failing groups
  // Press '4' = also strip filter/mask AND set fill='red' opacity=1 on every
  //             <path> inside the failing groups. If shapes appear red, the
  //             geometry paints fine and the bug is in the filter pipeline.
  //             If still invisible, the bug is at the path-paint level.
  // Press '5' = report computed style + bounding rect for paths in failing groups
  //             (no DOM mutation).
  // ---------------------------------------------------------------------------
  if (key === '4' || key === '5') {
    console.log(`[B1 EXP2] keypress detected: '${key}'`)
    const FAILING_IDS = ['shpGrp00', 'shpGrp01', 'shpGrp02', 'shpGrp09', 'shpGrp10', 'shpGrp11']
    const log = []
    FAILING_IDS.forEach(id => {
      const svg = document.getElementById(id)
      if (!svg) { log.push({ id, status: 'NOT FOUND' }); return }

      if (key === '4') {
        // Strip everything that could hide the path
        if (svg.hasAttribute('filter')) svg.removeAttribute('filter')
        if (svg.hasAttribute('mask')) svg.removeAttribute('mask')
        svg.querySelectorAll('[filter]').forEach(e => e.removeAttribute('filter'))
        svg.querySelectorAll('[mask]').forEach(e => e.removeAttribute('mask'))
      }

      svg.querySelectorAll('path').forEach(p => {
        const cs = window.getComputedStyle(p)
        const rect = p.getBoundingClientRect()
        const entry = {
          id,
          parentId: p.parentNode?.id || p.parentNode?.tagName,
          d_len: (p.getAttribute('d') || '').length,
          fill: cs.fill,
          opacity: cs.opacity,
          fillOpacity: cs.fillOpacity,
          visibility: cs.visibility,
          display: cs.display,
          rect: `${rect.width.toFixed(1)}x${rect.height.toFixed(1)} @ ${rect.x.toFixed(1)},${rect.y.toFixed(1)}`,
        }
        if (key === '4') {
          // Force visible paint
          p.setAttribute('fill', 'red')
          p.setAttribute('fill-opacity', '1')
          p.setAttribute('opacity', '1')
          p.style.fill = 'red'
          p.style.fillOpacity = '1'
          p.style.opacity = '1'
          entry.forced = 'fill=red'
        }
        log.push(entry)
      })
    })
    console.group(`[B1 EXP2] ${key === '4' ? 'force-fill' : 'inspect'} paths in failing groups`)
    console.table(log)
    console.groupEnd()
    if (log.length === 0) console.warn(`[B1 EXP2] No paths found inside failing groups`)
  }

  // ---------------------------------------------------------------------------
  // SAFARI B1 EXPERIMENT 3 — Filter parameter throttling on failing groups
  // Press '6' = clamp every feGaussianBlur stdDeviation <= 3
  // Press '7' = trim filter chain — keep only first N shadow layers (default 4)
  // Press '8' = clamp every feOffset dx/dy <= 2
  // (cumulative — press to keep adding throttles; reload to reset)
  // ---------------------------------------------------------------------------
  if (key === '6' || key === '7' || key === '8') {
    console.log(`[B1 EXP3] keypress detected: '${key}'`)
    const FAILING_IDS = ['shpGrp00', 'shpGrp01', 'shpGrp02', 'shpGrp09', 'shpGrp10', 'shpGrp11']
    const STDDEV_CAP = 3
    const OFFSET_CAP = 2
    const KEEP_LAYERS = 4   // for '7' — number of leading shadow primitives to keep

    let touched = 0
    FAILING_IDS.forEach(id => {
      const svg = document.getElementById(id)
      if (!svg) return
      // Find the shading filter inside this svg's defs (id starts with 'fx')
      const filters = svg.querySelectorAll('defs > filter[id^="fx"]')
      filters.forEach(filter => {
        if (key === '6') {
          filter.querySelectorAll('feGaussianBlur').forEach(b => {
            const sd = parseFloat(b.getAttribute('stdDeviation') || '0')
            if (sd > STDDEV_CAP) {
              b.setAttribute('stdDeviation', STDDEV_CAP)
              touched++
            }
          })
        }
        if (key === '7') {
          // Keep feFlood transparentInput (first child) plus first KEEP_LAYERS "shade-outset-*" sets.
          // Simpler heuristic: count feBlend results matching shade-outset-* and remove all primitives
          // that come AFTER the Nth feBlend.
          const children = Array.from(filter.children)
          let blendsKept = 0
          let cutoffIdx = children.length
          for (let i = 0; i < children.length; i++) {
            const c = children[i]
            if (c.tagName === 'feBlend' && (c.getAttribute('result') || '').startsWith('shade-')) {
              blendsKept++
              if (blendsKept >= KEEP_LAYERS) {
                cutoffIdx = i + 1
                break
              }
            }
          }
          if (cutoffIdx < children.length) {
            // Replace the final-output feComposite with one that simply uses the last kept feBlend
            const lastKeptBlendResult = children[cutoffIdx - 1].getAttribute('result')
            for (let i = children.length - 1; i >= cutoffIdx; i--) {
              filter.removeChild(children[i])
              touched++
            }
            // Append a passthrough feMerge so the filter has a sensible final result
            const ns = 'http://www.w3.org/2000/svg'
            const merge = document.createElementNS(ns, 'feMerge')
            const mergeNode = document.createElementNS(ns, 'feMergeNode')
            mergeNode.setAttribute('in', lastKeptBlendResult)
            merge.appendChild(mergeNode)
            const sgNode = document.createElementNS(ns, 'feMergeNode')
            sgNode.setAttribute('in', 'SourceGraphic')
            merge.insertBefore(sgNode, mergeNode)  // SourceGraphic underneath
            filter.appendChild(merge)
          }
        }
        if (key === '8') {
          filter.querySelectorAll('feOffset').forEach(o => {
            const dx = parseFloat(o.getAttribute('dx') || '0')
            const dy = parseFloat(o.getAttribute('dy') || '0')
            const cdx = Math.sign(dx) * Math.min(Math.abs(dx), OFFSET_CAP)
            const cdy = Math.sign(dy) * Math.min(Math.abs(dy), OFFSET_CAP)
            if (cdx !== dx || cdy !== dy) {
              o.setAttribute('dx', cdx)
              o.setAttribute('dy', cdy)
              touched++
            }
          })
        }
      })
    })
    console.log(`[B1 EXP3] '${key}' — ${touched} primitive(s) modified. Watch for visual change.`)

    // Force Safari to re-evaluate the filter graph by toggling the filter attr
    // on every consumer that references one of the touched filters.
    FAILING_IDS.forEach(id => {
      const svg = document.getElementById(id)
      if (!svg) return
      const consumers = []
      if (svg.hasAttribute('filter')) consumers.push(svg)
      svg.querySelectorAll('[filter]').forEach(c => consumers.push(c))
      consumers.forEach(c => {
        const v = c.getAttribute('filter')
        c.removeAttribute('filter')
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        c.getBoundingClientRect()
        c.setAttribute('filter', v)
      })
    })
    console.log(`[B1 EXP3] forced filter re-evaluation on consumers`)
  }

  // ---------------------------------------------------------------------------
  // SAFARI B1 EXPERIMENT 4 — Sanity + filter-region hypothesis
  // Press '9' = apply '6' (clamp stdDev<=3) GLOBALLY to all filters in the
  //             document. If working shapes visibly lose blur, mutation is
  //             taking effect; if not, Safari is ignoring our mutations.
  // Press 'q' = override filter region on failing groups to userSpaceOnUse
  //             with canvas-tight bounds (0,-50,100,300). If shapes appear,
  //             the bug is filter-region size in Safari.
  // Press 'w' = strip overflow="visible" from failing groups.
  // ---------------------------------------------------------------------------
  if (key === '9' || key === 'q' || key === 'w') {
    console.log(`[B1 EXP4] keypress detected: '${key}'`)
    const FAILING_IDS = ['shpGrp00', 'shpGrp01', 'shpGrp02', 'shpGrp09', 'shpGrp10', 'shpGrp11']
    let touched = 0

    if (key === '9') {
      // Global blur clamp — sanity check that DOM mutation reaches Safari renderer.
      document.querySelectorAll('feGaussianBlur').forEach(b => {
        const sd = parseFloat(b.getAttribute('stdDeviation') || '0')
        if (sd > 0.5) {
          b.setAttribute('stdDeviation', 0.5)
          touched++
        }
      })
      console.log(`[B1 EXP4] '9' — clamped ${touched} feGaussianBlur GLOBALLY to stdDev=0.5`)
      // Force re-eval on every filter consumer in the document
      document.querySelectorAll('[filter]').forEach(c => {
        const v = c.getAttribute('filter')
        c.removeAttribute('filter')
        c.getBoundingClientRect()
        c.setAttribute('filter', v)
      })
    }

    if (key === 'q') {
      FAILING_IDS.forEach(id => {
        const svg = document.getElementById(id)
        if (!svg) return
        const filters = svg.querySelectorAll('defs > filter[id^="fx"]')
        filters.forEach(filter => {
          filter.setAttribute('filterUnits', 'userSpaceOnUse')
          filter.setAttribute('x', '0')
          filter.setAttribute('y', '-50')
          filter.setAttribute('width', '100')
          filter.setAttribute('height', '300')
          touched++
        })
        // Force re-eval on consumers within this svg
        const consumers = []
        if (svg.hasAttribute('filter')) consumers.push(svg)
        svg.querySelectorAll('[filter]').forEach(c => consumers.push(c))
        consumers.forEach(c => {
          const v = c.getAttribute('filter')
          c.removeAttribute('filter')
          c.getBoundingClientRect()
          c.setAttribute('filter', v)
        })
      })
      console.log(`[B1 EXP4] 'q' — clamped filter region to userSpace 0,-50,100,300 on ${touched} filter(s)`)
    }

    if (key === 'w') {
      FAILING_IDS.forEach(id => {
        const svg = document.getElementById(id)
        if (!svg) return
        if (svg.getAttribute('overflow') === 'visible') {
          svg.removeAttribute('overflow')
          touched++
        }
        svg.querySelectorAll('[overflow="visible"]').forEach(e => {
          e.removeAttribute('overflow')
          touched++
        })
      })
      console.log(`[B1 EXP4] 'w' — stripped ${touched} overflow="visible" attribute(s)`)
    }
  }
}

//FUNC: getCurrentDateString() : date (string) : in YYYY.MM.DD format
//NOTE: Create with GPT-4 on April 15,2023
function getCurrentDateString() {
  const
    currentDate = new Date(),
    year = currentDate.getFullYear(),
    month = String(currentDate.getMonth() + 1).padStart(2, '0'),
    day = String(currentDate.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

//FUNC: getCurrentTime24HrFormat() : time (string) : in HH.MM.SS format
//NOTE: Create with GPT-4 on April 15,2023
function getCurrentTime(format24Hr = false) {
  const
    now = new Date(),
    minutes = String(now.getMinutes()).padStart(2, '0'),
    seconds = String(now.getSeconds()).padStart(2, '0')
  let
    hours = now.getHours(),
    amPm = ''
  if (!format24Hr) {
    amPm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
  }
  hours = String(hours).padStart(2, '0')
  return `${hours}.${minutes}.${seconds}${amPm ? '' + amPm : ''}`
}