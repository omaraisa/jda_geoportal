import { useState, useRef, useEffect } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { clearSelection } from "@/lib/utils/query";
import { SpatialQueryService } from "./spatial-query-service";
import { createSketchCompleteHandler, createQueryByLayerHandler } from "./query-handlers";
import { SpatialQueryState, SpatialQueryRefs, MessagePayload } from "./types";

export const useSpatialQuery = (
  view: __esri.MapView | __esri.SceneView | null,
  sendMessage: (message: MessagePayload) => void,
  widgets: any,
  updateStats: (action: string) => void,
  t: (key: string) => string
) => {
  // State
  const [state, setState] = useState<SpatialQueryState>({
    targetLayer: null,
    selectionGeometry: null,
    selectionMethodChecked: true,
  });

  // Refs
  const targetLayerRef = useRef<HTMLSelectElement | null>(null);
  const selectionLayerRef = useRef<HTMLSelectElement | null>(null);
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchInitialized = useRef<boolean>(false);

  const refs: SpatialQueryRefs = {
    targetLayerRef,
    selectionLayerRef,
    sketchContainerRef,
    graphicsLayerRef,
    sketchInitialized,
  };

  // Initialize sketch on view change
  useEffect(() => {
    if (view && !sketchInitialized.current) {
      sketchInitialized.current = true;

      graphicsLayerRef.current = new GraphicsLayer({
        title: t("widgets.query.queryLayerTitle"),
        listMode: "show",
        visible: true,
        group: "My Layers",
      } as any);
      view.map.add(graphicsLayerRef.current);

      if (sketchContainerRef.current) {
        const handleSketchComplete = createSketchCompleteHandler(
          view,
          targetLayerRef,
          graphicsLayerRef,
          widgets,
          sendMessage,
          t
        );

        SpatialQueryService.initializeSketch(
          view,
          graphicsLayerRef.current,
          sketchContainerRef.current,
          handleSketchComplete
        );
      }
    }
  }, [view, widgets, sendMessage, t]);

  // Handlers
  const runQueryByLayer = createQueryByLayerHandler(
    view,
    targetLayerRef,
    selectionLayerRef,
    graphicsLayerRef,
    widgets,
    sendMessage,
    updateStats,
    t
  );

  const selectionMethodHandler = () => {
    setState((prevState) => ({
      ...prevState,
      selectionMethodChecked: !prevState.selectionMethodChecked,
    }));
  };

  const handleClearSelection = () => {
    clearSelection(
      graphicsLayerRef.current,
      view,
      state.targetLayer as __esri.FeatureLayer,
      widgets
    );
  };

  return {
    state,
    refs,
    handlers: {
      runQueryByLayer,
      selectionMethodHandler,
      handleClearSelection,
    },
  };
};
