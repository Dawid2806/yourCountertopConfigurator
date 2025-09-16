export type LayoutType = "prosty" | "l-ksztaltny" | "u-ksztaltny"

export type LOrientation = "left-l" | "right-l"

export type CutoutType =
  | "zlew"
  | "zlew-narozny"
  | "zlew-podwojny"
  | "plyta-indukcyjna"
  | "plyta-indukcyjna-mala"
  | "plyta-indukcyjna-duza"
  | "plyta-gazowa"
  | "plyta-mieszana"
  | "otwor-baterii"
  | "otwor-dozownika"
  | "otwor-filtra"
  | "wycinek-narozny"

export type DividerType = "szafka-stojaca" | "przerwa" | "kolumna" | "lodowka-zabudowana" | "zmywarka"

export interface Point {
  x: number
  y: number
}

export interface Dimensions {
  length: number
  depth: number
  lengthA?: number
  lengthB?: number
  lengthLeft?: number
  lengthRight?: number
  gapWidth?: number
}

export interface Cutout {
  id: string
  name: string
  type: CutoutType
  width: number
  depth: number
  position: Point
  offsetX: number
  offsetY: number
  referenceX: "lewo" | "prawo"
  referenceY: "przod" | "tyl"
}

export interface DividerElement {
  id: string
  type: DividerType
  name: string
  width: number
  segmentId: string // Which segment this divider is placed on
  position: number // Position along the segment (0-1, where 0 is start, 1 is end)
  price: number
}

export interface CountertopStyle {
  type: "texture" | "color"
  value: string
  name: string
  pricePerSqm?: number
  category?: string
  preview?: string
  // Optional per-material texture tuning
  textureScaleCanvas?: number
  textureRotationCanvasDeg?: number
  textureScalePDF?: number
  textureRotationPDFDeg?: number
}

export interface SegmentStyle {
  segmentId: string
  name: string // "A", "B", "main"
  style: CountertopStyle
}

export interface Design {
  layout: LayoutType
  orientation: LOrientation
  dimensions: Dimensions
  style: CountertopStyle
  segmentStyles?: SegmentStyle[]
  cutouts: Cutout[]
  dividers?: DividerElement[]
}

export interface ValidationError {
  id: string
  type: "edge-distance" | "overlap" | "outside-bounds" | "dimension-invalid"
  message: string
  position?: Point
}

export interface SavedProject {
  id: string
  name: string
  design: Design
  createdAt: Date
  updatedAt: Date
  thumbnail?: string
}

export interface ProjectMetadata {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  thumbnail?: string
}

export type UnitType = "cm" | "mm" | "inches"

export interface AppSettings {
  units: UnitType
  language: "pl" | "en"
}
