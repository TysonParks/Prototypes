// PublicGenerator.js — Public-facing regen button (loaded only on the public branch)

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button')
  btn.id = 'regenBtn'
  btn.setAttribute('aria-label', 'Generate new artwork')
  btn.addEventListener('click', () => protoBatch.buildFromNewSeed())
  document.body.appendChild(btn)
})

// FUNC: positionRegenBtn()
// Called after each build to size/position the regen button below the frame.
function positionRegenBtn() {
  const btn = document.getElementById('regenBtn')
  if (!btn || !FRAME?.bleed?.elt || !BG?.elt) return
  const rect = FRAME.bleed.elt.getBoundingClientRect()
  const btnSize = rect.width * 0.12
  const btnZone = btnSize * 1.5
  BG.elt.style.paddingBottom = `${btnZone}px`
  btn.style.width = `${btnSize}px`
  btn.style.height = `${btnSize}px`
  btn.style.top = `${window.innerHeight - btnZone / 2}px`
}
