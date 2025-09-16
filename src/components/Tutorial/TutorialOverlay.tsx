"use client"
import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

type Step = {
  selector: string
  title: string
  description: string
}

const LS_KEY = "kitchenTop:tutorial:v1"

export function TutorialOverlay() {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const steps = React.useMemo<Step[]>(
    () => [
      {
        selector: '[data-tutorial="topbar"]',
        title: "Pasek narzędzi",
        description: "Tutaj zapiszesz, wczytasz i wyeksportujesz swój projekt.",
      },
      {
        selector: '[data-tutorial="topbar-new"]',
        title: "Nowy projekt",
        description: "Rozpocznij od zera. Na mobile resetuje kreator do kroku 1.",
      },
      {
        selector: '[data-tutorial="topbar-export-pdf"]',
        title: "Eksport PDF",
        description: "Szybki eksport planu do PDF z podsumowaniem i rysunkiem.",
      },
      {
        selector: '[data-tutorial="topbar-more"]',
        title: 'Więcej',
        description: 'Dodatkowe akcje: eksport PNG/JPG/JSON oraz import projektu.',
      },
      {
        selector: '[data-tutorial="panel-bar"]',
        title: "Panele konfiguracji",
        description: "Wybierz Układ, Wymiary, Styl oraz Dodatki z tego paska.",
      },
      {
        selector: '[data-tutorial^="panel-"]',
        title: "Menu paneli",
        description: "Kliknij wybrany panel, by otworzyć jego ustawienia.",
      },
    ],
    [],
  )

  const start = React.useCallback(() => {
    setIndex(0)
    setOpen(true)
  }, [])

  // Auto-start once on desktop (not mobile), only first visit
  React.useEffect(() => {
    if (isMobile) return
    const seen = localStorage.getItem(LS_KEY)
    if (!seen) {
      // delay a tick to ensure layout present
      setTimeout(() => start(), 300)
    }
  }, [isMobile, start])

  // External trigger
  React.useEffect(() => {
    const onStart = () => start()
    window.addEventListener("tutorial:start", onStart as any)
    return () => window.removeEventListener("tutorial:start", onStart as any)
  }, [start])

  const close = () => {
    setOpen(false)
    try { localStorage.setItem(LS_KEY, "1") } catch {}
  }

  if (!open) return null

  const step = steps[index]
  const target = document.querySelector(step.selector) as HTMLElement | null
  const rect = target?.getBoundingClientRect()

  const highlightStyle: React.CSSProperties | undefined = rect
    ? {
        position: "fixed",
        left: rect.left - 6,
        top: rect.top - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        border: "2px solid #3b82f6",
        borderRadius: 8,
        boxShadow: "0 0 0 9999px rgba(0,0,0,.5)",
        pointerEvents: "none",
        zIndex: 60,
      }
    : undefined

  // Tooltip position (below target, fallback to above)
  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        left: Math.max(12, Math.min(window.innerWidth - 320 - 12, rect.left)),
        top: rect.bottom + 12 <= window.innerHeight - 120 ? rect.bottom + 12 : rect.top - 110,
        width: 320,
        zIndex: 61,
      }
    : { position: "fixed", left: 16, top: 16, width: 320, zIndex: 61 }

  return (
    <div aria-label="Tutorial overlay">
      {/* Highlight + blackout */}
      {highlightStyle && <div style={highlightStyle} />}

      {/* Tooltip */}
      <div style={tooltipStyle} className="bg-white rounded-lg border border-gray-200 shadow-lg p-3">
        <div className="text-sm text-gray-500">Krok {index + 1} z {steps.length}</div>
        <div className="font-semibold text-gray-900 mt-1">{step.title}</div>
        <div className="text-sm text-gray-700 mt-1">{step.description}</div>
        <div className="mt-3 flex items-center justify-between">
          <button className="px-2 py-1 text-xs rounded border" onClick={close}>Pomiń</button>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-xs rounded border disabled:opacity-50" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>Wstecz</button>
            {index < steps.length - 1 ? (
              <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}>Dalej</button>
            ) : (
              <button className="px-2 py-1 text-xs rounded bg-green-600 text-white" onClick={close}>Zakończ</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
