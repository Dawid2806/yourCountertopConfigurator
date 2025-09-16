"use client"

import { useMemo } from "react"
import { useDebounce } from "./useDebounce"
import { calculatePricing } from "../utils/pricing"
import { CONFIG } from "../config"
import type { Design } from "../types"

export function usePricing(design: Design) {
  const debouncedDesign = useDebounce(design, CONFIG.VALIDATION_DEBOUNCE_MS)

  const pricing = useMemo(() => {
    return calculatePricing(debouncedDesign)
  }, [debouncedDesign])

  const pricePerSqm = useMemo(() => {
    return pricing.area > 0 ? pricing.total / pricing.area : 0
  }, [pricing.total, pricing.area])

  const hasDiscounts = useMemo(() => {
    return pricing.area > 2 // Example: discount for large surfaces
  }, [pricing.area])

  return {
    pricing,
    pricePerSqm,
    hasDiscounts,
  }
}
