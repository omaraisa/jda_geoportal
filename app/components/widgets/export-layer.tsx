"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import LayerSelector from "../ui/layer-selector";

const EXPORT_GP_URL = "https://gis.jda.gov.sa/agserver/rest/services/ExportLayer/GPServer/Export%20Layer";

export default function ExportLayer() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const updateStats = useStateStore((state) => state.updateStats);
  const [selectedLayer, setSelectedLayer] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [outputName, setOutputName] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const stopRequestedRef = useRef(false);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "warning" | "">("");

  useEffect(() => {
    stopRequestedRef.current = stopRequested;
  }, [stopRequested]);

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
    setStopRequested(false);
    stopRequestedRef.current = false;
    setStatusType("info");
    setStatus(t("widgets.exportLayer.status.submitting") || "Submitting export job...");
    try {
      let layerInput = "";
      let inputType = "geojson";
      let outputType = exportFormat;

      // Handle FeatureLayer
      if (selectedLayer.type === "feature" && selectedLayer.layerId !== undefined) {
        layerInput =
          `${selectedLayer.url.replace(/\/+$/, "")}/${selectedLayer.layerId}/query` +
          `?where=1%3D1&outFields=*&f=geojson`;
        inputType = "geojson";
      }
      // Handle GeoJSONLayer (esri GeoJSONLayer)
      else if (selectedLayer.type === "geojson") {
        // Use the direct URL of the GeoJSONLayer as the input
        layerInput = selectedLayer.url;
        inputType = "geojson";
      }
      // Handle CSVLayer (esri CSVLayer)
      else if (selectedLayer.type === "csv") {
        // Query all features from the CSVLayer already on the map and convert to GeoJSON
        if (selectedLayer.createQuery && selectedLayer.queryFeatures) {
          // Use the layer's built-in query to get all features
          const query = selectedLayer.createQuery();
          query.where = "1=1";
          query.outFields = ["*"];
          query.returnGeometry = true;
          const featureSet = await selectedLayer.queryFeatures(query);
          // Convert to GeoJSON
          const geojson = featureSetToGeoJSON(featureSet);
          layerInput = JSON.stringify(geojson);
          inputType = "geojson";
        } else {
          // fallback: direct URL
          layerInput = selectedLayer.url;
          inputType = "geojson";
        }
      }
      // Handle MapImageLayer (Image Layer)
      else if (selectedLayer.type === "map-image") {
        // Case 1: Whole map service layer (has .layers property)
        if (Array.isArray(selectedLayer.layers) && selectedLayer.layers.length > 0) {
          const sublayerIds = selectedLayer.layers.map((l: any) => l.id);
          const subId = sublayerIds[0];
          layerInput =
            `${selectedLayer.url.replace(/\/+$/, "")}/${subId}/query` +
            `?where=1%3D1&outFields=*&f=geojson`;
          inputType = "geojson";
        }
        // Case 2: Only a sublayer (has .sublayers property with one item)
        else if (
          Array.isArray(selectedLayer.sublayers.toArray()) &&
          selectedLayer.sublayers.toArray()[0].id !== undefined
        ) {
          const subId = selectedLayer.sublayers.toArray()[0].id;
          layerInput =
            `${selectedLayer.url.replace(/\/+$/, "")}/${subId}/query` +
            `?where=1%3D1&outFields=*&f=geojson`;
          inputType = "geojson";
        }
        // Fallback: If .layerId exists, use it as sublayer
        else if (
          selectedLayer.layerId !== undefined &&
          /\/MapServer\/?$/i.test(selectedLayer.url) &&
          Number.isInteger(Number(selectedLayer.layerId)) &&
          Number(selectedLayer.layerId) >= 0
        ) {
          layerInput =
            `${selectedLayer.url.replace(/\/+$/, "")}/${selectedLayer.layerId}/query` +
            `?where=1%3D1&outFields=*&f=geojson`;
          inputType = "geojson";
        } else {
          // Final fallback: use the base URL as is
          layerInput = selectedLayer.url;
        }
      }
      // Handle KML or other types
      else {
        layerInput = selectedLayer.url;
        if (selectedLayer.url && selectedLayer.url.toLowerCase().endsWith(".kml")) {
          inputType = "kml";
        }
      }

      // Align outputType with GPService
      if (outputType === "shapefile") outputType = "zip";
      if (outputType === "geojson") outputType = "geojson";
      if (outputType === "csv") outputType = "csv";
      if (outputType === "kml") outputType = "kml";

      // Use outputName or fallback to a default
      let outputNameParam =
        outputName?.trim()
          ? outputName.trim()
          : (selectedLayer.title || selectedLayer.name || "ExportedLayer");

      // Replace only non-ESRI supported characters (keep Unicode letters, numbers, and underscores)
      // ESRI feature class names: must start with a letter, only letters, numbers, and underscores, no spaces, max 160 chars
      // We'll replace anything except Unicode letters, numbers, and underscores with "_"
      outputNameParam = outputNameParam.replace(/[^\p{L}\p{N}_]/gu, "_");
      // Remove leading non-letter characters (ESRI requires starting with a letter)
      outputNameParam = outputNameParam.replace(/^[^A-Za-z\u0600-\u06FF]+/u, "");
      // Truncate to 160 chars
      outputNameParam = outputNameParam.slice(0, 160);

      const params: Record<string, any> = {
        layer_input: layerInput,
        input_type: inputType,
        output_type: outputType,
        output_name: outputNameParam,
        f: "json",
      };


      // Get token from cookies
      const cookies = Object.fromEntries(document.cookie.split("; ").map(c => c.split("=")));
      const token = cookies["arcgis_token"];

      // Always append token as a query param, never in POST body
      const submitUrl = EXPORT_GP_URL + "/submitJob" + (token ? `?token=${token}` : "");
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      });

      const data = await response.json();
      if (!data.jobId) {
        // Show error details from the response if available
        let errorMsg = "Failed to submit export job.";
        if (data.error?.message) errorMsg += " " + data.error.message;
        if (data.error?.details && Array.isArray(data.error.details)) {
          errorMsg += " " + data.error.details.join(" ");
        }
        errorMsg += " " + JSON.stringify(data);
        // Only log details, do not show in status
        console.error(errorMsg);
        setStatusType("error");
        setStatus(t("widgets.exportLayer.status.failed") || "Export failed.");
        throw new Error(errorMsg);
      }

      setStatusType("info");
      setStatus(t("widgets.exportLayer.status.polling") || "Waiting for export job...");
      const jobStatus = await pollJobStatus(data.jobId);

      if (jobStatus.jobStatus === "esriJobFailed") {
        let errorMsg = "Export job failed.";
        if (Array.isArray(jobStatus.messages)) {
          const errorMsgs = jobStatus.messages
            .filter((m: any) => m.type === "esriJobMessageTypeError")
            .map((m: any) => m.description)
            .join(" ");
          if (errorMsgs) errorMsg += " " + errorMsgs;
        }
        // Only log details, do not show in status
        console.error(errorMsg);
        setStatusType("error");
        setStatus(t("widgets.exportLayer.status.failed") || "Export failed.");
        throw new Error(errorMsg);
      }

      setStatusType("info");
      setStatus(t("widgets.exportLayer.status.fetching") || "Fetching export result...");
      // Inside handleExport, after pollJobStatus:
      let resultUrl = `${EXPORT_GP_URL}/jobs/${data.jobId}/results/output_file?f=json${token ? `&token=${token}` : ""}`;
      let resultResponse = await fetch(resultUrl);
      if (!resultResponse.ok) {
        console.error("Error fetching export result:", resultResponse.status, resultResponse.statusText);
        throw new Error(`HTTP error! status: ${resultResponse.status}`);
      }
      let resultData = await resultResponse.json();

      // If value is null, wait and retry a few times (the file may not be ready yet)
      let tries = 0;
      while (resultData.value == null && tries < 50) {
        // Use ref to check latest value
        if (stopRequestedRef.current) {
          setStatusType("warning");
          setStatus(t("widgets.exportLayer.status.stopped") || "Export stopped by user.");
          sendMessage({
            type: "warning",
            title: t("widgets.exportLayer.stopped") || "Export stopped",
            body: t("widgets.exportLayer.stoppedBody") || "Export was stopped by user.",
            duration: 6,
          });
          throw new Error("Export stopped by user.");
        }
        // If error is present and job failed, break and show error
        if (resultData.error) {
          setStatusType("error");
          setStatus(t("widgets.exportLayer.status.failed") || "Export failed.");
          console.error("Export job failed:", resultData.error);
          throw new Error(
            `Export failed. ${resultData.error.message || ""} ${resultData.error.details?.join(" ") || ""}`
          );
        }
        setStatusType("info");
        setStatus(
          (t("widgets.exportLayer.status.waiting") || "Waiting for export file...") +
            ` (${tries + 1}/50)`
        );
        await new Promise(res => setTimeout(res, 1500));
        resultResponse = await fetch(resultUrl);
         if (!resultResponse.ok) {
          console.error("Error fetching export result (retry):", resultResponse.status, resultResponse.statusText);
          throw new Error(`HTTP error! status: ${resultResponse.status}`);
        }
        resultData = await resultResponse.json();
        tries++;
      }

      if (resultData.value?.url) {
        setStatusType("success");
        setStatus(t("widgets.exportLayer.status.success") || "Export complete.");
        window.open(resultData.value.url, "_blank");
        sendMessage({
          type: "info",
          title: t("widgets.exportLayer.success"),
          body: t("widgets.exportLayer.exportComplete"),
          duration: 6,
        });
      } else {
        setStatusType("error");
        setStatus(t("widgets.exportLayer.status.failed") || "Export failed. No output URL found.");
        throw new Error("Export failed. No output URL found.");
      }
    } catch (error) {
      setStatusType("error");
      setStatus(t("widgets.exportLayer.status.failed") || "Export failed.");
      console.error("Export error:", error);
      sendMessage({
        type: "error",
        title: t("systemMessages.error.genericError.title"),
        body: t("systemMessages.error.genericError.body"),
        duration: 8,
      });
    } finally {
      setIsExporting(false);
      setStopRequested(false);
      stopRequestedRef.current = false;
    }
  };

  // Enhanced pollJobStatus: throw on failure, return job status object
  const pollJobStatus = async (jobId: string, interval = 2000, maxTries = 30) => {
    const cookies = Object.fromEntries(document.cookie.split("; ").map(c => c.split("=")));
    const token = cookies["arcgis_token"];
    const statusUrl = `${EXPORT_GP_URL}/jobs/${jobId}?f=json${token ? `&token=${token}` : ""}`;

    for (let i = 0; i < maxTries; i++) {
      const res = await fetch(statusUrl);
      const data = await res.json();
      if (data.jobStatus === "esriJobSucceeded") return data;
      if (data.jobStatus === "esriJobFailed") return data;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error("Export job timed out.");
  };

  // Helper function to convert esri FeatureSet to GeoJSON
  function featureSetToGeoJSON(featureSet: any) {
    const geojson: any = {
      type: "FeatureCollection",
      features: []
    };
    if (!featureSet || !featureSet.features) return geojson;
    for (const f of featureSet.features) {
      const geom = f.geometry && f.geometry.type === "point"
        ? {
            type: "Point",
            coordinates: [f.geometry.x, f.geometry.y]
          }
        : null; // Only handle points for CSVLayer
      geojson.features.push({
        type: "Feature",
        geometry: geom,
        properties: f.attributes
      });
    }
    updateStats("Export Layer");
    return geojson;
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      <LayerSelector getSelectedValue={handleSelectedLayer} />

      <label htmlFor="layerTitle" className="font-semibold text-foreground">
        {t("widgets.exportLayer.enterTitle")}
        <span className="text-xs text-muted ml-2 mr-2">
          ({t("widgets.exportLayer.optional")})
        </span>
      </label>
      <label htmlFor="layerTitle" className="textInput">
        <input
          id="layerTitle"
          type="text"
          className="input-text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder=" "
        />
        <span className="label">{t("widgets.exportLayer.titlePlaceholder")}</span>
      </label>

        <div className="flex flex-col w-full">
          <label htmlFor="formatSelect" className="font-semibold text-foreground">
            {t("widgets.exportLayer.selectFormat")}
          </label>
          <div className="select">
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
          </div>
        </div>

        <div className="flex space-x-2">
        <button
          className={`btn ${isExporting ? "btn-gray" : "btn-primary"} w-full`}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting
            ? t("widgets.exportLayer.exporting")
            : t("widgets.exportLayer.export")}
        </button>
        {/* {isExporting && (
          <button
            className="btn btn-danger w-full"
            onClick={() => setStopRequested(true)}
            type="button"
          ></button>
            {t("widgets.exportLayer.stop") || "Stop"}
          </button>
        )} */}
      </div>
            {status && (
        <div className={`mb-4 p-3 mt-2 ${
            statusType === "success"
              ? "bg-[rgba(122,181,122,0.3)] border-green-400 text-[rgb(67, 90, 67)]"
              : statusType === "error"  
              ? "bg-red-100 border-red-400 text-red-700"
              : statusType === "warning"
              ? "bg-yellow-100 border-yellow-400 text-yellow-700"
              : "bg-blue-100 border-blue-400 text-blue-700"
          } border rounded`}>
          {status}
        </div>
      )}
    </div>
  );
}
