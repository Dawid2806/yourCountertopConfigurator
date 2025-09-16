import type React from "react"
import type { Design } from "../types"
import { generatePolygon, calculateCutoutPosition } from "./geometry"

export function exportCanvasAsImage(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  format: "png" | "jpg" = "png",
): void {
  const canvas = canvasRef.current
  if (!canvas) {
    throw new Error("Canvas not found")
  }

  // Create a temporary canvas for export
  const exportCanvas = document.createElement("canvas")
  const exportCtx = exportCanvas.getContext("2d")
  if (!exportCtx) {
    throw new Error("Could not get canvas context")
  }

  // Set export canvas size (high resolution)
  exportCanvas.width = 1920
  exportCanvas.height = 1080

  // Fill with white background
  exportCtx.fillStyle = "#ffffff"
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

  // Copy the main canvas content
  exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height)

  // Export as image
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png"
  const quality = format === "jpg" ? 0.9 : undefined

  exportCanvas.toBlob(
    (blob) => {
      if (!blob) {
        throw new Error("Failed to create image blob")
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `kitchenTop-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    mimeType,
    quality,
  )
}

export function exportDesignAsHighResImage(design: Design, format: "png" | "jpg" = "png"): void {
  // Create a high-resolution canvas for export
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Set high resolution
  const scale = 4 // 4x resolution for crisp export
  canvas.width = 1920 * scale
  canvas.height = 1080 * scale
  ctx.scale(scale, scale)

  // Fill with white background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, 1920, 1080)

  // Generate polygon
  const polygon = generatePolygon(design.layout, design.dimensions, design.orientation)
  if (polygon.length === 0) return

  // Calculate bounds and centering
  const minX = Math.min(...polygon.map((p) => p.x))
  const maxX = Math.max(...polygon.map((p) => p.x))
  const minY = Math.min(...polygon.map((p) => p.y))
  const maxY = Math.max(...polygon.map((p) => p.y))

  const polygonWidth = maxX - minX
  const polygonHeight = maxY - minY

  const canvasWidth = 1920 - 200 // Leave margin
  const canvasHeight = 1080 - 200

  const scaleX = canvasWidth / polygonWidth
  const scaleY = canvasHeight / polygonHeight
  const drawScale = Math.min(scaleX, scaleY) * 0.8 // Leave some padding

  const offsetX = (1920 - polygonWidth * drawScale) / 2 - minX * drawScale
  const offsetY = (1080 - polygonHeight * drawScale) / 2 - minY * drawScale

  // Draw countertop
  const scaledPolygon = polygon.map((p) => ({
    x: p.x * drawScale + offsetX,
    y: p.y * drawScale + offsetY,
  }))

  ctx.fillStyle = design.style.type === "color" ? design.style.value : "#D2B48C"
  ctx.beginPath()
  ctx.moveTo(scaledPolygon[0].x, scaledPolygon[0].y)
  scaledPolygon.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = "#8B4513"
  ctx.lineWidth = 3
  ctx.stroke()

  // Draw cutouts
  design.cutouts.forEach((cutout) => {
    const cutoutPos = calculateCutoutPosition(cutout, polygon)
    const x = (cutoutPos.x - cutout.width / 2) * drawScale + offsetX
    const y = (cutoutPos.y - cutout.depth / 2) * drawScale + offsetY
    const width = cutout.width * drawScale
    const height = cutout.depth * drawScale

    // Draw cutout
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(x, y, width, height)
    ctx.strokeStyle = "#666666"
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // Label cutout
    ctx.fillStyle = "#333333"
    ctx.font = `${(16 * drawScale) / 100}px sans-serif`
    ctx.textAlign = "center"
    ctx.fillText(cutout.name, x + width / 2, y + height / 2)
  })

  // Add title
  ctx.fillStyle = "#333333"
  ctx.font = "bold 32px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(`Projekt Blatu - ${new Date().toLocaleDateString("pl-PL")}`, 960, 50)

  // Export
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png"
  const quality = format === "jpg" ? 0.9 : undefined

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        throw new Error("Failed to create image blob")
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `kitchenTop-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    mimeType,
    quality,
  )
}
