"use client"

import type React from "react"
import { useDesignStore } from "../../store/designStore"
import { pl } from "../../i18n/pl"
import type { LayoutType, LOrientation } from "../../types"

export const LayoutPanel: React.FC = () => {
  const { design, setLayout, setOrientation } = useDesignStore()

  const layoutOptions: { value: LayoutType; label: string }[] = [
    { value: "prosty", label: pl.prosty },
    { value: "l-ksztaltny", label: pl.lKsztaltny },
    { value: "u-ksztaltny", label: pl.uKsztaltny },
  ]

  const orientationOptions: { value: LOrientation; label: string }[] = [
    { value: "left-l", label: pl.leftL },
    { value: "right-l", label: pl.rightL },
  ]

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-800 mb-4">{pl.uklad}</h3>

      <div className="space-y-4">
        {/* Layout Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Typ układu</label>
          <div className="space-y-2">
            {layoutOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="layout"
                  value={option.value}
                  checked={design.layout === option.value}
                  onChange={(e) => setLayout(e.target.value as LayoutType)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Orientation Selection for L-shaped */}
        {design.layout === "l-ksztaltny" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Orientacja</label>
            <div className="space-y-2">
              {orientationOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="orientation"
                    value={option.value}
                    checked={design.orientation === option.value}
                    onChange={(e) => setOrientation(e.target.value as LOrientation)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Visual Preview */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Podgląd układu</label>
          <div className="bg-gray-50 p-4 rounded-lg">
            <LayoutPreview layout={design.layout} orientation={design.orientation} />
          </div>
        </div>
      </div>
    </div>
  )
}

const LayoutPreview: React.FC<{ layout: LayoutType; orientation: LOrientation }> = ({ layout, orientation }) => {
  const getPreviewPath = () => {
    switch (layout) {
      case "prosty":
        return "M 10 10 L 90 10 L 90 30 L 10 30 Z"
      case "l-ksztaltny":
        if (orientation === "left-l") {
          return "M 10 10 L 60 10 L 60 25 L 40 25 L 40 50 L 10 50 Z"
        } else {
          return "M 10 10 L 90 10 L 90 50 L 60 50 L 60 25 L 10 25 Z"
        }
      case "u-ksztaltny":
        return "M 10 10 L 30 10 L 30 25 L 50 25 L 50 10 L 70 10 L 70 50 L 10 50 Z"
      default:
        return ""
    }
  }

  return (
    <svg width="100" height="60" viewBox="0 0 100 60" className="w-full h-16">
      <path d={getPreviewPath()} fill="#D2B48C" stroke="#8B4513" strokeWidth="1" />
    </svg>
  )
}
