"use client"

import { useState, useEffect } from "react"
import { useDesignStore } from "../../store/designStore"
import {
  saveProject,
  getAllProjects,
  loadProject,
  deleteProject,
  duplicateProject,
  exportProject,
  importProject,
  getCurrentProjectId,
} from "../../utils/projectManager"
import type { SavedProject } from "../../types"

export function ProjectPanel() {
  const { design, loadDesign } = useDesignStore()
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadProjects()
    setCurrentProjectId(getCurrentProjectId())
  }, [])

  const loadProjects = () => {
    const allProjects = getAllProjects()
    setProjects(allProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()))
  }

  const handleSaveProject = async () => {
    if (!projectName.trim()) return

    setIsLoading(true)
    try {
      const savedProject = saveProject(projectName.trim(), design, currentProjectId || undefined)
      setCurrentProjectId(savedProject.id)
      setShowSaveDialog(false)
      setProjectName("")
      loadProjects()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Błąd podczas zapisywania")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadProject = (projectId: string) => {
    const project = loadProject(projectId)
    if (project) {
      loadDesign(project.design)
      setCurrentProjectId(project.id)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten projekt?")) {
      deleteProject(projectId)
      if (currentProjectId === projectId) {
        setCurrentProjectId(null)
      }
      loadProjects()
    }
  }

  const handleDuplicateProject = (projectId: string) => {
    const originalProject = projects.find((p) => p.id === projectId)
    if (originalProject) {
      const newName = prompt("Nazwa kopii:", `${originalProject.name} - kopia`)
      if (newName) {
        duplicateProject(projectId, newName)
        loadProjects()
      }
    }
  }

  const handleExportProject = (projectId: string) => {
    try {
      exportProject(projectId)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Błąd podczas eksportu")
    }
  }

  const handleImportProject = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          await importProject(file)
          loadProjects()
        } catch (error) {
          alert(error instanceof Error ? error.message : "Błąd podczas importu")
        }
      }
    }

    input.click()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Projekty</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Zapisz
          </button>
          <button
            onClick={handleImportProject}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Import
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Nazwa projektu..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveProject}
                disabled={!projectName.trim() || isLoading}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Zapisywanie..." : "Zapisz"}
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setProjectName("")
                }}
                className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Brak zapisanych projektów</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`p-3 border rounded-md transition-colors ${
                currentProjectId === project.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">Utworzony: {formatDate(project.createdAt)}</p>
                  {project.updatedAt.getTime() !== project.createdAt.getTime() && (
                    <p className="text-xs text-gray-500">Zmieniony: {formatDate(project.updatedAt)}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleLoadProject(project.id)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded text-xs"
                    title="Wczytaj projekt"
                  >
                    📂
                  </button>
                  <button
                    onClick={() => handleDuplicateProject(project.id)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded text-xs"
                    title="Duplikuj projekt"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleExportProject(project.id)}
                    className="p-1 text-green-600 hover:bg-green-100 rounded text-xs"
                    title="Eksportuj projekt"
                  >
                    💾
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded text-xs"
                    title="Usuń projekt"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
