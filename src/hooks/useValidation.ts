"use client"

import { useMemo } from "react"
import { useDebounce } from "./useDebounce"
import { validateDesign } from "../utils/validation"
import { CONFIG } from "../config"
import type { Design } from "../types"

export function useValidation(design: Design) {
  const debouncedDesign = useDebounce(design, CONFIG.VALIDATION_DEBOUNCE_MS)

  const validationErrors = useMemo(() => {
    return validateDesign(debouncedDesign)
  }, [debouncedDesign])

  const hasErrors = validationErrors.length > 0
  const errorCount = validationErrors.length
  const errorsByType = useMemo(() => {
    return validationErrors.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [validationErrors])

  return {
    validationErrors,
    hasErrors,
    errorCount,
    errorsByType,
  }
}
