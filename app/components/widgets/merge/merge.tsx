import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import OutputLayerList from "../analysis-tools/output-layer-list";
import { MergeService } from "./merge-service";
import { CalciteIcon } from "@esri/calcite-components-react";

const Merge: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);
  const addAnalysisOutputLayer = useStateStore((state) => state.addAnalysisOutputLayer);
  const removeAnalysisOutputLayer = useStateStore((state) => state.removeAnalysisOutputLayer);
  const getAnalysisOutputLayers = useStateStore((state) => state.getAnalysisOutputLayers);

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(["", ""]);
  const [outputName, setOutputName] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [, forceUpdate] = useState(0);
  const outputLayers = getAnalysisOutputLayers("merge");

  const handleLayerChange = (index: number, value: string) => {
    const newIds = [...selectedLayerIds];
    newIds[index] = value;
    setSelectedLayerIds(newIds);
  };

  const addLayerInput = () => {
    setSelectedLayerIds([...selectedLayerIds, ""]);
  };

  const removeLayerInput = (index: number) => {
    if (selectedLayerIds.length > 2) {
      const newIds = selectedLayerIds.filter((_, i) => i !== index);
      setSelectedLayerIds(newIds);
    }
  };

  const handleRun = async () => {
    // Filter out empty selections
    const validIds = selectedLayerIds.filter(id => id !== "");
    
    if (validIds.length < 2) {
      setStatusType("error");
      setStatus(t("widgets.merge.errors.minLayers") || "Please select at least two layers");
      return;
    }

    // Get actual layer objects
    const layers = validIds.map(id => view?.map.findLayerById(id) as __esri.FeatureLayer).filter(l => l);

    if (layers.length !== validIds.length) {
      setStatusType("error");
      setStatus(t("widgets.merge.errors.invalidLayers") || "Some selected layers could not be found");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.merge.status.running") || "Merging layers...");

    try {
      const resultLayer = await MergeService.runMergeAnalysis(layers, outputName);
      
      addAnalysisOutputLayer("merge", resultLayer);

      setStatusType("success");
      setStatus(t("widgets.merge.status.success") || "Merge completed successfully");
      updateStats("Merge Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Merge analysis failed");
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
    removeAnalysisOutputLayer("merge", layer.id);
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.merge.title") || "Merge Layers"}
      </h2>

      <div className="space-y-3">
        {selectedLayerIds.map((layerId, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-grow">
              <LayerSelector
                label={`${t("widgets.merge.layer") || "Layer"} ${index + 1}`}
                value={layerId}
                onChange={(val) => handleLayerChange(index, val)}
                view={view}
                filter={(layer) => {
                    // If it's the first layer, allow any feature layer
                    if (index === 0) return layer.type === "feature";
                    // If subsequent layers, must match geometry type of first selected layer (if selected)
                    const firstLayerId = selectedLayerIds[0];
                    if (!firstLayerId) return layer.type === "feature";
                    const firstLayer = view?.map.findLayerById(firstLayerId) as __esri.FeatureLayer;
                    if (!firstLayer) return layer.type === "feature";
                    return layer.type === "feature" && (layer as __esri.FeatureLayer).geometryType === firstLayer.geometryType;
                }}
              />
            </div>
            {selectedLayerIds.length > 2 && (
              <button
                onClick={() => removeLayerInput(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded mb-[2px]"
                title={t("common.remove") || "Remove"}
              >
                <CalciteIcon icon="trash" scale="s" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addLayerInput}
        className="flex items-center justify-center space-x-2 p-2 border border-dashed border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-600"
      >
        <CalciteIcon icon="plus" scale="s" />
        <span>{t("widgets.merge.addLayer") || "Add another layer"}</span>
      </button>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          {t("widgets.merge.outputName") || "Output Layer Name (Optional)"}
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder={t("widgets.merge.outputNamePlaceholder") || "Merged Result"}
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
          t("widgets.merge.run") || "Run Merge"
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

export default Merge;
