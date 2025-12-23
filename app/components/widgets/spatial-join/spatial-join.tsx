import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import OutputLayerList from "../analysis-tools/output-layer-list";
import { SpatialJoinService, SpatialJoinRelationship } from "./spatial-join-service";
import { CalciteIcon } from "@esri/calcite-components-react";

const RELATIONSHIPS: { value: SpatialJoinRelationship; label: string }[] = [
  { value: "intersects", label: "Intersects" },
  { value: "contains", label: "Contains" },
  { value: "within", label: "Within" },
  { value: "overlaps", label: "Overlaps" },
  { value: "touches", label: "Touches" }
];

const SpatialJoin: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);
  const addAnalysisOutputLayer = useStateStore((state) => state.addAnalysisOutputLayer);
  const removeAnalysisOutputLayer = useStateStore((state) => state.removeAnalysisOutputLayer);
  const getAnalysisOutputLayers = useStateStore((state) => state.getAnalysisOutputLayers);

  const [targetLayerId, setTargetLayerId] = useState<string>("");
  const [joinLayerId, setJoinLayerId] = useState<string>("");
  const [relationship, setRelationship] = useState<SpatialJoinRelationship>("intersects");
  const [outputName, setOutputName] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [, forceUpdate] = useState(0);
  const outputLayers = getAnalysisOutputLayers("spatial-join");

  const handleRun = async () => {
    if (!targetLayerId || !joinLayerId) {
      setStatusType("error");
      setStatus(t("widgets.spatialJoin.errors.noLayers") || "Please select both layers");
      return;
    }

    if (targetLayerId === joinLayerId) {
      setStatusType("error");
      setStatus(t("widgets.spatialJoin.errors.sameLayer") || "Please select different layers");
      return;
    }

    const targetLayer = view?.map.findLayerById(targetLayerId) as __esri.FeatureLayer;
    const joinLayer = view?.map.findLayerById(joinLayerId) as __esri.FeatureLayer;

    if (!targetLayer || !joinLayer) {
        setStatusType("error");
        setStatus(t("widgets.spatialJoin.errors.layerNotFound") || "Layer not found");
        return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.spatialJoin.status.running") || "Performing spatial join...");

    try {
      const resultLayer = await SpatialJoinService.runSpatialJoin(targetLayer, joinLayer, relationship, outputName);
      
      addAnalysisOutputLayer("spatial-join", resultLayer);

      setStatusType("success");
      setStatus(t("widgets.spatialJoin.status.success") || "Spatial join completed successfully");
      updateStats("Spatial Join Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Spatial join failed");
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
    removeAnalysisOutputLayer("spatial-join", layer.id);
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.spatialJoin.title") || "Spatial Join"}
      </h2>

      <LayerSelector
        label={t("widgets.spatialJoin.targetLayer") || "Target Layer"}
        value={targetLayerId}
        onChange={setTargetLayerId}
        view={view}
        filter={(layer) => layer.type === "feature"}
      />

      <LayerSelector
        label={t("widgets.spatialJoin.joinLayer") || "Join Layer"}
        value={joinLayerId}
        onChange={setJoinLayerId}
        view={view}
        filter={(layer) => layer.type === "feature"}
      />

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          {t("widgets.spatialJoin.relationship") || "Spatial Relationship"}
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as SpatialJoinRelationship)}
          className="p-2 border rounded text-sm bg-background text-foreground"
        >
          {RELATIONSHIPS.map((rel) => (
            <option key={rel.value} value={rel.value}>
              {t(`widgets.spatialJoin.relationships.${rel.value}`) || rel.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          {t("widgets.spatialJoin.outputName") || "Output Layer Name (Optional)"}
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder={t("widgets.spatialJoin.outputNamePlaceholder") || "Spatial Join Result"}
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
          t("widgets.spatialJoin.run") || "Run Analysis"
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

export default SpatialJoin;
