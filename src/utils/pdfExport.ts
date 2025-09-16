import { PDFDocument, rgb, StandardFonts, degrees, pushGraphicsState, popGraphicsState, moveTo, lineTo, closePath, clip, endPath } from "pdf-lib"
import type { Design } from "../types"
import { generatePolygon, calculateCutoutPosition, generateSegmentPolygons, isPointInPolygon } from "./geometry"
import { pl } from "../i18n/pl"
import { CONFIG } from "../config"
import { useCanvasStore } from "../store/canvasStore"

export async function generatePDF(design: Design): Promise<Uint8Array> {
  // pdf-lib StandardFonts use WinAnsi encoding; sanitize Polish diacritics
  const sanitizeWinAnsi = (text: string): string => {
    const map: Record<string, string> = {
      "ą": "a", "Ą": "A",
      "ć": "c", "Ć": "C",
      "ę": "e", "Ę": "E",
      "ł": "l", "Ł": "L",
      "ń": "n", "Ń": "N",
      "ó": "o", "Ó": "O",
      "ś": "s", "Ś": "S",
      "ź": "z", "Ź": "Z",
      "ż": "z", "Ż": "Z",
      "–": "-", "—": "-",
      "’": "'", "‚": "'",
      "„": '"', "”": '"',
      "×": "x",
    }
    return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–—’‚„”×]/g, ch => map[ch] ?? ch)
  }
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Title
  const title = `${pl.tytul} - ${new Date().toLocaleDateString("pl-PL")}`
  page.drawText(sanitizeWinAnsi(title), {
    x: 50,
    y: height - 50,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  // Drawing area
  const drawingArea = {
    x: 50,
    y: height - 400,
    width: width - 100,
    height: 300,
  }

  // Draw border
  page.drawRectangle({
    x: drawingArea.x,
    y: drawingArea.y,
    width: drawingArea.width,
    height: drawingArea.height,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  })

  // Try to embed a snapshot of the on-screen canvas for fidelity
  let snapshotPlaced = false
  let originalShowGrid: boolean | undefined = undefined
  try {
    const store = useCanvasStore.getState()
    originalShowGrid = store.showGrid
    // Temporarily hide grid and wait a frame to redraw
    store.setShowGrid(false)
    await new Promise((res) => requestAnimationFrame(() => res(null)))
    await new Promise((res) => setTimeout(res, 30))

    const canvas = useCanvasStore.getState().canvasEl
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      const img = await pdfDoc.embedPng(bytes)
      const imgW = img.width
      const imgH = img.height
      const scale = Math.min(drawingArea.width / imgW, drawingArea.height / imgH)
      const drawW = imgW * scale
      const drawH = imgH * scale
      const dx = drawingArea.x + (drawingArea.width - drawW) / 2
      const dy = drawingArea.y + (drawingArea.height - drawH) / 2
      page.drawImage(img, { x: dx, y: dy, width: drawW, height: drawH })
      snapshotPlaced = true
    }
  } catch (e) {
    // If canvas is tainted (CORS) or unavailable, fall back to vector rendering
    snapshotPlaced = false
  } finally {
    if (typeof originalShowGrid === 'boolean') {
      try { useCanvasStore.getState().setShowGrid(originalShowGrid) } catch {}
    }
  }

  // Generate and draw countertop (vector fallback)
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)
  if (!snapshotPlaced && polygon.length > 0) {
    // Calculate scale to fit drawing area
    const minX = Math.min(...polygon.map((p) => p.x))
    const maxX = Math.max(...polygon.map((p) => p.x))
    const minY = Math.min(...polygon.map((p) => p.y))
    const maxY = Math.max(...polygon.map((p) => p.y))

    const polygonWidth = maxX - minX
    const polygonHeight = maxY - minY

    const scaleX = (drawingArea.width - 40) / polygonWidth
    const scaleY = (drawingArea.height - 40) / polygonHeight
    const scale = Math.min(scaleX, scaleY)

    const offsetX = drawingArea.x + 20 + (drawingArea.width - 40 - polygonWidth * scale) / 2
    const offsetY = drawingArea.y + 20 + (drawingArea.height - 40 - polygonHeight * scale) / 2

    // Draw countertop polygon
    const scaledPolygon = polygon.map((p) => ({
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + (polygonHeight - (p.y - minY)) * scale, // Flip Y axis
    }))

    // Attempt texture fill by clipping and tiling image; fallback to solid color
    let textured = false
    if (design.style.type === 'texture') {
      try {
        const url = (design.style as any).value as string
        const res = await fetch(url)
        const bytes = new Uint8Array(await res.arrayBuffer())
        const isPng = url.toLowerCase().endsWith('.png')
        const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)

        // Clip to polygon
        // Build path operators
        // Compute bounding box of scaled polygon
        const minSX = Math.min(...scaledPolygon.map(p => p.x))
        const maxSX = Math.max(...scaledPolygon.map(p => p.x))
        const minSY = Math.min(...scaledPolygon.map(p => p.y))
        const maxSY = Math.max(...scaledPolygon.map(p => p.y))

        // Begin clip
        page.pushOperators(pushGraphicsState())
        page.pushOperators(moveTo(scaledPolygon[0].x, scaledPolygon[0].y))
        for (let i = 1; i < scaledPolygon.length; i++) {
          page.pushOperators(lineTo(scaledPolygon[i].x, scaledPolygon[i].y))
        }
        page.pushOperators(closePath(), clip(), endPath())

        // Tile image across bounding box
        const s = (design.style as any).textureScalePDF ?? CONFIG.TEXTURE.PDF_SCALE
        const rot = (design.style as any).textureRotationPDFDeg ?? CONFIG.TEXTURE.PDF_ROTATION_DEG
        const tileW = img.width * s
        const tileH = img.height * s
        const startX = Math.floor(minSX / tileW) * tileW
        const startY = Math.floor(minSY / tileH) * tileH
        for (let x = startX; x < maxSX; x += tileW) {
          for (let y = startY; y < maxSY; y += tileH) {
            page.drawImage(img, {
              x,
              y,
              width: tileW,
              height: tileH,
              rotate: degrees(rot),
            })
          }
        }

        // End clip
        page.pushOperators(popGraphicsState())
        textured = true
      } catch (e) {
        textured = false
      }
    }

    if (!textured) {
      // Solid color fallback using SVG path
      const path = `M ${scaledPolygon[0].x} ${scaledPolygon[0].y} ` +
        scaledPolygon.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z'
      page.drawSvgPath(path, {
        color: rgb(0.8, 0.7, 0.6),
        borderColor: rgb(0.5, 0.3, 0.1),
        borderWidth: 2,
      })
    } else {
      // Outline over texture using SVG path
      const path = `M ${scaledPolygon[0].x} ${scaledPolygon[0].y} ` +
        scaledPolygon.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z'
      page.drawSvgPath(path, {
        borderColor: rgb(0.5, 0.3, 0.1),
        borderWidth: 2,
      })
    }

    // Draw cutouts
    design.cutouts.forEach((cutout) => {
      const cutoutPos = calculateCutoutPosition(cutout, polygon)
      const cutoutX = offsetX + (cutoutPos.x - cutout.width / 2 - minX) * scale
      const cutoutY = offsetY + (polygonHeight - (cutoutPos.y + cutout.depth / 2 - minY)) * scale
      const cutoutWidth = cutout.width * scale
      const cutoutHeight = cutout.depth * scale

      // Draw cutout (hole)
      page.drawRectangle({
        x: cutoutX,
        y: cutoutY,
        width: cutoutWidth,
        height: cutoutHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.4, 0.4, 0.4),
        borderWidth: 1,
      })

      // Label cutout
      page.drawText(cutout.name, {
        x: cutoutX + cutoutWidth / 2 - cutout.name.length * 3,
        y: cutoutY + cutoutHeight / 2 - 4,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      })
    })

    // Draw dimensions
    drawPDFDimensions(page, font, design, scaledPolygon, scale, offsetX, offsetY, polygonHeight)
  }

  // Specifications table
  let tableY = drawingArea.y - 50

  page.drawText(pl.tabela, {
    x: 50,
    y: tableY,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  tableY -= 30

  // Helper: unit formatting
  const toInches = (cm: number) => cm / 2.54
  const toMillimeters = (cm: number) => cm * 10
  const fmt = (cm: number) => `${cm} cm (${toMillimeters(cm).toFixed(0)} mm, ${toInches(cm).toFixed(2)} in)`

  // Countertop specifications
  page.drawText(`${pl.blat}:`, {
    x: 50,
    y: tableY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  // Material preview (for textures)
  if (design.style.type === 'texture' && (design.style as any).preview) {
    try {
      const url = (design.style as any).preview as string
      const res = await fetch(url)
      const bytes = new Uint8Array(await res.arrayBuffer())
      const isPng = url.toLowerCase().endsWith('.png')
      const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
      const pw = 90
      const ph = 90
      page.drawImage(img, {
        x: width - pw - 50,
        y: tableY - ph + 5,
        width: pw,
        height: ph,
      })
      page.drawText(sanitizeWinAnsi('Podglad materialu'), {
        x: width - pw - 50,
        y: tableY + 5,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      // ignore preview failures
    }
  }

  tableY -= 20

  const layoutName =
    design.layout === "prosty" ? pl.prosty : design.layout === "l-ksztaltny" ? pl.lKsztaltny : pl.uKsztaltny

  page.drawText(sanitizeWinAnsi(`- Uklad: ${layoutName}`), {
    x: 70,
    y: tableY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })

  tableY -= 15

  // Dimensions (cm, mm, in)
  const dimText = getDimensionsTextWithUnits(design, fmt)
  page.drawText(sanitizeWinAnsi(`- Wymiary: ${dimText}`), {
    x: 70,
    y: tableY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })

  tableY -= 15

  page.drawText(sanitizeWinAnsi(`- Material: ${design.style.name}`), {
    x: 70,
    y: tableY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })

  tableY -= 30

  // Segments table (A/B[/C])
  const segments = generateSegmentPolygons(design.layout, design.dimensions, design.orientation)
  if (segments.length > 0) {
    page.drawText(sanitizeWinAnsi(`Segmenty:`), {
      x: 50,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    tableY -= 20
    if (design.layout === "u-ksztaltny") {
      const d = design.dimensions.depth || 0
      const C = design.dimensions.gapWidth || 0 // total top width
      const L = design.dimensions.lengthLeft || 0
      const R = design.dimensions.lengthRight || 0
      const order = ["A", "C", "B"]
      order.forEach((id) => {
        let len = 0, wid = 0
        if (id === "A") { len = L; wid = d }
        if (id === "B") { len = R; wid = d }
        if (id === "C") { len = C; wid = d }
        page.drawText(sanitizeWinAnsi(`- Segment ${id}: dlugosc ${fmt(len)}, szerokosc ${fmt(wid)}`), {
          x: 70,
          y: tableY,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        tableY -= 15
      })
    } else {
      segments.forEach((seg) => {
        const minX = Math.min(...seg.polygon.map((p) => p.x))
        const maxX = Math.max(...seg.polygon.map((p) => p.x))
        const minY = Math.min(...seg.polygon.map((p) => p.y))
        const maxY = Math.max(...seg.polygon.map((p) => p.y))
        const segLen = maxX - minX
        const segDepth = maxY - minY

        page.drawText(sanitizeWinAnsi(`- Segment ${seg.segmentId}: dlugosc ${fmt(segLen)}, szerokosc ${fmt(segDepth)}`), {
          x: 70,
          y: tableY,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        tableY -= 15
      })
    }
    tableY -= 10
  }

  // Cutouts table
  if (design.cutouts.length > 0) {
    page.drawText(sanitizeWinAnsi(`${pl.otwory}:`), {
      x: 50,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    tableY -= 20

    design.cutouts.forEach((cutout) => {
      const offsetText = `X: ${fmt(cutout.offsetX)} od ${cutout.referenceX === "lewo" ? "lewej" : "prawej"}, Y: ${fmt(cutout.offsetY)} od ${cutout.referenceY === "przod" ? "przodu" : "tylu"}`
      // determine segment label if applicable
      let segmentLabel = ""
      try {
        const poly = generatePolygon(design.layout, design.dimensions, design.orientation)
        const pos = calculateCutoutPosition(cutout as any, poly)
        const segHit = segments.find(s => isPointInPolygon(pos as any, s.polygon))
        if (segHit) segmentLabel = ` [Segment ${segHit.segmentId}]`
      } catch {}

      page.drawText(sanitizeWinAnsi(`- ${cutout.name}${segmentLabel}: ${fmt(cutout.width)} x ${fmt(cutout.depth)}`), {
        x: 70,
        y: tableY,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })

      tableY -= 12

      page.drawText(sanitizeWinAnsi(`  ${offsetText}`), {
        x: 70,
        y: tableY,
        size: 9,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })

      tableY -= 18
    })
  }

  // Footer note
  page.drawText(sanitizeWinAnsi(pl.nota), {
    x: 50,
    y: 50,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return pdfDoc.save()
}

function drawPDFDimensions(
  page: any,
  font: any,
  design: Design,
  scaledPolygon: Array<{ x: number; y: number }>,
  scale: number,
  offsetX: number,
  offsetY: number,
  polygonHeight: number,
) {
  // Draw basic dimensions based on layout
  switch (design.layout) {
    case "prosty":
      // Length dimension
      page.drawText(`${design.dimensions.length} cm`, {
        x: scaledPolygon[0].x + (scaledPolygon[1].x - scaledPolygon[0].x) / 2 - 20,
        y: scaledPolygon[0].y - 15,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Depth dimension
      page.drawText(`${design.dimensions.depth} cm`, {
        x: scaledPolygon[0].x - 30,
        y: scaledPolygon[0].y - (scaledPolygon[0].y - scaledPolygon[3].y) / 2,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      })
      break

    case "l-ksztaltny":
      page.drawText(`${design.dimensions.lengthA} cm`, {
        x: scaledPolygon[0].x + 20,
        y: scaledPolygon[0].y - 15,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      })
      break

    case "u-ksztaltny":
      page.drawText(`${design.dimensions.lengthLeft} cm`, {
        x: scaledPolygon[0].x + 10,
        y: scaledPolygon[0].y - 15,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      })
      break
  }
}

function getDimensionsText(design: Design): string {
  switch (design.layout) {
    case "prosty":
      return `${design.dimensions.length}×${design.dimensions.depth} cm`
    case "l-ksztaltny":
      return `${design.dimensions.lengthA}×${design.dimensions.lengthB}×${design.dimensions.depth} cm`
    case "u-ksztaltny":
      return `${design.dimensions.lengthLeft}+${design.dimensions.gapWidth}+${design.dimensions.lengthRight}×${design.dimensions.depth} cm`
    default:
      return ""
  }
}

function getDimensionsTextWithUnits(design: Design, fmt: (cm: number) => string): string {
  switch (design.layout) {
    case "prosty": {
      const { length, depth } = design.dimensions as any
      return `${fmt(length)} x ${fmt(depth)}`
    }
    case "l-ksztaltny": {
      const { lengthA, lengthB, depth } = design.dimensions as any
      return `A: ${fmt(lengthA)} | B: ${fmt(lengthB)} | Glebokosc: ${fmt(depth)}`
    }
    case "u-ksztaltny": {
      const { lengthLeft, gapWidth, lengthRight, depth } = design.dimensions as any
      const C = gapWidth || 0 // treat as total top width
      const g = Math.max(0, C - 2 * (depth || 0))
      return `Lewy: ${fmt(lengthLeft)} + C (gorna): ${fmt(C)} + Prawy: ${fmt(lengthRight)} x Glebokosc: ${fmt(depth)} (przerwa: ${fmt(g)})`
    }
    default:
      return ""
  }
}
