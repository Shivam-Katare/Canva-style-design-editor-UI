import { create } from "zustand";
import {
  PanelId,
  Theme,
  LayerMeta,
  HistoryEntry,
  ToastState,
  ExportSettings,
  ExportFormat,
  CANVAS_PRESETS,
} from "../types/editor";

const MAX_HISTORY = 50;

interface EditorStore {
  // Canvas size
  canvasSize: { width: number; height: number; name: string };
  zoom: number;
  theme: Theme;

  // Layers (metadata kept in sync with Fabric canvas objects)
  layers: LayerMeta[];
  selectedLayerId: string | null;

  // Undo/redo history
  history: HistoryEntry[];
  historyIndex: number;

  // UI
  activePanel: PanelId;
  isExportModalOpen: boolean;
  isCommentMode: boolean;
  toast: ToastState;

  // Export settings
  exportSettings: ExportSettings;

  // ── Actions ─────────────────────────────────────────────
  setCanvasSize: (width: number, height: number, name?: string) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: Theme) => void;

  setLayers: (layers: LayerMeta[]) => void;
  addLayer: (layer: LayerMeta) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, changes: Partial<LayerMeta>) => void;
  reorderLayers: (layers: LayerMeta[]) => void;
  setSelectedLayerId: (id: string | null) => void;

  setActivePanel: (panel: PanelId) => void;
  setExportModalOpen: (open: boolean) => void;
  setIsCommentMode: (val: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;

  setExportSettings: (s: Partial<ExportSettings>) => void;

  // History
  pushHistory: (canvasJson: string) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvasSize: { ...CANVAS_PRESETS[0], name: CANVAS_PRESETS[0].name },
  zoom: 1,
  theme: "dark",

  layers: [],
  selectedLayerId: null,

  history: [],
  historyIndex: -1,

  activePanel: null,
  isExportModalOpen: false,
  isCommentMode: false,
  toast: { message: "", visible: false },

  exportSettings: {
    resolution: "original",
    customWidth: 1080,
    customHeight: 1080,
    format: "png" as ExportFormat,
    quality: 100,
  },

  // ── Setters ─────────────────────────────────────────────
  setCanvasSize: (width, height, name = "Custom") =>
    set({ canvasSize: { width, height, name } }),

  setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.1, zoom)) }),

  setTheme: (theme) => {
    set({ theme });
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  },

  setLayers: (layers) => set({ layers }),
  addLayer: (layer) => set((s) => ({ layers: [layer, ...s.layers] })),
  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    })),
  updateLayer: (id, changes) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    })),
  reorderLayers: (layers) => set({ layers }),
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),

  setActivePanel: (panel) =>
    set((s) => ({ activePanel: s.activePanel === panel ? null : panel })),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setIsCommentMode: (val) => set({ isCommentMode: val }),

  showToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => get().hideToast(), 3000);
  },
  hideToast: () => set({ toast: { message: "", visible: false } }),

  setExportSettings: (s) =>
    set((prev) => ({ exportSettings: { ...prev.exportSettings, ...s } })),

  // ── History ─────────────────────────────────────────────
  pushHistory: (canvasJson) => {
    const { history, historyIndex, layers } = get();
    const truncated = history.slice(0, historyIndex + 1);
    const entry: HistoryEntry = { canvasJson, layers: [...layers] };
    const newHistory = [...truncated, entry].slice(-MAX_HISTORY);
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set({ historyIndex: newIndex, layers: entry.layers });
    return entry;
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set({ historyIndex: newIndex, layers: entry.layers });
    return entry;
  },
}));
