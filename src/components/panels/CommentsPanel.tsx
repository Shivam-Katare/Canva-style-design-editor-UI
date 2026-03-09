import React, { useEffect } from "react";
import { MessageSquare, MousePointer } from "lucide-react";
import { useCommentUtils } from "@veltdev/react";
import { useEditorStore } from "../../store/editorStore";

export const CommentsPanel: React.FC = () => {
  const { theme, isCommentMode, setIsCommentMode } = useEditorStore();
  const commentUtils = useCommentUtils();

  const dark = theme === "dark";
  const muted = dark ? "text-[#6b6b7a]" : "text-gray-400";
  const border = dark ? "border-[#242430]" : "border-[#e2e2ea]";

  const toggleCommentMode = () => {
    if (!commentUtils) return;
    const newMode = !isCommentMode;
    if (newMode) {
      commentUtils.enableCommentMode();
    } else {
      commentUtils.disableCommentMode();
    }
    setIsCommentMode(newMode);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (commentUtils && isCommentMode) {
        commentUtils.disableCommentMode();
        setIsCommentMode(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 space-y-5">
      {/* Mode toggle */}
      <div
        className={`rounded-xl border p-4 space-y-3 ${border} ${
          isCommentMode
            ? "border-[#ff6b4a]/50 bg-[#ff6b4a]/10"
            : dark
              ? "bg-[#111114]"
              : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCommentMode ? "bg-[#ff6b4a]" : dark ? "bg-[#1e1e24]" : "bg-gray-200"}`}
          >
            <MessageSquare
              size={18}
              className={isCommentMode ? "text-white" : muted}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">Comment Mode</p>
            <p className={`text-xs ${muted}`}>
              {isCommentMode
                ? "Click anywhere on the canvas to add a comment"
                : "Click to enable commenting"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleCommentMode}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]
            ${
              isCommentMode
                ? "bg-[#e8445a] text-white hover:bg-[#d13a50]"
                : "bg-[#ff6b4a] text-white hover:bg-[#e85b3c]"
            }`}
        >
          {isCommentMode ? "✕ Disable Comment Mode" : "💬 Enable Comment Mode"}
        </button>
      </div>

      {/* Instructions */}
      {isCommentMode && (
        <div className="space-y-2">
          <p
            className={`text-xs font-semibold ${muted} uppercase tracking-widest`}
          >
            How to use
          </p>
          <div
            className={`rounded-xl border ${border} divide-y ${dark ? "divide-[#242430]" : "divide-gray-100"}`}
          >
            {[
              {
                icon: "👆",
                text: "Click on the canvas to place a comment pin",
              },
              { icon: "✍️", text: "Type your comment in the popup" },
              { icon: "💬", text: "Click existing pins to view threads" },
              { icon: "↩️", text: "Press Escape to exit comment mode" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className={`flex items-start gap-3 px-4 py-3 text-xs ${muted}`}
              >
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isCommentMode && (
        <div
          className={`flex items-center gap-3 text-xs ${muted} rounded-xl border ${border} px-4 py-3`}
        >
          <MousePointer size={14} className="shrink-0" />
          <span>
            Enable comment mode to collaboratively annotate the canvas with your
            team
          </span>
        </div>
      )}
    </div>
  );
};
