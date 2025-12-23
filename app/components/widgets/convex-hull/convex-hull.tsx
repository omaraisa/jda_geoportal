import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import OutputLayerList from "../analysis-tools/output-layer-list";
import { ConvexHullService } from "./convex-hull-service";
import { CalciteIcon } from "@esri/calcite-components-react";

const ConvexHull: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);
  const addAnalysisOutputLayer = useStateStore((state) => state.addAnalysisOutputLayer);
  const removeAnalysisOutputLayer = useStateStore((state) => state.removeAnalysisOutputLayer);
  const getAnalysisOutputLayers = useStateStore((state) => state.getAnalysisOutputLayers);

  const [inputLayerId, setInputLayerId] = useState<string>("");
  const [mergeResults, setMergeResults] = useState<boolean>(true);
  const [outputName, setOutputName] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [, forceUpdate] = useState(0);
  const outputLayers = getAnalysisOutputLayers("convex-hull");

  const handleRun = async () => {
    if (!inputLayerId) {
      setStatusType("error");
      setStatus(t("widgets.convexHull.errors.noLayer") || "Please select an input layer");
      return;
    }

    const inputLayer = view?.map.findLayerById(inputLayerId) as __esri.FeatureLayer;
    if (!inputLayer) {
        setStatusType("error");
        setStatus(t("widgets.convexHull.errors.layerNotFound") || "Layer not found");
        return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.convexHull.status.running") || "Calculating convex hull...");

    try {
      const resultLayer = await ConvexHullService.runConvexHullAnalysis(inputLayer, mergeResults, outputName);
      
      addAnalysisOutputLayer("convex-hull", resultLayer);

      setStatusType("success");
      setStatus(t("widgets.convexHull.status.success") || "Convex hull created successfully");
      updateStats("Convex Hull Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Convex hull analysis failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleVisibility = (layer: __esri.Layer) => {
    layer.visible = !layer.visible;
    forceUpdate(Math.random());
  };

  const handleRename = (layer: __esri.Layer, newName: string) => {
    layer.title = newName;
    forceUpdate(Math.random());
  };

  const handleDelete = (layer: __esri.Layer) => {
    if (view) {
        view.map.remove(layer);
    }
    removeAnalysisOutputLayer("convex-hull", layer.id);
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.convexHull.title") || "Convex Hull"}
      </h2>

      <LayerSelector
        label={t("widgets.convexHull.layer") || "Input Layer"}
        value={inputLayerId}
        onChange={setInputLayerId}
        view={view}
        filter={(layer) => layer.type === "feature"}
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="mergeResults"
          checked={mergeResults}
          onChange={(e) => setMergeResults(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="mergeResults" className="text-sm text-gray-700">
          {t("widgets.convexHull.mergeResults") || "Create single hull for all features"}
        </label>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          {t("widgets.convexHull.outputName") || "Output Layer Name (Optional)"}
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder={t("widgets.convexHull.outputNamePlaceholder") || "Convex Hull Result"}
          className="p-2 border rounded text-sm bg-background text-foreground"
        />
      </div>

      <button
        onClick={handleRun}
        disabled={isRunning}
        className={`w-full p-2 rounded text-white font-medium transition-colors ${
          isRunning ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isRunning ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>{t("common.processing") || "Processing..."}</span>
          </div>
        ) : (
          t("widgets.convexHull.run") || "Run Analysis"
        )}
      </button>

      {status && (
        <div
          className={`p-3 rounded text-sm ${
            statusType === "error"
              ? "bg-red-100 text-red-700"
              : statusType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status}
        </div>
      )}

      {outputLayers && outputLayers.length > 0 && (
        <OutputLayerList 
          layers={outputLayers}
          onToggleVisibility={handleToggleVisibility}
          onRename={handleRename}
          onDelete={handleDelete}
          onZoomTo={handleZoomTo}
        />
      )}
    </div>
  );
};

export default ConvexHull;
