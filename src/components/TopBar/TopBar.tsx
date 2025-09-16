"use client";

import type React from "react";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Save,
  FolderOpen,
  FileDown,
  Upload,
  FileText,
  RotateCcw,
  ImageIcon,
  Camera,
} from "lucide-react";
import { pl } from "../../i18n/pl";
import { useDesignStore } from "../../store/designStore";
import {
  saveDesignToStorage,
  loadDesignFromStorage,
  exportDesignAsJSON,
  importDesignFromJSON,
  exportDesignAsPDF,
} from "../../utils/persistence";
import { exportDesignAsHighResImage } from "../../utils/imageExport";
import { useNotifications } from "../../hooks/useNotifications";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { saveProject, getAllProjects, loadProject as pmLoadProject } from "@/utils/projectManager";

export const TopBar: React.FC = () => {
  const { design, resetDesign, loadDesign } = useDesignStore();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleNew = () => {
    if (
      confirm(
        "Czy na pewno chcesz utworzyć nowy projekt? Niezapisane zmiany zostaną utracone."
      )
    ) {
      resetDesign();
      try {
        window.dispatchEvent(new CustomEvent("wizard:reset"));
      } catch {}
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const defaultName = `Projekt ${new Date().toLocaleString("pl-PL")}`;
      const name = prompt("Podaj nazwę projektu", defaultName);
      if (!name) {
        setIsLoading(false);
        return;
      }
      const p = saveProject(name, design);
      addNotification({ type: "success", title: "Projekt zapisany", message: `Zapisano jako "${p.name}"` });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd zapisywania",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    try {
      setIsLoading(true);
      const projects = getAllProjects();
      if (projects.length === 0) {
        addNotification({ type: "warning", title: "Brak projektów", message: "Nie znaleziono zapisanych projektów." });
        return;
      }
      const listing = projects
        .map((p, i) => `${i + 1}. ${p.name} — ${p.updatedAt.toLocaleString()}`)
        .join("\n");
      const idxStr = prompt(`Wybierz projekt do wczytania (1-${projects.length}):\n${listing}`);
      if (!idxStr) return;
      const idx = parseInt(idxStr, 10);
      if (Number.isNaN(idx) || idx < 1 || idx > projects.length) {
        addNotification({ type: "error", title: "Błędny wybór", message: "Podaj poprawny numer projektu." });
        return;
      }
      const proj = projects[idx - 1];
      const loaded = pmLoadProject(proj.id);
      if (loaded) {
        if (confirm("Wczytać wybrany projekt? Bieżące zmiany zostaną utracone.")) {
          loadDesign(loaded.design);
          addNotification({ type: "success", title: "Projekt wczytany", message: `Wczytano "${loaded.name}".` });
          try { window.dispatchEvent(new CustomEvent("wizard:open-summary")); } catch {}
        }
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd wczytywania",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      await exportDesignAsPDF(design);
      addNotification({
        type: "success",
        title: "PDF wyeksportowany",
        message: "PDF został wyeksportowany pomyślnie!",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd eksportu PDF",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsLoading(true);
      exportDesignAsJSON(design);
      addNotification({
        type: "success",
        title: "Projekt wyeksportowany jako JSON",
        message: "Projekt został wyeksportowany jako JSON!",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd eksportu JSON",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportJSON = async () => {
    try {
      setIsLoading(true);
      const importedDesign = await importDesignFromJSON();
      if (
        confirm(
          "Czy na pewno chcesz zaimportować ten projekt? Bieżące zmiany zostaną utracone."
        )
      ) {
        loadDesign(importedDesign);
        addNotification({
          type: "success",
          title: "Projekt zaimportowany",
          message: "Projekt został zaimportowany pomyślnie!",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd importu",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPNG = async () => {
    try {
      setIsLoading(true);
      exportDesignAsHighResImage(design, "png");
      addNotification({
        type: "success",
        title: "Obraz PNG wyeksportowany",
        message: "Obraz PNG został wyeksportowany pomyślnie!",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd eksportu PNG",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJPG = async () => {
    try {
      setIsLoading(true);
      exportDesignAsHighResImage(design, "jpg");
      addNotification({
        type: "success",
        title: "Obraz JPG wyeksportowany",
        message: "Obraz JPG został wyeksportowany pomyślnie!",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Błąd eksportu JPG",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-2 py-2" data-tutorial="topbar">
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          onClick={handleNew}
          disabled={isLoading}
          className="flex items-center whitespace-nowrap gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-tutorial="topbar-new"
        >
          <RotateCcw size={16} />
          {pl.nowy}
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center whitespace-nowrap  gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {pl.zapisz}
        </button>

        <button
          onClick={handleLoad}
          disabled={isLoading}
          className="flex items-center whitespace-nowrap gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderOpen size={16} />
          {pl.wczytaj}
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleExportPDF}
          disabled={isLoading}
          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-tutorial="topbar-export-pdf"
        >
          <FileText size={16} />
          {pl.eksportujPDF}
        </button>

        <button
          onClick={handleExportPNG}
          disabled={isLoading}
          className="flex items-center whitespace-nowrap gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon size={16} />
          PNG
        </button>

        <button
          onClick={handleExportJPG}
          disabled={isLoading}
          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera size={16} />
          JPG
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleExportJSON}
          disabled={isLoading}
          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown size={16} />
          {pl.eksportujJSON}
        </button>

        <button
          onClick={handleImportJSON}
          disabled={isLoading}
          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={16} />
          {pl.importujJSON}
        </button>

        {/* More dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="ml-2 px-3 py-2 text-sm whitespace-nowrap rounded border bg-white text-gray-800 hover:bg-gray-50"
              aria-label="Więcej"
              data-tutorial="topbar-more"
            >
              Więcej
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content sideOffset={6} align="end" className="min-w-[220px] rounded-md border border-gray-200 bg-white p-1 shadow-md">
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleNew(); }}>Nowy projekt</DropdownMenu.Item>
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleSave(); }}>Zapisz</DropdownMenu.Item>
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleLoad(); }}>Wczytaj</DropdownMenu.Item>
              <div className="my-1 h-px bg-gray-200" />
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleExportPDF(); }}>Eksportuj PDF</DropdownMenu.Item>
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleExportPNG(); }}>Eksportuj PNG</DropdownMenu.Item>
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleExportJPG(); }}>Eksportuj JPG</DropdownMenu.Item>
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleExportJSON(); }}>Eksportuj JSON</DropdownMenu.Item>
              <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer" onSelect={(e) => { e.preventDefault(); handleImportJSON(); }}>Importuj JSON</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button
          className="ml-1 px-3 py-2 text-sm whitespace-nowrap rounded border bg-white text-gray-800 hover:bg-gray-50"
          onClick={() => { try { window.dispatchEvent(new CustomEvent('tutorial:start')) } catch {} }}
        >
          Samouczek
        </button>

        {isLoading && (
          <div className="ml-4 flex items-center gap-2 text-sm text-gray-600">
            <LoadingSpinner size="sm" />
            Przetwarzanie...
          </div>
        )}
      </div>
    </div>
  );
};
