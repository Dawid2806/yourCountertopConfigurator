"use client";

import type React from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Wrench,
  Zap,
} from "lucide-react";
import { useDesignStore } from "../../store/designStore";
import {
  getValidationSummary,
  getAutoFixSuggestion,
  canAutoFix,
} from "../../utils/validation";
import { exportDesignAsPDF } from "../../utils/persistence";
import { useValidation } from "../../hooks/useValidation";
import { useNotifications } from "../../hooks/useNotifications";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState } from "react";

export const ValidationPanel: React.FC = () => {
  const { design, updateCutout } = useDesignStore();
  const { addNotification } = useNotifications();
  const [isExporting, setIsExporting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const {
    validationErrors: errors,
    hasErrors,
    errorCount,
  } = useValidation(design);
  const summary = getValidationSummary(errors);

  const handleQuickExportPDF = async () => {
    try {
      setIsExporting(true);
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
      setIsExporting(false);
    }
  };

  const handleAutoFix = async (error: any) => {
    setIsFixing(true);
    try {
      const fixedCutout = getAutoFixSuggestion(error, design);
      if (fixedCutout) {
        updateCutout(fixedCutout.id, {
          offsetX: fixedCutout.offsetX,
          offsetY: fixedCutout.offsetY,
        });
        addNotification({
          type: "success",
          title: "Błąd naprawiony",
          message: `Pozycja elementu ${fixedCutout.name} została skorygowana`,
        });
      }
    } catch (err) {
      console.error("Auto-fix failed:", err);
      addNotification({
        type: "error",
        title: "Błąd naprawy",
        message: "Nie udało się automatycznie naprawić błędu",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleAutoFixAll = async () => {
    setIsFixing(true);
    let fixedCount = 0;
    try {
      for (const error of errors) {
        if (canAutoFix(error)) {
          const fixedCutout = getAutoFixSuggestion(error, design);
          if (fixedCutout) {
            updateCutout(fixedCutout.id, {
              offsetX: fixedCutout.offsetX,
              offsetY: fixedCutout.offsetY,
            });
            fixedCount++;
          }
        }
      }

      if (fixedCount > 0) {
        addNotification({
          type: "success",
          title: "Błędy naprawione",
          message: `Naprawiono ${fixedCount} błędów automatycznie`,
        });
      }
    } catch (err) {
      console.error("Auto-fix all failed:", err);
      addNotification({
        type: "error",
        title: "Błąd naprawy",
        message: "Nie udało się naprawić wszystkich błędów",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "edge-distance":
        return <AlertTriangle size={16} className="text-orange-500" />;
      case "overlap":
        return <XCircle size={16} className="text-red-500" />;
      case "outside-bounds":
        return <XCircle size={16} className="text-red-500" />;
      case "dimension-invalid":
        return <AlertTriangle size={16} className="text-orange-500" />;
      default:
        return <AlertTriangle size={16} className="text-yellow-500" />;
    }
  };

  const getErrorSeverity = (type: string) => {
    switch (type) {
      case "edge-distance":
        return "Ostrzeżenie";
      case "overlap":
        return "Błąd krytyczny";
      case "outside-bounds":
        return "Błąd krytyczny";
      case "dimension-invalid":
        return "Błąd konfiguracji wymiarów";
      default:
        return "Ostrzeżenie";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 m-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {!hasErrors ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <AlertTriangle size={20} className="text-red-500" />
          )}
          <h3 className="font-semibold text-gray-800">Walidacja projektu</h3>
          {hasErrors && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {errorCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasErrors && errors.some(canAutoFix) && (
            <button
              onClick={handleAutoFixAll}
              disabled={isFixing}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFixing ? <LoadingSpinner size="sm" /> : <Zap size={14} />}
              {isFixing ? "Naprawianie..." : "Napraw wszystko"}
            </button>
          )}

          {!hasErrors && (
            <button
              onClick={handleQuickExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FileText size={14} />
              )}
              {isExporting ? "Eksportowanie..." : "Eksportuj PDF"}
            </button>
          )}
        </div>
      </div>

      <div
        className={`text-sm mb-3 ${
          !hasErrors ? "text-green-600" : "text-red-600"
        }`}
      >
        {summary}
      </div>

      {hasErrors && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded"
            >
              <div className="flex items-start gap-2 flex-1">
                {getErrorIcon(error.type)}
                <div className="flex-1">
                  <div className="text-sm text-red-700 font-medium">
                    {error.message}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {getErrorSeverity(error.type)}
                  </div>
                </div>
              </div>

              {canAutoFix(error) && (
                <button
                  onClick={() => handleAutoFix(error)}
                  disabled={isFixing}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFixing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Wrench size={12} />
                  )}
                  Napraw
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasErrors && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span className="font-medium">Projekt jest gotowy do eksportu</span>
          </div>
          <div className="mt-1 text-xs">
            Wszystkie otwory są prawidłowo umieszczone i spełniają wymagania
            techniczne.
          </div>
        </div>
      )}

      {hasErrors && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Wskazówki:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Otwory muszą być oddalone min. 3 cm od krawędzi</li>
            <li>• Otwory nie mogą się nakładać ani wykraczać poza blat</li>
            <li>• Użyj przycisku "Napraw" dla automatycznej korekty</li>
            <li>
              • Przeciągnij otwory ręcznie dla precyzyjnego pozycjonowania
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
