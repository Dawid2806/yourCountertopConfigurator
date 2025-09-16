import type { Point, Dimensions, LayoutType, LOrientation, Cutout, DividerElement } from "../types"

export function cmToPx(cm: number, scale = 1): number {
  return cm * 4 * scale // 1cm = 4px at scale 1 for better visibility without distortion
}

export function pxToCm(px: number, scale = 1): number {
  return px / 4 / scale
}

export function generatePolygon(
  layout: LayoutType,
  dimensions: Dimensions,
  orientation: LOrientation = "left-l",
): Point[] {
  const { length, depth, lengthA, lengthB, lengthLeft, lengthRight, gapWidth } = dimensions

  switch (layout) {
    case "prosty":
      if (!length || !depth) {
        return []
      }
      return [
        { x: 0, y: 0 },
        { x: length, y: 0 },
        { x: length, y: depth },
        { x: 0, y: depth },
      ]

    case "l-ksztaltny":
      if (!lengthA || !lengthB || !depth) {
        return []
      }

      if (orientation === "left-l") {
        // Left L: horizontal part (lengthA x depth), vertical part extends down (lengthB x depth)
        return [
          { x: 0, y: 0 },
          { x: lengthA, y: 0 },
          { x: lengthA, y: depth },
          { x: depth, y: depth }, // Only extend by depth width for the vertical part
          { x: depth, y: depth + lengthB }, // lengthB is the length of vertical arm
          { x: 0, y: depth + lengthB },
        ]
      } else {
        // Right L: horizontal part goes right, vertical part goes down from right side
        return [
          { x: 0, y: 0 },
          { x: lengthA, y: 0 },
          { x: lengthA, y: depth + lengthB },
          { x: lengthA - depth, y: depth + lengthB }, // Only subtract depth width
          { x: lengthA - depth, y: depth },
          { x: 0, y: depth },
        ]
      }

    case "u-ksztaltny":
      if (!depth) return []
      // Interpret dimensions.gapWidth as total top width (C)
      // Inner gap g = max(0, C - 2*depth)
      {
        const L = lengthLeft ?? 0
        const R = lengthRight ?? 0
        const C = gapWidth ?? 0
        const g = Math.max(0, C - 2 * depth)
        const outerW = C
        return [
          { x: 0, y: 0 }, // top-left outer
          { x: outerW, y: 0 }, // top-right outer
          { x: outerW, y: R + depth },
          { x: outerW - depth, y: R + depth },
          { x: outerW - depth, y: depth },
          { x: depth, y: depth }, // inner left top
          { x: depth, y: L + depth }, // inner left bottom
          { x: 0, y: L + depth }, // bottom of left arm (outer)
        ]
      }

    default:
      return []
  }
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      polygon[i].y > point.y !== polygon[j].y > point.y &&
      point.x <
        ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) / (polygon[j].y - polygon[i].y) + polygon[i].x
    ) {
      inside = !inside
    }
  }
  return inside
}

export function getDistanceToEdge(point: Point, polygon: Point[]): number {
  let minDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const distance = distancePointToLineSegment(point, polygon[i], polygon[j])
    minDistance = Math.min(minDistance, distance)
  }

  return minDistance
}

function distancePointToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

export function doRectanglesOverlap(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

export function calculateCutoutPosition(
  cutout: { offsetX: number; offsetY: number; referenceX: "lewo" | "prawo"; referenceY: "przod" | "tyl" },
  polygon: Point[],
): Point {
  if (polygon.length === 0) return { x: 0, y: 0 }

  // Get bounding box of polygon
  const minX = Math.min(...polygon.map((p) => p.x))
  const maxX = Math.max(...polygon.map((p) => p.x))
  const minY = Math.min(...polygon.map((p) => p.y))
  const maxY = Math.max(...polygon.map((p) => p.y))

  let x: number
  let y: number

  // Calculate X position
  if (cutout.referenceX === "lewo") {
    x = minX + cutout.offsetX
  } else {
    x = maxX - cutout.offsetX
  }

  // Calculate Y position
  if (cutout.referenceY === "przod") {
    y = minY + cutout.offsetY
  } else {
    y = maxY - cutout.offsetY
  }

  return { x, y }
}

export function isPointInCutout(point: Point, cutout: Cutout, polygon: Point[]): boolean {
  const cutoutPos = calculateCutoutPosition(cutout, polygon)
  const halfWidth = cutout.width / 2
  const halfDepth = cutout.depth / 2

  return (
    point.x >= cutoutPos.x - halfWidth &&
    point.x <= cutoutPos.x + halfWidth &&
    point.y >= cutoutPos.y - halfDepth &&
    point.y <= cutoutPos.y + halfDepth
  )
}

export function calculateOffsetsFromPosition(
  absolutePos: Point,
  polygon: Point[],
  referenceX: "lewo" | "prawo",
  referenceY: "przod" | "tyl",
): { offsetX: number; offsetY: number } {
  if (polygon.length === 0) return { offsetX: 0, offsetY: 0 }

  const minX = Math.min(...polygon.map((p) => p.x))
  const maxX = Math.max(...polygon.map((p) => p.x))
  const minY = Math.min(...polygon.map((p) => p.y))
  const maxY = Math.max(...polygon.map((p) => p.y))

  let offsetX: number
  let offsetY: number

  if (referenceX === "lewo") {
    offsetX = absolutePos.x - minX
  } else {
    offsetX = maxX - absolutePos.x
  }

  if (referenceY === "przod") {
    offsetY = absolutePos.y - minY
  } else {
    offsetY = maxY - absolutePos.y
  }

  return { offsetX: Math.max(0, offsetX), offsetY: Math.max(0, offsetY) }
}

export function generateSegmentPolygons(
  layout: LayoutType,
  dimensions: Dimensions,
  orientation: LOrientation = "left-l",
): { segmentId: string; name: string; polygon: Point[] }[] {
  const { length, depth, lengthA, lengthB, lengthLeft, lengthRight } = dimensions

  switch (layout) {
    case "prosty":
      if (!length || !depth) return []
      return [
        {
          segmentId: "main",
          name: "Główny",
          polygon: [
            { x: 0, y: 0 },
            { x: length, y: 0 },
            { x: length, y: depth },
            { x: 0, y: depth },
          ],
        },
      ]

    case "l-ksztaltny":
      if (!lengthA || !lengthB || !depth) return []

      if (orientation === "left-l") {
        // Rectangular segments (allowing overlap at the inner corner for simplicity)
        return [
          {
            segmentId: "A",
            name: "Segment A (poziomy)",
            polygon: [
              { x: 0, y: 0 },
              { x: lengthA, y: 0 },
              { x: lengthA, y: depth },
              { x: 0, y: depth },
            ],
          },
          {
            segmentId: "B",
            name: "Segment B (pionowy)",
            polygon: [
              { x: 0, y: depth },
              { x: depth, y: depth },
              { x: depth, y: depth + lengthB },
              { x: 0, y: depth + lengthB },
            ],
          },
        ]
      } else {
        return [
          {
            segmentId: "A",
            name: "Segment A (poziomy)",
            polygon: [
              { x: 0, y: 0 },
              { x: lengthA, y: 0 },
              { x: lengthA, y: depth },
              { x: 0, y: depth },
            ],
          },
          {
            segmentId: "B",
            name: "Segment B (pionowy)",
            polygon: [
              { x: lengthA - depth, y: depth },
              { x: lengthA, y: depth },
              { x: lengthA, y: depth + lengthB },
              { x: lengthA - depth, y: depth + lengthB },
            ],
          },
        ]
      }

    case "u-ksztaltny":
      if (!depth) return []
      {
        const L = lengthLeft ?? 0
        const R = lengthRight ?? 0
        const C = dimensions.gapWidth ?? 0 // treat as total top width
        const outerW = C
        return [
          {
            segmentId: "A",
            name: "Segment A (lewy)",
            polygon: [
              { x: 0, y: 0 },
              { x: depth, y: 0 },
              { x: depth, y: L + depth },
              { x: 0, y: L + depth },
            ],
          },
          {
            segmentId: "B",
            name: "Segment B (prawy)",
            polygon: [
              { x: outerW - depth, y: 0 },
              { x: outerW, y: 0 },
              { x: outerW, y: R + depth },
              { x: outerW - depth, y: R + depth },
            ],
          },
          {
            segmentId: "C",
            name: "Segment C (środkowy)",
            polygon: [
              { x: depth, y: 0 },
              { x: outerW - depth, y: 0 },
              { x: outerW - depth, y: depth },
              { x: depth, y: depth },
            ],
          },
        ]
      }

    default:
      return []
  }
}

export function generateSegmentPolygonsWithDividers(
  layout: LayoutType,
  dimensions: Dimensions,
  orientation: LOrientation = "left-l",
  dividers: DividerElement[] = [],
): { segmentId: string; name: string; polygon: Point[] }[] {
  // Get base segments without dividers
  const baseSegments = generateSegmentPolygons(layout, dimensions, orientation)

  if (!dividers || dividers.length === 0) {
    return baseSegments
  }

  const splitSegments: { segmentId: string; name: string; polygon: Point[] }[] = []

  baseSegments.forEach((segment) => {
    // Find dividers for this segment
    const segmentDividers = dividers
      .filter((d) => d.segmentId.toLowerCase() === segment.segmentId.toLowerCase())
      .sort((a, b) => a.position - b.position)

    if (segmentDividers.length === 0) {
      // No dividers, keep original segment
      splitSegments.push(segment)
      return
    }

    // Split segment based on dividers
    const polygon = segment.polygon
    if (polygon.length < 4) return

    // Calculate segment direction (assuming rectangular segments)
    const segmentStart = polygon[0]
    const segmentEnd = polygon[1]
    const segmentLength = Math.sqrt(
      Math.pow(segmentEnd.x - segmentStart.x, 2) + Math.pow(segmentEnd.y - segmentStart.y, 2),
    )

    let previousPosition = 0
    let segmentCounter = 0

    segmentDividers.forEach((divider, index) => {
      // Create segment from previous position to current divider
      if (divider.position > previousPosition) {
        const newSegmentId = generateNewSegmentId(segment.segmentId, segmentCounter)
        const newSegment = createSegmentBetweenPositions(
          polygon,
          previousPosition,
          divider.position,
          newSegmentId,
          segmentCounter,
        )
        if (newSegment) {
          splitSegments.push(newSegment)
          segmentCounter++
        }
      }

      previousPosition = divider.position
    })

    // Create final segment from last divider to end
    if (previousPosition < 1) {
      const newSegmentId = generateNewSegmentId(segment.segmentId, segmentCounter)
      const newSegment = createSegmentBetweenPositions(polygon, previousPosition, 1, newSegmentId, segmentCounter)
      if (newSegment) {
        splitSegments.push(newSegment)
      }
    }
  })

  return splitSegments
}

function generateNewSegmentId(originalId: string, counter: number): string {
  if (originalId.toLowerCase() === "main") {
    return counter === 0 ? "main" : `main-${counter + 1}`
  }

  // For A, B, C segments, generate sequential IDs
  const baseChar = originalId.toUpperCase().charCodeAt(0)
  return String.fromCharCode(baseChar + counter)
}

function createSegmentBetweenPositions(
  originalPolygon: Point[],
  startPos: number,
  endPos: number,
  segmentId: string,
  counter: number,
): { segmentId: string; name: string; polygon: Point[] } | null {
  if (originalPolygon.length < 4) return null

  // Assuming rectangular segments for simplicity
  const p1 = originalPolygon[0] // top-left
  const p2 = originalPolygon[1] // top-right
  const p3 = originalPolygon[2] // bottom-right
  const p4 = originalPolygon[3] // bottom-left

  // Calculate positions along the segment
  const startX = p1.x + (p2.x - p1.x) * startPos
  const endX = p1.x + (p2.x - p1.x) * endPos
  const startY = p1.y + (p2.y - p1.y) * startPos
  const endY = p1.y + (p2.y - p1.y) * endPos

  // Create new polygon for this segment portion
  const newPolygon: Point[] = [
    { x: startX, y: startY },
    { x: endX, y: endY },
    { x: endX + (p3.x - p2.x), y: endY + (p3.y - p2.y) },
    { x: startX + (p4.x - p1.x), y: startY + (p4.y - p1.y) },
  ]

  return {
    segmentId,
    name: `Segment ${segmentId}`,
    polygon: newPolygon,
  }
}
