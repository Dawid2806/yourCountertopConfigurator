"use client"
import React, { useState, useMemo } from "react"
import { LayoutPanel } from "@/components/Panels/LayoutPanel"
import { DimensionsPanel } from "@/components/Panels/DimensionsPanel"
import { StylePanel } from "@/components/Panels/StylePanel"
import { AddOnsPanel } from "@/components/Panels/AddOnsPanel"
import { useDesignStore } from "@/store/designStore"
import { useNotifications } from "@/hooks/useNotifications"
import { exportDesignAsPDF, exportDesignAsJSON } from "@/utils/persistence"
import { exportDesignAsHighResImage } from "@/utils/imageExport"
import { calculateCutoutPosition, generatePolygon } from "@/utils/geometry"
import { saveProject, getAllProjects, loadProject, deleteProject, exportProject, importProject } from "@/utils/projectManager"

type Step = 0 | 1 | 2 | 3 | 4

export function MobileAssistant() {
  const { design } = useDesignStore()
  const { addNotification } = useNotifications()
  const [step, setStep] = useState<Step>(0)

  const next = () => setStep((s) => (Math.min(4, s + 1) as Step))
  const prev = () => setStep((s) => (Math.max(0, s - 1) as Step))

  const steps: Array<{ title: string; component: React.ReactNode }> = [
    { title: "Układ", component: <LayoutPanel /> },
    { title: "Wymiary", component: <DimensionsPanel /> },
    { title: "Styl", component: <StylePanel /> },
    { title: "Dodatki", component: <AddOnsPanel /> },
    { title: "Podsumowanie", component: <Summary /> },
  ]

  const progressPct = ((step + 1) / steps.length) * 100

  const handleExport = async (type: "pdf" | "png" | "jpg" | "json") => {
    try {
      if (type === "pdf") await exportDesignAsPDF(design)
      if (type === "png" || type === "jpg") exportDesignAsHighResImage(design, type)
      if (type === "json") exportDesignAsJSON(design)
      addNotification({ type: "success", title: "Eksport", message: "Pomyślnie wyeksportowano" })
    } catch (e) {
      addNotification({ type: "error", title: "Błąd eksportu", message: "Nie udało się wyeksportować" })
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* listen to topbar events */}
      <EventBridge onReset={() => setStep(0)} onSummary={() => setStep(4 as Step)} />
      <div className="p-3 border-b bg-white flex items-center justify-between gap-2">
        <div>
          <div className="text-sm text-gray-600">Kreator (krok {step + 1} z {steps.length})</div>
          <div className="font-semibold text-gray-900">{steps[step].title}</div>
        </div>
        <button
          className="px-3 py-1.5 text-xs rounded-md border bg-white text-gray-700"
          onClick={() => setStep(0)}
        >
          Resetuj kreator
        </button>
      </div>
      <div className="px-3 pt-2">
        <div className="h-1.5 bg-gray-200 rounded">
          <div className="h-full bg-blue-600 rounded" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white border rounded-xl p-3 shadow-sm">
          {steps[step].component}
        </div>
        {step === 4 && (
          <div className="mt-4">
            <ProjectsWidget onLoaded={() => { /* stay on summary */ }} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t flex items-center justify-between gap-2">
        <button
          className="px-3 py-2 text-sm rounded-md border bg-white text-gray-900 disabled:opacity-50"
          onClick={prev}
          disabled={step === 0}
        >
          Wstecz
        </button>
        {step < steps.length - 1 ? (
          <button
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white"
            onClick={next}
          >
            Dalej
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm rounded-md border" onClick={() => handleExport("json")}>Eksport JSON</button>
            <button className="px-3 py-2 text-sm rounded-md border" onClick={() => handleExport("png")}>Eksport PNG</button>
            <button className="px-3 py-2 text-sm rounded-md bg-green-600 text-white" onClick={() => handleExport("pdf")}>
              Eksport PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Summary() {
  const { design } = useDesignStore()
  const polygon = useMemo(
    () => generatePolygon(design.layout, design.dimensions, design.orientation),
    [design],
  )

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm text-gray-600">Układ</div>
        <div className="font-medium text-gray-900 capitalize">{design.layout.replace("-", " ")}</div>
      </div>
      <div>
        <div className="text-sm text-gray-600">Wymiary</div>
        <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto">{JSON.stringify(design.dimensions, null, 2)}</pre>
      </div>
      <div>
        <div className="text-sm text-gray-600">Styl</div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border"
            style={{
              backgroundColor: design.style.type === "color" ? design.style.value : "#D2B48C",
              backgroundImage: design.style.type === "texture" ? `url(${(design.style as any).preview || design.style.value})` : "none",
              backgroundSize: "cover",
            }}
          />
          <div className="text-sm text-gray-800">{design.style.name}</div>
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-600">Dodatki</div>
        {design.cutouts.length === 0 ? (
          <div className="text-sm text-gray-500">Brak dodanych elementów</div>
        ) : (
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {design.cutouts.map((c) => (
              <li key={c.id}>
                {c.name} — {c.width}×{c.depth} cm
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="text-sm text-gray-600">Podgląd (schematyczny)</div>
        {polygon.length > 0 ? (
          <MiniPolygon polygon={polygon} />
        ) : (
          <div className="text-xs text-gray-500">Brak podglądu</div>
        )}
      </div>
    </div>
  )
}

function MiniPolygon({ polygon }: { polygon: Array<{ x: number; y: number }> }) {
  // Fit polygon to a small box 280x160
  const w = 280, h = 160, pad = 8
  const minX = Math.min(...polygon.map(p => p.x))
  const maxX = Math.max(...polygon.map(p => p.x))
  const minY = Math.min(...polygon.map(p => p.y))
  const maxY = Math.max(...polygon.map(p => p.y))
  const polyW = Math.max(1, maxX - minX)
  const polyH = Math.max(1, maxY - minY)
  const sx = (w - 2*pad) / polyW
  const sy = (h - 2*pad) / polyH
  const s = Math.min(sx, sy)
  const pts = polygon.map(p => ({ x: pad + (p.x - minX)*s, y: pad + (p.y - minY)*s }))
  const d = pts.map((p,i) => (i===0?`M ${p.x},${p.y}`:`L ${p.x},${p.y}`)).join(' ') + ' Z'
  return (
    <svg width={w} height={h} className="border rounded bg-gray-50">
      <path d={d} fill="#d2b48c" stroke="#8B4513" strokeWidth={2} />
    </svg>
  )
}

function EventBridge({ onReset, onSummary }: { onReset: () => void; onSummary: () => void }) {
  React.useEffect(() => {
    const r = () => onReset()
    const s = () => onSummary()
    window.addEventListener('wizard:reset', r as any)
    window.addEventListener('wizard:open-summary', s as any)
    return () => {
      window.removeEventListener('wizard:reset', r as any)
      window.removeEventListener('wizard:open-summary', s as any)
    }
  }, [onReset, onSummary])
  return null
}

function ProjectsWidget({ onLoaded }: { onLoaded: () => void }) {
  const { design, loadDesign } = useDesignStore()
  const { addNotification } = useNotifications()
  const [name, setName] = React.useState("")
  const [projects, setProjects] = React.useState(getAllProjects())
  const refresh = () => setProjects(getAllProjects())

  const handleSaveAs = () => {
    if (!name.trim()) {
      addNotification({ type: 'warning', title: 'Nazwa wymagana', message: 'Podaj nazwę projektu.' })
      return
    }
    try {
      const p = saveProject(name.trim(), design)
      setName("")
      refresh()
      addNotification({ type: 'success', title: 'Zapisano', message: `Projekt "${p.name}" zapisany.` })
    } catch (e) {
      addNotification({ type: 'error', title: 'Błąd zapisu', message: 'Nie udało się zapisać projektu.' })
    }
  }

  const handleLoad = (id: string) => {
    const p = loadProject(id)
    if (p) {
      loadDesign(p.design)
      addNotification({ type: 'success', title: 'Wczytano', message: `Projekt "${p.name}" wczytany.` })
      onLoaded()
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Usunąć projekt?')) return
    try { deleteProject(id); refresh(); } catch { addNotification({ type: 'error', title: 'Błąd', message: 'Nie udało się usunąć.' }) }
  }

  const handleImport = async (file: File) => {
    try {
      await importProject(file)
      refresh()
      addNotification({ type: 'success', title: 'Zaimportowano', message: 'Projekt został zaimportowany.' })
    } catch {
      addNotification({ type: 'error', title: 'Błąd importu', message: 'Nie udało się zaimportować.' })
    }
  }

  return (
    <div className="bg-white border rounded-xl p-3 shadow-sm">
      <div className="font-medium text-gray-900 mb-2">Projekty</div>
      <div className="flex items-center gap-2 mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa projektu" className="flex-1 px-2 py-1.5 text-sm border rounded" />
        <button className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white" onClick={handleSaveAs}>Zapisz jako</button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <label className="px-3 py-1.5 text-sm rounded border cursor-pointer">
          Importuj JSON
          <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
        </label>
      </div>
      {projects.length === 0 ? (
        <div className="text-sm text-gray-500">Brak zapisanych projektów.</div>
      ) : (
        <ul className="divide-y">
          {projects.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm text-gray-900 font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">{new Date(p.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 text-xs rounded border" onClick={() => handleLoad(p.id)}>Wczytaj</button>
                <button className="px-2 py-1 text-xs rounded border" onClick={() => exportProject(p.id)}>Eksportuj</button>
                <button className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 border border-red-200" onClick={() => handleDelete(p.id)}>Usuń</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
