import type { Design } from "../types"
import { MATERIALS, CUTOUT_TYPES, PRICING } from "../constants"
import { generatePolygon } from "./geometry"

export interface PricingBreakdown {
  materialCost: number
  laborCost: number
  edgeCost: number
  cutoutCost: number
  subtotal: number
  vat: number
  total: number
  area: number
  edgeLength: number
}

export function calculatePricing(design: Design): PricingBreakdown {
  // Calculate area
  const area = calculateCountertopArea(design)

  // Calculate edge length
  const edgeLength = calculateEdgeLength(design)

  // Find material price
  const material = MATERIALS.find((m) => m.value === design.style.value && m.type === design.style.type)
  const materialPricePerSqm = material?.pricePerSqm || 120

  // Calculate costs
  const materialCost = area * materialPricePerSqm
  const laborCost = area * PRICING.LABOR_COST_PER_SQM
  const edgeCost = edgeLength * PRICING.EDGE_COST_PER_CM

  // Calculate cutout costs
  const cutoutCost = design.cutouts.reduce((total, cutout) => {
    const cutoutType = CUTOUT_TYPES[cutout.type]
    const cutoutPrice = cutoutType?.price || 0
    return total + cutoutPrice + PRICING.CUTTING_COST_PER_CUTOUT
  }, 0)

  const subtotal = materialCost + laborCost + edgeCost + cutoutCost
  const vat = subtotal * PRICING.VAT_RATE
  const total = subtotal + vat

  return {
    materialCost,
    laborCost,
    edgeCost,
    cutoutCost,
    subtotal,
    vat,
    total,
    area,
    edgeLength,
  }
}

function calculateCountertopArea(design: Design): number {
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)
  if (polygon.length === 0) return 0

  // Calculate area using shoelace formula
  let area = 0
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    area += polygon[i].x * polygon[j].y
    area -= polygon[j].x * polygon[i].y
  }
  area = Math.abs(area) / 2

  // Convert from cm² to m²
  return area / 10000
}

function calculateEdgeLength(design: Design): number {
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)
  if (polygon.length === 0) return 0

  let perimeter = 0
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const dx = polygon[j].x - polygon[i].x
    const dy = polygon[j].y - polygon[i].y
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }

  return perimeter
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatArea(area: number): string {
  return `${area.toFixed(2)} m²`
}

export function formatLength(length: number): string {
  return `${length.toFixed(0)} cm`
}
