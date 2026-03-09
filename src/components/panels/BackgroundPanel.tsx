import React, { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Gradient, Pattern, FabricImage } from "fabric";
import { useEditorStore } from "../../store/editorStore";
import { useFabric } from "../../contexts/FabricContext";

/** Generate an SVG tile for each pattern type */
function makePatternSVG(id: string, color: string, opacity: number): string {
  const a = (opacity / 100).toFixed(2);
  const c = color;
  switch (id) {
    case "dots":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="3" fill="${c}" fill-opacity="${a}"/></svg>`;
    case "grid":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M20 0H0v20" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="1"/></svg>`;
    case "diagonal":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="0" y1="20" x2="20" y2="0" stroke="${c}" stroke-opacity="${a}" stroke-width="1.5"/></svg>`;
    case "crosshatch":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="0" y1="20" x2="20" y2="0" stroke="${c}" stroke-opacity="${a}" stroke-width="1"/><line x1="0" y1="0" x2="20" y2="20" stroke="${c}" stroke-opacity="${a}" stroke-width="1"/></svg>`;
    case "waves":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><path d="M0 10 Q10 0 20 10 Q30 20 40 10" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="1.5"/></svg>`;
    case "triangles":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20"><polygon points="12,2 22,18 2,18" fill="${c}" fill-opacity="${a}"/></svg>`;
    case "hexagons":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="24"><polygon points="14,2 24,8 24,16 14,22 4,16 4,8" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="1.5"/></svg>`;
    case "noise":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect x="0" y="0" width="4" height="4" fill="${c}" fill-opacity="${a}"/><rect x="8" y="4" width="4" height="4" fill="${c}" fill-opacity="${a}"/><rect x="4" y="8" width="4" height="4" fill="${c}" fill-opacity="${a}"/><rect x="12" y="12" width="4" height="4" fill="${c}" fill-opacity="${a}"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="3" fill="${c}" fill-opacity="${a}"/></svg>`;
  }
}

const SOLID_SWATCHES = [
  "#ffffff",
  "#f0f0f5",
  "#e2e2ea",
  "#d0d0df",
  "#111114",
  "#1e1e24",
  "#2d2d3a",
  "#3d3d52",
  "#ff6b4a",
  "#e8445a",
  "#00b4db",
  "#feca57",
  "#134e5e",
  "#71b280",
  "#f7971e",
  "#ed213a",
  "#0f3460",
  "#533483",
  "#ff6b6b",
  "#48dbfb",
];

const GRADIENTS = [
  {
    name: "Purple Night",
    start: "#1a1a2e",
    end: "#ff6b4a",
    angle: 135,
    css: "linear-gradient(135deg, #1a1a2e, #ff6b4a)",
  },
  {
    name: "Sunset",
    start: "#ff6b6b",
    end: "#feca57",
    angle: 135,
    css: "linear-gradient(135deg, #ff6b6b, #feca57)",
  },
  {
    name: "Ocean",
    start: "#0f3460",
    end: "#533483",
    angle: 135,
    css: "linear-gradient(135deg, #0f3460, #533483)",
  },
  {
    name: "Mint Fresh",
    start: "#00b4db",
    end: "#0083b0",
    angle: 135,
    css: "linear-gradient(135deg, #00b4db, #0083b0)",
  },
  {
    name: "Rose Gold",
    start: "#f7971e",
    end: "#ffd200",
    angle: 135,
    css: "linear-gradient(135deg, #f7971e, #ffd200)",
  },
  {
    name: "Midnight",
    start: "#0f0c29",
    end: "#24243e",
    angle: 135,
    css: "linear-gradient(135deg, #0f0c29, #24243e)",
  },
  {
    name: "Forest",
    start: "#134e5e",
    end: "#71b280",
    angle: 135,
    css: "linear-gradient(135deg, #134e5e, #71b280)",
  },
  {
    name: "Peach",
    start: "#ed213a",
    end: "#93291e",
    angle: 135,
    css: "linear-gradient(135deg, #ed213a, #93291e)",
  },
  {
    name: "Northern",
    start: "#1a1a2e",
    end: "#0f3460",
    angle: 135,
    css: "linear-gradient(135deg, #1a1a2e, #0f3460)",
  },
  {
    name: "Candy",
    start: "#e96c9d",
    end: "#f7a8d8",
    angle: 135,
    css: "linear-gradient(135deg, #e96c9d, #f7a8d8)",
  },
  {
    name: "Flame",
    start: "#f12711",
    end: "#f5af19",
    angle: 135,
    css: "linear-gradient(135deg, #f12711, #f5af19)",
  },
  {
    name: "Cool Blue",
    start: "#2980b9",
    end: "#2c3e50",
    angle: 135,
    css: "linear-gradient(135deg, #2980b9, #2c3e50)",
  },
];

const GRADIENT_ANGLES = [
  { label: "?", deg: 90 },
  { label: "?", deg: 45 },
  { label: "?", deg: 0 },
  { label: "?", deg: 315 },
  { label: "?", deg: 270 },
  { label: "?", deg: 225 },
  { label: "?", deg: 180 },
  { label: "?", deg: 135 },
];

const PATTERNS = [
  { name: "Dots", id: "dots" },
  { name: "Grid", id: "grid" },
  { name: "Diagonal", id: "diagonal" },
  { name: "Crosshatch", id: "crosshatch" },
  { name: "Waves", id: "waves" },
  { name: "Triangles", id: "triangles" },
  { name: "Hexagons", id: "hexagons" },
  { name: "Noise", id: "noise" },
];

type BgTab = "solid" | "gradient" | "image" | "pattern";

export const BackgroundPanel: React.FC = () => {
  const { theme, pushHistory, showToast } = useEditorStore();
  const { canvasRef, pushCanvasStateRef } = useFabric();
  const [tab, setTab] = useState<BgTab>("solid");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [showPicker, setShowPicker] = useState(false);
  const [gradAngle, setGradAngle] = useState(135);
  const [gradStart, setGradStart] = useState("#ff6b4a");
  const [gradEnd, setGradEnd] = useState("#1a1a2e");
  const [selectedGradientName, setSelectedGradientName] = useState<
    string | null
  >(null);
  const [patternColor, setPatternColor] = useState("#ff6b4a");
  const [patternOpacity, setPatternOpacity] = useState(50);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(
    null,
  );
  const [bgImageThumb, setBgImageThumb] = useState<string | null>(null);

  const dark = theme === "dark";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";
  const panelBg = dark ? "bg-[#111114]" : "bg-gray-50";

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify((canvas as any).toObject(["data"]));
    pushHistory(json);
    // Sync background change to all peers
    pushCanvasStateRef.current?.(json);
  };

  const clearBgImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (canvas as any).backgroundImage = null;
  };

  const applySolid = (col: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    clearBgImage();
    setSolidColor(col);
    canvas.set("backgroundColor", col);
    canvas.renderAll();
    saveHistory();
    showToast("Background updated");
  };

  const buildGradient = (
    start: string,
    end: string,
    angle: number,
    w: number,
    h: number,
  ) => {
    // Convert CSS-style angle (0=up, 90=right) to math angle
    const rad = ((angle - 90) * Math.PI) / 180;
    const len = Math.sqrt(w * w + h * h);
    const cx = w / 2;
    const cy = h / 2;
    return new Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords: {
        x1: cx - (len / 2) * Math.cos(rad),
        y1: cy - (len / 2) * Math.sin(rad),
        x2: cx + (len / 2) * Math.cos(rad),
        y2: cy + (len / 2) * Math.sin(rad),
      },
      colorStops: [
        { offset: 0, color: start },
        { offset: 1, color: end },
      ],
    });
  };

  const applyGradient = (
    start = gradStart,
    end = gradEnd,
    angle = gradAngle,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    clearBgImage();
    const gradient = buildGradient(
      start,
      end,
      angle,
      canvas.width!,
      canvas.height!,
    );
    (canvas as any).backgroundColor = gradient;
    canvas.renderAll();
    saveHistory();
    showToast("Gradient applied");
  };

  const applyPattern = (
    id: string,
    col = patternColor,
    opa = patternOpacity,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    clearBgImage();
    const svg = makePatternSVG(id, col, opa);
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    const img = new Image();
    img.onload = () => {
      const pat = new Pattern({ source: img, repeat: "repeat" });
      (canvas as any).backgroundColor = pat;
      canvas.renderAll();
      saveHistory();
    };
    img.src = dataUrl;
    setSelectedPatternId(id);
    showToast(`${id} pattern applied`);
  };

  const TABS: BgTab[] = ["solid", "gradient", "image", "pattern"];

  return (
    <div className="p-4 space-y-4">
      {/* Tab bar */}
      <div className={`flex rounded-lg ${panelBg} p-1 gap-1`}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize
              ${tab === t ? "bg-[#ff6b4a] text-white" : `${muted} ${hov}`}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Solid  */}
      {tab === "solid" && (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {SOLID_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => applySolid(c)}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 active:scale-95
                  ${solidColor === c ? "border-[#ff6b4a]" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          {/* Custom picker */}
          <button
            onClick={() => setShowPicker((v) => !v)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg border ${border} ${hov} transition-colors`}
          >
            <span
              className="w-5 h-5 rounded-md border border-white/20"
              style={{ background: solidColor }}
            />
            <span className={`text-xs font-mono ${muted}`}>{solidColor}</span>
          </button>
          {showPicker && (
            <div
              className={`p-3 rounded-xl border ${border} ${dark ? "bg-[#16161a]" : "bg-white"}`}
            >
              <HexColorPicker color={solidColor} onChange={applySolid} />
            </div>
          )}
        </div>
      )}

      {/* Gradient */}
      {tab === "gradient" && (
        <div className="space-y-4 overflow-x-hidden">
          {/* Preset gradients */}
          <div className="grid grid-cols-3 gap-2">
            {GRADIENTS.map((g) => (
              <button
                key={g.name}
                onClick={() => {
                  setGradStart(g.start);
                  setGradEnd(g.end);
                  setGradAngle(g.angle);
                  setSelectedGradientName(g.name);
                  applyGradient(g.start, g.end, g.angle);
                }}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95
                  ${selectedGradientName === g.name ? "border-[#ff6b4a] ring-2 ring-[#ff6b4a]/40" : "border-transparent hover:border-[#ff6b4a]/60"}`}
                style={{ background: g.css }}
                title={g.name}
              />
            ))}
          </div>

          {/* Custom gradient */}
          <div className={`h-px ${border}`} />
          <p
            className={`text-xs font-semibold ${muted} uppercase tracking-widest`}
          >
            Custom Gradient
          </p>

          {/* Start color */}
          <div className="space-y-1">
            <p className={`text-xs ${muted}`}>Start</p>
            <div className="w-full overflow-hidden">
              <HexColorPicker
                color={gradStart}
                onChange={(c) => {
                  setGradStart(c);
                  applyGradient(c, gradEnd, gradAngle);
                }}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* End color */}
          <div className="space-y-1">
            <p className={`text-xs ${muted}`}>End</p>
            <div className="w-full overflow-hidden">
              <HexColorPicker
                color={gradEnd}
                onChange={(c) => {
                  setGradEnd(c);
                  applyGradient(gradStart, c, gradAngle);
                }}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Angle presets */}
          <div className="grid grid-cols-8 gap-1">
            {GRADIENT_ANGLES.map((a) => (
              <button
                key={a.deg}
                onClick={() => {
                  setGradAngle(a.deg);
                  applyGradient(gradStart, gradEnd, a.deg);
                }}
                className={`aspect-square rounded text-sm flex items-center justify-center transition-all
                  ${gradAngle === a.deg ? "bg-[#ff6b4a] text-white" : `${hov} ${muted}`}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image*/}
      {tab === "image" && (
        <div className="space-y-3">
          <p className={`text-xs ${muted} text-center`}>
            Upload a background image to fill the canvas
          </p>
          <label
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed ${border} rounded-xl p-8 cursor-pointer ${hov} transition-colors relative overflow-hidden`}
          >
            {bgImageThumb ? (
              <img
                src={bgImageThumb}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            ) : null}
            <span className={`text-3xl ${muted} relative`}>???</span>
            <span className={`text-xs ${muted} relative`}>
              {bgImageThumb ? "Click to change" : "Click to upload"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const dataUrl = reader.result as string;
                  const img = await FabricImage.fromURL(dataUrl);
                  // Scale to fill the canvas
                  img.scaleX = canvas.width! / img.width!;
                  img.scaleY = canvas.height! / img.height!;
                  img.set({ left: 0, top: 0, originX: "left", originY: "top" });
                  canvas.set("backgroundColor", "");
                  (canvas as any).backgroundImage = img;
                  canvas.renderAll();
                  setBgImageThumb(dataUrl);
                  const json = JSON.stringify((canvas as any).toObject(["data"]));
                  pushHistory(json);
                  pushCanvasStateRef.current?.(json);
                  showToast("Background image set");
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
      )}

      {/*Pattern */}
      {tab === "pattern" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPattern(p.id)}
                className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 p-2
                  ${
                    selectedPatternId === p.id
                      ? "border-[#ff6b4a] ring-2 ring-[#ff6b4a]/40 bg-[#ff6b4a]/10"
                      : `${border} ${hov} hover:border-[#ff6b4a]/60`
                  }`}
              >
                <span className="text-base">
                  {
                    {
                      dots: "?",
                      grid: "?",
                      diagonal: "?",
                      crosshatch: "?",
                      waves: "?",
                      triangles: "?",
                      hexagons: "?",
                      noise: "¦",
                    }[p.id]
                  }
                </span>
                <span className={`text-[10px] ${muted}`}>{p.name}</span>
              </button>
            ))}
          </div>
          {/* Pattern color */}
          <div>
            <p
              className={`text-xs font-semibold ${muted} uppercase tracking-widest mb-2`}
            >
              Pattern Color
            </p>
            <HexColorPicker
              color={patternColor}
              onChange={(c) => {
                setPatternColor(c);
                if (selectedPatternId)
                  applyPattern(selectedPatternId, c, patternOpacity);
              }}
            />
          </div>
          {/* Pattern opacity */}
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs ${muted}`}>Opacity</span>
              <span className="text-xs font-mono">{patternOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={patternOpacity}
              onChange={(e) => {
                const opa = +e.target.value;
                setPatternOpacity(opa);
                if (selectedPatternId)
                  applyPattern(selectedPatternId, patternColor, opa);
              }}
              className="w-full accent-[#ff6b4a]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
