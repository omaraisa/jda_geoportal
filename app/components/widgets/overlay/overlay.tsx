import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls } from "../analysis-tools";
import { OverlayService, OverlayOperation } from "./overlay-service";

const OVERLAY_OPERATIONS: Array<{ value: OverlayOperation; label: string }> = [
  { value: "union", label: "Union" },
  { value: "intersect", label: "Intersect" },
  { value: "difference", label: "Difference" }
];

const Overlay: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);

  const [layer1Id, setLayer1Id] = useState<string>("");
  const [layer2Id, setLayer2Id] = useState<string>("");
  const [operation, setOperation] = useState<OverlayOperation>("union");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Get the selected layers
  const layer1 = view?.map.findLayerById(layer1Id) as __esri.FeatureLayer | __esri.GraphicsLayer;
  const layer2 = view?.map.findLayerById(layer2Id) as __esri.FeatureLayer | __esri.GraphicsLayer;

  const handleRun = async () => {
    if (!layer1 || !layer2) {
      setStatusType("error");
      setStatus(t("widgets.overlay.errors.noLayers") || "Please select both input layers");
      return;
    }

    if (layer1Id === layer2Id) {
      setStatusType("error");
      setStatus(t("widgets.overlay.errors.sameLayer") || "Please select different layers");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.overlay.status.running") || `Performing ${operation} analysis...`);

    try {
      await OverlayService.runOverlayAnalysis(layer1, layer2, operation);

      setStatusType("success");
      setStatus(t("widgets.overlay.status.success") || `${operation} analysis completed successfully`);
      updateStats("Overlay Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || `${operation} analysis failed`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.overlay.title") || "Overlay Analysis"}
      </h2>

      <LayerSelector
        label={t("widgets.overlay.layer1") || "Input Layer 1"}
        value={layer1Id}
        onChange={setLayer1Id}
        view={view}
      />

      <LayerSelector
        label={t("widgets.overlay.layer2") || "Input Layer 2"}
        value={layer2Id}
        onChange={setLayer2Id}
        view={view}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("widgets.overlay.operation") || "Overlay Operation"}
        </label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as OverlayOperation)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {OVERLAY_OPERATIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-600">
        {operation === "union" && (
          <p>{t("widgets.overlay.descriptions.union") || "Combines all geometries from both layers into a single geometry."}</p>
        )}
        {operation === "intersect" && (
          <p>{t("widgets.overlay.descriptions.intersect") || "Creates geometries where features from both layers overlap."}</p>
        )}
        {operation === "difference" && (
          <p>{t("widgets.overlay.descriptions.difference") || "Removes overlapping areas of Layer 2 from Layer 1."}</p>
        )}
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

export default Overlay;