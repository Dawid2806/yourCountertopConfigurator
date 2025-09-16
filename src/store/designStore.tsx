"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { Design, LayoutType, LOrientation, Cutout, CountertopStyle, Dimensions, DividerElement } from "../types"
import { MATERIALS } from "../constants"

interface DesignState {
  design: Design
}

type DesignAction =
  | { type: "SET_LAYOUT"; payload: LayoutType }
  | { type: "SET_ORIENTATION"; payload: LOrientation }
  | { type: "SET_DIMENSIONS"; payload: Partial<Dimensions> }
  | { type: "SET_STYLE"; payload: CountertopStyle }
  | { type: "SET_SEGMENT_STYLE"; payload: { segmentId: string; style: CountertopStyle } }
  | { type: "RESET_SEGMENT_STYLES" }
  | { type: "ADD_CUTOUT"; payload: Omit<Cutout, "id"> }
  | { type: "UPDATE_CUTOUT"; payload: { id: string; updates: Partial<Cutout> } }
  | { type: "REMOVE_CUTOUT"; payload: string }
  | { type: "ADD_DIVIDER"; payload: Omit<DividerElement, "id"> }
  | { type: "UPDATE_DIVIDER"; payload: { id: string; updates: Partial<DividerElement> } }
  | { type: "REMOVE_DIVIDER"; payload: string }
  | { type: "RESET_DESIGN" }
  | { type: "LOAD_DESIGN"; payload: Design }

const defaultDesign: Design = {
  layout: "prosty",
  orientation: "left-l",
  dimensions: {
    length: 300,
    depth: 60,
  },
  style: MATERIALS[0],
  cutouts: [],
  dividers: [],
}

const initialState: DesignState = {
  design: defaultDesign,
}

function designReducer(state: DesignState, action: DesignAction): DesignState {
  switch (action.type) {
    case "SET_LAYOUT": {
      const newDesign = { ...state.design, layout: action.payload }

      // Set appropriate default dimensions based on layout
      if (action.payload === "l-ksztaltny") {
        newDesign.dimensions = {
          ...state.design.dimensions,
          lengthA: state.design.dimensions.lengthA || 200,
          lengthB: state.design.dimensions.lengthB || 150,
          depth: state.design.dimensions.depth || 60,
        }
      } else if (action.payload === "u-ksztaltny") {
        newDesign.dimensions = {
          ...state.design.dimensions,
          lengthLeft: state.design.dimensions.lengthLeft || 150,
          lengthRight: state.design.dimensions.lengthRight || 150,
          gapWidth: state.design.dimensions.gapWidth || 100,
          depth: state.design.dimensions.depth || 60,
        }
      } else if (action.payload === "prosty") {
        newDesign.dimensions = {
          ...state.design.dimensions,
          length: state.design.dimensions.length || 300,
          depth: state.design.dimensions.depth || 60,
        }
      }

      return { design: newDesign }
    }
    case "SET_ORIENTATION":
      return {
        design: { ...state.design, orientation: action.payload },
      }
    case "SET_DIMENSIONS":
      return {
        design: {
          ...state.design,
          dimensions: { ...state.design.dimensions, ...action.payload },
        },
      }
    case "SET_STYLE":
      return {
        design: { ...state.design, style: action.payload },
      }
    case "SET_SEGMENT_STYLE": {
      const { segmentId, style } = action.payload
      const currentSegmentStyles = state.design.segmentStyles || []

      const updatedSegmentStyles = currentSegmentStyles.some((s) => s.segmentId === segmentId)
        ? currentSegmentStyles.map((s) => (s.segmentId === segmentId ? { ...s, style } : s))
        : [
            ...currentSegmentStyles,
            {
              segmentId,
              name: segmentId === "main" ? "Główny" : segmentId.toUpperCase(),
              style,
            },
          ]

      return {
        design: {
          ...state.design,
          segmentStyles: updatedSegmentStyles,
        },
      }
    }

    case "RESET_SEGMENT_STYLES":
      return {
        design: {
          ...state.design,
          segmentStyles: undefined,
        },
      }

    case "ADD_CUTOUT":
      return {
        design: {
          ...state.design,
          cutouts: [...state.design.cutouts, { ...action.payload, id: Date.now().toString() }],
        },
      }
    case "UPDATE_CUTOUT":
      return {
        design: {
          ...state.design,
          cutouts: state.design.cutouts.map((c) =>
            c.id === action.payload.id ? { ...c, ...action.payload.updates } : c,
          ),
        },
      }
    case "REMOVE_CUTOUT":
      return {
        design: {
          ...state.design,
          cutouts: state.design.cutouts.filter((c) => c.id !== action.payload),
        },
      }
    case "ADD_DIVIDER":
      return {
        design: {
          ...state.design,
          dividers: [...(state.design.dividers || []), { ...action.payload, id: Date.now().toString() }],
        },
      }
    case "UPDATE_DIVIDER":
      return {
        design: {
          ...state.design,
          dividers: (state.design.dividers || []).map((d) =>
            d.id === action.payload.id ? { ...d, ...action.payload.updates } : d,
          ),
        },
      }
    case "REMOVE_DIVIDER":
      return {
        design: {
          ...state.design,
          dividers: (state.design.dividers || []).filter((d) => d.id !== action.payload),
        },
      }
    case "RESET_DESIGN":
      return { design: defaultDesign }
    case "LOAD_DESIGN":
      return { design: action.payload }
    default:
      return state
  }
}

interface DesignContextType {
  design: Design
  setLayout: (layout: LayoutType) => void
  setOrientation: (orientation: LOrientation) => void
  setDimensions: (dimensions: Partial<Dimensions>) => void
  setStyle: (style: CountertopStyle) => void
  setSegmentStyle: (segmentId: string, style: CountertopStyle) => void
  resetSegmentStyles: () => void
  addCutout: (cutout: Omit<Cutout, "id">) => void
  updateCutout: (id: string, updates: Partial<Cutout>) => void
  removeCutout: (id: string) => void
  addDivider: (divider: Omit<DividerElement, "id">) => void
  updateDivider: (id: string, updates: Partial<DividerElement>) => void
  removeDivider: (id: string) => void
  resetDesign: () => void
  loadDesign: (design: Design) => void
}

const DesignContext = createContext<DesignContextType | undefined>(undefined)

export function DesignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(designReducer, initialState)

  const contextValue: DesignContextType = {
    design: state.design,
    setLayout: (layout) => dispatch({ type: "SET_LAYOUT", payload: layout }),
    setOrientation: (orientation) => dispatch({ type: "SET_ORIENTATION", payload: orientation }),
    setDimensions: (dimensions) => dispatch({ type: "SET_DIMENSIONS", payload: dimensions }),
    setStyle: (style) => dispatch({ type: "SET_STYLE", payload: style }),
    setSegmentStyle: (segmentId, style) => dispatch({ type: "SET_SEGMENT_STYLE", payload: { segmentId, style } }),
    resetSegmentStyles: () => dispatch({ type: "RESET_SEGMENT_STYLES" }),
    addCutout: (cutout) => dispatch({ type: "ADD_CUTOUT", payload: cutout }),
    updateCutout: (id, updates) => dispatch({ type: "UPDATE_CUTOUT", payload: { id, updates } }),
    removeCutout: (id) => dispatch({ type: "REMOVE_CUTOUT", payload: id }),
    addDivider: (divider) => dispatch({ type: "ADD_DIVIDER", payload: divider }),
    updateDivider: (id, updates) => dispatch({ type: "UPDATE_DIVIDER", payload: { id, updates } }),
    removeDivider: (id) => dispatch({ type: "REMOVE_DIVIDER", payload: id }),
    resetDesign: () => dispatch({ type: "RESET_DESIGN" }),
    loadDesign: (design) => dispatch({ type: "LOAD_DESIGN", payload: design }),
  }

  return <DesignContext.Provider value={contextValue}>{children}</DesignContext.Provider>
}

export function useDesignStore() {
  const context = useContext(DesignContext)
  if (context === undefined) {
    throw new Error("useDesignStore must be used within a DesignProvider")
  }
  return context
}
