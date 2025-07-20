"use client";

import { useState, useRef, useEffect } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { clearSelection } from "@/lib/utils/query";
import LayerSelector from "./spatial-query/layer-selector";
import SelectionMethodToggle from "./spatial-query/selection-method-toggle";
import QueryActions from "./spatial-query/query-actions";
import { SpatialQueryService } from "./spatial-query/spatial-query-service";

export default function SpatialQueryComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const widgets = useStateStore((state) => state.widgets);
  const updateStats = useStateStore((state) => state.updateStats);
  
  const targetLayerRef = useRef<HTMLSelectElement>(null);
  const selectionLayerRef = useRef<HTMLSelectElement>(null);
  const sketchContainerRef = useRef<HTMLDivElement>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchInitialized = useRef<boolean>(false);

  const [state, setState] = useState<{
    targetLayer: __esri.Layer | null;
    selectionGeometry: __esri.Geometry | null;
    selectionMethodChecked: boolean;
  }>({
    targetLayer: null,
    selectionGeometry: null,
    selectionMethodChecked: true,
  });

  useEffect(() => {
    if (view && !sketchInitialized.current) {
      sketchInitialized.current = true;

      graphicsLayerRef.current = new GraphicsLayer({
        title: t("widgets.query.queryLayerTitle"),
      });
      view.map.add(graphicsLayerRef.current);

      if (sketchContainerRef.current) {
        SpatialQueryService.initializeSketch(
          view,
          graphicsLayerRef.current,
          sketchContainerRef.current,
          handleSketchComplete
        );
      }
    }
  }, [view]);

  const handleSketchComplete = async (graphic: __esri.Graphic) => {
    const targetLayer = getSelectedTargetLayer();
    if (!targetLayer) {
      showErrorMessage();
      return;
    }

    try {
      const response = await SpatialQueryService.queryByGeometry(targetLayer, graphic.geometry);
      if (response && response.features.length) {
        SpatialQueryService.processQueryResult(
          response,
          graphicsLayerRef.current!,
          view,
          targetLayer,
          widgets
        );
      } else {
        sendMessage({
          type: "error",
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.noResultsFound.body"),
          duration: 10,
        });
      }
    } catch (error) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        duration: 10,
      });
    }
  };

  const runQueryByLayer = async () => {
    const targetLayer = getSelectedTargetLayer();
    const selectionLayer = getSelectedSelectionLayer();

    if (!targetLayer || !selectionLayer) {
      showErrorMessage();
      return;
    }

    try {
      const response = await SpatialQueryService.queryByLayer(targetLayer, selectionLayer);
      if (response && response.features.length) {
        SpatialQueryService.processQueryResult(
          response,
          graphicsLayerRef.current!,
          view,
          targetLayer,
          widgets
        );
      } else {
        sendMessage({
          type: "error",
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.noResultsFound.body"),
          duration: 10,
        });
      }
    } catch (error) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        duration: 10,
      });
    }
    updateStats("Spatial Query");
  };

  const getSelectedTargetLayer = (): __esri.FeatureLayer | null => {
    return view && targetLayerRef.current
      ? (view.map.layers.toArray()[Number(targetLayerRef.current.value)] as __esri.FeatureLayer)
      : null;
  };

  const getSelectedSelectionLayer = (): __esri.FeatureLayer | null => {
    return view && selectionLayerRef.current
      ? (view.map.layers.toArray()[Number(selectionLayerRef.current.value)] as __esri.FeatureLayer)
      : null;
  };

  const showErrorMessage = () => {
    sendMessage({
      type: "error",
      title: t("systemMessages.error.queryError.title"),
      body: t("systemMessages.error.completeSearchRequirements.body"),
      duration: 10,
    });
  };

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

  return (
    <div className="flex flex-col space-y-4 p-4">
      <LayerSelector
        view={view}
        targetLayerRef={targetLayerRef}
        selectionLayerRef={selectionLayerRef}
        selectionMethodChecked={state.selectionMethodChecked}
      />

      <SelectionMethodToggle
        selectionMethodChecked={state.selectionMethodChecked}
        onToggle={selectionMethodHandler}
      />

      <div
        ref={sketchContainerRef}
        style={{
          display: state.selectionMethodChecked ? "block" : "none",
        }}
      ></div>

      <QueryActions
        selectionMethodChecked={state.selectionMethodChecked}
        onRunQueryByLayer={runQueryByLayer}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
