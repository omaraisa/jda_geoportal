import { useState, useRef, useEffect } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { clearSelection } from "@/lib/utils/query";
import { SpatialQueryService } from "./spatial-query-service";
import { createSketchCompleteHandler, createQueryByLayerHandler } from "./query-handlers";
import { getSelectedTargetLayer } from "./query-utils";
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
    targetLayerValue: "",
    selectionLayerValue: "",
    hasResults: false,
    relationship: "intersects",
  });

  // Refs
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchInitialized = useRef<boolean>(false);
  const targetLayerValueRef = useRef<string>("");
  const relationshipRef = useRef<string>("intersects");

  // Update ref when state changes
  useEffect(() => {
    targetLayerValueRef.current = state.targetLayerValue;
  }, [state.targetLayerValue]);

  useEffect(() => {
    relationshipRef.current = state.relationship;
  }, [state.relationship]);

  const refs: SpatialQueryRefs = {
    sketchContainerRef,
    graphicsLayerRef,
    sketchInitialized,
  };

  const setHasResults = (hasResults: boolean) => {
    setState((prevState) => ({
      ...prevState,
      hasResults,
    }));
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
          targetLayerValueRef,
          graphicsLayerRef,
          widgets,
          sendMessage,
          t,
          setHasResults,
          relationshipRef
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
    state.targetLayerValue,
    state.selectionLayerValue,
    graphicsLayerRef,
    widgets,
    sendMessage,
    updateStats,
    t,
    setHasResults,
    state.relationship
  );

  const selectionMethodHandler = () => {
    setState((prevState) => ({
      ...prevState,
      selectionMethodChecked: !prevState.selectionMethodChecked,
    }));
  };

  const handleTargetLayerChange = (value: string) => {
    setState((prevState) => ({
      ...prevState,
      targetLayerValue: value,
    }));
  };

  const handleSelectionLayerChange = (value: string) => {
    setState((prevState) => ({
      ...prevState,
      selectionLayerValue: value,
    }));
  };

  const handleRelationshipChange = (value: string) => {
    setState((prevState) => ({
      ...prevState,
      relationship: value,
    }));
  };

  const handleClearSelection = () => {
    const targetLayer = getSelectedTargetLayer(view, state.targetLayerValue);
    clearSelection(
      graphicsLayerRef.current,
      view,
      targetLayer,
      widgets
    );
    setHasResults(false);
  };

  const handleSwitchSelection = async () => {
    const targetLayer = getSelectedTargetLayer(view, state.targetLayerValue);
    if (targetLayer && graphicsLayerRef.current && view) {
      await SpatialQueryService.switchSelection(
        targetLayer,
        graphicsLayerRef.current,
        view,
        widgets
      );
    }
  };

  const handleCreateLayer = () => {
    const targetLayer = getSelectedTargetLayer(view, state.targetLayerValue);
    if (targetLayer && graphicsLayerRef.current && view) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const timeCode = `${hours}${minutes}${seconds}`;
      
      const uniqueTitle = `Spatial Query Result - ${targetLayer.title} ${timeCode}`;
      
      SpatialQueryService.createLayerFromResults(
        targetLayer,
        graphicsLayerRef.current.graphics.toArray(),
        view,
        uniqueTitle
      );
    }
  };

  return {
    state,
    refs,
    handlers: {
      runQueryByLayer,
      selectionMethodHandler,
      handleClearSelection,
      handleSwitchSelection,
      handleTargetLayerChange,
      handleSelectionLayerChange,
      handleRelationshipChange,
      handleCreateLayer,
    },
  };
};
