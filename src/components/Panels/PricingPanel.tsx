"use client"

import type React from "react"
import { Calculator, Info, TrendingUp, Award } from "lucide-react"
import { useDesignStore } from "../../store/designStore"
import { formatPrice, formatArea, formatLength } from "../../utils/pricing"
import { usePricing } from "../../hooks/usePricing"

export const PricingPanel: React.FC = () => {
  const { design } = useDesignStore()
  const { pricing, pricePerSqm, hasDiscounts } = usePricing(design)

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={20} className="text-green-600" />
        <h3 className="font-semibold text-gray-800">Kalkulator Kosztów</h3>
        <div className="ml-auto text-xs text-gray-500">{formatPrice(pricePerSqm)}/m²</div>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-green-800">Całkowity koszt:</span>
            <span className="text-xl font-bold text-green-800">{formatPrice(pricing.total)}</span>
          </div>
          <div className="text-sm text-green-600 flex items-center justify-between">
            <span>
              Powierzchnia: {formatArea(pricing.area)} • Obwód: {formatLength(pricing.edgeLength)}
            </span>
            {hasDiscounts && (
              <div className="flex items-center gap-1 text-green-700">
                <Award size={14} />
                <span className="text-xs">Rabat za powierzchnię</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
            Szczegóły kosztów:
            <TrendingUp size={14} className="text-gray-500" />
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Materiał ({design.style.name}):</span>
              <div className="text-right">
                <span className="font-medium">{formatPrice(pricing.materialCost)}</span>
                <div className="text-xs text-gray-500">{formatPrice(pricing.materialCost / pricing.area)}/m²</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Robocizna:</span>
              <div className="text-right">
                <span className="font-medium">{formatPrice(pricing.laborCost)}</span>
                <div className="text-xs text-gray-500">{formatPrice(pricing.laborCost / pricing.area)}/m²</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Wykończenie krawędzi:</span>
              <div className="text-right">
                <span className="font-medium">{formatPrice(pricing.edgeCost)}</span>
                <div className="text-xs text-gray-500">{formatPrice(pricing.edgeCost / pricing.edgeLength)}/cm</div>
              </div>
            </div>

            {pricing.cutoutCost > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Otwory ({design.cutouts.length}):</span>
                <div className="text-right">
                  <span className="font-medium">{formatPrice(pricing.cutoutCost)}</span>
                  <div className="text-xs text-gray-500">
                    {formatPrice(pricing.cutoutCost / design.cutouts.length)}/szt
                  </div>
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            <div className="flex justify-between">
              <span className="text-gray-600">Netto:</span>
              <span className="font-medium">{formatPrice(pricing.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">VAT (23%):</span>
              <span className="font-medium">{formatPrice(pricing.vat)}</span>
            </div>

            <hr className="border-gray-300" />

            <div className="flex justify-between font-semibold">
              <span>Brutto:</span>
              <span>{formatPrice(pricing.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Informacje o cenie:</p>
              <ul className="space-y-1">
                <li>• Ceny są orientacyjne i mogą się różnić</li>
                <li>• Zawierają materiał, robociznę i wykończenie</li>
                <li>• Transport i montaż wliczony w cenę</li>
                <li>• Ostateczna cena po oględzinach</li>
                {hasDiscounts && <li>• Rabat za powierzchnię powyżej 2m²</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Material info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="font-medium text-gray-700 text-sm mb-2">Wybrany materiał:</h5>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded border"
              style={{
                backgroundColor: design.style.type === "color" ? design.style.value : "#D2B48C",
                backgroundImage: design.style.type === "texture" ? `url(${design.style.value})` : "none",
                backgroundSize: "cover",
              }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{design.style.name}</div>
              <div className="text-xs text-gray-600">
                {formatPrice(pricing.materialCost / pricing.area)}/m² •
                {design.style.type === "color" ? " Kolor jednolity" : " Tekstura naturalna"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Jakość</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= (design.style.pricePerSqm || 0) / 100 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
