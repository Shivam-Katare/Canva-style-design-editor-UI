import { useEffect, useRef, useCallback } from "react";
import { useVeltCrdtStore } from "@veltdev/crdt-react";
import { useFabric } from "../contexts/FabricContext";
import { useEditorStore } from "../store/editorStore";
import type { LayerMeta } from "../types/editor";

/** Shape stored in the CRDT text store */
interface CanvasSnapshot {
  /** JSON-stringified Fabric canvas (output of canvas.toJSON(["data"])) */
  json: string;
  /** JSON-stringified LayerMeta[] */
  layers: string;
  /** Canvas dimensions — synced so peers resize their canvas too */
  canvasSize: { width: number; height: number; name: string };
}

/**
 * useCollaborativeEditor
 *
 * Bridges the Fabric.js canvas with a Velt CRDT text store so that every
 * change made locally is propagated to all connected peers in real-time.
 *
 * Usage (inside CanvasArea):
 *   const { pushCanvasState, applyCurrentValue } = useCollaborativeEditor();
 *   // call applyCurrentValue() once after the Fabric canvas is initialised
 *   // call pushCanvasState(json) inside every canvas mutation event handler
 */
export function useCollaborativeEditor() {
  const { canvasRef, isRemoteUpdate } = useFabric();

  // One shared CRDT text store for the whole canvas state.
  // type:'text' gives us a simple full-replacement store backed by Y.Text.
  // We handle our own 150 ms debounce so debounceMs is omitted here.
  const { value, update } = useVeltCrdtStore<string>({
    id: "pixframe-canvas-state",
    type: "text",
    initialValue: "",
    enablePresence: false,
  });

  // Ref copy of value so stable callbacks can read the latest snapshot
  // without becoming stale closures.
  const valueRef = useRef<string>("");
  useEffect(() => {
    valueRef.current = value ?? "";
  }, [value]);

  // The last snapshot we pushed to CRDT — used to suppress the echo when
  // the store reflects our own update back to us.
  const lastPushedRef = useRef<string>("");

  // Debounce handle
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Apply a snapshot string to the Fabric canvas ──────────────────────
  const applySnapshot = useCallback(
    (raw: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !raw) return;
      try {
        const { json, layers, canvasSize } = JSON.parse(raw) as CanvasSnapshot;
        const parsed = JSON.parse(json);

        // Cancel any pending local push so it doesn't overwrite the incoming
        // remote state after we apply it.
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }

        // Treat this incoming snapshot as "our last known state" so that when
        // the CRDT store echoes it back (e.g. after re-subscription on user
        // switch) we don't apply it a second time.
        lastPushedRef.current = raw;

        isRemoteUpdate.current = true;

        // Apply remote canvas size before loading objects
        if (canvasSize) {
          useEditorStore
            .getState()
            .setCanvasSize(
              canvasSize.width,
              canvasSize.height,
              canvasSize.name,
            );
          canvas.setDimensions({
            width: canvasSize.width,
            height: canvasSize.height,
          });
        }

        (canvas as any).loadFromJSON(parsed).then(() => {
          // Restore visibility on each object from the layers snapshot BEFORE
          // renderAll, so the canvas reflects the correct visible state.
          if (layers) {
            const remoteLayers: LayerMeta[] = JSON.parse(layers);
            remoteLayers.forEach((layer) => {
              const obj = canvas
                .getObjects()
                .find((o: any) => o.data?.id === layer.id);
              if (obj) obj.set("visible", layer.visible);
            });
          }

          canvas.renderAll();

          // Update Zustand layers AFTER canvas objects are fully restored.
          if (layers) {
            const remoteLayers: LayerMeta[] = JSON.parse(layers);
            useEditorStore.getState().setLayers(remoteLayers);
          }

          // Defer clearing the remote-update flag by two animation frames so
          // that the React useEffect([layers]) triggered by setLayers() above
          // fires while isRemoteUpdate is still true.  That prevents the purge
          // logic in CanvasArea from removing objects that were just loaded.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isRemoteUpdate.current = false;
            });
          });
        });
      } catch {
        // Malformed snapshot — ignore
      }
    },
    [canvasRef, isRemoteUpdate],
  );

  // ── React to remote value changes ─────────────────────────────────────
  useEffect(() => {
    if (!value) return;
    // Skip echoes of our own pushes
    if (value === lastPushedRef.current) return;
    applySnapshot(value);
  }, [value, applySnapshot]);

  // ── Push local canvas state to CRDT ───────────────────────────────────
  // Debounced 150 ms so rapid drag operations only push one update.
  // Layers are read from the Zustand store at flush time (not capture time)
  // so newly added layers are included even if addLayer() ran after the
  // canvas event fired.
  const pushCanvasState = useCallback(
    (canvasJson: string) => {
      if (isRemoteUpdate.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const state = useEditorStore.getState();
        const snapshot = JSON.stringify({
          json: canvasJson,
          layers: JSON.stringify(state.layers),
          canvasSize: state.canvasSize,
        } satisfies CanvasSnapshot);
        lastPushedRef.current = snapshot;
        update(snapshot);
      }, 150);
    },
    [update, isRemoteUpdate],
  );

  // ── Immediate push (no debounce) ──────────────────────────────────────
  // Use for discrete user actions (delete, visibility toggle) where the result
  // must be reflected in CRDT right away so no in-flight remote echo can revert
  // the change.
  const pushCanvasStateImmediate = useCallback(
    (canvasJson: string) => {
      if (isRemoteUpdate.current) return;
      // Cancel any pending debounced push — this one supersedes it
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const state = useEditorStore.getState();
      const snapshot = JSON.stringify({
        json: canvasJson,
        layers: JSON.stringify(state.layers),
        canvasSize: state.canvasSize,
      } satisfies CanvasSnapshot);
      lastPushedRef.current = snapshot;
      update(snapshot);
    },
    [update, isRemoteUpdate],
  );

  // ── Late-joiner initial load ───────────────────────────────────────────
  // Called once from CanvasArea after the Fabric canvas is initialised.
  // If a CRDT snapshot is already available (another peer already edited),
  // it is immediately applied to the blank canvas.
  const applyCurrentValue = useCallback(() => {
    applySnapshot(valueRef.current);
  }, [applySnapshot]);

  return { pushCanvasState, pushCanvasStateImmediate, applyCurrentValue };
}
