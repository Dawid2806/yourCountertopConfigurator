"use client";

import type React from "react";

import { useState } from "react";
import { useDesignStore } from "../../store/designStore";
import { DIVIDER_ELEMENTS, DIVIDER_CATEGORIES } from "../../constants";
import type { DividerType, DividerElement } from "../../types";

export const DividersPanel = () => {
  const { design, addDivider, removeDivider } = useDesignStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("szafki");

  const handleDragStart = (e: React.DragEvent, dividerType: DividerType) => {
    const dividerData = DIVIDER_ELEMENTS[dividerType];
    const dragData = {
      type: "divider",
      dividerType,
      name: dividerData.name,
      width: dividerData.width,
      price: dividerData.price,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
  };

  const handleAddDivider = (dividerType: DividerType, segmentId: string) => {
    const dividerData = DIVIDER_ELEMENTS[dividerType];
    const newDivider: Omit<DividerElement, "id"> = {
      type: dividerType,
      name: dividerData.name,
      width: dividerData.width,
      segmentId,
      position: 0.5, // Middle of segment
      price: dividerData.price,
    };
    addDivider(newDivider);
  };

  const getAvailableSegments = () => {
    if (design.layout === "prosty") return [{ id: "main", name: "Główny" }];
    if (design.layout === "l-ksztaltny")
      return [
        { id: "a", name: "Segment A" },
        { id: "b", name: "Segment B" },
      ];
    if (design.layout === "u-ksztaltny")
      return [
        { id: "a", name: "Segment A" },
        { id: "b", name: "Segment B" },
        { id: "c", name: "Segment C" },
      ];
    return [];
  };

  const filteredDividers = Object.entries(DIVIDER_ELEMENTS).filter(
    ([_, divider]) => divider.category === selectedCategory
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg text-black font-semibold mb-4">
        Elementy dzielące
      </h3>

      {/* Category Tabs */}
      <div className=" flex gap-3 flex-wrap mb-6">
        {Object.entries(DIVIDER_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === key
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Divider Elements Grid */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {filteredDividers.map(([key, divider]) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, key as DividerType)}
            className="border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: divider.color }}
                />
                <div>
                  <h4 className="font-medium text-black text-sm">
                    {divider.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {divider.width}cm szerokości
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">
                  {divider.price > 0 ? `+${divider.price} zł` : "Gratis"}
                </span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="mt-3 flex gap-2">
              {getAvailableSegments().map((segment) => (
                <button
                  key={segment.id}
                  onClick={() =>
                    handleAddDivider(key as DividerType, segment.id)
                  }
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Dodaj do {segment.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Current Dividers List */}
      {design.dividers && design.dividers.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Dodane elementy dzielące</h4>
          <div className="space-y-2">
            {design.dividers.map((divider) => (
              <div
                key={divider.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: getDividerColor(divider.type) }}
                  />
                  <div>
                    <span className="font-medium text-sm">{divider.name}</span>
                    <p className="text-xs text-gray-500">
                      Segment {divider.segmentId.toUpperCase()} • Pozycja:{" "}
                      {Math.round(divider.position * 100)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">
                    {divider.price > 0 ? `+${divider.price} zł` : ""}
                  </span>
                  <button
                    onClick={() => removeDivider(divider.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Wskazówka:</strong> Przeciągnij element na Canvas lub użyj
          przycisków &quot;Dodaj do&quot; aby umieścić element dzielący na wybranym
          segmencie.
        </p>
      </div>
    </div>
  );
};

const getDividerColor = (dividerType: DividerType): string => {
  const colors: Record<DividerType, string> = {
    "szafka-stojaca": "#8B4513",
    przerwa: "#FFFFFF",
    kolumna: "#696969",
    "lodowka-zabudowana": "#2F4F4F",
    zmywarka: "#4682B4",
  };
  return colors[dividerType] || "#999999";
};
