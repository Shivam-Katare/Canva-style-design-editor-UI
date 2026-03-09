import React, { useRef, useState, useCallback } from "react";
import { Upload, FlipHorizontal, FlipVertical, RefreshCw } from "lucide-react";
import { FabricImage } from "fabric";
import { useEditorStore } from "../../store/editorStore";
import { useFabric } from "../../contexts/FabricContext";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/svg+xml,.heic,.heif";

export const ImagePanel: React.FC = () => {
  const { theme, selectedLayerId, pushHistory, showToast, addLayer } =
    useEditorStore();
  const { canvasRef, pushCanvasStateRef, pushCanvasStateImmediateRef } =
    useFabric();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [opacity, setOpacity] = useState(100);

  const dark = theme === "dark";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";

  const addImageToCanvas = useCallback(
    async (file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let dataUrl: string;

      if (
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic"
      ) {
        try {
          const heic2any = (await import("heic2any")).default;
          const blob = (await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.92,
          })) as Blob;
          dataUrl = await blobToDataUrl(blob);
        } catch {
          showToast("HEIC conversion failed");
          return;
        }
      } else {
        dataUrl = await blobToDataUrl(file);
      }

      const img = await FabricImage.fromURL(dataUrl, {
        crossOrigin: "anonymous",
      });
      const canvasW = canvas.width!;
      const canvasH = canvas.height!;
      const scaleX = (canvasW * 0.7) / img.width!;
      const scaleY = (canvasH * 0.7) / img.height!;
      const scale = Math.min(scaleX, scaleY, 1);

      img.set({
        left: canvasW / 2,
        top: canvasH / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
      });

      const id = crypto.randomUUID();
      (img as any).data = { id };

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

      addLayer({
        id,
        type: "image",
        name: file.name.replace(/\.[^.]+$/, ""),
        visible: true,
      });

      const json = JSON.stringify((canvas as any).toObject(["data"]));
      pushHistory(json);
      // Push immediately after addLayer() so the CRDT snapshot includes the
      // new layer metadata. This also cancels the debounced push from object:added.
      pushCanvasStateImmediateRef.current?.(json);
      showToast(`Image added · ${file.name}`);
    },
    [canvasRef, addLayer, pushHistory, showToast, pushCanvasStateImmediateRef],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(addImageToCanvas);
  };

  // Selected image controls
  const selectedObj = (() => {
    if (!canvasRef.current || !selectedLayerId) return null;
    const objs = canvasRef.current.getObjects();
    return objs.find((o: any) => o.data?.id === selectedLayerId) || null;
  })();

  const isImage = selectedObj instanceof FabricImage;

  const handleOpacity = (val: number) => {
    setOpacity(val);
    if (selectedObj) {
      selectedObj.set("opacity", val / 100);
      canvasRef.current!.renderAll();
      const json = JSON.stringify(
        (canvasRef.current as any).toObject(["data"]),
      );
      pushHistory(json);
      pushCanvasStateRef.current?.(json);
    }
  };

  const handleFlip = (axis: "X" | "Y") => {
    if (!selectedObj) return;
    if (axis === "X") selectedObj.set("flipX", !selectedObj.flipX);
    else selectedObj.set("flipY", !selectedObj.flipY);
    canvasRef.current!.renderAll();
    const json = JSON.stringify((canvasRef.current as any).toObject(["data"]));
    pushHistory(json);
    pushCanvasStateImmediateRef.current?.(json);
  };

  const handleReplace = () => fileRef.current?.click();

  return (
    <div className="p-4 space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${
            dragging ? "border-[#ff6b4a] bg-[#ff6b4a]/10" : `${border} ${hov}`
          }`}
      >
        <Upload
          size={28}
          className={`mx-auto mb-2 ${dragging ? "text-[#ff6b4a]" : muted}`}
        />
        <p
          className={`text-sm font-medium ${dragging ? "text-[#ff6b4a]" : muted}`}
        >
          Drop image here
        </p>
        <p className={`text-xs mt-1 ${muted}`}>JPG, PNG, WEBP, HEIC, SVG</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Image controls (shown when image selected) */}
      {isImage && (
        <div className="space-y-4 pt-2">
          <div className={`h-px ${dark ? "bg-[#242430]" : "bg-[#e2e2ea]"}`} />
          <p className="text-xs font-semibold text-[#ff6b4a] uppercase tracking-widest">
            Image Controls
          </p>

          {/* Opacity */}
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs ${muted}`}>Opacity</span>
              <span className="text-xs font-mono">{opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => handleOpacity(+e.target.value)}
              className="w-full accent-[#ff6b4a] cursor-pointer"
            />
          </div>

          {/* Flip buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFlip("X")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border ${border} ${hov} transition-colors`}
            >
              <FlipHorizontal size={14} /> Flip H
            </button>
            <button
              onClick={() => handleFlip("Y")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border ${border} ${hov} transition-colors`}
            >
              <FlipVertical size={14} /> Flip V
            </button>
          </div>

          {/* Replace */}
          <button
            onClick={handleReplace}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border ${border} ${hov} transition-colors`}
          >
            <RefreshCw size={14} /> Replace Image
          </button>
          <input
            type="file"
            accept={ACCEPTED}
            className="hidden"
            id="replace-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f || !selectedObj || !(selectedObj instanceof FabricImage))
                return;
              blobToDataUrl(f).then((url) => {
                (selectedObj as FabricImage).setSrc(url).then(() => {
                  canvasRef.current!.renderAll();
                  const json = JSON.stringify(
                    (canvasRef.current as any).toObject(["data"]),
                  );
                  pushHistory(json);
                });
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

function blobToDataUrl(blob: Blob | File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}
