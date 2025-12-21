import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import { ChartingService, ChartData } from "./charting-service";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

const OPERATIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" }
];

const Charting: React.FC = () => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);

  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [fields, setFields] = useState<__esri.Field[]>([]);
  const [categoryField, setCategoryField] = useState<string>("");
  const [valueField, setValueField] = useState<string>("");
  const [operation, setOperation] = useState<"count" | "sum" | "avg" | "min" | "max">("count");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const selectedLayer = view?.map.findLayerById(selectedLayerId) as FeatureLayer;

  useEffect(() => {
    if (selectedLayer && selectedLayer.type === "feature") {
      selectedLayer.load().then(() => {
        setFields(selectedLayer.fields);
        // Reset selections
        setCategoryField("");
        setValueField("");
      });
    } else {
      setFields([]);
    }
  }, [selectedLayer]);

  const handleGenerateChart = async () => {
    if (!selectedLayer || !categoryField) {
      setError("Please select a layer and a category field.");
      return;
    }

    if (operation !== "count" && !valueField) {
      setError("Value field is required for this operation.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await ChartingService.getCategoryStatistics(
        selectedLayer,
        categoryField,
        operation === "count" ? null : valueField,
        operation
      );
      setChartData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate chart data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-sm h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800">Statistics & Charting</h2>
      
      <LayerSelector
        label="Select Layer"
        value={selectedLayerId}
        onChange={setSelectedLayerId}
        view={view}
      />

      {fields.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Field (X-Axis)</label>
            <select
              value={categoryField}
              onChange={(e) => setCategoryField(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Field</option>
              {fields.map((f) => (
                <option key={f.name} value={f.name}>{f.alias || f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
            <div className="flex flex-wrap gap-2">
              {OPERATIONS.map((op) => (
                <button
                  key={op.value}
                  onClick={() => setOperation(op.value as any)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    operation === op.value
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {operation !== "count" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value Field (Y-Axis)</label>
              <select
                value={valueField}
                onChange={(e) => setValueField(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Numeric Field</option>
                {fields
                  .filter((f) => ["small-integer", "integer", "single", "double", "long"].includes(f.type))
                  .map((f) => (
                    <option key={f.name} value={f.name}>{f.alias || f.name}</option>
                  ))}
              </select>
            </div>
          )}

          <button
            onClick={handleGenerateChart}
            disabled={isLoading || !categoryField || (operation !== "count" && !valueField)}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
              isLoading || !categoryField || (operation !== "count" && !valueField)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Calculating..." : "Generate Statistics"}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">Results</h3>
          <div className="overflow-x-auto max-h-60">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Placeholder for Chart Visualization */}
          <div className="mt-4 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-gray-500 text-sm">
            Chart visualization will be implemented here using a charting library.
          </div>

          <div className="mt-2 flex justify-end">
             <button 
               onClick={() => {
                 if (chartData.length === 0) return;
                 const csvContent = "data:text/csv;charset=utf-8," 
                   + "Category,Value\n"
                   + chartData.map(e => `"${e.category}",${e.value}`).join("\n");
                 const encodedUri = encodeURI(csvContent);
                 const link = document.createElement("a");
                 link.setAttribute("href", encodedUri);
                 link.setAttribute("download", "chart_data.csv");
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
               }} 
               className="text-blue-600 hover:underline text-sm font-medium"
             >
               Export CSV
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charting;
