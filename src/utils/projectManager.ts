import type { Design, SavedProject, ProjectMetadata } from "../types"

const PROJECTS_STORAGE_KEY = "kitchenTop:projects:v1"
const CURRENT_PROJECT_KEY = "kitchenTop:currentProject:v1"

export function saveProject(name: string, design: Design, projectId?: string): SavedProject {
  try {
    const projects = getAllProjects()
    const now = new Date()

    const project: SavedProject = {
      id: projectId || generateProjectId(),
      name,
      design,
      createdAt: projectId ? projects.find((p) => p.id === projectId)?.createdAt || now : now,
      updatedAt: now,
    }

    const existingIndex = projects.findIndex((p) => p.id === project.id)
    if (existingIndex >= 0) {
      projects[existingIndex] = project
    } else {
      projects.push(project)
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
    localStorage.setItem(CURRENT_PROJECT_KEY, project.id)

    return project
  } catch (error) {
    console.error("Failed to save project:", error)
    throw new Error("Nie udało się zapisać projektu")
  }
}

export function getAllProjects(): SavedProject[] {
  try {
    const serialized = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!serialized) return []

    const projects = JSON.parse(serialized) as SavedProject[]
    return projects.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
  } catch (error) {
    console.error("Failed to load projects:", error)
    return []
  }
}

export function getProjectMetadata(): ProjectMetadata[] {
  return getAllProjects().map(({ design, ...metadata }) => metadata)
}

export function loadProject(projectId: string): SavedProject | null {
  try {
    const projects = getAllProjects()
    const project = projects.find((p) => p.id === projectId)

    if (project) {
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId)
    }

    return project || null
  } catch (error) {
    console.error("Failed to load project:", error)
    return null
  }
}

export function deleteProject(projectId: string): void {
  try {
    const projects = getAllProjects()
    const filteredProjects = projects.filter((p) => p.id !== projectId)

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filteredProjects))

    const currentProjectId = localStorage.getItem(CURRENT_PROJECT_KEY)
    if (currentProjectId === projectId) {
      localStorage.removeItem(CURRENT_PROJECT_KEY)
    }
  } catch (error) {
    console.error("Failed to delete project:", error)
    throw new Error("Nie udało się usunąć projektu")
  }
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY)
}

export function duplicateProject(projectId: string, newName: string): SavedProject {
  const project = loadProject(projectId)
  if (!project) {
    throw new Error("Projekt nie został znaleziony")
  }

  return saveProject(newName, project.design)
}

function generateProjectId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function exportProject(projectId: string): void {
  const project = loadProject(projectId)
  if (!project) {
    throw new Error("Projekt nie został znaleziony")
  }

  const serialized = JSON.stringify(project, null, 2)
  const blob = new Blob([serialized], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${project.name.replace(/[^a-z0-9]/gi, "_")}_${project.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function importProject(file: File): Promise<SavedProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedProject = JSON.parse(content) as SavedProject

        if (!importedProject.design || !importedProject.name) {
          throw new Error("Nieprawidłowy format pliku")
        }

        const newProject = saveProject(`${importedProject.name} (imported)`, importedProject.design)

        resolve(newProject)
      } catch (error) {
        console.error("Failed to import project:", error)
        reject(new Error("Nie udało się zaimportować projektu"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Nie udało się odczytać pliku"))
    }

    reader.readAsText(file)
  })
}
