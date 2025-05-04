"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import LayerSelector from "../ui/layer-selector";

const EXPORT_GP_URL = "https://gis.jda.gov.sa/agserver/rest/services/ExportData/GPServer/ExportData";

export default function ExportLayer() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);

  const [selectedLayer, setSelectedLayer] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectedLayer = (layerId: string) => {
    const layer = view?.map?.layers?.toArray().find((l: any) => l.id === layerId);
    setSelectedLayer(layer);
  };

  const handleExport = async () => {
    if (!selectedLayer) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.genericError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        duration: 8,
      });
      return;
    }

    setIsExporting(true);
    try {
      const params = {
        Layer: JSON.stringify({ url: selectedLayer.url }),
        Format: exportFormat,
        f: "json",
      };

      const response = await fetch(EXPORT_GP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      });

      const data = await response.json();
      if (!data.jobId) throw new Error("Failed to submit export job.");

      await pollJobStatus(data.jobId);

      const resultUrl = `${EXPORT_GP_URL}/jobs/${data.jobId}/results/Output?f=json`;
      const resultResponse = await fetch(resultUrl);
      const resultData = await resultResponse.json();

      if (resultData.value?.url) {
        window.open(resultData.value.url, "_blank");
        sendMessage({
          type: "info",
          title: t("widgets.exportLayer.success"),
          body: t("widgets.exportLayer.exportComplete"),
          duration: 6,
        });
      } else {
        throw new Error("Export failed. No output URL found.");
      }
    } catch (error) {
      console.error("Export error:", error);
      sendMessage({
        type: "error",
        title: t("systemMessages.error.genericError.title"),
        body: (error as Error).message,
        duration: 8,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const pollJobStatus = async (jobId: string, interval = 2000, maxTries = 30) => {
    const statusUrl = `${EXPORT_GP_URL}/jobs/${jobId}?f=json`;
    for (let i = 0; i < maxTries; i++) {
      const res = await fetch(statusUrl);
      const data = await res.json();
      if (data.jobStatus === "esriJobSucceeded") return;
      if (data.jobStatus === "esriJobFailed") throw new Error("Export job failed.");
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error("Export job timed out.");
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <LayerSelector getSelectedValue={handleSelectedLayer} />

      <label htmlFor="formatSelect" className="font-semibold text-foreground">
        {t("widgets.exportLayer.selectFormat")}
      </label>
      <select
        id="formatSelect"
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value)}
        className="input-select"
      >
        <option value="csv">{t("widgets.exportLayer.csv")}</option>
        <option value="shapefile">{t("widgets.exportLayer.shapefile")}</option>
        <option value="kml">{t("widgets.exportLayer.kml")}</option>
        <option value="geojson">{t("widgets.exportLayer.geojson")}</option>
      </select>

      <button
        className={`btn ${isExporting ? "btn-gray" : "btn-primary"} w-full`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting
          ? t("widgets.exportLayer.exporting")
          : t("widgets.exportLayer.export")}
      </button>
    </div>
  );
}
