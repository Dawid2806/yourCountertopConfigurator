import type { Point, Design } from "../types"
import { generatePolygon, cmToPx, calculateCutoutPosition } from "./geometry"
import { CONFIG } from "../config"
import { useSettingsStore } from "../store/settingsStore"

export interface DimensionLine {
  start: Point
  end: Point
  label: string
  offset: number
  type: "horizontal" | "vertical"
}

export function generateDimensionLines(design: Design): DimensionLine[] {
  const lines: DimensionLine[] = []
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)

  if (polygon.length === 0) return lines

  // Get bounding box
  const minX = Math.min(...polygon.map((p) => p.x))
  const maxX = Math.max(...polygon.map((p) => p.x))
  const minY = Math.min(...polygon.map((p) => p.y))
  const maxY = Math.max(...polygon.map((p) => p.y))

  // Units formatting based on current settings
  const { units, convertValue } = useSettingsStore.getState()
  const unitLabel = units === "cm" ? "cm" : units === "mm" ? "mm" : "in"
  const fmt = (cm: number) => {
    const v = convertValue(cm, "cm" as any, units as any)
    const num = units === "mm" ? Math.round(v) : Math.round(v * 100) / 100
    return `${num} ${unitLabel}`
  }

  // Overall dimensions
  switch (design.layout) {
    case "prosty":
      // Length dimension (horizontal)
      lines.push({
        start: { x: minX, y: minY },
        end: { x: maxX, y: minY },
        label: `${fmt(design.dimensions.length)}`,
        offset: -30,
        type: "horizontal",
      })

      // Depth dimension (vertical)
      lines.push({
        start: { x: minX, y: minY },
        end: { x: minX, y: maxY },
        label: `${fmt(design.dimensions.depth)}`,
        offset: -30,
        type: "vertical",
      })
      break

    case "l-ksztaltny":
      // Length A (horizontal segment)
      lines.push({
        start: { x: minX, y: minY },
        end: { x: design.dimensions.lengthA || 0, y: minY },
        label: `${fmt(design.dimensions.lengthA || 0)}`,
        offset: -30,
        type: "horizontal",
      })

      // Length B (vertical segment)
      if (design.orientation === "left-l") {
        // Length B (vertical segment on left side)
        lines.push({
          start: { x: minX, y: design.dimensions.depth || 0 },
          end: { x: minX, y: maxY },
          label: `${fmt(design.dimensions.lengthB || 0)}`,
          offset: -50,
          type: "vertical",
        })
      } else {
        // Length B (vertical segment on right side)
        lines.push({
          start: { x: design.dimensions.lengthA || 0, y: design.dimensions.depth || 0 },
          end: { x: design.dimensions.lengthA || 0, y: maxY },
          label: `${fmt(design.dimensions.lengthB || 0)}`,
          offset: 20,
          type: "vertical",
        })
      }

      // Depth (horizontal at top)
      lines.push({
        start: { x: minX, y: minY },
        end: { x: minX, y: design.dimensions.depth || 0 },
        label: `${fmt(design.dimensions.depth || 0)}`,
        offset: -30,
        type: "vertical",
      })
      break

    case "u-ksztaltny": {
      const d = design.dimensions.depth || 0
      const C = design.dimensions.gapWidth || 0 // treat as total top width
      const g = Math.max(0, C - 2 * d)
      // Main top dimension across entire width = C
      lines.push({
        start: { x: minX, y: minY },
        end: { x: maxX, y: minY },
        label: `${fmt(C)}`,
        offset: -30,
        type: "horizontal",
      })

      // Small side annotations for left/right depth
      if (d > 0) {
        lines.push({
          start: { x: minX, y: minY },
          end: { x: minX + d, y: minY },
          label: `${fmt(d)}`,
          offset: -18,
          type: "horizontal",
        })
        lines.push({
          start: { x: maxX - d, y: minY },
          end: { x: maxX, y: minY },
          label: `${fmt(d)}`,
          offset: -18,
          type: "horizontal",
        })
        // Inner gap annotation (optional smaller)
        lines.push({
          start: { x: minX + d, y: minY },
          end: { x: maxX - d, y: minY },
          label: `${fmt(g)}`,
          offset: -45,
          type: "horizontal",
        })
      }

      // Vertical arm lengths from under top bar
      lines.push({
        start: { x: minX, y: minY + d },
        end: { x: minX, y: minY + d + (design.dimensions.lengthLeft || 0) },
        label: `${fmt(design.dimensions.lengthLeft || 0)}`,
        offset: -30,
        type: "vertical",
      })
      lines.push({
        start: { x: maxX, y: minY + d },
        end: { x: maxX, y: minY + d + (design.dimensions.lengthRight || 0) },
        label: `${fmt(design.dimensions.lengthRight || 0)}`,
        offset: 20,
        type: "vertical",
      })
      break
    }
  }

  // Cutout dimensions
  design.cutouts.forEach((cutout) => {
    const pos = calculateCutoutPosition(cutout, polygon)

    // Cutout size label
    lines.push({
      start: { x: pos.x - cutout.width / 2, y: pos.y - cutout.depth / 2 },
      end: { x: pos.x + cutout.width / 2, y: pos.y - cutout.depth / 2 },
      label: `${fmt(cutout.width)}×${fmt(cutout.depth)}`,
      offset: -15,
      type: "horizontal",
    })

    // Position offsets
    const offsetLabel = `X: ${fmt(cutout.offsetX)} od ${cutout.referenceX === "lewo" ? "lewej" : "prawej"}, Y: ${fmt(cutout.offsetY)} od ${cutout.referenceY === "przod" ? "przodu" : "tyłu"}`

    // Add offset dimension lines
    if (cutout.referenceX === "lewo") {
      lines.push({
        start: { x: minX, y: pos.y },
        end: { x: pos.x, y: pos.y },
        label: `${fmt(cutout.offsetX)}`,
        offset: 15,
        type: "horizontal",
      })
    } else {
      lines.push({
        start: { x: pos.x, y: pos.y },
        end: { x: maxX, y: pos.y },
        label: `${fmt(cutout.offsetX)}`,
        offset: 15,
        type: "horizontal",
      })
    }

    if (cutout.referenceY === "przod") {
      lines.push({
        start: { x: pos.x, y: minY },
        end: { x: pos.x, y: pos.y },
        label: `${fmt(cutout.offsetY)}`,
        offset: 15,
        type: "vertical",
      })
    } else {
      lines.push({
        start: { x: pos.x, y: pos.y },
        end: { x: pos.x, y: maxY },
        label: `${fmt(cutout.offsetY)}`,
        offset: 15,
        type: "vertical",
      })
    }
  })

  return lines
}

export function drawDimensionLine(ctx: CanvasRenderingContext2D, line: DimensionLine, zoom: number) {
  const startPx = {
    x: cmToPx(line.start.x) + CONFIG.CANVAS_PADDING,
    y: cmToPx(line.start.y) + CONFIG.CANVAS_PADDING,
  }
  const endPx = {
    x: cmToPx(line.end.x) + CONFIG.CANVAS_PADDING,
    y: cmToPx(line.end.y) + CONFIG.CANVAS_PADDING,
  }

  ctx.strokeStyle = "#666666"
  ctx.lineWidth = 1
  ctx.fillStyle = "#333333"
  ctx.font = `${Math.max(10, Math.min(14, 12 * zoom))}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  if (line.type === "horizontal") {
    const y = startPx.y + line.offset

    // Extension lines
    ctx.beginPath()
    ctx.moveTo(startPx.x, startPx.y)
    ctx.lineTo(startPx.x, y)
    ctx.moveTo(endPx.x, endPx.y)
    ctx.lineTo(endPx.x, y)
    ctx.stroke()

    // Dimension line
    ctx.beginPath()
    ctx.moveTo(startPx.x, y)
    ctx.lineTo(endPx.x, y)
    ctx.stroke()

    // Arrowheads
    const arrowSize = 5
    ctx.beginPath()
    ctx.moveTo(startPx.x, y)
    ctx.lineTo(startPx.x + arrowSize, y - arrowSize / 2)
    ctx.lineTo(startPx.x + arrowSize, y + arrowSize / 2)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(endPx.x, y)
    ctx.lineTo(endPx.x - arrowSize, y - arrowSize / 2)
    ctx.lineTo(endPx.x - arrowSize, y + arrowSize / 2)
    ctx.closePath()
    ctx.fill()

    // Label
    const centerX = (startPx.x + endPx.x) / 2
    ctx.fillText(line.label, centerX, y - 8)
  } else {
    // vertical
    const x = startPx.x + line.offset

    // Extension lines
    ctx.beginPath()
    ctx.moveTo(startPx.x, startPx.y)
    ctx.lineTo(x, startPx.y)
    ctx.moveTo(endPx.x, endPx.y)
    ctx.lineTo(x, endPx.y)
    ctx.stroke()

    // Dimension line
    ctx.beginPath()
    ctx.moveTo(x, startPx.y)
    ctx.lineTo(x, endPx.y)
    ctx.stroke()

    // Arrowheads
    const arrowSize = 5
    ctx.beginPath()
    ctx.moveTo(x, startPx.y)
    ctx.lineTo(x - arrowSize / 2, startPx.y + arrowSize)
    ctx.lineTo(x + arrowSize / 2, startPx.y + arrowSize)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x, endPx.y)
    ctx.lineTo(x - arrowSize / 2, endPx.y - arrowSize)
    ctx.lineTo(x + arrowSize / 2, endPx.y - arrowSize)
    ctx.closePath()
    ctx.fill()

    // Label (rotated)
    const centerY = (startPx.y + endPx.y) / 2
    ctx.save()
    ctx.translate(x - 15, centerY)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(line.label, 0, 0)
    ctx.restore()
  }
}
