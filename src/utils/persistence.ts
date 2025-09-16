import type { Design } from "../types"

const STORAGE_KEY = "kitchenTop:design:v1"

export function saveDesignToStorage(design: Design): void {
  try {
    const serialized = JSON.stringify(design)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error("Failed to save design to localStorage:", error)
    throw new Error("Nie udało się zapisać projektu")
  }
}

export function loadDesignFromStorage(): Design | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return null

    return JSON.parse(serialized) as Design
  } catch (error) {
    console.error("Failed to load design from localStorage:", error)
    return null
  }
}

export function exportDesignAsJSON(design: Design): void {
  try {
    const serialized = JSON.stringify(design, null, 2)
    const blob = new Blob([serialized], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `kitchenTop-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Failed to export design as JSON:", error)
    throw new Error("Nie udało się wyeksportować projektu")
  }
}

export function importDesignFromJSON(): Promise<Design> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error("Nie wybrano pliku"))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const design = JSON.parse(content) as Design

          // Basic validation
          if (!design.layout || !design.dimensions || !design.style) {
            throw new Error("Nieprawidłowy format pliku")
          }

          resolve(design)
        } catch (error) {
          console.error("Failed to parse JSON:", error)
          reject(new Error("Nie udało się odczytać pliku. Sprawdź czy plik jest prawidłowy."))
        }
      }

      reader.onerror = () => {
        reject(new Error("Nie udało się odczytać pliku"))
      }

      reader.readAsText(file)
    }

    input.click()
  })
}

export function exportDesignAsPDF(design: Design): Promise<void> {
  return import("./pdfExport").then(async ({ generatePDF }) => {
    try {
      const pdfBytes = await generatePDF(design)
      // Ensure BlobPart is an ArrayBuffer, not a generic Uint8Array<ArrayBufferLike>
      const arrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ) as ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `kitchenTop-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export PDF:", error)
      throw new Error("Nie udało się wyeksportować PDF")
    }
  })
}
