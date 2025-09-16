"use client";

import type React from "react";
import { useState } from "react";
import { useDesignStore } from "../../store/designStore";
import { pl } from "../../i18n/pl";
import { MATERIALS, MATERIAL_CATEGORIES } from "../../constants";

export const StylePanel: React.FC = () => {
  const { design, setStyle } = useDesignStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isTexture = design.style.type === "texture";

  const handleDragStart = (
    e: React.DragEvent,
    material: (typeof MATERIALS)[0]
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "style",
        material: material,
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const filteredMaterials = activeCategory
    ? MATERIALS.filter((material) => material.category === activeCategory)
    : MATERIALS;

  return (
    <div className="flex flex-col">
      <div className="p-4 pb-2">
        <h3 className="font-semibold text-gray-800 mb-4">{pl.styl}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategorie
            </label>
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  activeCategory === null
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Wszystkie
              </button>
              {Object.entries(MATERIAL_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    activeCategory === key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {pl.material}
              {activeCategory &&
                ` - ${
                  MATERIAL_CATEGORIES[
                    activeCategory as keyof typeof MATERIAL_CATEGORIES
                  ].name
                }`}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {filteredMaterials.map((material, index) => {
                const isSelected = design.style.value === material.value;
                return (
                  <button
                    key={index}
                    onClick={() => setStyle(material)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, material)}
                    className={`p-2 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-full h-6 rounded mb-1"
                      style={{
                        backgroundColor:
                          material.type === "color"
                            ? material.value
                            : "#D2B48C",
                        backgroundImage:
                          material.type === "texture"
                            ? `url(${(material as any).preview || material.value})`
                            : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div
                      className={`text-xs text-center font-medium leading-tight ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {material.name}
                    </div>
                    <div
                      className={`text-xs text-center ${
                        isSelected ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {material.pricePerSqm} zł/m²
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current selection info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Aktualny wybór
            </h4>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded border flex-shrink-0"
                style={{
                  backgroundColor:
                    design.style.type === "color"
                      ? design.style.value
                      : "#D2B48C",
                  backgroundImage:
                    design.style.type === "texture"
                      ? `url(${(design.style as any).preview || design.style.value})`
                      : "none",
                  backgroundSize: "cover",
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-600 font-medium block truncate">
                  {design.style.name}
                </span>
                <div className="text-xs text-gray-500">
                  {design.style.pricePerSqm} zł/m² •{" "}
                  {
                    MATERIAL_CATEGORIES[
                      design.style.category as keyof typeof MATERIAL_CATEGORIES
                    ]?.name
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Texture tuning */}
          {isTexture && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ustawienia tekstury</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Skala (podgląd/eksport)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={(design.style as any).textureScaleCanvas ?? 1}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setStyle({
                          ...(design.style as any),
                          textureScaleCanvas: v,
                          textureScalePDF: Math.max(0.3, Math.min(3, v * 0.8)),
                        });
                      }}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-700 w-10 text-right">
                      {((design.style as any).textureScaleCanvas ?? 1).toFixed(1)}×
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Obrót (°)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={1}
                      value={(design.style as any).textureRotationCanvasDeg ?? 0}
                      onChange={(e) => {
                        const deg = Number(e.target.value);
                        setStyle({
                          ...(design.style as any),
                          textureRotationCanvasDeg: deg,
                          textureRotationPDFDeg: deg,
                        });
                      }}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-700 w-10 text-right">
                      {((design.style as any).textureRotationCanvasDeg ?? 0).toFixed(0)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 italic">
            Przeciągnij materiał na stół, aby go zastosować
          </div>
        </div>
      </div>
    </div>
  );
};
