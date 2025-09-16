"use client"

import type React from "react"
import { useDesignStore } from "../../store/designStore"
import { MATERIALS } from "../../constants"
import { generateSegmentPolygons } from "../../utils/geometry"

export const SegmentStylePanel: React.FC = () => {
  const { design, setSegmentStyle, resetSegmentStyles } = useDesignStore()

  const segments = generateSegmentPolygons(design.layout, design.dimensions, design.orientation)

  if (segments.length <= 1) {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Style segmentów</h3>
        <p className="text-sm text-gray-600">
          Style segmentów są dostępne tylko dla układów L-kształtnych i U-kształtnych.
        </p>
      </div>
    )
  }

  const getSegmentStyle = (segmentId: string) => {
    return design.segmentStyles?.find((s) => s.segmentId === segmentId)?.style || design.style
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Style segmentów</h3>
        <button onClick={resetSegmentStyles} className="text-sm text-blue-600 hover:text-blue-800">
          Resetuj
        </button>
      </div>

      <div className="space-y-6">
        {segments.map((segment) => {
          const currentStyle = getSegmentStyle(segment.segmentId)

          return (
            <div key={segment.segmentId} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">{segment.name}</h4>

              <div className="grid grid-cols-2 gap-2">
                {MATERIALS.map((material) => (
                  <button
                    key={material.name}
                    onClick={() => setSegmentStyle(segment.segmentId, material)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({
                          type: "segment-style",
                          material,
                          targetSegment: segment.segmentId,
                        }),
                      )
                    }}
                    className={`p-3 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                      currentStyle.name === material.name
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded mb-2"
                      style={{
                        backgroundColor: material.type === "color" ? material.value : "#D2B48C",
                      }}
                    />
                    <div className="text-xs text-gray-700 text-center">{material.name}</div>
                    {material.pricePerSqm && (
                      <div className="text-xs text-gray-500 text-center">{material.pricePerSqm} zł/m²</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 Możesz wybrać różne kolory dla każdego segmentu blatu. Kliknij na materiał lub przeciągnij go na konkretny
          segment na canvas.
        </p>
      </div>
    </div>
  )
}
