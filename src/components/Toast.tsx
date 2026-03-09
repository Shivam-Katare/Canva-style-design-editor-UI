import React from "react";
import { useEditorStore } from "../store/editorStore";

export const Toast: React.FC = () => {
  const { toast } = useEditorStore();

  if (!toast.visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] toast-in
        bg-[#1e1e2e] border border-[#ff6b4a]/40 text-[#f0f0f5] text-sm
        px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3
        pointer-events-none select-none"
    >
      <span className="w-2 h-2 rounded-full bg-[#ff6b4a] shrink-0" />
      {toast.message}
    </div>
  );
};
