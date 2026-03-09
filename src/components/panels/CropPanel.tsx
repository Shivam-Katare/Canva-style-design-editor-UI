import React, { useState } from "react";
import { FabricImage } from "fabric";
import { useEditorStore } from "../../store/editorStore";
import { useFabric } from "../../contexts/FabricContext";

const ASPECT_PRESETS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];

export const CropPanel: React.FC = () => {
  const { theme, selectedLayerId, pushHistory, showToast } = useEditorStore();
  const { canvasRef, pushCanvasStateImmediateRef } = useFabric();
  const [aspect, setAspect] = useState<number | null>(null);

  const dark = theme === "dark";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";

  const getSelected = (): FabricImage | null => {
    if (!canvasRef.current || !selectedLayerId) return null;
    const obj = canvasRef.current
      .getObjects()
      .find((o: any) => o.data?.id === selectedLayerId);
    return obj instanceof FabricImage ? obj : null;
  };

  const applyCrop = () => {
    const img = getSelected();
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Apply crop by adjusting clipPath or using Fabric's built-in crop
    // We use a simple approach: set cropX, cropY, width, height on the image
    const w = img.getScaledWidth();
    const h = img.getScaledHeight();

    let cropW = w;
    let cropH = h;
    if (aspect) {
      if (w / h > aspect) {
        cropW = h * aspect;
      } else {
        cropH = w / aspect;
      }
    }

    // Convert back to unscaled coordinates
    const scaleX = img.scaleX || 1;
    const scaleY = img.scaleY || 1;
    const origW = img.width || 0;
    const origH = img.height || 0;

    const newCropX = (w - cropW) / 2 / scaleX;
    const newCropY = (h - cropH) / 2 / scaleY;
    const newW = origW - 2 * newCropX;
    const newH = origH - 2 * newCropY;

    img.set({
      cropX: (img.cropX || 0) + newCropX,
      cropY: (img.cropY || 0) + newCropY,
      width: newW,
      height: newH,
    });

    canvas.renderAll();
    const json = JSON.stringify((canvas as any).toObject(["data"]));
    pushHistory(json);
    pushCanvasStateImmediateRef.current?.(json);
    showToast("Crop applied");
  };

  const cancelCrop = () => {
    showToast("Crop cancelled");
  };

  const hasImage = !!getSelected();

  return (
    <div className="p-4 space-y-5">
      {!hasImage ? (
        <div className={`text-center py-8 space-y-2`}>
          <div className="text-4xl">??</div>
          <p className={`text-sm font-medium ${muted}`}>
            Select an image layer
          </p>
          <p className={`text-xs ${muted}`}>
            Crop is only available for image layers
          </p>
        </div>
      ) : (
        <>
          <div>
            <p
              className={`text-xs font-semibold ${muted} uppercase tracking-widest mb-3`}
            >
              Aspect Ratio
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setAspect(p.value)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all
                    ${
                      aspect === p.value
                        ? "border-[#ff6b4a] bg-[#ff6b4a]/20 text-[#ff6b4a]"
                        : `${border} ${muted} ${hov}`
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border ${border} ${dark ? "bg-[#111114]" : "bg-gray-50"} p-4 text-center`}
          >
            <p className={`text-xs ${muted} mb-1`}>Crop Preview</p>
            <p className={`text-xs ${muted}`}>
              {aspect
                ? `${ASPECT_PRESETS.find((p) => p.value === aspect)?.label} ratio`
                : "Freeform"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyCrop}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                bg-[#ff6b4a] text-white hover:bg-[#e85b3c] active:scale-[0.98] transition-all"
            >
              Apply Crop
            </button>
            <button
              onClick={cancelCrop}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${border} ${hov} transition-all`}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};
