import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls, NumberInput } from "../analysis-tools";
import { GeometryModifyService, GeometryOperation } from "./geometry-modify-service";
import OutputLayerList from "../analysis-tools/output-layer-list";

const GEOMETRY_OPERATIONS: Array<{ value: GeometryOperation; label: string; description: string }> = [
  {
    value: "offset",
    label: "Offset",
    description: "Creates a parallel geometry at a specified distance"
  },
  {
    value: "densify",
    label: "Densify",
    description: "Adds vertices to make segments shorter than a maximum length"
  },
  {
    value: "simplify",
    label: "Simplify",
    description: "Simplifies geometries by removing unnecessary vertices"
  }
];

const GeometryModify: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);
  const addAnalysisOutputLayer = useStateStore((state) => state.addAnalysisOutputLayer);
  const removeAnalysisOutputLayer = useStateStore((state) => state.removeAnalysisOutputLayer);
  const getAnalysisOutputLayers = useStateStore((state) => state.getAnalysisOutputLayers);

  const [inputLayerId, setInputLayerId] = useState<string>("");
  const [operation, setOperation] = useState<GeometryOperation>("offset");
  const [offsetDistance, setOffsetDistance] = useState<number>(10);
  const [maxSegmentLength, setMaxSegmentLength] = useState<number>(100);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const outputLayers = getAnalysisOutputLayers("geometry-modify");

  // Get the selected layer
  const inputLayer = view?.map.findLayerById(inputLayerId) as __esri.FeatureLayer | __esri.GraphicsLayer;

  const handleRun = async () => {
    if (!inputLayer) {
      setStatusType("error");
      setStatus(t("widgets.geometryModify.errors.noLayer") || "Please select an input layer");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.geometryModify.status.running") || `Performing ${operation} operation...`);

    try {
      const options = {
        distance: operation === "offset" ? offsetDistance : undefined,
        maxSegmentLength: operation === "densify" ? maxSegmentLength : undefined
      };

      const resultLayer = await GeometryModifyService.runGeometryModifyAnalysis(inputLayer, operation, options);

      addAnalysisOutputLayer("geometry-modify", resultLayer);

      setStatusType("success");
      setStatus(t("widgets.geometryModify.status.success") || `${operation} operation completed successfully`);
      updateStats("Geometry Modify Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || `${operation} operation failed`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleVisibility = (layer: __esri.Layer) => {
    layer.visible = !layer.visible;
    // Force re-render by updating stateStore
    useStateStore.setState({ forceUpdate: Date.now() });
  };

  const handleRename = (layer: __esri.Layer, newName: string) => {
    layer.title = newName;
    // Force re-render
    useStateStore.setState({ forceUpdate: Date.now() });
  };

  const handleDelete = (layer: __esri.Layer) => {
    if (view) {
        view.map.remove(layer);
    }
    removeAnalysisOutputLayer("geometry-modify", layer.id);
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.geometryModify.title") || "Geometry Modification"}
      </h2>

      <LayerSelector
        label={t("widgets.geometryModify.inputLayer") || "Input Layer"}
        value={inputLayerId}
        onChange={setInputLayerId}
        view={view}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("widgets.geometryModify.operation") || "Operation"}
        </label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as GeometryOperation)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {GEOMETRY_OPERATIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-600">
        {GEOMETRY_OPERATIONS.find(op => op.value === operation)?.description}
      </div>

      {operation === "offset" && (
        <NumberInput
          label={t("widgets.geometryModify.offsetDistance") || "Offset Distance (meters)"}
          value={offsetDistance}
          onChange={setOffsetDistance}
          min={-1000}
          max={1000}
          step={1}
        />
      )}

      {operation === "densify" && (
        <NumberInput
          label={t("widgets.geometryModify.maxSegmentLength") || "Maximum Segment Length (meters)"}
          value={maxSegmentLength}
          onChange={setMaxSegmentLength}
          min={1}
          max={10000}
          step={10}
        />
      )}

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
        isRunning={isRunning}
      />

      {outputLayers.length > 0 && (
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

export default GeometryModify;