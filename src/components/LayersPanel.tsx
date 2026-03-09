import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Type,
  Image,
  Palette,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { useFabric } from "../contexts/FabricContext";
import { LayerMeta } from "../types/editor";

const TYPE_ICONS: Record<string, LucideIcon> = {
  text: Type,
  image: Image,
  background: Palette,
};

interface LayerRowProps {
  layer: LayerMeta;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  dark: boolean;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
  onRename,
  dark,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = TYPE_ICONS[layer.type] || Image;
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-2 cursor-pointer transition-all mx-2 my-0.5 rounded-lg
        ${isDragging ? "opacity-50 scale-[0.98] z-50" : ""}
        ${
          isSelected
            ? `${dark ? "bg-[#ff6b4a]/20" : "bg-purple-100"} border border-[#ff6b4a]/40`
            : `border border-transparent ${hov}`
        }`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className={`${muted} cursor-grab active:cursor-grabbing shrink-0`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={13} />
      </span>

      {/* Type icon */}
      <TypeIcon size={12} className={isSelected ? "text-[#ff6b4a]" : muted} />

      {/* Name */}
      {editing ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => {
            onRename(editName);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(editName);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          className={`flex-1 text-xs bg-transparent border-b ${border} focus:outline-none focus:border-[#ff6b4a]`}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="flex-1 text-xs truncate select-none"
          title={layer.name}
        >
          {layer.name}
        </span>
      )}

      {/* Visibility */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className={`shrink-0 p-1 rounded transition-colors ${muted} ${hov}`}
      >
        {layer.visible ? (
          <Eye size={12} />
        ) : (
          <EyeOff size={12} className="opacity-40" />
        )}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`shrink-0 p-1 rounded transition-colors ${muted} hover:text-[#e8445a]`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

export const LayersPanel: React.FC = () => {
  const {
    theme,
    layers,
    selectedLayerId,
    setSelectedLayerId,
    reorderLayers,
    updateLayer,
    removeLayer,
    pushHistory,
    showToast,
  } = useEditorStore();
  const { canvasRef, pushCanvasStateRef, pushCanvasStateImmediateRef } =
    useFabric();

  // Default closed on small screens, open on wider screens
  const [isOpen, setIsOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );

  const dark = theme === "dark";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const bg = dark ? "bg-[#16161a]" : "bg-[#fafafa]";
  const text = dark ? "text-[#f0f0f5]" : "text-[#111114]";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      const newLayers = arrayMove(layers, oldIndex, newIndex);
      reorderLayers(newLayers);

      // Sync fabric canvas z-order (layers[0] = topmost in panel = front on canvas)
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objs = canvas.getObjects();
      const idOrder = [...newLayers].reverse(); // reverse: panel top = canvas front
      idOrder.forEach((layer, i) => {
        const obj = objs.find((o: any) => o.data?.id === layer.id);
        if (obj) (canvas as any).moveObjectTo(obj, i);
      });
      canvas.renderAll();
      const reorderJson = JSON.stringify((canvas as any).toObject(["data"]));
      pushCanvasStateRef.current?.(reorderJson);
    },
    [layers, reorderLayers, canvasRef],
  );

  const handleSelect = (id: string) => {
    setSelectedLayerId(id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.data?.id === id);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const handleToggleVisibility = (layer: LayerMeta) => {
    const newVisible = !layer.visible;
    updateLayer(layer.id, { visible: newVisible });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.data?.id === layer.id);
    if (obj) {
      obj.set("visible", newVisible);
      canvas.renderAll();
    }
    const visJson = JSON.stringify((canvas as any).toObject(["data"]));
    // Use immediate push so the echo-suppression ref is set synchronously,
    // preventing any in-flight remote snapshot from reverting the toggle.
    pushCanvasStateImmediateRef.current?.(visJson);
  };

  const handleDelete = (id: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const obj = canvas.getObjects().find((o: any) => o.data?.id === id);
      if (obj) {
        canvas.remove(obj);
        canvas.renderAll();
      }
    }
    removeLayer(id);
    const json = JSON.stringify(
      (canvasRef.current as any)?.toObject(["data"]) ?? {},
    );
    pushHistory(json);
    // Immediate push so the deletion is reflected in CRDT synchronously and
    // cannot be undone by a remote echo arriving within the debounce window.
    pushCanvasStateImmediateRef.current?.(json);
    showToast("Layer deleted");
  };

  const handleRename = (id: string, name: string) => {
    updateLayer(id, { name });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renameJson = JSON.stringify((canvas as any).toObject(["data"]));
    pushCanvasStateRef.current?.(renameJson);
  };

  return (
    <div className="relative flex shrink-0">
      {/* ── Collapsed toggle tab (always visible when closed) ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Show Layers"
          className={`flex flex-col items-center justify-center gap-1 w-10 h-full border-l
            ${bg} ${border} ${text} transition-colors
            hover:bg-[#ff6b4a]/10 hover:text-[#ff6b4a]`}
        >
          <Layers size={15} />
          <ChevronRight size={11} className={muted} />
        </button>
      )}

      {/* ── Full panel ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`w-[240px] max-w-[240px] h-full flex flex-col shrink-0 border-l ${bg} ${border} ${text}`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b ${border} shrink-0 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-[#ff6b4a]" />
              <span className="text-sm font-semibold">Layers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${muted} font-mono`}>
                {layers.length}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                title="Hide Layers"
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${muted} hover:bg-[#ff6b4a]/10 hover:text-[#ff6b4a]`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Layer list */}
          <div className="flex-1 overflow-y-auto py-2">
            {layers.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center h-32 gap-2 ${muted} text-xs text-center px-4`}
              >
                <span className="text-2xl opacity-40">⊙</span>
                <span>No layers yet. Add an image or text to get started.</span>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layers.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {layers.map((layer) => (
                    <LayerRow
                      key={layer.id}
                      layer={layer}
                      isSelected={selectedLayerId === layer.id}
                      onSelect={() => handleSelect(layer.id)}
                      onToggleVisibility={() => handleToggleVisibility(layer)}
                      onDelete={() => handleDelete(layer.id)}
                      onRename={(name) => handleRename(layer.id, name)}
                      dark={dark}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Footer hint */}
          <div className={`px-4 py-2 border-t ${border} shrink-0`}>
            <p className={`text-[10px] ${muted} text-center`}>
              Top = Front · Drag to reorder · Double-click to rename
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
