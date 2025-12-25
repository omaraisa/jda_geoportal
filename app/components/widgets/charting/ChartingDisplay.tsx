import React from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

export const ChartingDisplay: React.FC = () => {
  const { t } = useTranslation();
  const chartingState = useStateStore((state) => state.chartingState);
  const setChartingState = useStateStore((state) => state.setChartingState);
  const { chartData, chartType, title, valueFields, operation } = chartingState;

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-medium">{t("widgets.charting.noData")}</p>
        <p className="text-sm">{t("widgets.charting.configureMessage")}</p>
      </div>
    );
  }

  const chartTypes: { id: "bar" | "pie" | "line" | "area"; label: string; icon: string }[] = [
    { id: "bar", label: "Bar", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "pie", label: "Pie", icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" },
    { id: "line", label: "Line", icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" },
    { id: "area", label: "Area", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }
  ];

  const renderChart = () => {
    const isCount = operation === "count";
    const keys = isCount ? ["count"] : (valueFields || []);

    switch (chartType) {
      case "pie":
        // For Pie, we only visualize the first metric or count
        const dataKey = isCount ? "count" : (valueFields?.[0] || "value");
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey="category"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            {keys.map((key, index) => (
                <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={COLORS[index % COLORS.length]} 
                    activeDot={{ r: 8 }} 
                />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            {keys.map((key, index) => (
                <Area 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={COLORS[index % COLORS.length]} 
                    fill={COLORS[index % COLORS.length]} 
                    fillOpacity={0.3}
                />
            ))}
          </AreaChart>
        );
      case "bar":
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            {keys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 bg-white overflow-hidden">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500">Total Categories: {chartData.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg border">
            {chartTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setChartingState({ chartType: type.id })}
                className={`p-2 rounded-md transition-all ${
                  chartType === type.id
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title={type.label}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={type.icon} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 flex gap-4">
        <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        <div className="w-80 flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-sm text-gray-700">
            {t("widgets.charting.dataSummary")}
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("widgets.charting.categories")}</th>
                  {operation === "count" ? (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t("widgets.charting.count")}</th>
                  ) : (
                      valueFields?.map(field => (
                          <th key={field} className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{field}</th>
                      ))
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((item, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 truncate max-w-[150px]" title={String(item.category)}>
                      {item.category}
                    </td>
                    {operation === "count" ? (
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                            {Number(item.count).toLocaleString()}
                        </td>
                    ) : (
                        valueFields?.map(field => (
                            <td key={field} className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                                {Number(item[field]).toLocaleString()}
                            </td>
                        ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500 flex justify-between">
            <span>{t("widgets.charting.totalItems")}:</span>
            <span className="font-bold">{chartData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
