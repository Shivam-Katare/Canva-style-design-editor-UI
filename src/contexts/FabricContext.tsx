import React, {
  createContext,
  useContext,
  useRef,
  MutableRefObject,
} from "react";
import type { Canvas } from "fabric";

interface FabricContextType {
  canvasRef: MutableRefObject<Canvas | null>;
}

const FabricContext = createContext<FabricContextType | null>(null);

export const FabricProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const canvasRef = useRef<Canvas | null>(null);
  return (
    <FabricContext.Provider value={{ canvasRef }}>
      {children}
    </FabricContext.Provider>
  );
};

export const useFabric = () => {
  const ctx = useContext(FabricContext);
  if (!ctx) throw new Error("useFabric must be used within FabricProvider");
  return ctx;
};
