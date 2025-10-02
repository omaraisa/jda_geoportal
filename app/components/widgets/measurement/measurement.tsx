import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls } from "../analysis-tools";
import { MeasurementService, MeasurementType, MeasurementUnit, MeasurementResult } from "./measurement-service";

const MEASUREMENT_TYPES: Array<{ value: MeasurementType; label: string }> = [
  { value: "area", label: "Area" },
  { value: "length", label: "Length" },
  { value: "distance", label: "Distance" }
];

const MEASUREMENT_UNITS: Array<{ value: MeasurementUnit; label: string }> = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" }
];

const Measurement: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);

  const [inputLayerId, setInputLayerId] = useState<string>("");
  const [measurementType, setMeasurementType] = useState<MeasurementType>("area");
  const [unit, setUnit] = useState<MeasurementUnit>("metric");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<MeasurementResult[]>([]);

  // Get the selected layer
  const inputLayer = view?.map.findLayerById(inputLayerId) as __esri.FeatureLayer;

  const handleRun = async () => {
    if (!inputLayer) {
      setStatusType("error");
      setStatus(t("widgets.measurement.errors.noLayer") || "Please select an input layer");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.measurement.status.running") || "Calculating measurements...");

    try {
      const measurementResults = await MeasurementService.runMeasurementAnalysis(
        inputLayer,
        measurementType,
        unit
      );

      setResults(measurementResults);
      setStatusType("success");
      setStatus(t("widgets.measurement.status.success") || "Measurement calculation completed successfully");
      updateStats("Measurement Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || "Measurement calculation failed");
      setResults([]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.measurement.title") || "Measurement Analysis"}
      </h2>

      <LayerSelector
        label={t("widgets.measurement.inputLayer") || "Input Layer"}
        value={inputLayerId}
        onChange={setInputLayerId}
        view={view}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("widgets.measurement.type") || "Measurement Type"}
        </label>
        <select
          value={measurementType}
          onChange={(e) => setMeasurementType(e.target.value as MeasurementType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MEASUREMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("widgets.measurement.unit") || "Unit System"}
        </label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MEASUREMENT_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
        isRunning={isRunning}
      />

      {results.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold text-md mb-2">
            {t("widgets.measurement.results") || "Results"}
          </h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="font-medium capitalize">{result.type}:</span>
                <span className="text-blue-600 font-mono">
                  {MeasurementService.formatResult(result)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Measurement;