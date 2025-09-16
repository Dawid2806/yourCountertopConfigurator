// Note: Prefer pulling runtime/config values from CONFIG in src/config.
export const GRID_SIZE = 10 // 1cm in pixels at 1:1 scale
export const MIN_EDGE_DISTANCE = 30 // 3cm in mm
export const CANVAS_PADDING = 50
export const DEFAULT_ZOOM = 0.8
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 5

export const CUTOUT_TYPES = {
  zlew: { name: "Zlew", defaultWidth: 40, defaultDepth: 40, price: 150, category: "zlewy" },
  "zlew-narozny": { name: "Zlew narożny", defaultWidth: 50, defaultDepth: 50, price: 200, category: "zlewy" },
  "zlew-podwojny": { name: "Zlew podwójny", defaultWidth: 80, defaultDepth: 40, price: 250, category: "zlewy" },
  "plyta-indukcyjna": { name: "Płyta indukcyjna", defaultWidth: 60, defaultDepth: 52, price: 200, category: "plyty" },
  "plyta-indukcyjna-mala": {
    name: "Płyta indukcyjna mała",
    defaultWidth: 45,
    defaultDepth: 40,
    price: 180,
    category: "plyty",
  },
  "plyta-indukcyjna-duza": {
    name: "Płyta indukcyjna duża",
    defaultWidth: 75,
    defaultDepth: 52,
    price: 250,
    category: "plyty",
  },
  "plyta-gazowa": { name: "Płyta gazowa", defaultWidth: 60, defaultDepth: 52, price: 180, category: "plyty" },
  "plyta-mieszana": { name: "Płyta mieszana", defaultWidth: 90, defaultDepth: 52, price: 300, category: "plyty" },
  "otwor-baterii": { name: "Otwór na baterię", defaultWidth: 3.5, defaultDepth: 3.5, price: 50, category: "inne" },
  "otwor-dozownika": { name: "Dozownik mydła", defaultWidth: 3, defaultDepth: 3, price: 40, category: "inne" },
  "otwor-filtra": { name: "Filtr do wody", defaultWidth: 4, defaultDepth: 4, price: 60, category: "inne" },
  "wycinek-narozny": { name: "Wycinek narożny", defaultWidth: 20, defaultDepth: 20, price: 80, category: "inne" },
} as const

export const CUTOUT_CATEGORIES = {
  zlewy: { name: "Zlewy", icon: "🚿" },
  plyty: { name: "Płyty grzewcze", icon: "🔥" },
  inne: { name: "Inne dodatki", icon: "⚙️" },
} as const

export const MATERIALS = [
  // Solid Colors - Basic
  { type: "color" as const, value: "#FFFFFF", name: "Biały", pricePerSqm: 90, category: "kolory" },
  { type: "color" as const, value: "#F8F8FF", name: "Kość słoniowa", pricePerSqm: 95, category: "kolory" },
  { type: "color" as const, value: "#F5F5DC", name: "Beżowy", pricePerSqm: 100, category: "kolory" },
  { type: "color" as const, value: "#D2B48C", name: "Jasny brąz", pricePerSqm: 110, category: "kolory" },
  { type: "color" as const, value: "#8B4513", name: "Brązowy", pricePerSqm: 120, category: "kolory" },

  // Solid Colors - Grays
  { type: "color" as const, value: "#F5F5F5", name: "Jasny szary", pricePerSqm: 105, category: "kolory" },
  { type: "color" as const, value: "#D3D3D3", name: "Średni szary", pricePerSqm: 115, category: "kolory" },
  { type: "color" as const, value: "#696969", name: "Szary", pricePerSqm: 130, category: "kolory" },
  { type: "color" as const, value: "#2F4F4F", name: "Ciemny szary", pricePerSqm: 140, category: "kolory" },

  // Textures - New (served from /public)
  {
    type: "texture" as const,
    value: "/texture/pebbled-counter-unity/pebbled-counter-unity/pebbled-counter-Base_Color.png",
    name: "Kamień – Pebbled Counter",
    pricePerSqm: 220,
    category: "kamien",
    preview: "/texture/pebbled-counter-unity/pebbled-counter-unity/pebbled-counter-preview.jpg",
    textureScaleCanvas: 0.7,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 0.6,
    textureRotationPDFDeg: 0,
  },
  {
    type: "texture" as const,
    value: "/texture/subtle-grained-wood-unity/subtle-grained-wood-unity/subtle-grained-wood_albedo.png",
    name: "Drewno – Subtle Grained",
    pricePerSqm: 180,
    category: "drewno",
    preview: "/texture/subtle-grained-wood-unity/subtle-grained-wood-unity/subtle-grained-wood_preview.jpg",
    // Wood looks noisy w/ small tiles; enlarge tiles and keep grain direction consistent
    textureScaleCanvas: 1.6,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 1.2,
    textureRotationPDFDeg: 0,
  },
  {
    type: "texture" as const,
    value: "/texture/oak-wood-bare-unity/oak-wood-bare_albedo.png",
    name: "Drewno – Dąb (surowy)",
    pricePerSqm: 190,
    category: "drewno",
    preview: "/texture/oak-wood-bare-unity/oak-wood-bare_preview.jpg",
    textureScaleCanvas: 1.5,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 1.2,
    textureRotationPDFDeg: 0,
  },
  {
    type: "texture" as const,
    value: "/texture/bamboo-wood-semigloss-Unity/bamboo-wood-semigloss-albedo.png",
    name: "Drewno – Bambus (semi-gloss)",
    pricePerSqm: 170,
    category: "drewno",
    // brak dedykowanego preview, użyjemy albedo
    preview: "/texture/bamboo-wood-semigloss-Unity/bamboo-wood-semigloss-albedo.png",
    // większe słoje i obrót o 90°
    textureScaleCanvas: 1.8,
    textureRotationCanvasDeg: 90,
    textureScalePDF: 1.4,
    textureRotationPDFDeg: 90,
  },
  // Procedural SVG textures (local, seamless)
  {
    type: "texture" as const,
    value: "/texture/procedural/marble-white.svg",
    name: "Marmur – biały",
    pricePerSqm: 240,
    category: "kamien",
    preview: "/texture/procedural/marble-white.svg",
    textureScaleCanvas: 1.2,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 1.0,
    textureRotationPDFDeg: 0,
  },
  {
    type: "texture" as const,
    value: "/texture/procedural/granite-gray.svg",
    name: "Granit – szary",
    pricePerSqm: 230,
    category: "kamien",
    preview: "/texture/procedural/granite-gray.svg",
    textureScaleCanvas: 1.4,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 1.1,
    textureRotationPDFDeg: 0,
  },
  {
    type: "texture" as const,
    value: "/texture/procedural/concrete-light.svg",
    name: "Beton – jasny",
    pricePerSqm: 160,
    category: "nowoczesne",
    preview: "/texture/procedural/concrete-light.svg",
    textureScaleCanvas: 1.0,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 0.9,
    textureRotationPDFDeg: 0,
  },
  {
    type: "texture" as const,
    value: "/texture/procedural/stainless-brushed.svg",
    name: "Stal nierdzewna – szczotkowana",
    pricePerSqm: 280,
    category: "nowoczesne",
    preview: "/texture/procedural/stainless-brushed.svg",
    textureScaleCanvas: 1.0,
    textureRotationCanvasDeg: 90,
    textureScalePDF: 1.0,
    textureRotationPDFDeg: 90,
  },
  {
    type: "texture" as const,
    value: "/texture/procedural/quartz-speckled.svg",
    name: "Kwarc – nakrapiany",
    pricePerSqm: 260,
    category: "kamien",
    preview: "/texture/procedural/quartz-speckled.svg",
    textureScaleCanvas: 1.3,
    textureRotationCanvasDeg: 0,
    textureScalePDF: 1.0,
    textureRotationPDFDeg: 0,
  },
 

]

export const MATERIAL_CATEGORIES = {
  kolory: { name: "Kolory jednolite", icon: "🎨" },
  drewno: { name: "Drewno", icon: "🌳" },
  kamien: { name: "Kamień naturalny", icon: "🪨" },
  nowoczesne: { name: "Materiały nowoczesne", icon: "✨" },
} as const

export const PRICING = {
  LABOR_COST_PER_SQM: 50, // Cost of installation per square meter
  EDGE_COST_PER_CM: 2, // Cost of edge finishing per centimeter
  CUTTING_COST_PER_CUTOUT: 30, // Additional cost per cutout for cutting
  VAT_RATE: 0.23, // 23% VAT
} as const

export const DIVIDER_ELEMENTS = {
  "szafka-stojaca": {
    name: "Szafka stojąca",
    width: 60,
    price: 500,
    category: "szafki",
    color: "#8B4513", // Brown color for visualization
  },
  przerwa: {
    name: "Przerwa",
    width: 10,
    price: 0,
    category: "przerwy",
    color: "#FFFFFF", // White/empty space
  },
  kolumna: {
    name: "Kolumna",
    width: 30,
    price: 200,
    category: "konstrukcyjne",
    color: "#696969", // Gray color
  },
  "lodowka-zabudowana": {
    name: "Lodówka zabudowana",
    width: 60,
    price: 0,
    category: "agd",
    color: "#2F4F4F", // Dark gray
  },
  zmywarka: {
    name: "Zmywarka",
    width: 60,
    price: 0,
    category: "agd",
    color: "#4682B4", // Steel blue
  },
} as const

export const DIVIDER_CATEGORIES = {
  szafki: { name: "Szafki", icon: "🗄️" },
  przerwy: { name: "Przerwy", icon: "⬜" },
  konstrukcyjne: { name: "Konstrukcyjne", icon: "🏗️" },
  agd: { name: "AGD zabudowane", icon: "🔌" },
} as const
