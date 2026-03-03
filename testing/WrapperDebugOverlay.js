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
    collinear:  `rgba(60, 180, 255, 0.9)`,       // blue
    adjacent:   `rgba(60, 255, 120, 0.9)`,       // green
    radiant:    `rgba(255, 180, 60, 0.9)`,       // orange
    segLabel:   `rgba(255, 255, 255, 0.85)`,     // white
    segDot:     `rgba(255, 255, 0, 0.9)`,        // yellow (corner dot)
    inWrapper:  `rgba(180, 60, 255, 0.9)`,       // purple
    outWrapper: `rgba(255, 120, 60, 0.9)`,       // coral
    arcOrigin:  `rgba(0, 255, 200, 0.6)`,        // cyan
    bgPill:     `rgba(0, 0, 0, 0.6)`,            // label background
  }

  //MARK: Toggle
  static toggle(grid) {
    if (!grid) { console.warn(`WrapperDebugOverlay: no grid provided`); return }
    WrapperDebugOverlay._grid = grid
    if (WrapperDebugOverlay._visible) {
      WrapperDebugOverlay.hide()
    } else {
      WrapperDebugOverlay.show(grid)
    }
  }

  static show(grid) {
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

    // Draw in layers: connections first, then dots/labels on top
    WrapperDebugOverlay._drawConnections(g, segs)
    WrapperDebugOverlay._drawRadiantConnections(g, segs)
    WrapperDebugOverlay._drawCornerDots(g, segs)
    WrapperDebugOverlay._drawCornerLabels(g, segs)
    WrapperDebugOverlay._drawLegend(g)

    console.log(`%c[WrapperDebugOverlay] ON — ${segs.length} segments`, 'color: lime')
    WrapperDebugOverlay._logSummary(segs)
  }

  static hide() {
    WrapperDebugOverlay._visible = false
    const existing = document.getElementById('wrapper-debug-overlay')
    if (existing) existing.remove()
    WrapperDebugOverlay._overlayGroup = null
    console.log(`%c[WrapperDebugOverlay] OFF`, 'color: gray')
  }

  //MARK: Drawing — Connections (Flush + Adjacent)
  static _drawConnections(g, segs) {
    const drawn = new Set()
    const C = WrapperDebugOverlay.colors

    segs.forEach(seg => {
      // Coincident wrapper — true coincident only (shared vertex + collinear overlap)
      // Diagonal/radiant pairs are drawn separately in _drawRadiantConnections
      if (seg.coincidentWrapper) {
        const w = seg.coincidentWrapper
        const key = WrapperDebugOverlay._pairKey(seg, w)
        if (!drawn.has(key)) {
          drawn.add(key)
          WrapperDebugOverlay._drawWrapperLine(g, seg, w, C.coincident, 'coin')
        }
      }
      // Collinear wrapper (non-coincident flush)
      if (seg.collinearWrapper && !seg.coincidentWrapper) {
        const key = WrapperDebugOverlay._pairKey(seg, seg.collinearWrapper)
        if (!drawn.has(key)) {
          drawn.add(key)
          WrapperDebugOverlay._drawWrapperLine(g, seg, seg.collinearWrapper, C.collinear, 'coll')
        }
      }
      // Adjacent wrapper
      if (seg.adjacentWrapper) {
        const key = WrapperDebugOverlay._pairKey(seg, seg.adjacentWrapper)
        if (!drawn.has(key)) {
          drawn.add(key)
          WrapperDebugOverlay._drawWrapperLine(g, seg, seg.adjacentWrapper, C.adjacent, 'adj')
        }
      }
    })
  }

  //MARK: Drawing — Radiant/Diagonal Connections
  static _drawRadiantConnections(g, segs) {
    const drawn = new Set()
    const C = WrapperDebugOverlay.colors

    segs.forEach(seg => {
      const radOuts = seg.radiantOutWrappers
      if (radOuts && radOuts.length > 0) {
        radOuts.forEach(rw => {
          const key = WrapperDebugOverlay._pairKey(seg, rw)
          if (!drawn.has(key)) {
            drawn.add(key)
            WrapperDebugOverlay._drawWrapperLine(g, seg, rw, C.radiant, 'rad')
          }
        })
      }
    })
  }

  static _drawWrapperLine(g, segA, segB, color, label) {
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
    line.setAttribute('stroke-width', '0.3')
    line.setAttribute('stroke-dasharray', '1 0.5')
    line.setAttribute('opacity', '0.8')
    g.appendChild(line)

    // Midpoint label
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    WrapperDebugOverlay._drawMicroLabel(g, mx, my, label, color, 0.8)
  }

  //MARK: Drawing — Corner Dots
  static _drawCornerDots(g, segs) {
    const C = WrapperDebugOverlay.colors

    segs.forEach(seg => {
      const ex = seg.end.x
      const ey = seg.end.y

      // Determine dot color based on wrapper status
      let dotColor = C.segDot
      if (seg.coincidentWrapper) dotColor = C.coincident
      else if (seg.collinearWrapper) dotColor = C.collinear
      else if (seg.adjacentWrapper) dotColor = C.adjacent

      // Corner dot
      const circle = document.createElementNS(xmlns, 'circle')
      circle.setAttribute('cx', ex)
      circle.setAttribute('cy', ey)
      circle.setAttribute('r', '0.4')
      circle.setAttribute('fill', dotColor)
      circle.setAttribute('stroke', 'black')
      circle.setAttribute('stroke-width', '0.1')
      g.appendChild(circle)

      // In/Out indicator
      if (seg.isOutsideCorner) {
        // Small "O" ring for outside corners
        const ring = document.createElementNS(xmlns, 'circle')
        ring.setAttribute('cx', ex)
        ring.setAttribute('cy', ey)
        ring.setAttribute('r', '0.7')
        ring.setAttribute('fill', 'none')
        ring.setAttribute('stroke', C.outWrapper)
        ring.setAttribute('stroke-width', '0.15')
        g.appendChild(ring)
      } else {
        // Small filled inner dot for inside corners
        const inner = document.createElementNS(xmlns, 'circle')
        inner.setAttribute('cx', ex)
        inner.setAttribute('cy', ey)
        inner.setAttribute('r', '0.2')
        inner.setAttribute('fill', C.inWrapper)
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
  static _drawCornerLabels(g, segs) {
    const C = WrapperDebugOverlay.colors
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
      pill.setAttribute('fill', C.bgPill)
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
  static _drawLegend(g) {
    const C = WrapperDebugOverlay.colors
    const entries = [
      { label: 'Coincident', color: C.coincident },
      { label: 'Collinear', color: C.collinear },
      { label: 'Adjacent', color: C.adjacent },
      { label: 'Radiant', color: C.radiant },
      { label: 'OutCorner ○', color: C.outWrapper },
      { label: 'InCorner ●', color: C.inWrapper },
      { label: 'ArcOrigin', color: C.arcOrigin },
    ]

    // Legend background
    const lx = -4, ly = -9
    const lbg = document.createElementNS(xmlns, 'rect')
    lbg.setAttribute('x', lx)
    lbg.setAttribute('y', ly)
    lbg.setAttribute('width', 18)
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
      text.textContent = entry.label
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
  static _logSummary(segs) {
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
