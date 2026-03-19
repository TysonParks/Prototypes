// CLASS: WrapperDebugOverlay
// Visual debug overlay for wrapper relationships on rendered output.
// Press 'd' to toggle. Shows segment IDs, corner types, and wrapper connections.
// Usage: WrapperDebugOverlay.toggle(GRID)

class WrapperDebugOverlay {

  //MARK: Static State
  static _visible = false
  static _overlayGroup = null
  static _grid = null

  //MARK: Color Palette
  static colors = {
    coincident: `rgba(255, 60, 60, 0.9)`,       // red
    collinear: `rgba(60, 180, 255, 0.9)`,       // blue
    adjacent: `rgba(60, 255, 120, 0.9)`,       // green
    radiant: `rgba(255, 180, 60, 0.9)`,       // orange
    segLabel: `rgba(255, 255, 255, 0.85)`,     // white
    segDot: `rgba(255, 255, 0, 0.9)`,        // yellow (corner dot)
    inWrapper: `rgba(180, 60, 255, 0.9)`,       // purple
    outWrapper: `rgba(255, 120, 60, 0.9)`,       // coral
    arcOrigin: `rgba(0, 255, 200, 0.6)`,        // cyan
    bgPill: `rgba(0, 0, 0, 0.6)`,            // label background
  }

  //MARK: Toggle
  static toggle(grid, frameGrid) {
    if (!grid) { console.warn(`WrapperDebugOverlay: no grid provided`); return }
    WrapperDebugOverlay._grid = grid
    if (WrapperDebugOverlay._visible) {
      WrapperDebugOverlay.hide()
    } else {
      WrapperDebugOverlay.show(grid, frameGrid)
    }
  }

  static show(grid, frameGrid) {
    WrapperDebugOverlay.hide()  // remove any existing overlay
    WrapperDebugOverlay._visible = true
    WrapperDebugOverlay._grid = grid

    const parent = FRAME.bleed
    if (!parent) { console.warn(`WrapperDebugOverlay: FRAME.bleed not found`); return }

    // Create overlay <g> element
    const g = document.createElementNS(xmlns, 'g')
    g.setAttribute('id', 'wrapper-debug-overlay')
    g.setAttribute('pointer-events', 'none')
    parent.elt.appendChild(g)
    WrapperDebugOverlay._overlayGroup = g

    const segs = grid.allSimpleSubShapesSegs
    if (!segs || segs.length === 0) {
      console.warn(`WrapperDebugOverlay: no segments found`)
      return
    }

    // Auto-detect frame grid: prefer explicit arg, fall back to global BGRID
    const bgrid = frameGrid ?? (typeof BGRID !== 'undefined' ? BGRID : null)
    const frameSegs = bgrid ? bgrid.allSimpleSubShapesSegs : []

    // Draw order: bottom → top
    //   radiant (solid, bottommost) — upper dashed layers reveal it through their gaps
    //   adjacent → collinear → coincident  (dashed 1 1, each type on top of previous)
    //   frame versions of the above (dashed 2 2, lower opacity)
    //   corner dots → labels (always on top)
    WrapperDebugOverlay._drawRadiantConnections(g, segs)
    if (frameSegs.length) WrapperDebugOverlay._drawRadiantConnections(g, frameSegs, true)
    WrapperDebugOverlay._drawConnections(g, segs)
    if (frameSegs.length) WrapperDebugOverlay._drawConnections(g, frameSegs, true)
    WrapperDebugOverlay._drawCornerDots(g, segs)
    if (frameSegs.length) WrapperDebugOverlay._drawCornerDots(g, frameSegs, true)
    WrapperDebugOverlay._drawCornerLabels(g, segs)
    if (frameSegs.length) WrapperDebugOverlay._drawCornerLabels(g, frameSegs, true)
    WrapperDebugOverlay._drawLegend(g, !!frameSegs.length)

    const frameNote = frameSegs.length ? ` + ${frameSegs.length} frame segs` : ''
    console.log(`%c[WrapperDebugOverlay] ON — ${segs.length} segs${frameNote}`, 'color: lime')
    WrapperDebugOverlay._logSummary(segs, frameSegs)
  }

  static hide() {
    WrapperDebugOverlay._visible = false
    const existing = document.getElementById('wrapper-debug-overlay')
    if (existing) existing.remove()
    WrapperDebugOverlay._overlayGroup = null
    console.log(`%c[WrapperDebugOverlay] OFF`, 'color: gray')
  }

  //MARK: Drawing — Connections (Flush + Adjacent)
  // Three ordered passes so coincident (rarest) always renders above collinear above adjacent.
  // isFrame=true uses longer dash period (2 2) and lower opacity to distinguish frame segs.
  static _drawConnections(g, segs, isFrame = false) {
    const C = WrapperDebugOverlay.colors
    const dash = isFrame ? '2 2' : '1 1'
    const opacity = isFrame ? 0.6 : 0.85
    const sw = isFrame ? '0.22' : '0.3'

    // Pass 1: Adjacent (bottommost of the flush group)
    const drawnAdj = new Set()
    segs.forEach(seg => {
      if (seg.adjacentWrapper) {
        const key = WrapperDebugOverlay._pairKey(seg, seg.adjacentWrapper)
        if (!drawnAdj.has(key)) {
          drawnAdj.add(key)
          WrapperDebugOverlay._drawWrapperLine(g, seg, seg.adjacentWrapper, C.adjacent, 'adj', dash, opacity, sw)
        }
      }
    })

    // Pass 2: Collinear
    const drawnColl = new Set()
    segs.forEach(seg => {
      if (seg.collinearWrapper && !seg.coincidentWrapper) {
        const key = WrapperDebugOverlay._pairKey(seg, seg.collinearWrapper)
        if (!drawnColl.has(key)) {
          drawnColl.add(key)
          WrapperDebugOverlay._drawWrapperLine(g, seg, seg.collinearWrapper, C.collinear, 'coll', dash, opacity, sw)
        }
      }
    })

    // Pass 3: Coincident (topmost — rarest, most diagnostic)
    const drawnCoin = new Set()
    segs.forEach(seg => {
      if (seg.coincidentWrapper) {
        const key = WrapperDebugOverlay._pairKey(seg, seg.coincidentWrapper)
        if (!drawnCoin.has(key)) {
          drawnCoin.add(key)
          WrapperDebugOverlay._drawWrapperLine(g, seg, seg.coincidentWrapper, C.coincident, 'coin', dash, opacity, sw)
        }
      }
    })
  }

  //MARK: Drawing — Radiant/Diagonal Connections
  // Drawn first (bottommost layer). Solid stroke (no dash) so upper dashed layers
  // reveal radiant through their gaps — radiant shows between the dashes of adj/coll/coin.
  static _drawRadiantConnections(g, segs, isFrame = false) {
    const drawn = new Set()
    const C = WrapperDebugOverlay.colors
    const opacity = isFrame ? 0.5 : 0.7
    const sw = isFrame ? '0.2' : '0.25'

    segs.forEach(seg => {
      const radOuts = seg.radiantOutWrappers
      if (radOuts && radOuts.length > 0) {
        radOuts.forEach(rw => {
          const key = WrapperDebugOverlay._pairKey(seg, rw)
          if (!drawn.has(key)) {
            drawn.add(key)
            // null dashArray = solid (no stroke-dasharray attribute set)
            WrapperDebugOverlay._drawWrapperLine(g, seg, rw, C.radiant, 'rad', null, opacity, sw)
          }
        })
      }
    })
  }

  // dashArray: string like '1 1' for dashed, or null for solid (no attribute set).
  static _drawWrapperLine(g, segA, segB, color, label, dashArray = '1 1', opacity = 0.85, strokeWidth = '0.3') {
    const
      ax = segA.end.x,
      ay = segA.end.y,
      bx = segB.end.x,
      by = segB.end.y

    // Connection line
    const line = document.createElementNS(xmlns, 'line')
    line.setAttribute('x1', ax)
    line.setAttribute('y1', ay)
    line.setAttribute('x2', bx)
    line.setAttribute('y2', by)
    line.setAttribute('stroke', color)
    line.setAttribute('stroke-width', strokeWidth)
    if (dashArray) line.setAttribute('stroke-dasharray', dashArray)
    line.setAttribute('opacity', String(opacity))
    g.appendChild(line)

    // Midpoint label
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    WrapperDebugOverlay._drawMicroLabel(g, mx, my, label, color, 0.8)
  }

  //MARK: Drawing — Corner Dots
  // isFrame=true uses slightly smaller radii and lower opacity to de-emphasise frame corners.
  static _drawCornerDots(g, segs, isFrame = false) {
    const C = WrapperDebugOverlay.colors
    const dotR = isFrame ? '0.3' : '0.4'
    const ringR = isFrame ? '0.55' : '0.7'
    const innerR = isFrame ? '0.15' : '0.2'
    const dotOpacity = isFrame ? '0.65' : '1'

    segs.forEach(seg => {
      const ex = seg.end.x
      const ey = seg.end.y

      // Dot color reflects the highest-priority wrapper type present
      let dotColor = C.segDot
      if (seg.coincidentWrapper) dotColor = C.coincident
      else if (seg.collinearWrapper) dotColor = C.collinear
      else if (seg.adjacentWrapper) dotColor = C.adjacent
      else if (seg.radiantOutWrappers?.length > 0) dotColor = C.radiant

      // Corner dot
      const circle = document.createElementNS(xmlns, 'circle')
      circle.setAttribute('cx', ex)
      circle.setAttribute('cy', ey)
      circle.setAttribute('r', dotR)
      circle.setAttribute('fill', dotColor)
      circle.setAttribute('stroke', 'black')
      circle.setAttribute('stroke-width', '0.1')
      circle.setAttribute('opacity', dotOpacity)
      g.appendChild(circle)

      // In/Out indicator
      if (seg.isOutsideCorner) {
        // Small "O" ring for outside corners
        const ring = document.createElementNS(xmlns, 'circle')
        ring.setAttribute('cx', ex)
        ring.setAttribute('cy', ey)
        ring.setAttribute('r', ringR)
        ring.setAttribute('fill', 'none')
        ring.setAttribute('stroke', C.outWrapper)
        ring.setAttribute('stroke-width', '0.15')
        ring.setAttribute('opacity', dotOpacity)
        g.appendChild(ring)
      } else {
        // Small filled inner dot for inside corners
        const inner = document.createElementNS(xmlns, 'circle')
        inner.setAttribute('cx', ex)
        inner.setAttribute('cy', ey)
        inner.setAttribute('r', innerR)
        inner.setAttribute('fill', C.inWrapper)
        inner.setAttribute('opacity', dotOpacity)
        g.appendChild(inner)
      }

      // Arc origin dot (if segment has an arc)
      if (seg.hasArc && seg.arcOrigin) {
        const ao = seg.arcOrigin
        const arcDot = document.createElementNS(xmlns, 'circle')
        arcDot.setAttribute('cx', ao.x)
        arcDot.setAttribute('cy', ao.y)
        arcDot.setAttribute('r', '0.25')
        arcDot.setAttribute('fill', C.arcOrigin)
        arcDot.setAttribute('stroke', 'black')
        arcDot.setAttribute('stroke-width', '0.08')
        g.appendChild(arcDot)
      }
    })
  }

  //MARK: Drawing — Corner Labels (positioned at segment start vertex)
  // isFrame=true uses a dark-blue pill background so frame labels are visually distinct.
  static _drawCornerLabels(g, segs, isFrame = false) {
    const C = WrapperDebugOverlay.colors
    const pillColor = isFrame ? 'rgba(0,30,90,0.75)' : C.bgPill
    // Track drawn corners to avoid duplicate labels at shared vertices
    const drawnCorners = new Set()

    segs.forEach(seg => {
      // Use seg.start — in the ring, seg.end == seg.endNeighbor.start,
      // so using seg.end shifts every label one corner forward.
      const ex = seg.start.x
      const ey = seg.start.y
      const cornerKey = `${Math.round(ex * 10)},${Math.round(ey * 10)}`

      // Skip if we've already labeled this corner position
      if (drawnCorners.has(cornerKey)) return
      drawnCorners.add(cornerKey)

      const shortId = WrapperDebugOverlay._shortId(seg)

      // Offset label slightly from corner for readability
      const offX = ex + 1.2
      const offY = ey - 0.6

      // Background pill
      const pill = document.createElementNS(xmlns, 'rect')
      const labelWidth = shortId.length * 0.7 + 0.4
      pill.setAttribute('x', offX - 0.2)
      pill.setAttribute('y', offY - 0.7)
      pill.setAttribute('width', labelWidth)
      pill.setAttribute('height', 1.1)
      pill.setAttribute('rx', '0.3')
      pill.setAttribute('fill', pillColor)
      g.appendChild(pill)

      // Text label
      const text = document.createElementNS(xmlns, 'text')
      text.textContent = shortId
      text.setAttribute('x', offX)
      text.setAttribute('y', offY + 0.2)
      text.setAttribute('text-anchor', 'start')
      text.setAttribute('font-size', '1.275')
      text.setAttribute('font-family', 'monospace')
      text.setAttribute('fill', C.segLabel)
      g.appendChild(text)
    })
  }

  //MARK: Drawing — Legend
  static _drawLegend(g, hasFrame = false) {
    const C = WrapperDebugOverlay.colors
    const entries = [
      { label: 'Coincident', color: C.coincident, note: '— 1 1' },
      { label: 'Collinear', color: C.collinear, note: '— 1 1' },
      { label: 'Adjacent', color: C.adjacent, note: '— 1 1' },
      { label: 'Radiant', color: C.radiant, note: '——— solid' },
      { label: 'OutCorner ○', color: C.outWrapper, note: '' },
      { label: 'InCorner ●', color: C.inWrapper, note: '' },
      { label: 'ArcOrigin', color: C.arcOrigin, note: '' },
    ]
    if (hasFrame) entries.push({ label: 'Frame segs', color: 'rgba(120,160,255,0.85)', note: '-- 2 2' })

    // Legend background
    const lx = -4, ly = -9
    const lbg = document.createElementNS(xmlns, 'rect')
    lbg.setAttribute('x', lx)
    lbg.setAttribute('y', ly)
    lbg.setAttribute('width', 22)
    lbg.setAttribute('height', entries.length * 2.2 + 0.8)
    lbg.setAttribute('rx', '0.5')
    lbg.setAttribute('fill', 'rgba(0,0,0,0.75)')
    g.appendChild(lbg)

    entries.forEach((entry, i) => {
      const ey = ly + 1.6 + i * 2.2

      // Color swatch
      const swatch = document.createElementNS(xmlns, 'rect')
      swatch.setAttribute('x', lx + 0.5)
      swatch.setAttribute('y', ey - 0.8)
      swatch.setAttribute('width', 1.4)
      swatch.setAttribute('height', 1.4)
      swatch.setAttribute('rx', '0.3')
      swatch.setAttribute('fill', entry.color)
      g.appendChild(swatch)

      // Label
      const text = document.createElementNS(xmlns, 'text')
      text.textContent = entry.note ? `${entry.label}  ${entry.note}` : entry.label
      text.setAttribute('x', lx + 2.5)
      text.setAttribute('y', ey + 0.35)
      text.setAttribute('font-size', '1.8')
      text.setAttribute('font-family', 'sans-serif')
      text.setAttribute('fill', 'white')
      g.appendChild(text)
    })
  }

  //MARK: Drawing — Helpers
  static _drawMicroLabel(g, x, y, text, color, fontSize = 1.2) {
    const label = document.createElementNS(xmlns, 'text')
    label.textContent = text
    label.setAttribute('x', x)
    label.setAttribute('y', y)
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('font-size', fontSize)
    label.setAttribute('font-family', 'monospace')
    label.setAttribute('fill', color)
    label.setAttribute('stroke', 'black')
    label.setAttribute('stroke-width', '0.08')
    label.setAttribute('paint-order', 'stroke')
    g.appendChild(label)
  }

  static _shortId(seg) {
    // Try to extract a meaningful short name from the segment ID
    // ProtoSegment ids look like: "grp0-isl0-shp0-cel003-s0"
    const id = seg.id || ''
    const match = id.match(/(cel\d+)-?(s\d+)?/)
    if (match) return match[0]
    // Fallback: first 8 chars
    return id.substring(0, 8)
  }

  static _pairKey(a, b) {
    const ids = [a.id, b.id].sort()
    return `${ids[0]}|${ids[1]}`
  }

  //MARK: Console Logging
  static _logSummary(segs, frameSegs = []) {
    const coin = segs.filter(s => s.coincidentWrapper)
    const coll = segs.filter(s => s.collinearWrapper && !s.coincidentWrapper)
    const adj = segs.filter(s => s.adjacentWrapper)
    const rad = segs.filter(s => s.radiantOutWrappers?.length > 0)

    console.groupCollapsed(`%c[WrapperDebugOverlay] Summary`, 'color: cyan')

    console.log(`Coincident wrappers: ${coin.length}`)
    coin.forEach(s => {
      const w = s.coincidentWrapper
      console.log(
        `  ${s.id} → ${w.id}`,
        `| out:${s.isOutsideCorner} → out:${w.isOutsideCorner}`,
        `| coinOut:${!!s.coinOutWrapper} coinIn:${!!s.coinInWrapper}`,
        `| flushState:${s.flushWrapState}`
      )
    })

    console.log(`Collinear wrappers: ${coll.length}`)
    coll.forEach(s => {
      const w = s.collinearWrapper
      console.log(
        `  ${s.id} → ${w.id}`,
        `| out:${s.isOutsideCorner}`,
        `| flushState:${s.flushWrapState}`
      )
    })

    console.log(`Adjacent wrappers: ${adj.length}`)
    adj.forEach(s => {
      const w = s.adjacentWrapper
      console.log(
        `  ${s.id} → ${w.id}`,
        `| out:${s.isOutsideCorner}`,
        `| adjState:${s.adjWrapState}`
      )
    })

    console.log(`Radiant connections: ${rad.length}`)
    rad.forEach(s => {
      console.log(
        `  ${s.id} → [${s.radiantOutWrappers.map(r => WrapperDebugOverlay._shortId(r)).join(', ')}]`,
        `| out:${s.isOutsideCorner}`,
        `| arcOrigin:${s.arcOrigin ? `(${s.arcOrigin.x.toFixed(1)},${s.arcOrigin.y.toFixed(1)})` : 'none'}`
      )
    })

    console.groupEnd()

    if (frameSegs.length > 0) {
      const fCoin = frameSegs.filter(s => s.coincidentWrapper)
      const fColl = frameSegs.filter(s => s.collinearWrapper && !s.coincidentWrapper)
      const fAdj = frameSegs.filter(s => s.adjacentWrapper)
      const fRad = frameSegs.filter(s => s.radiantOutWrappers?.length > 0)
      console.groupCollapsed(`%c[WrapperDebugOverlay] Frame Summary (${frameSegs.length} segs)`, 'color: #88aaff')
      console.log(`Frame coincident: ${fCoin.length} | collinear: ${fColl.length} | adjacent: ${fAdj.length} | radiant: ${fRad.length}`)
      console.groupEnd()
    }
  }

  //MARK: Console Inspection Helpers
  // Call from browser console: WrapperDebugOverlay.inspect(GRID)
  static inspect(grid) {
    grid = grid || WrapperDebugOverlay._grid || GRID
    const segs = grid.allSimpleSubShapesSegs

    console.group(`%c[WrapperDebugOverlay] Full Inspection`, 'color: cyan; font-weight: bold')

    // Group segments by shape
    const byShape = new Map()
    segs.forEach(s => {
      const shapeId = s.shape?.id || 'unknown'
      if (!byShape.has(shapeId)) byShape.set(shapeId, [])
      byShape.get(shapeId).push(s)
    })

    byShape.forEach((shapeSegs, shapeId) => {
      const hasWrappers = shapeSegs.some(s =>
        s.coincidentWrapper || s.collinearWrapper || s.adjacentWrapper
        || s.radiantOutWrappers?.length > 0 || s.radiantInWrappers?.length > 0
      )
      if (!hasWrappers) return

      console.groupCollapsed(`Shape: ${shapeId} (${shapeSegs.length} segs)`)
      shapeSegs.forEach(s => {
        const wrapInfo = []
        if (s.coincidentWrapper) wrapInfo.push(`coin→${WrapperDebugOverlay._shortId(s.coincidentWrapper)}`)
        if (s.collinearWrapper) wrapInfo.push(`coll→${WrapperDebugOverlay._shortId(s.collinearWrapper)}`)
        if (s.adjacentWrapper) wrapInfo.push(`adj→${WrapperDebugOverlay._shortId(s.adjacentWrapper)}`)
        if (s.radiantOutWrappers?.length > 0) wrapInfo.push(`radOut→[${s.radiantOutWrappers.map(r => WrapperDebugOverlay._shortId(r)).join(',')}]`)
        if (s.radiantInWrappers?.length > 0) wrapInfo.push(`radIn→[${s.radiantInWrappers.map(r => WrapperDebugOverlay._shortId(r)).join(',')}]`)

        if (wrapInfo.length > 0) {
          console.log(
            `  ${WrapperDebugOverlay._shortId(s)}`,
            `| ${s.isOutsideCorner ? 'OUT' : 'IN '}`,
            `| arc:${s.hasArc ? 'Y' : 'N'}`,
            `| ${wrapInfo.join(' | ')}`,
            s  // the actual segment object for expandable inspection
          )
        }
      })
      console.groupEnd()
    })

    console.groupEnd()
  }

  // Focused inspection of a single segment by partial ID match
  static seg(partialId, grid) {
    grid = grid || WrapperDebugOverlay._grid || GRID
    const segs = grid.allSimpleSubShapesSegs
    const matches = segs.filter(s => s.id.includes(partialId))

    if (matches.length === 0) {
      console.warn(`No segments matching "${partialId}"`)
      return null
    }

    matches.forEach(s => {
      console.group(`%c${s.id}`, 'color: yellow; font-weight: bold')
      console.log(`  Shape:`, s.shape?.id)
      console.log(`  Start:`, s.start?.toString(), `End:`, s.end?.toString())
      console.log(`  Direction:`, s.direction?.name, `isOutsideCorner:`, s.isOutsideCorner)
      console.log(`  hasArc:`, s.hasArc, `arcRadius:`, s.arcRadius)
      console.log(`  arcOrigin:`, s.arcOrigin?.toString())
      console.log(`  endCorner:`, s.endCorner?.value)
      console.log(`  --- Flush ---`)
      console.log(`  flushWrapper:`, s.flushWrapper?.id)
      console.log(`  coincidentWrapper:`, s.coincidentWrapper?.id)
      console.log(`  collinearWrapper:`, s.collinearWrapper?.id)
      console.log(`  coinOutWrapper:`, s.coinOutWrapper?.id, `coinInWrapper:`, s.coinInWrapper?.id)
      console.log(`  flushOutWrapper:`, s.flushOutWrapper?.id, `flushInWrapper:`, s.flushInWrapper?.id)
      console.log(`  flushWrapState:`, s.flushWrapState)
      console.log(`  isCoinOutWrapper:`, s.isCoinOutWrapper, `isCoinInWrapper:`, s.isCoinInWrapper)
      console.log(`  --- Adjacent ---`)
      console.log(`  adjacentWrapper:`, s.adjacentWrapper?.id)
      console.log(`  adjOutWrapper:`, s.adjOutWrapper?.id, `adjInWrapper:`, s.adjInWrapper?.id)
      console.log(`  adjWrapState:`, s.adjWrapState)
      console.log(`  --- Radiant ---`)
      console.log(`  radiantOutWrappers:`, s.radiantOutWrappers?.map(r => r.id))
      console.log(`  radiantInWrappers:`, s.radiantInWrappers?.map(r => r.id))
      console.log(`  isInnerMostWrapper:`, s.isInnerMostWrapper)
      console.log(`  --- Viables ---`)
      console.log(`  viableWrappers:`, s.viableWrappers?.length)
      console.log(`  viableCoinWrapOrigins:`, s.viableCoinWrapOrigins?.length)
      console.log(`  viableRadiantOrigins:`, s.viableRadiantOrigins?.length)
      console.log(`  Segment object:`, s)
      console.groupEnd()
    })

    return matches.length === 1 ? matches[0] : matches
  }

  // Adjacent distance diagnostic — logs raw vs normalized distances for aspect-ratio debugging (§ 9.12.10)
  static adjDistances(grid) {
    grid = grid || WrapperDebugOverlay._grid || GRID
    const segs = grid.allSimpleSubShapesSegs
    const adjSegs = segs.filter(s => s.adjacentWrapper)

    if (adjSegs.length === 0) {
      console.warn(`[WrapperDebugOverlay] No adjacent wrappers found`)
      return []
    }

    const cellW = grid.cellSize.x
    const cellH = grid.cellSize.y
    const isSquare = Math.abs(cellW - cellH) < 0.01

    console.group(
      `%c[WrapperDebugOverlay] Adjacent Distances — cellSize: ${cellW.toFixed(2)}×${cellH.toFixed(2)}` +
      ` (${isSquare ? 'square' : cellW > cellH ? 'wide' : 'tall'})`,
      'color: lime; font-weight: bold'
    )

    const rows = adjSegs.map(s => {
      const w = s.adjacentWrapper
      const row = WrapperDebugOverlay._adjDistRow(s, w, cellW, cellH)

      if (row.changed) {
        console.warn(
          `  ${s.id} → ${w.id}: SELECTION CHANGED ${row.rawPick} → ${row.normPick}`,
          `| raw: ${row.rawStart.toFixed(3)} / ${row.rawEnd.toFixed(3)}`,
          `| norm: ${row.normStart.toFixed(3)} / ${row.normEnd.toFixed(3)}`,
          `| adjState: ${s.adjWrapState}`
        )
      }

      return row
    })

    console.table(rows)

    const changedCount = rows.filter(r => r.changed).length
    if (changedCount > 0) {
      console.warn(`${changedCount} segment(s) had selection changed by normalization`)
    } else {
      console.log(`No selection changes from normalization (all picks agree)`)
    }

    console.groupEnd()
    return rows
  }

  // Focused diagnostic for a single segment's adjacent pipeline — deep inspection for debugging (§ 9.12.10)
  static adjDebug(partialId, grid) {
    grid = grid || WrapperDebugOverlay._grid || GRID
    const segs = grid.allSimpleSubShapesSegs
    const matches = segs.filter(s => s.id.includes(partialId))

    if (matches.length === 0) {
      console.warn(`No segments matching "${partialId}"`)
      return null
    }
    if (matches.length > 1) {
      console.warn(`Multiple matches for "${partialId}":`, matches.map(s => s.id))
      console.log(`Using first match: ${matches[0].id}`)
    }

    const s = matches[0]
    const cellW = grid.cellSize.x
    const cellH = grid.cellSize.y

    console.group(`%c[adjDebug] ${s.id}`, 'color: lime; font-weight: bold')
    console.log(`cellSize: ${cellW.toFixed(2)}×${cellH.toFixed(2)} | cellRadius: ${grid.cellRadius}`)
    console.log(`isOutsideCorner: ${s.isOutsideCorner} | hasArc: ${s.hasArc} | arcRadius: ${s.arcRadius}`)
    console.log(`arcOrigin:`, s.arcOrigin?.toString())
    console.log(`endCorner: ${s.endCorner?.value} | end:`, s.end?.toString())

    // Adjacent wrapper info
    const adjW = s.adjacentWrapper
    console.log(`\n--- Adjacent Wrapper ---`)
    if (!adjW) {
      console.warn(`No adjacentWrapper assigned`)

      // Show why — inspect the full adj pipeline
      console.log(`adjDistanceObjs:`, s.adjDistanceObjs)
      console.log(`adjIntersectObjs:`, s.adjIntersectObjs)
      console.log(`adjWrapperObjsFinal:`, s.adjWrapperObjsFinal)

      // Show viable wrappers that pass/fail adj filters
      const viables = s.viableWrappers
      console.log(`viableWrappers (${viables?.length}):`, viables?.map(v => v.id))
      if (viables?.length > 0) {
        const sameFacing = viables.filter(v => s.hasSameFacingCorner(v))
        const notCoin = sameFacing.filter(v => !s.hasCoincidentCorner(v))
        const notColl = notCoin.filter(v => !s.hasCollinearCorner(v))
        console.log(`  sameFacing: ${sameFacing.length} | -coincident: ${notCoin.length} | -collinear: ${notColl.length}`)

        notColl.forEach(v => {
          const boundsOk = s.shape.neighborShapes.length === 0
            ? (v.minArcIsWithinThatCornerBounds?.(s) || s.minArcIsWithinThatCornerBounds?.(v))
            : (s.isOutsideCorner ? v.minArcIsWithinThatMaxArc?.(s) : s.minArcIsWithinThatMaxArc?.(v))
          const sizeOk = s.isOutsideCorner
            ? s.maxArcRadius > s.cellRadius
            : s.cellRadius < v.maxArcRadius
          console.log(
            `    ${v.id}: boundsOk=${boundsOk} sizeOk=${sizeOk}`,
            `| maxArcR: ${v.maxArcRadius?.toFixed(2)} cellR: ${s.cellRadius?.toFixed(2)}`
          )
        })
      }
    } else {
      console.log(`adjacentWrapper: ${adjW.id}`)
      console.log(`adjOutWrapper: ${s.adjOutWrapper?.id} | adjInWrapper: ${s.adjInWrapper?.id}`)
      console.log(`adjWrapState: ${s.adjWrapState} (0=equi, 1=div, 2=conv)`)

      // in/out assignment
      const inOuts = s.inOutAdjWrappers
      console.log(`inOutAdjWrappers: [${inOuts?.[0]?.id}, ${inOuts?.[1]?.id}]`)

      // Distance row
      const row = WrapperDebugOverlay._adjDistRow(s, adjW, cellW, cellH)
      console.log(`\n--- Distance Analysis ---`)
      console.log(`inWrapper: ${row._inWrapper} (isVert: ${row.inIsVert})`)
      console.log(`outWrapper: ${row._outWrapper}`)
      console.log(`vertDist (x-gap): ${row._vertDist?.toFixed(3)} | horDist (y-gap): ${row._horDist?.toFixed(3)}`)
      console.log(`rawStart: ${row.rawStart.toFixed(3)} | rawEnd: ${row.rawEnd.toFixed(3)} → pick: ${row.rawPick}`)
      console.log(`normStart: ${row.normStart.toFixed(3)} | normEnd: ${row.normEnd.toFixed(3)} → pick: ${row.normPick}`)
      if (row.changed) console.warn(`⚠️ SELECTION CHANGED by normalization: ${row.rawPick} → ${row.normPick}`)

      // Full adj pipeline objects
      console.log(`\n--- Full Pipeline ---`)
      console.log(`adjDistanceObjs:`, s.adjDistanceObjs)
      console.log(`adjIntersectObjs:`, s.adjIntersectObjs)
      console.log(`adjWrapperObjsFinal:`, s.adjWrapperObjsFinal)

      // wrapState details
      if (s.adjWrapState !== undefined) {
        const [inner, outer] = inOuts
        if (inner?.hasDiagonalCorner?.(outer)) {
          const outCorner = outer.end
          const inDist = inner.arcOrigin?.dist(outCorner)
          const outDist = outer.arcOrigin?.dist(outCorner)
          console.log(`\n--- wrapState (radiant) ---`)
          console.log(`outCorner:`, outCorner?.toString())
          console.log(`inDist: ${inDist?.toFixed(3)} | outDist: ${outDist?.toFixed(3)}`)
          console.log(`inDist ${inDist > outDist ? '>' : inDist < outDist ? '<' : '='} outDist → state: ${s.adjWrapState}`)
        } else {
          const obj = inner?.adjIntersectObjs?.[0]
          console.log(`\n--- wrapState (proximal) ---`)
          console.log(`intersectObj dist: ${obj?.dist?.toFixed(3)} | outer arcRadius: ${outer?.arcRadius?.toFixed(3)}`)
        }
      }

      // Neighbor context
      console.log(`\n--- Neighbors ---`)
      const neighbors = s.andNeighborsArray || [s]
      neighbors.forEach(n => {
        if (n.id === s.id) return
        console.log(`  ${n.id}: adjWrapper=${n.adjacentWrapper?.id || 'none'} adjState=${n.adjWrapState}`)
      })
    }

    console.log(`\nSegment object:`, s)
    console.groupEnd()
    return s
  }

  // Internal: compute distance row for one seg→wrapper pair
  static _adjDistRow(s, w, cellW, cellH) {
    const { inWrapper, outWrapper } = s.inOutWrapObjWith(w)
    const { horInSide, vertInSide, horOutSide, vertOutSide } = s.horVertInOutsSideObjWith(w)

    const vertDist = vertInSide.x - vertOutSide.x
    const horDist = horInSide.y - horOutSide.y
    const rawStart = inWrapper.isVertical ? vertDist : horDist
    const rawEnd = inWrapper.isVertical ? horDist : vertDist
    const normStart = inWrapper.isVertical
      ? Math.abs(vertDist / cellW) : Math.abs(horDist / cellH)
    const normEnd = inWrapper.isVertical
      ? Math.abs(horDist / cellH) : Math.abs(vertDist / cellW)

    const rawPick = Math.abs(rawStart) === Math.abs(rawEnd) ? 'both'
      : ((inWrapper.isOutsideCorner !== outWrapper.isOutsideCorner)
        ? (Math.abs(rawStart) < Math.abs(rawEnd) ? 'start' : 'end')
        : (Math.abs(rawStart) > Math.abs(rawEnd) ? 'start' : 'end'))
    const normPick = normStart === normEnd ? 'both'
      : ((inWrapper.isOutsideCorner !== outWrapper.isOutsideCorner)
        ? (normStart < normEnd ? 'start' : 'end')
        : (normStart > normEnd ? 'start' : 'end'))

    const changed = rawPick !== normPick

    return {
      seg: WrapperDebugOverlay._shortId(s),
      segId: s.id,
      wrapper: WrapperDebugOverlay._shortId(w),
      wrapperId: w.id,
      inIsVert: inWrapper.isVertical ? 'Y' : 'N',
      rawStart: +rawStart.toFixed(3),
      rawEnd: +rawEnd.toFixed(3),
      normStart: +normStart.toFixed(3),
      normEnd: +normEnd.toFixed(3),
      rawPick,
      normPick,
      changed: changed ? '⚠️' : '',
      adjState: s.adjWrapState,
      // extras for adjDebug
      _inWrapper: inWrapper.id,
      _outWrapper: outWrapper.id,
      _vertDist: vertDist,
      _horDist: horDist,
    }
  }

  // Quick wrapper relationship table
  static table(grid) {
    grid = grid || WrapperDebugOverlay._grid || GRID
    const segs = grid.allSimpleSubShapesSegs

    const rows = segs
      .filter(s =>
        s.coincidentWrapper || s.collinearWrapper || s.adjacentWrapper
        || s.radiantOutWrappers?.length > 0
      )
      .map(s => ({
        id: WrapperDebugOverlay._shortId(s),
        shape: s.shape?.id?.replace(/.*-/, '') || '?',
        out: s.isOutsideCorner ? 'OUT' : 'IN',
        arc: s.hasArc ? 'Y' : 'N',
        coin: s.coincidentWrapper ? WrapperDebugOverlay._shortId(s.coincidentWrapper) : '',
        coll: s.collinearWrapper ? WrapperDebugOverlay._shortId(s.collinearWrapper) : '',
        adj: s.adjacentWrapper ? WrapperDebugOverlay._shortId(s.adjacentWrapper) : '',
        radOut: s.radiantOutWrappers?.map(r => WrapperDebugOverlay._shortId(r)).join(',') || '',
        fState: s.flushWrapState ?? '',
        aState: s.adjWrapState ?? '',
        coinOut: s.coinOutWrapper ? 'Y' : '',
        coinIn: s.coinInWrapper ? 'Y' : '',
      }))

    console.table(rows)
    return rows
  }
}
