import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UnitType, AppSettings } from "../types"

interface SettingsState extends AppSettings {
  setUnits: (units: UnitType) => void
  setLanguage: (language: "pl" | "en") => void
  convertValue: (value: number, fromUnit?: UnitType, toUnit?: UnitType) => number
  formatValue: (value: number, showUnit?: boolean) => string
}

const CM_TO_INCHES = 0.393701
const INCHES_TO_CM = 2.54
const CM_TO_MM = 10
const MM_TO_CM = 0.1
const INCHES_TO_MM = 25.4
const MM_TO_INCHES = 1 / 25.4

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      units: "cm",
      language: "pl",

      setUnits: (units) => set({ units }),
      setLanguage: (language) => set({ language }),

      convertValue: (value, fromUnit, toUnit) => {
        const currentUnits = get().units
        const from = fromUnit || currentUnits
        const to = toUnit || currentUnits

        if (from === to) return value

        // Convert via cm as base when helpful
        let result: number
        if (from === "cm" && to === "inches") {
          result = value * CM_TO_INCHES
          return Math.round(result * 100) / 100
        } else if (from === "inches" && to === "cm") {
          result = value * INCHES_TO_CM
          return Math.round(result * 100) / 100
        } else if (from === "cm" && to === "mm") {
          result = value * CM_TO_MM
          return Math.round(result)
        } else if (from === "mm" && to === "cm") {
          result = value * MM_TO_CM
          return Math.round(result * 100) / 100
        } else if (from === "inches" && to === "mm") {
          result = value * INCHES_TO_MM
          return Math.round(result)
        } else if (from === "mm" && to === "inches") {
          result = value * MM_TO_INCHES
          return Math.round(result * 100) / 100
        }

        return value
      },

      formatValue: (valueCm, showUnit = true) => {
        const { units, convertValue } = get()
        const converted = convertValue(valueCm, "cm", units)
        const formatted = units === "mm" ? Math.round(converted) : Math.round(converted * 100) / 100

        if (!showUnit) return formatted.toString()

        if (units === "cm") return `${formatted} cm`
        if (units === "mm") return `${formatted} mm`
        return `${formatted}"`
      },
    }),
    {
      name: "kitchenTop:settings:v1",
    },
  ),
)
