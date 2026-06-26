// DEV-ONLY: dynamic regen ('n' key) + rotation-aware dummy morph during hide/reveal.
// Load after RevealAnimation.js; excluded from Art Blocks submission bundle.

(function () {
  'use strict'

  if (typeof RevealAnim === 'undefined' || !RevealAnim._installDevRegen) return

  RevealAnim._installDevRegen(function (core) {
    const ROTATION_RELOAD_MODES = Object.freeze({
      NEUTRAL_RESET: 'neutral-reset',
      PRE_ROTATE_DUMMY: 'pre-rotate-dummy',
      HORIZONTAL_MORPH_RESET: 'horizontal-morph-reset',
    })

    let rotationReloadMode = ROTATION_RELOAD_MODES.NEUTRAL_RESET
    let _rebuildInFlight = true
    let _reloadRotationSnapshot = null
    let _neutralHorizontalHiddenPill = null

    function rotationReloadSnapshot() {
      if (_reloadRotationSnapshot) return _reloadRotationSnapshot
      if (typeof artworkRotationSnapshot !== 'function') {
        return { angle: 0, rawAngle: 0, scale: 1, isSideways: false }
      }
      return artworkRotationSnapshot()
    }

    function latchReloadRotationSnapshot() {
      _reloadRotationSnapshot = typeof artworkRotationSnapshot === 'function'
        ? artworkRotationSnapshot()
        : null
    }

    function clearReloadRotationSnapshot() {
      _reloadRotationSnapshot = null
      _neutralHorizontalHiddenPill = null
    }

    function normalizeReloadAngle(angle) {
      const n = Number(angle)
      if (!Number.isFinite(n)) return 0
      return ((Math.round(n / 90) * 90) % 360 + 360) % 360
    }

    function isNeutralHorizontalReloadActive() {
      const snap = rotationReloadSnapshot()
      return !core.isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET
        && snap.isSideways
    }

    function isPreRotatedReloadActive() {
      const snap = rotationReloadSnapshot()
      return !core.isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.PRE_ROTATE_DUMMY
        && snap.isSideways
    }

    function shouldResetRotationAfterHorizontalReload() {
      const snap = rotationReloadSnapshot()
      return !core.isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.HORIZONTAL_MORPH_RESET
        && snap.isSideways
    }

    function isUpsideDownReloadRotation() {
      return normalizeReloadAngle(rotationReloadSnapshot().angle) === 180
    }

    function captureNeutralHorizontalHiddenPill() {
      if (!isNeutralHorizontalReloadActive()) return
      const style = getComputedStyle(document.documentElement)
      const width = parseFloat(style.getPropertyValue('--dummy-pill-width'))
      const height = parseFloat(style.getPropertyValue('--dummy-pill-height'))
      if (!Number.isFinite(width) || !Number.isFinite(height)) return
      _neutralHorizontalHiddenPill = { width, height }
    }

    function shouldPreserveNeutralHorizontalHiddenPill() {
      const dummy = core.getDummy()
      return isNeutralHorizontalReloadActive()
        && dummy
        && !dummy.classList.contains('revealed')
    }

    function rotatedRectBaseFromVisual(left, top, width, height) {
      const cx = left + width / 2
      const cy = top + height / 2
      return {
        left: cx - height / 2,
        top: cy - width / 2,
        width: height,
        height: width,
      }
    }

    function rotateCornerRadii(radii, angle) {
      const deg = ((Math.round(angle / 90) * 90) % 360 + 360) % 360
      if (deg === 90) return { tl: radii.bl, tr: radii.tl, br: radii.tr, bl: radii.br }
      if (deg === 180) return { tl: radii.br, tr: radii.bl, br: radii.tl, bl: radii.tr }
      if (deg === 270) return { tl: radii.tr, tr: radii.br, br: radii.bl, bl: radii.tl }
      return radii
    }

    function prepRotationForReloadBuild() {
      if (rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET) {
        if (isUpsideDownReloadRotation()
          && typeof resetArtworkRotationToDefault === 'function') {
          resetArtworkRotationToDefault()
          clearReloadRotationSnapshot()
          core.updateLayoutVarsWithoutDummyTransition(core.defaultFrameMetrics)
        }
        return
      }
      if (!shouldResetRotationAfterHorizontalReload()) return
      if (typeof resetArtworkRotationToDefault === 'function') resetArtworkRotationToDefault()
      clearReloadRotationSnapshot()
      core.updateLayoutVarsWithoutDummyTransition(core.defaultFrameMetrics)
    }

    function syncArtworkRotationBeforeRevealLayout() {
      const shouldSync = isPreRotatedReloadActive()
        || (!core.isWebKitClass
          && rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET
          && rotationReloadSnapshot().isSideways)
      if (!shouldSync) return
      if (typeof syncArtworkRotationToViewport === 'function') syncArtworkRotationToViewport()
    }

    function setRotationReloadMode(value) {
      const next = String(value || '').toLowerCase()
      const allowed = Object.values(ROTATION_RELOAD_MODES)
      if (!allowed.includes(next)) {
        console.warn('[RevealAnim] unknown rotation reload mode:', value)
        return rotationReloadMode
      }
      rotationReloadMode = next
      core.updateLayoutVars(core.getCurrentMetrics())
      return rotationReloadMode
    }

    core.setUpdateLayoutVars(function updateLayoutVarsWithRotation(metrics = core.getCurrentMetrics()) {
      const root = document.documentElement.style
      const rotationSnap = rotationReloadSnapshot()
      const usePreRotatedDummy = !core.isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.PRE_ROTATE_DUMMY
        && rotationSnap.isSideways
      const useNeutralHorizontalDummy = !core.isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET
        && rotationSnap.isSideways
      const useHorizontalMorphReset = !core.isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.HORIZONTAL_MORPH_RESET
        && rotationSnap.isSideways

      let artLeft, artTop, artW, artH
      let artRadiiPx = null
      let uuToPxArt
      const elts = core.getMaskShapeElts()
      if (elts) {
        const rect = elts.pathElt.getBoundingClientRect()
        if (rect && rect.width > 0 && rect.height > 0) {
          artLeft = rect.left
          artTop = rect.top
          artW = rect.width
          artH = rect.height
          const radiiUu = core.measureCornerRadiiUu(elts.pathElt)
          if (radiiUu) {
            let bbox
            try { bbox = elts.pathElt.getBBox() } catch (_e) { bbox = null }
            if (bbox && bbox.width > 0) {
              const k = artW / bbox.width
              artRadiiPx = {
                tl: radiiUu.tl * k, tr: radiiUu.tr * k,
                br: radiiUu.br * k, bl: radiiUu.bl * k,
              }
            }
          }
        }
      }

      const fs = (typeof frameSize !== 'undefined' && frameSize)
        ? frameSize : core.computeFrameSize()
      let pillW = Math.min(fs.x * (9 / 11), window.innerWidth * 0.9)
      let pillH = pillW * (core.defaultFrameMetrics.height / core.defaultFrameMetrics.width)
      if (usePreRotatedDummy) {
        const visualW = Math.min(fs.y * (rotationSnap.scale || 1), window.innerWidth * 0.98)
        pillH = visualW
        pillW = visualW * (core.defaultFrameMetrics.width / core.defaultFrameMetrics.height)
      }
      if (useNeutralHorizontalDummy) {
        const visualW = Math.min(pillH, window.innerWidth * 0.98)
        pillW = visualW
        pillH = visualW * (core.defaultFrameMetrics.width / core.defaultFrameMetrics.height)
      } else if (useHorizontalMorphReset) {
        const baseW = pillW
        pillW = pillH
        pillH = baseW
      }
      let uuToPxPill = pillW / ((useNeutralHorizontalDummy || useHorizontalMorphReset)
        ? core.defaultFrameMetrics.height : core.defaultFrameMetrics.width)
      let pillLeft = (window.innerWidth - pillW) / 2
      let pillTop = (window.innerHeight - pillH) / 2
      let pillCx = pillLeft + pillW / 2
      let pillCy = pillTop + pillH / 2

      function syncPillPlacement() {
        uuToPxPill = pillW / ((useNeutralHorizontalDummy || useHorizontalMorphReset)
          ? core.defaultFrameMetrics.height : core.defaultFrameMetrics.width)
        pillLeft = (window.innerWidth - pillW) / 2
        pillTop = (window.innerHeight - pillH) / 2
        pillCx = pillLeft + pillW / 2
        pillCy = pillTop + pillH / 2
      }

      if (artW == null && typeof BG !== 'undefined' && BG && BG.elt) {
        const bgRect = BG.elt.getBoundingClientRect && BG.elt.getBoundingClientRect()
        if (bgRect && bgRect.width > 0 && bgRect.height > 0) {
          artLeft = bgRect.left
          artTop = bgRect.top
          artW = bgRect.width
          artH = bgRect.height
        }
      }

      if (artW == null) {
        artLeft = pillLeft; artTop = pillTop; artW = pillW; artH = pillH
        uuToPxArt = uuToPxPill
      } else {
        uuToPxArt = artW / metrics.width
      }
      if (!artRadiiPx) {
        const r = metrics.cornerRadii
        artRadiiPx = {
          tl: r.tl * uuToPxArt, tr: r.tr * uuToPxArt,
          br: r.br * uuToPxArt, bl: r.bl * uuToPxArt,
        }
      }

      if (usePreRotatedDummy && artW != null) {
        const baseRect = rotatedRectBaseFromVisual(artLeft, artTop, artW, artH)
        artLeft = baseRect.left
        artTop = baseRect.top
        artW = baseRect.width
        artH = baseRect.height
      } else if ((useNeutralHorizontalDummy || useHorizontalMorphReset) && artRadiiPx) {
        artRadiiPx = rotateCornerRadii(artRadiiPx, rotationSnap.angle)
      }

      if (useNeutralHorizontalDummy && artW != null && artW > pillW) {
        pillW = Math.min(artW, window.innerWidth * 0.98)
        pillH = pillW * (core.defaultFrameMetrics.width / core.defaultFrameMetrics.height)
        syncPillPlacement()
      }

      if (useNeutralHorizontalDummy
        && shouldPreserveNeutralHorizontalHiddenPill()
        && _neutralHorizontalHiddenPill) {
        pillW = Math.min(_neutralHorizontalHiddenPill.width, window.innerWidth * 0.98)
        pillH = _neutralHorizontalHiddenPill.height
        syncPillPlacement()
      }

      root.setProperty('--dummy-rotation', `${usePreRotatedDummy ? rotationSnap.angle : 0}deg`)
      root.setProperty('--dummy-pill-left', `${pillLeft}px`)
      root.setProperty('--dummy-pill-top', `${pillTop}px`)
      root.setProperty('--dummy-pill-width', `${pillW}px`)
      root.setProperty('--dummy-pill-height', `${pillH}px`)
      root.setProperty('--dummy-pill-radius', `${Math.min(pillW, pillH) / 2}px`)
      root.setProperty('--dummy-art-left', `${artLeft}px`)
      root.setProperty('--dummy-art-top', `${artTop}px`)
      root.setProperty('--dummy-art-width', `${artW}px`)
      root.setProperty('--dummy-art-height', `${artH}px`)
      root.setProperty('--dummy-art-radius-tl', `${artRadiiPx.tl}px`)
      root.setProperty('--dummy-art-radius-tr', `${artRadiiPx.tr}px`)
      root.setProperty('--dummy-art-radius-br', `${artRadiiPx.br}px`)
      root.setProperty('--dummy-art-radius-bl', `${artRadiiPx.bl}px`)

      const artCx = artLeft + artW / 2
      const artCy = artTop + artH / 2
      const safariHiddenDx = pillCx - artCx
      const safariHiddenDy = pillCy - artCy
      const safariHiddenScaleX = artW > 0 ? (pillW / artW) * core.hiddenScale : core.hiddenScale
      const safariHiddenScaleY = artH > 0 ? (pillH / artH) * core.hiddenScale : core.hiddenScale
      root.setProperty('--dummy-safari-hidden-dx', `${safariHiddenDx}px`)
      root.setProperty('--dummy-safari-hidden-dy', `${safariHiddenDy}px`)
      root.setProperty('--dummy-safari-hidden-scale-x', `${safariHiddenScaleX}`)
      root.setProperty('--dummy-safari-hidden-scale-y', `${safariHiddenScaleY}`)

      const activeBlurUserUnits = core.isWebKitClass ? core.safariBlurUserUnits : core.blurUserUnits
      const revealBlurPx = Math.max(0, activeBlurUserUnits * uuToPxPill)
      root.setProperty('--reveal-blur', `${revealBlurPx}px`)
      document.documentElement.classList.toggle('reveal-no-blur', revealBlurPx <= 0)

      root.setProperty('--loading-text-size',
        `${core.loadingTextSizeUserUnits * uuToPxPill}px`)
      root.setProperty('--loading-text-shadow-y',
        `${core.loadingTextShadowOffsetUserUnits * uuToPxPill}px`)
      root.setProperty('--loading-text-shadow-blur',
        `${core.loadingTextShadowBlurUserUnits * uuToPxPill}px`)

      core.setCurrentMetrics(metrics)
    })

    function prepareHideLayout() {
      latchReloadRotationSnapshot()
      if (typeof BG !== 'undefined' && BG && BG.elt) core.setFrameElt(BG.elt)
      core.setCurrentMetrics(core.getCurrentFrameMetrics())
      if (isPreRotatedReloadActive()) {
        core.updateLayoutVarsWithoutDummyTransition(core.getCurrentMetrics())
      } else {
        core.updateLayoutVars(core.getCurrentMetrics())
      }
    }

    const baseHideNow = RevealAnim.hideNow

    function hideNow() {
      if (core.isWebKitClass) return
      prepareHideLayout()
      baseHideNow()
    }

    function installRegenKeyHandler() {
      if (window._revealKeyHookInstalled) return
      window._revealKeyHookInstalled = true
      window.addEventListener('keydown', (e) => {
        const t = e.target
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        if (e.metaKey || e.ctrlKey || e.altKey) return
        if (e.key !== 'n' && e.key !== 'N') return
        if (core.isWebKitClass) {
          e.preventDefault()
          e.stopImmediatePropagation()
          return
        }
        if (typeof protoBatch === 'undefined' || !protoBatch) return
        if (_rebuildInFlight) {
          e.preventDefault()
          e.stopImmediatePropagation()
          return
        }
        _rebuildInFlight = true
        e.preventDefault()
        e.stopImmediatePropagation()
        const started = RevealAnim.transitionToHash?.(() => {
          if (typeof protoBatch !== 'undefined' && protoBatch) {
            prepRotationForReloadBuild()
            protoBatch.buildFromNewSeed()
          }
        })
        if (!started) _rebuildInFlight = false
      }, true)
    }

    core.setDevHooks({
      shouldPreserveHiddenPill: shouldPreserveNeutralHorizontalHiddenPill,
      prepareHideLayout,
      captureHiddenPill: captureNeutralHorizontalHiddenPill,
      beforeRevealLayoutSync: syncArtworkRotationBeforeRevealLayout,
      onRevealComplete: () => {
        _rebuildInFlight = false
        clearReloadRotationSnapshot()
      },
      installRegenKeyHandler,
    })

    core.exposeDevApi({
      rotationReloadModes: ROTATION_RELOAD_MODES,
      get rotationReloadMode() { return rotationReloadMode },
      setRotationReloadMode,
      hideNow,
    })

    installRegenKeyHandler()
  })
})()
