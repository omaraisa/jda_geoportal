import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls } from "../analysis-tools";
import { DissolveService } from "./dissolve-service";
import OutputLayerList from "../analysis-tools/output-layer-list";

const Dissolve: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);
  const addAnalysisOutputLayer = useStateStore((state) => state.addAnalysisOutputLayer);
  const removeAnalysisOutputLayer = useStateStore((state) => state.removeAnalysisOutputLayer);
  const getAnalysisOutputLayers = useStateStore((state) => state.getAnalysisOutputLayers);

  const [inputLayerId, setInputLayerId] = useState<string>("");
  const [outputName, setOutputName] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [, forceUpdate] = useState(0);
  const outputLayers = getAnalysisOutputLayers("dissolve");

  // Get the selected layer
  const inputLayer = view?.map.findLayerById(inputLayerId) as __esri.FeatureLayer | __esri.GraphicsLayer;

  const handleRun = async () => {
    if (!inputLayer) {
      setStatusType("error");
      setStatus(t("widgets.dissolve.errors.noLayer") || "Please select an input layer");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.dissolve.status.running") || "Dissolving geometries...");

    try {
      const resultLayer = await DissolveService.runDissolveAnalysis(inputLayer, outputName);
      
      addAnalysisOutputLayer("dissolve", resultLayer);

      setStatusType("success");
      setStatus(t("widgets.dissolve.status.success") || "Dissolve analysis completed successfully");
      updateStats("Dissolve Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Dissolve analysis failed");
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
    removeAnalysisOutputLayer("dissolve", layer.id);
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.dissolve.title") || "Dissolve Analysis"}
      </h2>

      <LayerSelector
        label={t("widgets.dissolve.inputLayer") || "Input Layer"}
        value={inputLayerId}
        onChange={setInputLayerId}
        view={view}
      />

      <div className="text-sm text-gray-600">
        <p>{t("widgets.dissolve.description") || "Merges overlapping or adjacent geometries into single geometries."}</p>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          {t("widgets.dissolve.outputName") || "Output Layer Name (Optional)"}
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder={t("widgets.dissolve.outputNamePlaceholder") || "Dissolved Result"}
          className="p-2 border rounded text-sm bg-background text-foreground"
        />
      </div>

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
        isRunning={isRunning}
      />

      <OutputLayerList 
        layers={outputLayers}
        onToggleVisibility={handleToggleVisibility}
        onRename={handleRename}
        onDelete={handleDelete}
        onZoomTo={handleZoomTo}
      />
    </div>
  );
};

export default Dissolve;