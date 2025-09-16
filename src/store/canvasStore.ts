import { create } from "zustand"
import { CONFIG } from "../config"
import type { Point } from "../types"

interface CanvasState {
  zoom: number
  pan: Point
  isDragging: boolean
  showGrid: boolean
  showRulers: boolean
  canvasEl: HTMLCanvasElement | null
  dragState: {
    isDraggingCutout: boolean
    draggedCutoutId: string | null
    dragOffset: Point
    lastMousePos: Point
  }
  segmentResize: {
    active: boolean
    segmentId: string | null
    startMouseCm: Point
    originalLengthCm: number
  }
  setZoom: (zoom: number) => void
  setPan: (pan: Point) => void
  setIsDragging: (isDragging: boolean) => void
  setShowGrid: (showGrid: boolean) => void
  setShowRulers: (showRulers: boolean) => void
  setCanvasEl: (el: HTMLCanvasElement | null) => void
  startCutoutDrag: (cutoutId: string, mousePos: Point, cutoutCenter: Point) => void
  updateCutoutDrag: (mousePos: Point) => void
  endCutoutDrag: () => void
  startSegmentResize: (segmentId: string, startMouseCm: Point, originalLengthCm: number) => void
  endSegmentResize: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  zoom: CONFIG.DEFAULT_ZOOM,
  pan: { x: 0, y: 0 },
  isDragging: false,
  showGrid: true,
  showRulers: true,
  canvasEl: null,
  dragState: {
    isDraggingCutout: false,
    draggedCutoutId: null,
    dragOffset: { x: 0, y: 0 },
    lastMousePos: { x: 0, y: 0 },
  },
  segmentResize: {
    active: false,
    segmentId: null,
    startMouseCm: { x: 0, y: 0 },
    originalLengthCm: 0,
  },

  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowRulers: (showRulers) => set({ showRulers }),
  setCanvasEl: (el) => set({ canvasEl: el }),

  startCutoutDrag: (cutoutId, mousePos, cutoutCenter) =>
    set({
      dragState: {
        isDraggingCutout: true,
        draggedCutoutId: cutoutId,
        dragOffset: {
          x: cutoutCenter.x - mousePos.x,
          y: cutoutCenter.y - mousePos.y,
        },
        lastMousePos: mousePos,
      },
    }),

  updateCutoutDrag: (mousePos) =>
    set((state) => ({
      dragState: {
        ...state.dragState,
        lastMousePos: mousePos,
      },
    })),

  endCutoutDrag: () =>
    set({
      dragState: {
        isDraggingCutout: false,
        draggedCutoutId: null,
        dragOffset: { x: 0, y: 0 },
        lastMousePos: { x: 0, y: 0 },
      },
    }),

  startSegmentResize: (segmentId, startMouseCm, originalLengthCm) =>
    set({ segmentResize: { active: true, segmentId, startMouseCm, originalLengthCm } }),
  endSegmentResize: () => set({ segmentResize: { active: false, segmentId: null, startMouseCm: { x: 0, y: 0 }, originalLengthCm: 0 } }),
}))
