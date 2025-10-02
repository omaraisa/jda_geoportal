import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls, NumberInput, UnitSelector, AnalysisService } from "../analysis-tools";
import { BufferService } from "./buffer-service";

const DISTANCE_UNITS = [
  { value: "meters", label: "Meters" },
  { value: "kilometers", label: "Kilometers" },
  { value: "feet", label: "Feet" },
  { value: "yards", label: "Yards" },
  { value: "miles", label: "Miles" }
];

const Buffer: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);

  const [inputLayerId, setInputLayerId] = useState<string>("");
  const [distances, setDistances] = useState<number[]>([100]);
  const [unit, setUnit] = useState<string>("meters");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Get the selected layer
  const inputLayer = view?.map.findLayerById(inputLayerId) as __esri.FeatureLayer;

  const handleAddDistance = () => {
    setDistances([...distances, 100]);
  };

  const handleRemoveDistance = (index: number) => {
    if (distances.length > 1) {
      setDistances(distances.filter((_, i) => i !== index));
    }
  };

  const handleDistanceChange = (index: number, value: number) => {
    const newDistances = [...distances];
    newDistances[index] = value;
    setDistances(newDistances);
  };

  const handleRun = async () => {
    if (!inputLayer) {
      setStatusType("error");
      setStatus(t("widgets.buffer.errors.noLayer") || "Please select an input layer");
      return;
    }

    if (distances.some(d => d <= 0)) {
      setStatusType("error");
      setStatus(t("widgets.buffer.errors.invalidDistance") || "All distances must be greater than 0");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.buffer.status.running") || "Creating buffers...");

    try {
      await BufferService.runBufferAnalysis(inputLayer, distances, unit);

      setStatusType("success");
      setStatus(t("widgets.buffer.status.success") || "Buffer analysis completed successfully");
      updateStats("Buffer Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Buffer analysis failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.buffer.title") || "Buffer Analysis"}
      </h2>

      <LayerSelector
        label={t("widgets.buffer.inputLayer") || "Input Layer"}
        value={inputLayerId}
        onChange={setInputLayerId}
        view={view}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("widgets.buffer.distances") || "Buffer Distances"}
        </label>
        {distances.map((distance, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                type="number"
                value={distance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleDistanceChange(index, val);
                  }
                }}
                min={0.1}
                step={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {distances.length > 1 && (
              <button
                onClick={() => handleRemoveDistance(index)}
                className="px-2 py-1 text-red-600 hover:text-red-800"
                title="Remove distance"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddDistance}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t("widgets.buffer.addDistance") || "Add Distance"}
        </button>
      </div>

      <UnitSelector
        label={t("widgets.buffer.unit") || "Distance Unit"}
        value={unit}
        onChange={setUnit}
        units={DISTANCE_UNITS}
      />

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
        isRunning={isRunning}
      />
    </div>
  );
};

export default Buffer;