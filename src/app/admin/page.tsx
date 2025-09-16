"use client"

import { useState } from "react"
import { Plus, Save, X, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Types for admin forms
interface MaterialForm {
  type: "color" | "texture"
  value: string
  name: string
  pricePerSqm: number
  category: "kolory" | "drewno" | "kamien" | "nowoczesne"
}

interface AddonForm {
  name: string
  defaultWidth: number
  defaultDepth: number
  price: number
  category: "zlewy" | "plyty" | "inne"
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"materials" | "addons">("materials")
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [showAddonForm, setShowAddonForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
  const [editingAddon, setEditingAddon] = useState<string | null>(null)

  // Material form state
  const [materialForm, setMaterialForm] = useState<MaterialForm>({
    type: "color",
    value: "#FFFFFF",
    name: "",
    pricePerSqm: 100,
    category: "kolory",
  })

  // Addon form state
  const [addonForm, setAddonForm] = useState<AddonForm>({
    name: "",
    defaultWidth: 40,
    defaultDepth: 40,
    price: 150,
    category: "zlewy",
  })

  const resetMaterialForm = () => {
    setMaterialForm({
      type: "color",
      value: "#FFFFFF",
      name: "",
      pricePerSqm: 100,
      category: "kolory",
    })
    setShowMaterialForm(false)
    setEditingMaterial(null)
  }

  const resetAddonForm = () => {
    setAddonForm({
      name: "",
      defaultWidth: 40,
      defaultDepth: 40,
      price: 150,
      category: "zlewy",
    })
    setShowAddonForm(false)
    setEditingAddon(null)
  }

  const handleSaveMaterial = () => {
    // TODO: Implement save logic to update constants/index.ts
    console.log("Saving material:", materialForm)
    resetMaterialForm()
  }

  const handleSaveAddon = () => {
    // TODO: Implement save logic to update constants/index.ts
    console.log("Saving addon:", addonForm)
    resetAddonForm()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft size={20} />
                <span>Powrót do aplikacji</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Panel Administracyjny</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("materials")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "materials"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Materiały
              </button>
              <button
                onClick={() => setActiveTab("addons")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "addons"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dodatki
              </button>
            </nav>
          </div>
        </div>

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Zarządzanie Materiałami</h2>
              <button
                onClick={() => setShowMaterialForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Dodaj Materiał
              </button>
            </div>

            {/* Material Form */}
            {showMaterialForm && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingMaterial ? "Edytuj Materiał" : "Nowy Materiał"}
                  </h3>
                  <button onClick={resetMaterialForm} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Typ</label>
                    <select
                      value={materialForm.type}
                      onChange={(e) =>
                        setMaterialForm((prev) => ({
                          ...prev,
                          type: e.target.value as "color" | "texture",
                          value: e.target.value === "color" ? "#FFFFFF" : "/textures/",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="color">Kolor</option>
                      <option value="texture">Tekstura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
                    <select
                      value={materialForm.category}
                      onChange={(e) =>
                        setMaterialForm((prev) => ({
                          ...prev,
                          category: e.target.value as MaterialForm["category"],
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kolory">Kolory jednolite</option>
                      <option value="drewno">Drewno</option>
                      <option value="kamien">Kamień naturalny</option>
                      <option value="nowoczesne">Materiały nowoczesne</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa</label>
                    <input
                      type="text"
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. Dąb jasny"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cena za m² (zł)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={materialForm.pricePerSqm}
                      onChange={(e) => setMaterialForm((prev) => ({ ...prev, pricePerSqm: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {materialForm.type === "color" ? "Kolor (hex)" : "Ścieżka do tekstury"}
                    </label>
                    {materialForm.type === "color" ? (
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={materialForm.value}
                          onChange={(e) => setMaterialForm((prev) => ({ ...prev, value: e.target.value }))}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={materialForm.value}
                          onChange={(e) => setMaterialForm((prev) => ({ ...prev, value: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={materialForm.value}
                        onChange={(e) => setMaterialForm((prev) => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="/textures/wood-oak.jpg"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={resetMaterialForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveMaterial}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    Zapisz
                  </button>
                </div>
              </div>
            )}

            {/* Materials List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Istniejące Materiały</h3>
                <p className="text-sm text-gray-500 mt-1">Lista wszystkich dostępnych materiałów w systemie</p>
              </div>
              <div className="p-4">
                <div className="text-center py-8 text-gray-500">
                  <p>Funkcja wyświetlania i edycji materiałów będzie dostępna wkrótce.</p>
                  <p className="text-sm mt-2">Materiały są obecnie zarządzane w pliku constants/index.ts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Addons Tab */}
        {activeTab === "addons" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Zarządzanie Dodatkami</h2>
              <button
                onClick={() => setShowAddonForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Dodaj Dodatek
              </button>
            </div>

            {/* Addon Form */}
            {showAddonForm && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingAddon ? "Edytuj Dodatek" : "Nowy Dodatek"}
                  </h3>
                  <button onClick={resetAddonForm} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa</label>
                    <input
                      type="text"
                      value={addonForm.name}
                      onChange={(e) => setAddonForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. Zlew pojedynczy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
                    <select
                      value={addonForm.category}
                      onChange={(e) =>
                        setAddonForm((prev) => ({
                          ...prev,
                          category: e.target.value as AddonForm["category"],
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="zlewy">Zlewy</option>
                      <option value="plyty">Płyty grzewcze</option>
                      <option value="inne">Inne dodatki</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Szerokość (cm)</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      step="0.5"
                      value={addonForm.defaultWidth}
                      onChange={(e) => setAddonForm((prev) => ({ ...prev, defaultWidth: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Głębokość (cm)</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      step="0.5"
                      value={addonForm.defaultDepth}
                      onChange={(e) => setAddonForm((prev) => ({ ...prev, defaultDepth: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cena (zł)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={addonForm.price}
                      onChange={(e) => setAddonForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={resetAddonForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveAddon}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    Zapisz
                  </button>
                </div>
              </div>
            )}

            {/* Addons List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Istniejące Dodatki</h3>
                <p className="text-sm text-gray-500 mt-1">Lista wszystkich dostępnych dodatków w systemie</p>
              </div>
              <div className="p-4">
                <div className="text-center py-8 text-gray-500">
                  <p>Funkcja wyświetlania i edycji dodatków będzie dostępna wkrótce.</p>
                  <p className="text-sm mt-2">Dodatki są obecnie zarządzane w pliku constants/index.ts</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
