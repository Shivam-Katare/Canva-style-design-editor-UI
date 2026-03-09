import React, { useState, useEffect } from "react";
import { IText } from "fabric";
import { HexColorPicker } from "react-colorful";
import {
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { useFabric } from "../../contexts/FabricContext";
import { GOOGLE_FONTS } from "../../types/editor";

const WEIGHTS = ["300", "400", "500", "600", "700", "800"];
const WEIGHT_LABELS: Record<string, string> = {
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "SemiBold",
  "700": "Bold",
  "800": "ExtraBold",
};

export const TextPanel: React.FC = () => {
  const { theme, selectedLayerId, addLayer, pushHistory, showToast } =
    useEditorStore();
  const { canvasRef, pushCanvasStateRef, pushCanvasStateImmediateRef } =
    useFabric();

  const [font, setFont] = useState("Inter");
  const [size, setSize] = useState(48);
  const [weight, setWeight] = useState("700");
  const [color, setColor] = useState("#f0f0f5");
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState<"left" | "center" | "right" | "justify">(
    "center",
  );
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const dark = theme === "dark";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";
  const hov = dark ? "hover:bg-[#1e1e24]" : "hover:bg-gray-100";
  const inp = dark
    ? "bg-[#1e1e24] text-[#f0f0f5]"
    : "bg-gray-100 text-[#111114]";
  const bg = dark ? "bg-[#16161a]" : "bg-white";

  // Load Google Font when selected
  useEffect(() => {
    if (font === "Inter") return;
    const id = `gfont-${font.replace(/\s/g, "-")}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [font]);

  // Sync controls from selected text object
  const getSelected = () => {
    if (!canvasRef.current || !selectedLayerId) return null;
    const obj = canvasRef.current
      .getObjects()
      .find((o: any) => o.data?.id === selectedLayerId);
    return obj instanceof IText ? obj : null;
  };

  useEffect(() => {
    const obj = getSelected();
    if (!obj) return;
    setFont((obj.fontFamily as string) || "Inter");
    setSize((obj.fontSize as number) || 48);
    setWeight((obj.fontWeight as string) || "700");
    setColor((obj.fill as string) || "#ffffff");
    setItalic(obj.fontStyle === "italic");
    setUnderline(!!obj.underline);
    setAlign((obj.textAlign as any) || "center");
    setLetterSpacing((obj.charSpacing as number) || 0);
    setLineHeight((obj.lineHeight as number) || 1.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayerId]);

  const applyToSelected = (props: Record<string, unknown>) => {
    const obj = getSelected();
    if (!obj) return;
    obj.set(props as any);
    canvasRef.current!.renderAll();
    const json = JSON.stringify((canvasRef.current as any).toObject(["data"]));
    pushHistory(json);
    pushCanvasStateRef.current?.(json);
  };

  const addText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new IText("Double-click to edit", {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: "center",
      originY: "center",
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      fontStyle: italic ? "italic" : "normal",
      underline,
      textAlign: align,
      fill: color,
      charSpacing: letterSpacing,
      lineHeight,
    });
    const id = crypto.randomUUID();
    (text as any).data = { id };
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    addLayer({ id, type: "text", name: "Text Layer", visible: true });
    const json = JSON.stringify((canvas as any).toObject(["data"]));
    pushHistory(json);
    pushCanvasStateImmediateRef.current?.(json);
    showToast("Text added");
  };

  const Section: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
  }) => (
    <div className="space-y-2">
      <p className={`text-xs font-semibold ${muted} uppercase tracking-widest`}>
        {label}
      </p>
      {children}
    </div>
  );

  return (
    <div className="p-4 space-y-5">
      {/* Add Text Button */}
      <button
        onClick={addText}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
          bg-[#ff6b4a] text-white hover:bg-[#e85b3c] active:scale-[0.98] transition-all shadow-lg shadow-[#ff6b4a]/20"
      >
        <Plus size={16} /> Add Text
      </button>

      <div className={`h-px ${dark ? "bg-[#242430]" : "bg-[#e2e2ea]"}`} />

      {/* Font Family */}
      <Section label="Font">
        <select
          value={font}
          onChange={(e) => {
            setFont(e.target.value);
            applyToSelected({ fontFamily: e.target.value });
          }}
          className={`w-full text-xs px-3 py-2 rounded-lg border ${border} ${inp} focus:outline-none focus:border-[#ff6b4a] cursor-pointer`}
          style={{ fontFamily: font }}
        >
          {GOOGLE_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </Section>

      {/* Size & Weight */}
      <Section label="Size & Weight">
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-1 rounded-lg border ${border} ${bg} px-2 py-1.5 flex-1`}
          >
            <button
              onClick={() => {
                const v = Math.max(8, size - 1);
                setSize(v);
                applyToSelected({ fontSize: v });
              }}
              className={`${muted} ${hov} rounded p-0.5`}
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              value={size}
              min={8}
              max={400}
              onChange={(e) => {
                const v = +e.target.value;
                setSize(v);
                applyToSelected({ fontSize: v });
              }}
              className={`w-12 text-center text-xs bg-transparent focus:outline-none`}
            />
            <button
              onClick={() => {
                const v = size + 1;
                setSize(v);
                applyToSelected({ fontSize: v });
              }}
              className={`${muted} ${hov} rounded p-0.5`}
            >
              <Plus size={12} />
            </button>
          </div>
          <select
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              applyToSelected({ fontWeight: e.target.value });
            }}
            className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${border} ${inp} focus:outline-none focus:border-[#ff6b4a]`}
          >
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {WEIGHT_LABELS[w]}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Style toggles */}
      <Section label="Style">
        <div className="flex gap-2">
          {[
            {
              Icon: Bold,
              active: weight === "700",
              action: () => {
                const w = weight === "700" ? "400" : "700";
                setWeight(w);
                applyToSelected({ fontWeight: w });
              },
              label: "Bold",
            },
            {
              Icon: Italic,
              active: italic,
              action: () => {
                setItalic((v) => {
                  const n = !v;
                  applyToSelected({ fontStyle: n ? "italic" : "normal" });
                  return n;
                });
              },
              label: "Italic",
            },
            {
              Icon: Underline,
              active: underline,
              action: () => {
                setUnderline((v) => {
                  const n = !v;
                  applyToSelected({ underline: n });
                  return n;
                });
              },
              label: "Underline",
            },
          ].map(({ Icon, active, action, label }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all text-sm
                ${active ? "border-[#ff6b4a] bg-[#ff6b4a]/20 text-[#ff6b4a]" : `${border} ${muted} ${hov}`}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </Section>

      {/* Alignment */}
      <Section label="Alignment">
        <div className="flex gap-1">
          {(
            [
              { icon: AlignLeft, value: "left" },
              { icon: AlignCenter, value: "center" },
              { icon: AlignRight, value: "right" },
              { icon: AlignJustify, value: "justify" },
            ] as const
          ).map(({ icon: Icon, value }) => (
            <button
              key={value}
              onClick={() => {
                setAlign(value);
                applyToSelected({ textAlign: value });
              }}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all
                ${align === value ? "border-[#ff6b4a] bg-[#ff6b4a]/20 text-[#ff6b4a]" : `${border} ${muted} ${hov}`}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </Section>

      {/* Color */}
      <Section label="Color">
        <div className="relative">
          <button
            onClick={() => setShowColorPicker((v) => !v)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg border ${border} ${hov} transition-colors`}
          >
            <span
              className="w-5 h-5 rounded-md border border-white/20 shrink-0"
              style={{ background: color }}
            />
            <span className="text-xs font-mono">{color}</span>
          </button>
          {showColorPicker && (
            <div
              className={`absolute top-full mt-2 left-0 z-50 p-3 rounded-xl border ${border} ${dark ? "bg-[#16161a]" : "bg-white"} shadow-2xl`}
            >
              <HexColorPicker
                color={color}
                onChange={(c) => {
                  setColor(c);
                  applyToSelected({ fill: c });
                }}
              />
              <button
                onClick={() => setShowColorPicker(false)}
                className={`mt-2 text-xs ${muted} w-full text-center`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Letter Spacing */}
      <Section label="Letter Spacing">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-50}
            max={200}
            value={letterSpacing}
            onChange={(e) => {
              const v = +e.target.value;
              setLetterSpacing(v);
              applyToSelected({ charSpacing: v });
            }}
            className="flex-1 accent-[#ff6b4a]"
          />
          <span className="text-xs font-mono w-8 text-right">
            {letterSpacing}
          </span>
        </div>
      </Section>

      {/* Line Height */}
      <Section label="Line Height">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.8}
            max={3}
            step={0.05}
            value={lineHeight}
            onChange={(e) => {
              const v = +e.target.value;
              setLineHeight(v);
              applyToSelected({ lineHeight: v });
            }}
            className="flex-1 accent-[#ff6b4a]"
          />
          <span className="text-xs font-mono w-8 text-right">
            {lineHeight.toFixed(1)}
          </span>
        </div>
      </Section>
    </div>
  );
};
