import React, { useEffect, useRef, useCallback } from "react";
import { Canvas, FabricImage } from "fabric";
import { VeltCursor } from "@veltdev/react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { useFabric } from "../contexts/FabricContext";

export const CanvasArea: React.FC = () => {
  const {
    theme,
    canvasSize,
    zoom,
    setZoom,
    selectedLayerId,
    setSelectedLayerId,
    removeLayer,
    layers,
    pushHistory,
    showToast,
    isCommentMode,
    undo: storeUndo,
    redo: storeRedo,
    setExportModalOpen,
    addLayer,
  } = useEditorStore();
  const { canvasRef } = useFabric();
  const elRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const prevSizeRef = useRef({
    width: canvasSize.width,
    height: canvasSize.height,
  });

  const dark = theme === "dark";

  // Initialize Fabric canvas
  useEffect(() => {
    if (!elRef.current || canvasRef.current) return;

    const canvas = new Canvas(elRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });
    canvasRef.current = canvas;

    // Selection events â†’ sync selectedLayerId
    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0] as any;
      if (obj?.data?.id) setSelectedLayerId(obj.data.id);
    });
    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0] as any;
      if (obj?.data?.id) setSelectedLayerId(obj.data.id);
    });
    canvas.on("selection:cleared", () => setSelectedLayerId(null));

    // Object modified â†’ push history
    canvas.on("object:modified", () => {
      const json = JSON.stringify((canvas as any).toJSON(["data"]));
      pushHistory(json);
    });

    // Push initial history
    const json = JSON.stringify((canvas as any).toJSON(["data"]));
    pushHistory(json);

    // Apply zoom
    applyZoom(canvas, zoom, canvasSize.width, canvasSize.height);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prev = prevSizeRef.current;
    if (prev.width === canvasSize.width && prev.height === canvasSize.height)
      return;
    prevSizeRef.current = {
      width: canvasSize.width,
      height: canvasSize.height,
    };
    canvas.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height,
    });
    canvas.renderAll();
    applyZoom(canvas, zoom, canvasSize.width, canvasSize.height);
    showToast(`Canvas resized to ${canvasSize.width}—${canvasSize.height}`);
  }, [canvasSize.width, canvasSize.height]);

  // Sync zoom changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyZoom(canvas, zoom, canvasSize.width, canvasSize.height);
  }, [zoom, canvasSize]);

  // Sync layer visibility with fabric, and purge any canvas objects whose
  // Zustand layer was removed (safety net for post-user-switch drift).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const layerIds = new Set(layers.map((l) => l.id));

    // Remove canvas objects that no longer have a matching layer entry
    const toRemove = canvas
      .getObjects()
      .filter((o: any) => o.data?.id && !layerIds.has(o.data.id));
    toRemove.forEach((o) => canvas.remove(o));

    // Sync visibility for remaining objects
    layers.forEach((layer) => {
      const obj = canvas.getObjects().find((o: any) => o.data?.id === layer.id);
      if (obj) {
        obj.set("visible", layer.visible);
      }
    });

    canvas.renderAll();
  }, [layers]);

  // â”€â”€ Selection sync: when layerMeta selection changes, select on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!selectedLayerId) {
      canvas.discardActiveObject();
      canvas.renderAll();
      return;
    }
    const obj = canvas
      .getObjects()
      .find((o: any) => o.data?.id === selectedLayerId);
    if (obj && canvas.getActiveObject() !== obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  }, [selectedLayerId]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const entry = storeUndo();
        if (entry)
          (canvasRef.current as any)
            .loadFromJSON(JSON.parse(entry.canvasJson))
            .then(() => canvasRef.current!.renderAll());
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        const entry = storeRedo();
        if (entry)
          (canvasRef.current as any)
            .loadFromJSON(JSON.parse(entry.canvasJson))
            .then(() => canvasRef.current!.renderAll());
      }
      if (ctrl && e.key === "e") {
        e.preventDefault();
        setExportModalOpen(true);
      }
      if (ctrl && e.key === "=") {
        e.preventDefault();
        setZoom(Math.min(4, zoom + 0.1));
      }
      if (ctrl && e.key === "-") {
        e.preventDefault();
        setZoom(Math.max(0.1, zoom - 0.1));
      }
      if (ctrl && e.key === "0") {
        e.preventDefault();
        fitToScreen();
      }
      if (ctrl && e.key === "d") {
        e.preventDefault();
        const active = canvas.getActiveObject() as any;
        if (active) {
          active.clone().then((cloned: any) => {
            cloned.set({
              left: (active.left || 0) + 20,
              top: (active.top || 0) + 20,
            });
            const id = crypto.randomUUID();
            cloned.data = { id };
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            addLayer({
              id,
              type: active.type === "i-text" ? "text" : "image",
              name: "Copy",
              visible: true,
            });
            const json = JSON.stringify((canvas as any).toJSON(["data"]));
            pushHistory(json);
          });
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !isCommentMode) {
        const active = canvas.getActiveObject() as any;
        if (active && active.data?.id) {
          canvas.remove(active);
          canvas.renderAll();
          removeLayer(active.data.id);
          const json = JSON.stringify((canvas as any).toJSON(["data"]));
          pushHistory(json);
        }
      }
      if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedLayerId(null);
      }
    },
    [
      canvasRef,
      storeUndo,
      storeRedo,
      zoom,
      setZoom,
      setExportModalOpen,
      isCommentMode,
      removeLayer,
      setSelectedLayerId,
      pushHistory,
      addLayer,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const fitToScreen = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const { width: sw, height: sh } = stage.getBoundingClientRect();
    const pad = 80;
    const zx = (sw - pad) / canvasSize.width;
    const zy = (sh - pad) / canvasSize.height;
    setZoom(Math.min(zx, zy, 1));
  };

  // Fit on mount
  useEffect(() => {
    const timeout = setTimeout(fitToScreen, 100);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag-and-drop images onto canvas
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const scale = Math.min(
        (canvasSize.width * 0.5) / img.width!,
        (canvasSize.height * 0.5) / img.height!,
        1,
      );
      img.set({ left: x, top: y, scaleX: scale, scaleY: scale });
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
      const json = JSON.stringify((canvas as any).toJSON(["data"]));
      pushHistory(json);
      URL.revokeObjectURL(url);
    }
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      ref={stageRef}
      className={`flex-1 overflow-auto flex items-center justify-center relative ${
        dark ? "bg-[#0c0c0e]" : "bg-[#e8e8f0]"
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Velt cursors rendered within canvas area */}
      <div className="absolute inset-0 pointer-events-none z-[150]">
        <VeltCursor />
      </div>

      {/* Canvas wrapper */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          margin: 40,
          borderRadius: 2,
        }}
      >
        <canvas ref={elRef} style={{ display: "block" }} />

        {/* Comment mode overlay indicator */}
        {isCommentMode && (
          <div className="absolute inset-0 border-2 border-[#ff6b4a] rounded pointer-events-none z-[100]">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#ff6b4a] text-white text-xs px-3 py-1 rounded-full font-medium">
              Comment Mode, Click to add comment
            </div>
          </div>
        )}
      </div>

      {/*Bottom zoom toolbar */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-xl
          border z-[200] shadow-xl backdrop-blur-sm
          ${dark ? "bg-[#16161a]/90 border-[#242430] text-[#f0f0f5]" : "bg-white/90 border-[#e2e2ea] text-[#111114]"}`}
      >
        <button
          onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
          className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100"}`}
          title="Zoom out (Ctrl+-)"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-xs font-mono w-12 text-center">{zoomPct}%</span>
        <button
          onClick={() => setZoom(Math.min(4, zoom + 0.1))}
          className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100"}`}
          title="Zoom in (Ctrl++)"
        >
          <ZoomIn size={14} />
        </button>
        <div
          className={`w-px h-4 ${dark ? "bg-[#242430]" : "bg-[#e2e2ea]"} mx-1`}
        />
        <button
          onClick={fitToScreen}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100"}`}
          title="Fit to screen (Ctrl+0)"
        >
          <Maximize size={13} />
        </button>
      </div>
    </div>
  );
};

// Helpers
function applyZoom(canvas: Canvas, zoom: number, logW: number, logH: number) {
  canvas.setZoom(zoom);
  canvas.setDimensions({ width: logW * zoom, height: logH * zoom });
}
