import React, {
  createContext,
  useContext,
  useRef,
  MutableRefObject,
} from "react";
import type { Canvas } from "fabric";

interface FabricContextType {
  canvasRef: MutableRefObject<Canvas | null>;
  /** Set to true before applying a remote CRDT update to Fabric, false after.
   *  Canvas event handlers check this to avoid echoing remote changes back. */
  isRemoteUpdate: MutableRefObject<boolean>;
  /** Ref to pushCanvasState from useCollaborativeEditor. Set by CanvasArea;
   *  consumed by BackgroundPanel and LayersPanel to push their mutations. */
  pushCanvasStateRef: MutableRefObject<((json: string) => void) | null>;
  /** Ref to pushCanvasStateImmediate (bypasses debounce). Used by LayersPanel
   *  for discrete actions (delete, visibility) so the echo ref is set at once. */
  pushCanvasStateImmediateRef: MutableRefObject<
    ((json: string) => void) | null
  >;
}

const FabricContext = createContext<FabricContextType | null>(null);

export const FabricProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const canvasRef = useRef<Canvas | null>(null);
  const isRemoteUpdate = useRef<boolean>(false);
  const pushCanvasStateRef = useRef<((json: string) => void) | null>(null);
  const pushCanvasStateImmediateRef = useRef<((json: string) => void) | null>(
    null,
  );
  return (
    <FabricContext.Provider
      value={{
        canvasRef,
        isRemoteUpdate,
        pushCanvasStateRef,
        pushCanvasStateImmediateRef,
      }}
    >
      {children}
    </FabricContext.Provider>
  );
};

export const useFabric = () => {
  const ctx = useContext(FabricContext);
  if (!ctx) throw new Error("useFabric must be used within FabricProvider");
  return ctx;
};
