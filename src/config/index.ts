export const CONFIG = {
  // Canvas settings
  GRID_SIZE: 10,
  MIN_EDGE_DISTANCE: 30,
  CANVAS_PADDING: 50,
  DEFAULT_ZOOM: 0.8,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,

  // Validation settings
  VALIDATION_DEBOUNCE_MS: 300,
  AUTO_SAVE_INTERVAL_MS: 30000,

  // Performance settings
  CANVAS_REDRAW_THROTTLE_MS: 16, // ~60fps

  // Storage settings
  MAX_PROJECTS: 50,
  STORAGE_QUOTA_WARNING_MB: 5,

  // Export settings
  EXPORT_IMAGE_SCALE: 4,
  EXPORT_IMAGE_WIDTH: 1920,
  EXPORT_IMAGE_HEIGHT: 1080,

  // Texture rendering
  TEXTURE: {
    CANVAS_SCALE: 0.5, // 0.5 = half-size pattern tiles on canvas
    CANVAS_ROTATION_DEG: 0, // rotate texture on canvas in degrees
    PDF_SCALE: 0.3, // scale factor for tiling in PDF
    PDF_ROTATION_DEG: 0, // rotation for texture tiles in PDF
  },

  // Pricing settings
  PRICING: {
    LABOR_COST_PER_SQM: 50,
    EDGE_COST_PER_CM: 2,
    CUTTING_COST_PER_CUTOUT: 30,
    VAT_RATE: 0.23,
  },

  // UI settings
  NOTIFICATION_DURATION_MS: 3000,
  TOOLTIP_DELAY_MS: 500,
} as const

export type ConfigType = typeof CONFIG
