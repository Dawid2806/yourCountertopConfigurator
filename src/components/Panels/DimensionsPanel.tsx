"use client";

import type React from "react";
import { useDesignStore } from "../../store/designStore";
import { useSettingsStore } from "../../store/settingsStore";
import type { UnitType } from "@/types";
import { UnitToggle } from "@/components/ui/unit-toggle";
import { pl } from "../../i18n/pl";

export const DimensionsPanel: React.FC = () => {
  const { design, setDimensions } = useDesignStore();
  const { units, convertValue, formatValue } = useSettingsStore();

  const handleDimensionChange = (key: string, value: string) => {
    const numValue = Number.parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const cmValue = convertValue(numValue, units as UnitType, "cm");
      setDimensions({ [key]: cmValue });
    }
  };

  const renderInput = (
    key: string,
    label: string,
    value: number | undefined,
    min = 10,
    max = 500
  ) => {
    const displayValue =
      value != null ? convertValue(value, "cm" as UnitType, units as UnitType) : undefined;
    const displayMin = convertValue(min, "cm" as UnitType, units as UnitType);
    const displayMax = convertValue(max, "cm" as UnitType, units as UnitType);
    const unitLabel = units === "cm" ? pl.cm : units === "mm" ? "mm" : "in";
    const step = units === "inches" ? "0.01" : units === "cm" ? "0.1" : "1";

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} ({unitLabel})
        </label>
        <input
          type="number"
          min={displayMin}
          max={displayMax}
          step={step}
          value={displayValue || ""}
          onChange={(e) => handleDimensionChange(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{pl.wymiary}</h3>
        <UnitToggle />
      </div>

      <div className="space-y-2">
        {/* Basic dimensions for all layouts */}
        {design.layout === "prosty" && (
          <>
            {renderInput("length", pl.dlugosc, design.dimensions.length)}
            {renderInput("depth", pl.glebokosc, design.dimensions.depth)}
          </>
        )}

        {/* L-shaped dimensions */}
        {design.layout === "l-ksztaltny" && (
          <>
            {renderInput("lengthA", pl.dlugoscA, design.dimensions.lengthA)}
            {renderInput("lengthB", pl.dlugoscB, design.dimensions.lengthB)}
            {renderInput("depth", pl.glebokosc, design.dimensions.depth)}
          </>
        )}

        {/* U-shaped dimensions */}
        {design.layout === "u-ksztaltny" && (
          <>
            {renderInput(
              "lengthLeft",
              pl.dlugoscLewa,
              design.dimensions.lengthLeft
            )}
            {renderInput(
              "gapWidth",
              pl.szerokoscPrzestrzen,
              design.dimensions.gapWidth
            )}
            {renderInput(
              "lengthRight",
              pl.dlugoscPrawa,
              design.dimensions.lengthRight
            )}
            {renderInput("depth", pl.glebokosc, design.dimensions.depth)}
          </>
        )}

        {/* Dimension summary */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Podsumowanie
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            {design.layout === "prosty" && (
              <>
                <div>
                  Powierzchnia:{" "}
                  {units === "inches"
                    ? (
                        (design.dimensions.length || 0) *
                        (design.dimensions.depth || 0) *
                        0.00001550003
                      ).toFixed(3) + " sq ft"
                    : (
                        ((design.dimensions.length || 0) *
                          (design.dimensions.depth || 0)) /
                        10000
                      ).toFixed(2) + " m²"}
                </div>
                <div>
                  Obwód:{" "}
                  {formatValue(
                    2 *
                      ((design.dimensions.length || 0) +
                        (design.dimensions.depth || 0))
                  )}
                </div>
              </>
            )}
            {design.layout === "l-ksztaltny" && (
              <>
                <div>
                  Typ: L-kształtny (
                  {design.orientation === "left-l" ? "Lewy" : "Prawy"})
                </div>
                <div>
                  Długość A: {formatValue(design.dimensions.lengthA || 0)}
                </div>
                <div>
                  Długość B: {formatValue(design.dimensions.lengthB || 0)}
                </div>
              </>
            )}
            {design.layout === "u-ksztaltny" && (
              <>
                <div>Typ: U-kształtny</div>
                <div>
                  Lewa: {formatValue(design.dimensions.lengthLeft || 0)}
                </div>
                <div>
                  Prawa: {formatValue(design.dimensions.lengthRight || 0)}
                </div>
                <div>
                  Głębokość: {formatValue(design.dimensions.depth || 0)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
