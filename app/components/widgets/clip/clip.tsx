import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls } from "../analysis-tools";
import { ClipService, ClipOperation } from "./clip-service";

// Operation is fixed to 'clip' by default

const Clip: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);

  const [inputLayerId, setInputLayerId] = useState<string>("");
  const [clipLayerId, setClipLayerId] = useState<string>("");
  const operation: ClipOperation = "clip";
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Get the selected layers
  const inputLayer = view?.map.findLayerById(inputLayerId) as __esri.FeatureLayer | __esri.GraphicsLayer;
  const clipLayer = view?.map.findLayerById(clipLayerId) as __esri.FeatureLayer | __esri.GraphicsLayer;

  const handleRun = async () => {
    if (!inputLayer || !clipLayer) {
      setStatusType("error");
      setStatus(t("widgets.clip.errors.noLayers") || "Please select both input and clip layers");
      return;
    }

    if (inputLayerId === clipLayerId) {
      setStatusType("error");
      setStatus(t("widgets.clip.errors.sameLayer") || "Please select different layers");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.clip.status.running") || `Performing ${operation} analysis...`);

    try {
      await ClipService.runClipAnalysis(inputLayer, clipLayer, operation);

      setStatusType("success");
      setStatus(t("widgets.clip.status.success") || `${operation} analysis completed successfully`);
      updateStats("Clip Analysis");
    } catch (error: any) {
      const err = error as any;
      setStatusType("error");
      setStatus(t(err.key) || err.message || `${operation} analysis failed`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.clip.title") || "Clip & Cut Analysis"}
      </h2>

      <LayerSelector
        label={t("widgets.clip.inputLayer") || "Input Layer"}
        value={inputLayerId}
        onChange={setInputLayerId}
        view={view}
      />

      <LayerSelector
        label={t("widgets.clip.clipLayer") || "Clip/Cut Layer"}
        value={clipLayerId}
        onChange={setClipLayerId}
        view={view}
      />

      {/* Operation selector removed; defaulting to 'clip' */}

      <div className="text-sm text-gray-600">
        <p>{t("widgets.clip.descriptions.clip") || "Extracts portions of the input layer that overlap with the clip layer."}</p>
      </div>

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
        isRunning={isRunning}
      />
    </div>
  );
};

export default Clip;