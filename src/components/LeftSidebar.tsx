import React from "react";
import { Image, Type, Palette, Crop } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { PanelId } from "../types/editor";
import { ImagePanel } from "./panels/ImagePanel";
import { TextPanel } from "./panels/TextPanel";
import { BackgroundPanel } from "./panels/BackgroundPanel";
import { CropPanel } from "./panels/CropPanel";

const ICONS: { id: PanelId; Icon: LucideIcon; label: string }[] = [
  { id: "image", Icon: Image, label: "Image" },
  { id: "text", Icon: Type, label: "Text" },
  { id: "background", Icon: Palette, label: "Background" },
  { id: "crop", Icon: Crop, label: "Crop" },
];

export const LeftSidebar: React.FC = () => {
  const { theme, activePanel, setActivePanel } = useEditorStore();
  const dark = theme === "dark";

  const sidebarBg = dark ? "bg-[#111114]" : "bg-[#fafafa]";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const panelBg = dark ? "bg-[#16161a]" : "bg-white";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";
  const text = dark ? "text-[#f0f0f5]" : "text-[#111114]";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";

  return (
    <div className="flex h-full shrink-0 relative z-40">
      {/* ── 48px icon bar ─────────────────────────────────── */}
      <div
        className={`w-12 h-full flex flex-col items-center py-3 gap-1 border-r ${sidebarBg} ${border} shrink-0`}
      >
        {ICONS.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            title={label}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all group relative
              ${
                activePanel === id
                  ? "bg-[#ff6b4a]/20 text-[#ff6b4a]"
                  : `${muted} ${hov}`
              }`}
          >
            <Icon size={18} />
            {/* Tooltip */}
            <span
              className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none
              opacity-0 group-hover:opacity-100 transition-opacity z-50
              ${dark ? "bg-[#1e1e24] text-[#f0f0f5]" : "bg-gray-800 text-white"}`}
            >
              {label}
            </span>
            {/* Active indicator */}
            {activePanel === id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#ff6b4a] rounded-r-full -ml-3" />
            )}
          </button>
        ))}
      </div>

      {/* ── Expandable panel ──────────────────────────────── */}
      {activePanel && (
        <div
          className={`w-[280px] h-full border-r ${panelBg} ${border} ${text} flex flex-col overflow-hidden panel-slide-in`}
        >
          {/* Panel header */}
          <div
            className={`px-4 py-3 border-b ${border} flex items-center justify-between shrink-0`}
          >
            <span className="text-sm font-semibold">
              {ICONS.find((i) => i.id === activePanel)?.label}
            </span>
            <button
              onClick={() => setActivePanel(activePanel)}
              className={`w-6 h-6 flex items-center justify-center rounded ${muted} ${hov} transition-colors text-lg leading-none`}
            >
              ×
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activePanel === "image" && <ImagePanel />}
            {activePanel === "text" && <TextPanel />}
            {activePanel === "background" && <BackgroundPanel />}
            {activePanel === "crop" && <CropPanel />}
          </div>
        </div>
      )}
    </div>
  );
};
