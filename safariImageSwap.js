// safariImageSwap.js
// ---------------------------------------------------------------------------
// Safari render-time UX module.
//
// Background (KNOWN-ISSUES § 9.15.6):
//   WebKit's pre-LBSE software SVG filter pipeline rasterizes our 19-filter
//   / 440-primitive scenes ~50–100× slower than Chromium (~10s vs ~150ms on
//   typical hashes). The earlier canvas-image-swap experiment confirmed
//   that rasterization cost is fixed regardless of where it happens, so
//   we no longer try to dodge it. Instead:
//
//   1. Show a fullscreen loading overlay during every build so the user
//      sees something polished instead of a blank/half-painted screen.
//   2. On Safari only: disable shadow animation after each build (the
//      filter rerasterization makes animation unwatchable), and display a
//      persistent "best viewed on Chrome desktop" notice.
//
// Public API (window.SafariCompatUX):
//   .isSafari          true if UA-detected Safari/WebKit
//   .showOverlay()     manually show the loading overlay
//   .hideOverlay()     manually hide it
//   .setMessage(str)   override the overlay message text
//
// Filename retained ("safariImageSwap") to avoid index.html churn — the
// module's role is now broader than the original swap experiment.
// ---------------------------------------------------------------------------

(function () {
  'use strict'

  //SECT: UA detection
  // True for desktop Safari and iOS Safari/WebKit; false for Chromium,
  // Firefox-on-iOS, Edge-on-iOS, Chrome-on-iOS.
  const ua = navigator.userAgent
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Android/i.test(ua)

  //SECT: DOM elements (lazy-created on first show)
  let _overlay = null
  let _notice = null
  // Hide token — bumped when a new build starts so a stale rAF chain from
  // a prior build doesn't yank the overlay early on the next one.
  let _hideToken = 0

  //FUNC: ensureStyles() : void
  // Inject the overlay CSS once. Kept inline so the module is fully
  // self-contained — drop the script tag, drop the feature.
  function ensureStyles() {
    if (document.getElementById('safari-ux-styles')) return
    const style = document.createElement('style')
    style.id = 'safari-ux-styles'
    style.textContent = `
      #safari-ux-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #1a1a1a;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        color: #d0d0d0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
          Helvetica, Arial, sans-serif;
        font-size: 14px;
        letter-spacing: 0.05em;
        opacity: 1;
        transition: opacity 0.4s ease-out;
        pointer-events: none;
      }
      #safari-ux-overlay.fade-out {
        opacity: 0;
      }
      #safari-ux-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(255, 255, 255, 0.12);
        border-top-color: rgba(255, 255, 255, 0.75);
        border-radius: 50%;
        animation: safari-ux-spin 1s linear infinite;
      }
      @keyframes safari-ux-spin {
        to { transform: rotate(360deg); }
      }
      #safari-ux-message {
        text-align: center;
        max-width: 28em;
        line-height: 1.5;
      }
      #safari-ux-message .primary {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        opacity: 0.85;
      }
      #safari-ux-message .secondary {
        display: block;
        margin-top: 1em;
        font-size: 12px;
        opacity: 0.55;
        text-transform: none;
        letter-spacing: 0.03em;
      }
      #safari-ux-notice {
        position: fixed;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9998;
        padding: 6px 14px;
        background: rgba(0, 0, 0, 0.65);
        color: rgba(255, 255, 255, 0.7);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
          Helvetica, Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 0.05em;
        border-radius: 4px;
        pointer-events: none;
        user-select: none;
      }
    `
    document.head.appendChild(style)
  }

  //FUNC: buildOverlay() : HTMLElement
  function buildOverlay() {
    ensureStyles()
    const el = document.createElement('div')
    el.id = 'safari-ux-overlay'
    const spinner = document.createElement('div')
    spinner.id = 'safari-ux-spinner'
    const msg = document.createElement('div')
    msg.id = 'safari-ux-message'
    msg.innerHTML = isSafari
      ? `<span class="primary">Rendering</span>
         <span class="secondary">
           Safari rendering can take 10+ seconds.<br>
           For the best experience, view on Chrome desktop.
         </span>`
      : `<span class="primary">Rendering</span>`
    el.appendChild(spinner)
    el.appendChild(msg)
    return el
  }

  //FUNC: buildNotice() : HTMLElement
  // Persistent footer notice shown only on Safari, after the overlay
  // fades out. Reminds the user the experience is degraded.
  function buildNotice() {
    ensureStyles()
    const el = document.createElement('div')
    el.id = 'safari-ux-notice'
    el.textContent =
      'Safari: animation disabled. View on Chrome desktop for full experience.'
    return el
  }

  //FUNC: showOverlay() : void
  function showOverlay() {
    _hideToken++ // invalidate any pending hide from a prior build
    if (!_overlay) _overlay = buildOverlay()
    _overlay.classList.remove('fade-out')
    if (!_overlay.parentNode) document.body.appendChild(_overlay)
  }

  //FUNC: hideOverlay() : void
  function hideOverlay() {
    if (!_overlay) return
    _overlay.classList.add('fade-out')
    // Remove from DOM after fade completes so it doesn't intercept
    // anything (it's already pointer-events:none, but clean is clean).
    const myToken = _hideToken
    setTimeout(() => {
      if (myToken !== _hideToken) return // a new build started
      if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay)
    }, 500)
  }

  //FUNC: showSafariNotice() : void
  // Insert the persistent footer notice. Idempotent.
  function showSafariNotice() {
    if (!isSafari) return
    if (!_notice) _notice = buildNotice()
    if (!_notice.parentNode) document.body.appendChild(_notice)
  }

  //FUNC: setMessage(str) : void
  // Override the overlay's primary message line. Useful for debugging or
  // for surfacing build-stage info.
  function setMessage(str) {
    if (!_overlay) _overlay = buildOverlay()
    const primary = _overlay.querySelector('.primary')
    if (primary) primary.textContent = str
  }

  //SECT: hook into ProtoBatch
  function installHooks() {
    if (typeof ProtoBatch === 'undefined') return false

    const origBuild = ProtoBatch.prototype.buildFromHash

    ProtoBatch.prototype.buildFromHash = function (hash) {
      // Show overlay synchronously BEFORE the build runs. The browser
      // commits a paint after this JS task returns, so the overlay will
      // be visible before the SVG starts its (slow) rasterization.
      showOverlay()

      const result = origBuild.apply(this, arguments)

      // Stop animation on Safari — bitmap-quality matters more than
      // motion when each frame costs 10s.
      if (isSafari && typeof globalControls !== 'undefined' && globalControls) {
        globalControls.animated = false
      }

      // Hide overlay after the SVG has had a chance to commit a paint.
      // 3× rAF gives the compositor time to flush:
      //   rAF1: build's DOM mutations are coalesced
      //   rAF2: paint cycle (slow on Safari — main thread blocks here)
      //   rAF3: post-paint, safe to fade out
      // On Chrome these all fire within ~50ms; on Safari rAF2 stalls
      // through the rasterization, which is exactly what we want.
      const myToken = _hideToken
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        if (myToken !== _hideToken) return // a newer build is in flight
        hideOverlay()
        showSafariNotice()
      })))

      return result
    }

    console.log(
      '[SafariCompatUX] hooks installed; isSafari =', isSafari,
    )

    // Backup keydown handler at the window level. p5's keyPressed() can
    // miss keys on Safari when focus drifts during a long synchronous
    // SVG paint or when key events queue up during the ~10s rasterization.
    // Listening on window directly bypasses focus quirks entirely.
    //
    // Uses CAPTURE phase so this handler runs BEFORE p5's document-level
    // keydown listener — that way we can stopImmediatePropagation() to
    // prevent double-firing through gui.js's keyPressed().
    //
    // Currently bound: 'n' (new seed) — extend here as needed.
    if (!window._safariUXKeyHookInstalled) {
      window._safariUXKeyHookInstalled = true
      window.addEventListener('keydown', (e) => {
        // Skip when typing in an input/contenteditable.
        const t = e.target
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        // Skip with modifiers (Cmd-N, etc. — leave to the browser).
        if (e.metaKey || e.ctrlKey || e.altKey) return
        if (e.key === 'n' || e.key === 'N') {
          if (typeof protoBatch !== 'undefined' && protoBatch) {
            e.preventDefault()
            e.stopImmediatePropagation()
            protoBatch.buildFromNewSeed()
          }
        }
      }, true) // capture
    }

    return true
  }

  if (!installHooks()) {
    document.addEventListener('DOMContentLoaded', installHooks)
  }

  //SECT: public API
  window.SafariCompatUX = {
    isSafari,
    showOverlay,
    hideOverlay,
    setMessage,
    showSafariNotice,
    hideSafariNotice: () => {
      if (_notice && _notice.parentNode) _notice.parentNode.removeChild(_notice)
    },
  }
})()
