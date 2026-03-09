import React, { useState, useRef, useEffect } from "react";
import {
  VeltPresence,
  VeltCommentTool,
  VeltSidebarButton,
  VeltNotificationsTool,
} from "@veltdev/react";
import {
  Undo2,
  Redo2,
  Sun,
  Moon,
  Download,
  ChevronDown,
  Check,
} from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { useFabric } from "../contexts/FabricContext";
import { CANVAS_PRESETS } from "../types/editor";
import { User } from "../types/user";

interface TopBarProps {
  currentUser: User;
  staticUsers: User[];
  onSwitchUser: (user: User) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  staticUsers,
  onSwitchUser,
}) => {
  const {
    theme,
    setTheme,
    canvasSize,
    setCanvasSize,
    setExportModalOpen,
    history,
    historyIndex,
    undo: storeUndo,
    redo: storeRedo,
    showToast,
  } = useEditorStore();
  const { canvasRef } = useFabric();

  const [sizeOpen, setSizeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);
  const dropRef = useRef<HTMLDivElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setSizeOpen(false);
      if (
        userDropRef.current &&
        !userDropRef.current.contains(e.target as Node)
      )
        setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleUndo = () => {
    const entry = storeUndo();
    if (entry && canvasRef.current) {
      (canvasRef.current as any)
        .loadFromJSON(JSON.parse(entry.canvasJson))
        .then(() => canvasRef.current!.renderAll());
    }
  };
  const handleRedo = () => {
    const entry = storeRedo();
    if (entry && canvasRef.current) {
      (canvasRef.current as any)
        .loadFromJSON(JSON.parse(entry.canvasJson))
        .then(() => canvasRef.current!.renderAll());
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const dark = theme === "dark";
  const bg = dark ? "bg-[#111114]" : "bg-white";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const text = dark ? "text-[#f0f0f5]" : "text-[#111114]";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const dropBg = dark ? "bg-[#16161a]" : "bg-white";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";
  const inp = dark
    ? "bg-[#111114] text-[#f0f0f5]"
    : "bg-gray-50 text-[#111114]";

  return (
    <header
      className={`h-12 px-2 sm:px-4 flex items-center justify-between shrink-0 border-b ${bg} ${border} ${text} z-50 relative gap-1 sm:gap-2`}
      style={{ minHeight: 48 }}
    >
      {/* ── Logo ─────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#ff6b4a" />
          <path d="M6 7h8a3 3 0 0 1 0 6H6V7Z" fill="white" opacity="0.9" />
          <path d="M6 13h5v4H6v-4Z" fill="white" opacity="0.6" />
        </svg>
        <span className="font-bold text-base tracking-tight text-[#ff6b4a] hidden sm:block">
          Pixframe
        </span>
      </div>

      {/* ── Canvas Size Dropdown ──────────────────── */}
      <div ref={dropRef} className="relative min-w-0">
        <button
          onClick={() => setSizeOpen((v) => !v)}
          className={`flex items-center gap-1.5 text-sm px-2 sm:px-3 py-1.5 rounded-lg border ${border} ${hov} transition-colors`}
        >
          <span
            className={`${muted} text-xs font-medium hidden md:block truncate max-w-[100px]`}
          >
            {canvasSize.name}
          </span>
          <span className="text-xs font-mono opacity-60 whitespace-nowrap">
            {canvasSize.width}×{canvasSize.height}
          </span>
          <ChevronDown size={12} className={muted} />
        </button>

        {sizeOpen && (
          <div
            className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 w-64 rounded-xl border ${border} ${dropBg} shadow-2xl py-1 z-[200] panel-slide-in`}
          >
            {CANVAS_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  if (p.name !== "Custom") {
                    setCanvasSize(p.width, p.height, p.name);
                    setSizeOpen(false);
                    showToast(`${p.name} · ${p.width}×${p.height}`);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm ${hov} transition-colors ${text}`}
              >
                <span>{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.name !== "Custom" && (
                    <span className={`${muted} text-xs font-mono`}>
                      {p.width}×{p.height}
                    </span>
                  )}
                  {canvasSize.name === p.name && (
                    <Check size={12} className="text-[#ff6b4a]" />
                  )}
                </div>
              </button>
            ))}
            <div className={`px-3 pt-2 pb-3 border-t ${border} mt-1`}>
              <p className={`text-xs ${muted} mb-2`}>Custom size</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customW}
                  onChange={(e) => setCustomW(+e.target.value)}
                  min={100}
                  max={8000}
                  className={`w-20 text-xs px-2 py-1.5 rounded-lg border ${border} ${inp} focus:outline-none focus:border-[#ff6b4a]`}
                />
                <span className={`${muted} text-xs`}>×</span>
                <input
                  type="number"
                  value={customH}
                  onChange={(e) => setCustomH(+e.target.value)}
                  min={100}
                  max={8000}
                  className={`w-20 text-xs px-2 py-1.5 rounded-lg border ${border} ${inp} focus:outline-none focus:border-[#ff6b4a]`}
                />
                <button
                  onClick={() => {
                    setCanvasSize(customW, customH, "Custom");
                    setSizeOpen(false);
                    showToast(`Custom · ${customW}×${customH}`);
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-[#ff6b4a] text-white hover:bg-[#e85b3c] transition-colors"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Controls ────────────────────────── */}
      <div className="flex items-center gap-0.5 sm:gap-1 justify-end shrink-0">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${canUndo ? `${hov} ${text}` : "opacity-30 cursor-not-allowed text-[#6b6b7a]"}`}
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${canRedo ? `${hov} ${text}` : "opacity-30 cursor-not-allowed text-[#6b6b7a]"}`}
        >
          <Redo2 size={15} />
        </button>

        <div
          className={`w-px h-5 ${dark ? "bg-[#242430]" : "bg-[#e2e2ea]"} mx-0.5 sm:mx-1`}
        />

        {/* Velt Comment Tool */}
        <VeltCommentTool shadowDom={false} />

        {/* Velt Comments Sidebar Button */}
        <VeltSidebarButton shadowDom={false} />

        {/* Velt Notifications Tool */}
        <VeltNotificationsTool shadowDom={false} />

        <button
          onClick={() => setTheme(dark ? "light" : "dark")}
          title="Toggle theme"
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${hov} ${text}`}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Velt Presence Avatars — hidden on very small screens */}
        <div className="mx-0.5 sm:mx-1 hidden xs:block sm:block">
          <VeltPresence />
        </div>

        {/* User Switcher */}
        <div ref={userDropRef} className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            title="Switch user"
            className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:pr-2 rounded-lg border ${border} ${hov} transition-colors`}
          >
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=7c5cfc&color=fff&size=64`;
              }}
            />
            <span
              className={`text-xs font-medium max-w-[56px] truncate ${text} hidden sm:block`}
            >
              {currentUser.name.split(" ")[0]}
            </span>
            <ChevronDown size={10} className={`${muted} hidden sm:block`} />
          </button>

          {userOpen && (
            <div
              className={`absolute top-full mt-1 right-0 w-52 rounded-xl border ${border} ${dropBg} shadow-2xl py-1 z-[200] panel-slide-in`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider px-3 pt-2 pb-1 ${muted}`}
              >
                Switch user
              </p>
              {staticUsers.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => {
                    onSwitchUser(u);
                    setUserOpen(false);
                    showToast(`Signed in as ${u.name}`);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm ${hov} transition-colors ${text}`}
                >
                  <img
                    src={u.photoUrl}
                    alt={u.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=7c5cfc&color=fff&size=64`;
                    }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium leading-tight">
                      {u.name}
                    </p>
                    <p className={`text-[10px] ${muted} leading-tight`}>
                      {u.email}
                    </p>
                  </div>
                  {currentUser.userId === u.userId && (
                    <Check size={12} className="text-[#ff6b4a] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setExportModalOpen(true)}
          title="Export (Ctrl+E)"
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-sm font-semibold text-white
            bg-gradient-to-r from-[#ff6b4a] to-[#e8445a]
            hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]
            transition-all duration-150 shadow-lg shadow-[#ff6b4a]/30"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
