import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import { ChartingService } from "./charting-service";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import CheckboxField from "../../ui/checkbox-field";

const OPERATIONS = [
  { value: "count", label: "count" },
  { value: "sum", label: "sum" },
  { value: "avg", label: "average" },
  { value: "min", label: "minimum" },
  { value: "max", label: "maximum" }
];

const CHART_TYPES = [
  { value: "bar", label: "bar", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { value: "pie", label: "pie", icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" },
  { value: "line", label: "line", icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" },
  { value: "area", label: "area", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }
];

export const ChartingConfig: React.FC = () => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const chartingState = useStateStore((state) => state.chartingState);
  const setChartingState = useStateStore((state) => state.setChartingState);
  const setActiveBottomPane = useStateStore((state) => state.setActiveBottomPane);
  const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);

  const [fields, setFields] = useState<__esri.Field[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const selectedLayer = view?.map.findLayerById(chartingState.selectedLayerId) as FeatureLayer;

  useEffect(() => {
    if (selectedLayer && selectedLayer.type === "feature") {
      selectedLayer.load().then(() => {
        setFields(selectedLayer.fields);
      });
    } else {
      setFields([]);
    }
  }, [selectedLayer]);

  const handleGenerateChart = async () => {
    if (!selectedLayer || !chartingState.categoryField) {
      setError(t("widgets.charting.errorSelectLayer"));
      return;
    }

    if (chartingState.operation !== "count" && (!chartingState.valueFields || chartingState.valueFields.length === 0)) {
      setError(t("widgets.charting.errorValueField"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await ChartingService.getCategoryStatistics(
        selectedLayer,
        chartingState.categoryField,
        chartingState.operation === "count" ? null : chartingState.valueFields,
        chartingState.operation
      );
      
      setChartingState({ 
        chartData: data,
        title: `${chartingState.operation.toUpperCase()} of ${chartingState.valueFields?.join(", ") || chartingState.categoryField} by ${chartingState.categoryField}`
      });
      
      // Open bottom pane with results
      setActiveBottomPane("ChartingComponent");
      toggleBottomPane(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate chart data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <LayerSelector
          label={t("widgets.charting.targetLayer")}
          value={chartingState.selectedLayerId}
          onChange={(id) => setChartingState({ selectedLayerId: id })}
          view={view}
        />

        {fields.length > 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("widgets.charting.categoryField")}</label>
              <select
                value={chartingState.categoryField}
                onChange={(e) => setChartingState({ categoryField: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">{t("widgets.charting.selectField")}</option>
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>{f.alias || f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("widgets.charting.operation")}</label>
              <div className="grid grid-cols-3 gap-2">
                {OPERATIONS.map((op) => (
                  <button
                    key={op.value}
                    onClick={() => setChartingState({ operation: op.value })}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      chartingState.operation === op.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {t(`widgets.charting.${op.label}`)}
                  </button>
                ))}
              </div>
            </div>

            {chartingState.operation !== "count" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("widgets.charting.valueFields")}</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {fields
                    .filter((f) => ["small-integer", "integer", "single", "double", "long"].includes(f.type))
                    .map((f) => (
                      <CheckboxField
                        key={f.name}
                        id={`field-${f.name}`}
                        label={f.alias || f.name}
                        checked={chartingState.valueFields?.includes(f.name) || false}
                        onChange={(checked) => {
                          const currentFields = chartingState.valueFields || [];
                          let newFields;
                          if (checked) {
                            newFields = [...currentFields, f.name];
                          } else {
                            newFields = currentFields.filter(field => field !== f.name);
                          }
                          setChartingState({ valueFields: newFields });
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("widgets.charting.chartType")}</label>
              <div className="grid grid-cols-2 gap-3">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setChartingState({ chartType: type.value })}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      chartingState.chartType === type.value
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${chartingState.chartType === type.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                       {/* Simple SVG icons for chart types */}
                       {type.value === 'bar' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>}
                       {type.value === 'pie' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>}
                       {type.value === 'line' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>}
                       {type.value === 'area' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">{t(`widgets.charting.${type.label}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateChart}
              disabled={isLoading || !chartingState.categoryField || (chartingState.operation !== "count" && (!chartingState.valueFields || chartingState.valueFields.length === 0))}
              className={`w-full py-4 px-4 rounded-xl text-white font-black uppercase tracking-widest shadow-lg transition-all ${
                isLoading || !chartingState.categoryField || (chartingState.operation !== "count" && (!chartingState.valueFields || chartingState.valueFields.length === 0))
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:transform active:scale-95"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("widgets.charting.processing")}
                </span>
              ) : t("widgets.charting.visualizeData")}
            </button>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
