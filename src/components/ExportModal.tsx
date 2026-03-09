import React, { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { useFabric } from "../contexts/FabricContext";
import type { ExportFormat } from "../types/editor";

const RESOLUTIONS = [
  {
    label: "Original",
    value: "original" as const,
    description: "Native canvas dimensions",
  },
  { label: "2×", value: "2x" as const, description: "Double resolution" },
  { label: "4K", value: "4k" as const, description: "Longest side = 3840px" },
  {
    label: "Custom",
    value: "custom" as const,
    description: "Set exact dimensions",
  },
];

const FORMATS: { label: string; value: ExportFormat; description: string }[] = [
  {
    label: "PNG",
    value: "png",
    description: "Lossless · Best for graphics & text",
  },
  { label: "JPEG", value: "jpeg", description: "Compressed · Best for photos" },
  { label: "WEBP", value: "webp", description: "Modern format · Best for web" },
];

export const ExportModal: React.FC = () => {
  const {
    theme,
    isExportModalOpen,
    setExportModalOpen,
    canvasSize,
    showToast,
    exportSettings,
    setExportSettings,
  } = useEditorStore();
  const { canvasRef } = useFabric();
  const [exporting, setExporting] = useState(false);

  const dark = theme === "dark";
  const bg = dark ? "bg-[#16161a]" : "bg-white";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const text = dark ? "text-[#f0f0f5]" : "text-[#111114]";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";
  const inp = dark
    ? "bg-[#1e1e24] text-[#f0f0f5]"
    : "bg-gray-100 text-[#111114]";
  const overlay = dark ? "bg-black/60" : "bg-black/30";

  if (!isExportModalOpen) return null;

  const { resolution, customWidth, customHeight, format, quality } =
    exportSettings;

  const getMultiplier = (): number => {
    const w = canvasSize.width;
    const h = canvasSize.height;
    if (resolution === "original") return 1;
    if (resolution === "2x") return 2;
    if (resolution === "4k") {
      const longest = Math.max(w, h);
      return 3840 / longest;
    }
    if (resolution === "custom") {
      return Math.min(customWidth / w, customHeight / h);
    }
    return 1;
  };

  const getOutputSize = (): { w: number; h: number } => {
    const mult = getMultiplier();
    return {
      w: Math.round(canvasSize.width * mult),
      h: Math.round(canvasSize.height * mult),
    };
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50)); // let UI update
      const multiplier = getMultiplier();
      const dataURL = canvas.toDataURL({
        format: format === "jpeg" ? "jpeg" : format === "webp" ? "webp" : "png",
        quality: quality / 100,
        multiplier,
        enableRetinaScaling: true,
      } as any);
      const { w, h } = getOutputSize();
      const link = document.createElement("a");
      link.download = `pixframe-export.${format}`;
      link.href = dataURL;
      link.click();
      setExportModalOpen(false);
      showToast(`Exported as ${format.toUpperCase()} · ${w}×${h}`);
    } catch (e) {
      showToast("Export failed — try reducing resolution");
      console.error("Export error:", e);
    } finally {
      setExporting(false);
    }
  };

  const { w: outW, h: outH } = getOutputSize();

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-center justify-center ${overlay} backdrop-blur-sm`}
      onClick={(e) => {
        if (e.target === e.currentTarget) setExportModalOpen(false);
      }}
    >
      <div
        className={`w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border ${bg} ${border} ${text} shadow-2xl panel-slide-in`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${border}`}
        >
          <div>
            <h2 className="text-base font-bold">Export Design</h2>
            <p className={`text-xs ${muted}`}>
              Pixel-perfect, full resolution export
            </p>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className={`p-2 rounded-lg ${hov} ${muted} transition-colors`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resolution */}
          <div>
            <p
              className={`text-xs font-semibold ${muted} uppercase tracking-widest mb-3`}
            >
              Resolution
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setExportSettings({ resolution: r.value })}
                  className={`text-left p-3 rounded-xl border transition-all
                    ${
                      resolution === r.value
                        ? "border-[#ff6b4a] bg-[#ff6b4a]/10"
                        : `${border} ${hov}`
                    }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-sm font-semibold ${resolution === r.value ? "text-[#ff6b4a]" : ""}`}
                    >
                      {r.label}
                    </span>
                    {resolution === r.value && (
                      <span className="w-2 h-2 rounded-full bg-[#ff6b4a]" />
                    )}
                  </div>
                  <p className={`text-xs ${muted}`}>{r.description}</p>
                </button>
              ))}
            </div>
            {resolution === "custom" && (
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="number"
                  value={customWidth}
                  min={100}
                  max={10000}
                  onChange={(e) =>
                    setExportSettings({ customWidth: +e.target.value })
                  }
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border ${border} ${inp} focus:outline-none focus:border-[#ff6b4a]`}
                  placeholder="Width"
                />
                <span className={`text-sm ${muted}`}>×</span>
                <input
                  type="number"
                  value={customHeight}
                  min={100}
                  max={10000}
                  onChange={(e) =>
                    setExportSettings({ customHeight: +e.target.value })
                  }
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border ${border} ${inp} focus:outline-none focus:border-[#ff6b4a]`}
                  placeholder="Height"
                />
              </div>
            )}
          </div>

          {/* Output size preview */}
          <div
            className={`flex items-center justify-between rounded-xl border ${border} px-4 py-3`}
          >
            <span className={`text-xs ${muted}`}>Output size</span>
            <span className="text-sm font-mono font-semibold">
              {outW} × {outH} px
            </span>
          </div>

          {/* Format */}
          <div>
            <p
              className={`text-xs font-semibold ${muted} uppercase tracking-widest mb-3`}
            >
              Format
            </p>
            <div className="space-y-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setExportSettings({ format: f.value })}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all
                    ${format === f.value ? "border-[#ff6b4a] bg-[#ff6b4a]/10" : `${border} ${hov}`}`}
                >
                  <div>
                    <span
                      className={`text-sm font-semibold ${format === f.value ? "text-[#ff6b4a]" : ""}`}
                    >
                      {f.label}
                    </span>
                    <p className={`text-xs ${muted}`}>{f.description}</p>
                  </div>
                  {format === f.value && (
                    <span className="w-2 h-2 rounded-full bg-[#ff6b4a]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quality (JPEG / WEBP) */}
          {(format === "jpeg" || format === "webp") && (
            <div>
              <div className="flex justify-between mb-2">
                <p
                  className={`text-xs font-semibold ${muted} uppercase tracking-widest`}
                >
                  Quality
                </p>
                <span className="text-xs font-mono">{quality}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) =>
                  setExportSettings({ quality: +e.target.value })
                }
                className="w-full accent-[#ff6b4a]"
              />
              <div className={`flex justify-between text-[10px] ${muted} mt-1`}>
                <span>Smaller file</span>
                <span>Best quality</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${border} flex gap-3`}>
          <button
            onClick={() => setExportModalOpen(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${border} ${hov} transition-all`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white
              bg-gradient-to-r from-[#ff6b4a] to-[#e8445a]
              hover:brightness-110 active:scale-[0.98] transition-all
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Preparing export...
              </>
            ) : (
              <>
                <Download size={16} />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
