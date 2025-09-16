"use client";

import type React from "react";
import { useState } from "react";
import { Plus, Trash2, Move, ChevronDown, ChevronRight } from "lucide-react";
import { useDesignStore } from "../../store/designStore";
import { pl } from "../../i18n/pl";
import { CUTOUT_TYPES, CUTOUT_CATEGORIES } from "../../constants";
import type { Cutout, CutoutType } from "../../types";

export const AddOnsPanel: React.FC = () => {
  const { design, addCutout, updateCutout, removeCutout } = useDesignStore();
  const [selectedType, setSelectedType] = useState<CutoutType>("zlew");
  const [isDraggingFromPanel, setIsDraggingFromPanel] = useState(false);
  const [draggedType, setDraggedType] = useState<CutoutType | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    zlewy: true,
    plyty: true,
    inne: false,
  });

  const handleAddCutout = () => {
    const cutoutType = CUTOUT_TYPES[selectedType];
    const newCutout: Omit<Cutout, "id"> = {
      name: cutoutType.name,
      type: selectedType,
      width: cutoutType.defaultWidth,
      depth: cutoutType.defaultDepth,
      position: { x: 50, y: 30 }, // Default position
      offsetX: 50,
      offsetY: 30,
      referenceX: "lewo",
      referenceY: "przod",
    };

    addCutout(newCutout);
  };

  const handleDragStart = (e: React.DragEvent, type: CutoutType) => {
    setIsDraggingFromPanel(true);
    setDraggedType(type);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "cutout",
        cutoutType: type,
        ...CUTOUT_TYPES[type],
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setIsDraggingFromPanel(false);
    setDraggedType(null);
  };

  const handleCutoutUpdate = (id: string, field: string, value: any) => {
    updateCutout(id, { [field]: value });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getCutoutsByCategory = () => {
    const grouped: Record<
      string,
      Array<[string, (typeof CUTOUT_TYPES)[keyof typeof CUTOUT_TYPES]]>
    > = {};

    Object.entries(CUTOUT_TYPES).forEach(([key, cutoutType]) => {
      const category = cutoutType.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push([key, cutoutType]);
    });

    return grouped;
  };

  const cutoutsByCategory = getCutoutsByCategory();

  return (
    <div className=" flex flex-col">
      <div className="p-4 pb-2">
        <h3 className="font-semibold text-gray-800 mb-4">{pl.dodatki}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {/* Add new cutout */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {pl.dodajOtwor}
            </h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 mb-2">
                  Przeciągnij na stół lub kliknij "Dodaj"
                </label>

                <div className="space-y-2">
                  {Object.entries(cutoutsByCategory).map(
                    ([categoryKey, cutouts]) => {
                      const category =
                        CUTOUT_CATEGORIES[
                          categoryKey as keyof typeof CUTOUT_CATEGORIES
                        ];
                      const isExpanded = expandedCategories[categoryKey];

                      return (
                        <div
                          key={categoryKey}
                          className="border border-gray-100 rounded-lg"
                        >
                          <button
                            onClick={() => toggleCategory(categoryKey)}
                            className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-t-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{category.icon}</span>
                              <span className="text-sm font-medium text-gray-700">
                                {category.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({cutouts.length})
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="p-2 pt-0 space-y-1 max-h-48 overflow-y-auto">
                              {cutouts.map(([key, cutoutType]) => {
                                const isSelected = selectedType === key;
                                return (
                                  <div
                                    key={key}
                                    draggable
                                    onDragStart={(e) =>
                                      handleDragStart(e, key as CutoutType)
                                    }
                                    onDragEnd={handleDragEnd}
                                    onClick={() =>
                                      setSelectedType(key as CutoutType)
                                    }
                                    style={{
                                      backgroundColor: isSelected
                                        ? "#3b82f6"
                                        : undefined,
                                      borderColor: isSelected
                                        ? "#3b82f6"
                                        : "#e5e7eb",
                                      color: isSelected ? "#ffffff" : undefined,
                                    }}
                                    className={`
                                    flex items-center justify-between p-2 border rounded cursor-grab transition-all text-sm
                                    ${
                                      !isSelected
                                        ? "hover:border-gray-300 hover:bg-gray-50"
                                        : ""
                                    }
                                    ${draggedType === key ? "opacity-50" : ""}
                                  `}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className="font-medium truncate"
                                        style={{
                                          color: isSelected
                                            ? "#ffffff"
                                            : "#111827",
                                        }}
                                      >
                                        {cutoutType.name}
                                      </div>
                                      <div className="text-xs">
                                        <span
                                          style={{
                                            color: isSelected
                                              ? "#ffffff"
                                              : "#111827",
                                          }}
                                        >
                                          {cutoutType.defaultWidth}×
                                          {cutoutType.defaultDepth} cm
                                        </span>
                                        {cutoutType.price && (
                                          <span
                                            className="ml-2"
                                            style={{
                                              color: isSelected
                                                ? "#ffffff"
                                                : "#16a34a",
                                            }}
                                          >
                                            +{cutoutType.price} zł
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div
                                      className="flex-shrink-0"
                                      style={{
                                        color: isSelected
                                          ? "#ffffff"
                                          : "#9ca3af",
                                      }}
                                    >
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M9 9l6 6M9 15l6-6" />
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <button
                onClick={handleAddCutout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Dodaj {CUTOUT_TYPES[selectedType].name}
              </button>
            </div>
          </div>

          {design.cutouts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <Move size={16} />
                <span>
                  Przeciągnij otwory na planie, aby zmienić ich pozycję
                </span>
              </div>
            </div>
          )}

          {/* Existing cutouts */}
          <div className="space-y-3">
            {design.cutouts.map((cutout) => {
              const cutoutType = CUTOUT_TYPES[cutout.type];
              const category =
                CUTOUT_CATEGORIES[
                  cutoutType?.category as keyof typeof CUTOUT_CATEGORIES
                ];

              return (
                <div
                  key={cutout.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-700 truncate">
                        {cutout.name}
                      </h4>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{category?.icon}</span>
                        <span>{category?.name}</span>
                        {cutoutType?.price && (
                          <span className="ml-1 text-green-600">
                            +{cutoutType.price} zł
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCutout(cutout.id)}
                      className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {pl.szerokosc} (cm)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          step="0.1"
                          value={cutout.width}
                          onChange={(e) =>
                            handleCutoutUpdate(
                              cutout.id,
                              "width",
                              Number.parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {pl.glebokosc} (cm)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          step="0.1"
                          value={cutout.depth}
                          onChange={(e) =>
                            handleCutoutUpdate(
                              cutout.id,
                              "depth",
                              Number.parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Position offsets */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {pl.offsetX} (cm)
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={cutout.referenceX}
                            onChange={(e) =>
                              handleCutoutUpdate(
                                cutout.id,
                                "referenceX",
                                e.target.value
                              )
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="lewo">{pl.lewo}</option>
                            <option value="prawo">{pl.prawo}</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={cutout.offsetX}
                            onChange={(e) =>
                              handleCutoutUpdate(
                                cutout.id,
                                "offsetX",
                                Number.parseFloat(e.target.value)
                              )
                            }
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {pl.offsetY} (cm)
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={cutout.referenceY}
                            onChange={(e) =>
                              handleCutoutUpdate(
                                cutout.id,
                                "referenceY",
                                e.target.value
                              )
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="przod">{pl.przod}</option>
                            <option value="tyl">{pl.tyl}</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={cutout.offsetY}
                            onChange={(e) =>
                              handleCutoutUpdate(
                                cutout.id,
                                "offsetY",
                                Number.parseFloat(e.target.value)
                              )
                            }
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {design.cutouts.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Brak otworów. Dodaj pierwszy otwór powyżej.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
