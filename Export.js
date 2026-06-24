//MARK: Export CLASS
// SIZE: 200 lines
// SVG/PNG download helpers. createSVGMarkup used by ProtoLayerObjects; raster export via guiDev / ProtoBatchDev.
class Export {

  // MARK: File export methods
  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static createSVGMarkup(svgElement) {
    const
      serializer = new XMLSerializer(),
      svgMarkup = serializer.serializeToString(svgElement)
    return svgMarkup
  }
  //METH:
  static exportSVG(svgMarkup, fileName) {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xmlcharset=utf-8' }),
      url = URL.createObjectURL(blob),
      link = document.createElement('a')

    link.href = url
    link.download = fileName
    link.click()

    URL.revokeObjectURL(url)
  }

  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static exportPNG(svgMarkup, fileName, width, height, scale = 1) {
    // DeBug.log("Starting exportPNG() function...")

    const canvas = document.createElement("canvas")
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext("2d")
    ctx.scale(scale, scale)

    const
      img = new Image(),
      svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }),
      svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl

    img.onload = function () {
      // DeBug.log("Image loaded...")                                                           //LOGGING:
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(function (blob) {
        // DeBug.log("Blob created...")                                                         //LOGGING:
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        // DeBug.log("Link clicked...")                                                         //LOGGING:

        URL.revokeObjectURL(url) // Revoke the Blob URL for the PNG
        URL.revokeObjectURL(svgUrl) // Revoke the Blob URL for the SVG
        DeBug.log(`PNG saved`)                                                                  //LOGGING:
      })
    }
  }

  // MARK: Frame Sequence Export
  //METH: exportFrames() : null : export a sequence of PNG frames rotating shadAngle 360° starting from startAngle
  static async exportFrames({
    size = vert(1000, 1800),
    totalFrames = 360,
    scale = 1,
    startAngle = 90,
    useDirectoryPicker = true,
    _dirHandle = null,        // Pre-acquired handle from ProtoBatch (bypasses picker)
    _hashPrefix = null,       // Custom prefix for batch filenames
  } = {}) {
    const degreesPerFrame = 360 / totalFrames
    const hash = tokenData.hash
    const trimmedHash = _hashPrefix || `${hash.slice(0, 4)}\u2026${hash.slice(-4)}`
    const date = getCurrentDateString()
    const padLength = String(totalFrames - 1).length
    const rezString = `${size.x * scale}x${size.y * scale}`
    const framesString = `${totalFrames}fr`

    // Pre-create a single canvas and context to reuse across all frames
    const canvas = document.createElement('canvas')
    canvas.width = size.x * scale
    canvas.height = size.y * scale
    const ctx = canvas.getContext('2d')

    // Use pre-acquired handle, or attempt to get one via picker
    let dirHandle = _dirHandle
    if (!dirHandle && useDirectoryPicker && window.showDirectoryPicker) {
      try {
        dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      } catch (e) {
        DeBug.warn(`Directory picker cancelled or unsupported, falling back to downloads`)
        dirHandle = null
      }
    }

    // Cache the SVG element reference
    const svgElement = FRAME.bleed.elt

    //ARROW: updateShadeAngle() : null : set shadAngle and update all filter offsets in place
    const updateShadeAngle = (angle) => {
      globalControls.shadAngle = angle % 360
      const shadVect = Shade.shadVect(globalControls.shadAngle)
      S.offsetElts.forEach(({ elt, mag }) => {
        elt.attribute('dx', shadVect.x * mag)
        elt.attribute('dy', shadVect.y * mag)
      })
    }

    //ARROW: renderFrame() : Promise<Blob> : serialize current SVG state and rasterize to a PNG blob
    const renderFrame = () => {
      return new Promise((resolve, reject) => {
        const svgMarkup = Export.createSVGMarkup(svgElement)
        const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        const img = new Image()

        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.save()
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0, size.x, size.y)
          ctx.restore()
          URL.revokeObjectURL(svgUrl)

          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          }, 'image/png')
        }

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl)
          reject(new Error('Failed to load SVG image'))
        }

        img.src = svgUrl
      })
    }

    //ARROW: saveBlob() : Promise<void> : save blob either to picked directory or as browser download
    const saveBlob = async (blob, fileName) => {
      if (dirHandle) {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        URL.revokeObjectURL(url)
        // Small delay to prevent browser from choking on rapid downloads
        await new Promise(r => setTimeout(r, 100))
      }
    }

    // Main export loop
    console.log(`Exporting ${totalFrames} frames at ${size.x}x${size.y} (scale ${scale})...`)
    const startTime = performance.now()

    //ARROW: formatAngle() : string : format angle, rounded to nearest relevant decimal
    const formatAngle = (angle) => {
      const normalized = ((angle % 360) + 360) % 360
      const rounded = roundToDec(normalized, 1)
      return Number.isInteger(rounded) ? `${rounded}deg` : `${rounded}deg`
    }

    for (let i = 0; i < totalFrames; i++) {
      const angle = startAngle + (i * degreesPerFrame)
      const frameNum = String(i).padStart(padLength, '0')
      const angleStr = formatAngle(angle)
      const fileName = `Prototypes-${trimmedHash}-${date}-fr${frameNum}of${totalFrames}-${angleStr}-${rezString}.png`

      updateShadeAngle(angle)

      // Allow a microtask/paint cycle so the DOM updates before serialization
      await new Promise(r => requestAnimationFrame(r))

      const blob = await renderFrame()
      await saveBlob(blob, fileName)

      if (i % 10 === 0 || i === totalFrames - 1) {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1)
        const pct = ((i + 1) / totalFrames * 100).toFixed(1)
        console.log(`Frame ${i + 1}/${totalFrames} (${pct}%) — ${elapsed}s elapsed`)
      }
    }

    // Restore original angle
    updateShadeAngle(startAngle)

    const totalTime = ((performance.now() - startTime) / 1000).toFixed(1)
    console.log(`Export complete: ${totalFrames} frames in ${totalTime}s`)
  }
}
