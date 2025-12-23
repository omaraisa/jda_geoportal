import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import OutputLayerList from "../analysis-tools/output-layer-list";
import { AttributeJoinService } from "./attribute-join-service";
import { CalciteIcon } from "@esri/calcite-components-react";

const AttributeJoin: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);
  const addAnalysisOutputLayer = useStateStore((state) => state.addAnalysisOutputLayer);
  const removeAnalysisOutputLayer = useStateStore((state) => state.removeAnalysisOutputLayer);
  const getAnalysisOutputLayers = useStateStore((state) => state.getAnalysisOutputLayers);

  const [targetLayerId, setTargetLayerId] = useState<string>("");
  const [joinLayerId, setJoinLayerId] = useState<string>("");
  const [targetField, setTargetField] = useState<string>("");
  const [joinField, setJoinField] = useState<string>("");
  const [outputName, setOutputName] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [, forceUpdate] = useState(0);
  const outputLayers = getAnalysisOutputLayers("attribute-join");

  const [targetFields, setTargetFields] = useState<__esri.Field[]>([]);
  const [joinFields, setJoinFields] = useState<__esri.Field[]>([]);

  useEffect(() => {
    if (targetLayerId && view) {
      const layer = view.map.findLayerById(targetLayerId) as __esri.FeatureLayer;
      if (layer && layer.fields) {
        setTargetFields(layer.fields);
      }
    } else {
      setTargetFields([]);
    }
  }, [targetLayerId, view]);

  useEffect(() => {
    if (joinLayerId && view) {
      const layer = view.map.findLayerById(joinLayerId) as __esri.FeatureLayer;
      if (layer && layer.fields) {
        setJoinFields(layer.fields);
      }
    } else {
      setJoinFields([]);
    }
  }, [joinLayerId, view]);

  const handleRun = async () => {
    if (!targetLayerId || !joinLayerId) {
      setStatusType("error");
      setStatus(t("widgets.attributeJoin.errors.noLayers") || "Please select both layers");
      return;
    }

    if (!targetField || !joinField) {
      setStatusType("error");
      setStatus(t("widgets.attributeJoin.errors.noFields") || "Please select join fields");
      return;
    }

    const targetLayer = view?.map.findLayerById(targetLayerId) as __esri.FeatureLayer;
    const joinLayer = view?.map.findLayerById(joinLayerId) as __esri.FeatureLayer;

    if (!targetLayer || !joinLayer) {
        setStatusType("error");
        setStatus(t("widgets.attributeJoin.errors.layerNotFound") || "Layer not found");
        return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.attributeJoin.status.running") || "Performing attribute join...");

    try {
      const resultLayer = await AttributeJoinService.runAttributeJoin(targetLayer, joinLayer, targetField, joinField, outputName);
      
      addAnalysisOutputLayer("attribute-join", resultLayer);

      setStatusType("success");
      setStatus(t("widgets.attributeJoin.status.success") || "Attribute join completed successfully");
      updateStats("Attribute Join Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Attribute join failed");
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
    removeAnalysisOutputLayer("attribute-join", layer.id);
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.attributeJoin.title") || "Attribute Join"}
      </h2>

      <LayerSelector
        label={t("widgets.attributeJoin.targetLayer") || "Target Layer"}
        value={targetLayerId}
        onChange={setTargetLayerId}
        view={view}
        filter={(layer) => layer.type === "feature"}
      />

      {targetFields.length > 0 && (
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium">
            {t("widgets.attributeJoin.targetField") || "Target Join Field"}
          </label>
          <select
            value={targetField}
            onChange={(e) => setTargetField(e.target.value)}
            className="p-2 border rounded text-sm bg-background text-foreground"
          >
            <option value="">{t("common.select") || "Select..."}</option>
            {targetFields.map((f) => (
              <option key={f.name} value={f.name}>
                {f.alias || f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <LayerSelector
        label={t("widgets.attributeJoin.joinLayer") || "Join Layer"}
        value={joinLayerId}
        onChange={setJoinLayerId}
        view={view}
        filter={(layer) => layer.type === "feature"}
      />

      {joinFields.length > 0 && (
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium">
            {t("widgets.attributeJoin.joinField") || "Join Layer Field"}
          </label>
          <select
            value={joinField}
            onChange={(e) => setJoinField(e.target.value)}
            className="p-2 border rounded text-sm bg-background text-foreground"
          >
            <option value="">{t("common.select") || "Select..."}</option>
            {joinFields.map((f) => (
              <option key={f.name} value={f.name}>
                {f.alias || f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          {t("widgets.attributeJoin.outputName") || "Output Layer Name (Optional)"}
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder={t("widgets.attributeJoin.outputNamePlaceholder") || "Attribute Join Result"}
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
          t("widgets.attributeJoin.run") || "Run Analysis"
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

export default AttributeJoin;
