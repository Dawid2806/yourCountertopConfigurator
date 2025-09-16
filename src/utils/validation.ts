import type { Design, ValidationError, Cutout } from "../types"
import {
  generatePolygon,
  calculateCutoutPosition,
  getDistanceToEdge,
  isPointInPolygon,
  doRectanglesOverlap,
  calculateOffsetsFromPosition,
} from "./geometry"
import { CONFIG } from "../config"

export function validateDesign(design: Design): ValidationError[] {
  const errors: ValidationError[] = []
  // Basic dimension validation
  if (design.layout === "u-ksztaltny") {
    const { depth, gapWidth, lengthLeft, lengthRight } = design.dimensions as any
    if (!depth || depth < 10) {
      errors.push({ id: "dim-depth", type: "dimension-invalid", message: "Głębokość musi być >= 10 cm" })
    }
    if (!gapWidth || gapWidth < 10) {
      errors.push({ id: "dim-gap", type: "dimension-invalid", message: "Szerokość przestrzeni (C) musi być >= 10 cm" })
    }
    if (!lengthLeft || lengthLeft < 10) {
      errors.push({ id: "dim-left", type: "dimension-invalid", message: "Długość lewego ramienia (A) musi być >= 10 cm" })
    }
    if (!lengthRight || lengthRight < 10) {
      errors.push({ id: "dim-right", type: "dimension-invalid", message: "Długość prawego ramienia (B) musi być >= 10 cm" })
    }
  }
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)

  if (polygon.length === 0) {
    return errors
  }

  // Validate each cutout
  design.cutouts.forEach((cutout, index) => {
    const cutoutPos = calculateCutoutPosition(cutout, polygon)

    // Check if cutout is within bounds
    const cutoutBounds = {
      minX: cutoutPos.x - cutout.width / 2,
      maxX: cutoutPos.x + cutout.width / 2,
      minY: cutoutPos.y - cutout.depth / 2,
      maxY: cutoutPos.y + cutout.depth / 2,
    }

    const corners = [
      { x: cutoutBounds.minX, y: cutoutBounds.minY },
      { x: cutoutBounds.maxX, y: cutoutBounds.minY },
      { x: cutoutBounds.maxX, y: cutoutBounds.maxY },
      { x: cutoutBounds.minX, y: cutoutBounds.maxY },
    ]

    // Check if all corners are inside polygon
    const outsideCorners = corners.filter((corner) => !isPointInPolygon(corner, polygon))
    if (outsideCorners.length > 0) {
      errors.push({
        id: `${cutout.id}-outside`,
        type: "outside-bounds",
        message: `${cutout.name} wykracza poza granice blatu`,
        position: cutoutPos,
      })
    }

    // Check minimum edge distance
    const minDistance = Math.min(...corners.map((corner) => getDistanceToEdge(corner, polygon)))

    if (minDistance < CONFIG.MIN_EDGE_DISTANCE / 10) {
      // Convert mm to cm
      errors.push({
        id: `${cutout.id}-edge`,
        type: "edge-distance",
        message: `${cutout.name} jest za blisko krawędzi (min. 3 cm)`,
        position: cutoutPos,
      })
    }

    // Check overlap with other cutouts
    design.cutouts.forEach((otherCutout, otherIndex) => {
      if (index >= otherIndex) return // Avoid duplicate checks

      const otherPos = calculateCutoutPosition(otherCutout, polygon)
      const rect1 = {
        x: cutoutPos.x - cutout.width / 2,
        y: cutoutPos.y - cutout.depth / 2,
        width: cutout.width,
        height: cutout.depth,
      }
      const rect2 = {
        x: otherPos.x - otherCutout.width / 2,
        y: otherPos.y - otherCutout.depth / 2,
        width: otherCutout.width,
        height: otherCutout.depth,
      }

      if (doRectanglesOverlap(rect1, rect2)) {
        errors.push({
          id: `${cutout.id}-${otherCutout.id}-overlap`,
          type: "overlap",
          message: `${cutout.name} nakłada się z ${otherCutout.name}`,
          position: {
            x: (cutoutPos.x + otherPos.x) / 2,
            y: (cutoutPos.y + otherPos.y) / 2,
          },
        })
      }
    })
  })

  return errors
}

export function getValidationSummary(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return "Wszystkie walidacje przeszły pomyślnie"
  }

  const edgeErrors = errors.filter((e) => e.type === "edge-distance").length
  const overlapErrors = errors.filter((e) => e.type === "overlap").length
  const boundsErrors = errors.filter((e) => e.type === "outside-bounds").length

  const parts = []
  if (edgeErrors > 0) parts.push(`${edgeErrors} błędów odległości od krawędzi`)
  if (overlapErrors > 0) parts.push(`${overlapErrors} nakładających się otworów`)
  if (boundsErrors > 0) parts.push(`${boundsErrors} otworów poza granicami`)

  return `Znaleziono ${errors.length} błędów: ${parts.join(", ")}`
}

export function getAutoFixSuggestion(error: ValidationError, design: Design): Cutout | null {
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)
  const cutout = design.cutouts.find((c) => error.id.includes(c.id))

  if (!cutout || !polygon.length) return null

  switch (error.type) {
    case "edge-distance":
      return fixEdgeDistanceError(cutout, polygon)
    case "outside-bounds":
      return fixOutsideBoundsError(cutout, polygon)
    case "overlap":
      return fixOverlapError(cutout, design, polygon)
    default:
      return null
  }
}

function fixEdgeDistanceError(cutout: Cutout, polygon: { x: number; y: number }[]): Cutout {
  // Move cutout towards center to maintain minimum edge distance
  const currentPos = calculateCutoutPosition(cutout, polygon)

  // Calculate polygon center
  const centerX = polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.x, 0) / polygon.length
  const centerY = polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.y, 0) / polygon.length

  // Move 5cm towards center
  const directionX = centerX - currentPos.x
  const directionY = centerY - currentPos.y
  const length = Math.sqrt(directionX * directionX + directionY * directionY)

  const newX = currentPos.x + (directionX / length) * 5
  const newY = currentPos.y + (directionY / length) * 5

  const newOffsets = calculateOffsetsFromPosition({ x: newX, y: newY }, polygon, cutout.referenceX, cutout.referenceY)

  return {
    ...cutout,
    offsetX: Math.round(newOffsets.offsetX),
    offsetY: Math.round(newOffsets.offsetY),
  }
}

function fixOutsideBoundsError(cutout: Cutout, polygon: { x: number; y: number }[]): Cutout {
  // Move cutout to center of polygon
  const centerX = polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.x, 0) / polygon.length
  const centerY = polygon.reduce((sum: number, p: { x: number; y: number }) => sum + p.y, 0) / polygon.length

  const newOffsets = calculateOffsetsFromPosition(
    { x: centerX, y: centerY },
    polygon,
    cutout.referenceX,
    cutout.referenceY,
  )

  return {
    ...cutout,
    offsetX: Math.round(newOffsets.offsetX),
    offsetY: Math.round(newOffsets.offsetY),
  }
}

function fixOverlapError(cutout: Cutout, design: Design, polygon: { x: number; y: number }[]): Cutout {
  // Find a position that doesn't overlap with other cutouts
  const otherCutouts = design.cutouts.filter((c) => c.id !== cutout.id)

  // Try positions in a grid pattern
  for (let offsetX = 10; offsetX < 100; offsetX += 10) {
    for (let offsetY = 10; offsetY < 50; offsetY += 10) {
      const testCutout = { ...cutout, offsetX, offsetY }
      const testPos = calculateCutoutPosition(testCutout, polygon)

      // Check if this position overlaps with any other cutout
      const hasOverlap = otherCutouts.some((other) => {
        const otherPos = calculateCutoutPosition(other, polygon)
        const rect1 = {
          x: testPos.x - cutout.width / 2,
          y: testPos.y - cutout.depth / 2,
          width: cutout.width,
          height: cutout.depth,
        }
        const rect2 = {
          x: otherPos.x - other.width / 2,
          y: otherPos.y - other.depth / 2,
          width: other.width,
          height: other.depth,
        }
        return doRectanglesOverlap(rect1, rect2)
      })

      if (!hasOverlap) {
        return { ...cutout, offsetX, offsetY }
      }
    }
  }

  // If no good position found, return original
  return cutout
}

export function canAutoFix(error: ValidationError): boolean {
  return ["edge-distance", "outside-bounds", "overlap"].includes(error.type)
}
