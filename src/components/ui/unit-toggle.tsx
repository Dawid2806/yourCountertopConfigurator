"use client"
import { useSettingsStore } from "@/store/settingsStore"
import type { UnitType } from "@/types"

export function UnitToggle() {
  const { units, setUnits } = useSettingsStore()

  const handleUnitChange = (newUnit: UnitType) => {
    setUnits(newUnit)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
      <button
        onClick={() => handleUnitChange("cm")}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          units === "cm" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        cm
      </button>
      <button
        onClick={() => handleUnitChange("mm")}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          units === "mm" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        mm
      </button>
      <button
        onClick={() => handleUnitChange("inches")}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          units === "inches" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        in
      </button>
    </div>
  )
}
