import React, { useState, FormEvent } from "react";
import { submitJob } from "@arcgis/core/rest/geoprocessor";
import request from "@arcgis/core/request";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";

interface PrintFormData {
  title: string;
  format: 'pdf' | 'png8' | 'jpg';
  layout: string;
  includeLegend: boolean;
  includeScale: boolean;
  scalebarUnit: 'metric' | 'imperial';
}

const PrintComponent: React.FC = () => {
  const view = useStateStore((state) => state.targetView);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [resolution, setResolution] = useState(300);
  const [formData, setFormData] = useState<PrintFormData>({
    title: "My Map",
    format: "pdf",
    layout: "Standard",
    includeLegend: true,
    includeScale: true,
    scalebarUnit: "metric",
  });

  const JDALAYOUTS = ["Standard", "Presentation","MAP_ONLY"]
  const GP_URL = "https://gis.jda.gov.sa/agserver/rest/services/Printer/GPServer/Export%20Web%20Map";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResolution(parseInt(e.target.value, 10));
  };

  const pollJobStatus = async (jobId: string): Promise<void> => {
    const jobStatusUrl = `${GP_URL}/jobs/${jobId}?f=json`;
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await request(jobStatusUrl, {
          query: { f: "json" },
          responseType: "json"
        });

        const jobStatus = response.data.jobStatus;
        // const messages = response.data.messages;

        // if (messages && messages.length > 0) {
        //   messages.forEach((message: any) => {
        //     // console.log(`Job Message: ${message.type} - ${message.description}`);
        //     setProgress(`${message.type}: ${message.description}`);
        //   });
        // }

        // console.log(`Job Status: ${jobStatus}`);
        // setProgress(`Job Status: ${jobStatus}`);

        if (jobStatus === "esriJobSucceeded") {
          // console.log("Job succeeded!");
          return;
        } else if (jobStatus === "esriJobFailed") {
          console.error("Print job failed:", response.data.messages);
          setError(`Print job failed: ${response.data.messages ? response.data.messages.map((m: any) => m.description).join(', ') : 'Unknown error'}`);
          throw new Error(`Print job failed: ${response.data.messages ? response.data.messages.map((m: any) => m.description).join(', ') : 'Unknown error'}`);
        } else if (jobStatus === "esriJobCancelled") {
          setError("Print job was cancelled.");
          throw new Error("Print job was cancelled.");
        } else if (jobStatus === "esriJobWaiting" || jobStatus === "esriJobExecuting") {
          // console.log(`Job is ${jobStatus}...`);
          setProgress(t("widgets.print.processing"));
        }
      } catch (error: any) {
        console.error("Error polling job status:", error);
        setError(`Error polling job status: ${error.message}`);
        throw error;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setError("Print job timed out after waiting for too long.");
    throw new Error("Print job timed out after waiting for too long.");
  };


  const handlePrint = async (e: FormEvent) => {
    e.preventDefault();

    if (!view) {
      setError("No map view available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(t("widgets.print.preparing"));

    try {
      const basemapLayer = view.map.basemap.baseLayers.at(0);

      const operationalLayers = view.map.layers.map((layer: any) => {
        if (!layer.url || !layer.visible) {
          console.warn(`Layer ${layer.title} is not printable or has no URL.`);
          return null;
        }

        let layerType = "";

        if (layer.type === "feature") {
          layerType = "FeatureLayer";
        } else if (layer.type === "map-image") {
          layerType = "ArcGISMapServiceLayer";
        } else if (layer.type === "tile") {
          layerType = "ArcGISTiledMapServiceLayer";
        } else if (layer.type === "vector-tile") {
          layerType = "VectorTileLayer";
        } else if (layer.type === "csv") {
          layerType = "CSV";
        } else if (layer.type === "kml") {
          layerType = "KML";
        } else if (layer.type === "imagery") {
          layerType = "ArcGISImageServiceLayer";
        } else {
          console.warn(`Unsupported layer type: ${layer.type} for ${layer.title}`);
          return null;
        }

        return {
          id: layer.id,
          title: layer.title,
          opacity: layer.opacity,
          visible: layer.visible,
          url: layer.url,
          layerType,
        };
      }).toArray().filter(Boolean);



      const baseMap = view.map.basemap.toJSON();

      const extent = view.extent.toJSON();

      const webMapJSON = {
        mapOptions: {
          extent,
          ...(view.type === "2d" ? { rotation: -view.rotation } : {}),
        },
        operationalLayers: operationalLayers.map((layer: any) => ({
          id: layer.id,
          title: layer.title,
          opacity: layer.opacity,
          visible: layer.visible,
          url: layer.url,
          // Map custom types to Esri types for compatibility
          layerType:
        layer.layerType === "ArcGISMapServiceLayer" ||
        layer.layerType === "MapImageLayer"
          ? "MapImageLayer"
          : layer.layerType === "ArcGISTiledMapServiceLayer"
          ? "ArcGISTiledMapServiceLayer"
          : layer.layerType === "VectorTileLayer"
          ? "VectorTileLayer"
          : layer.layerType === "FeatureLayer"
          ? "FeatureLayer"
          : layer.layerType,
        })),
        baseMap,
        exportOptions: {
          dpi: resolution,
          outputSize: [view.width, view.height],
        },
        layoutOptions: {
          legendOptions: formData.includeLegend
        ? {
            operationalLayers: operationalLayers.map((layer: any) => ({
          id: layer.id,
            })),
          }
        : undefined,
          customTextElements: [
        { CustomTitle: formData.title }, //
        { CustomAuthor: "Omar Adam" },
          ],
        },
      };
      console.log("Web Map JSON:", JSON.stringify(webMapJSON));
      console.log("Map Scale:", view.scale);
      console.log("Map Center:", view.center);
      const params = {
        Web_Map_as_JSON: JSON.stringify(webMapJSON),
        Format: formData.format.toUpperCase(),
        Layout_Template: formData.layout,
        Title: formData.title,
        Extent: JSON.stringify(extent)
      };

      setProgress(t("widgets.print.submitting"));
      const jobInfo = await submitJob(GP_URL, params);
      // console.log("Job submitted with ID:", jobInfo.jobId);
      if (!jobInfo.jobId) {
        throw new Error("Failed to submit job");
      }

      setProgress(t("widgets.print.polling"));
      await pollJobStatus(jobInfo.jobId);

      setProgress(t("widgets.print.fetching"));
      const resultUrl = `${GP_URL}/jobs/${jobInfo.jobId}/results/Output_File?f=json`;
      const resultResponse = await request(resultUrl);
      const outputUrl = resultResponse.data.value.url;

      window.open(outputUrl, "_blank");
      setProgress(t("widgets.print.complete"));
    } catch (err) {
      console.error("Print error:", err);
      setError(err instanceof Error ? err.message : "Failed to print map");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="p-4 text-black w-full max-w-md">

      <form onSubmit={handlePrint}>
        <FormField label={t("widgets.print.title")}>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </FormField>

        <FormField label={t("widgets.print.Format")}>
          <select
            name="format"
            value={formData.format}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            {["pdf", "png8", "jpg"].map((fmt) => (
              <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
            ))}
          </select>
        </FormField>

        <FormField label={t("widgets.print.Layout")}>
          <select
            name="layout"
            value={formData.layout}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            {JDALAYOUTS.map((lay) => (
              <option key={lay} value={lay}>{lay}</option>
            ))}
          </select>
        </FormField>

        <FormField label={t("widgets.print.Resolution")}>
          <select
            name="resolution"
            defaultValue={300}
            className="w-full p-2 border rounded"
            onChange={handleResolutionChange}
          >
            <option value={300}>{t("widgets.print.Default")}</option>
            <option value={600}>{t("widgets.print.High")}</option>
          </select>
        </FormField>

        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            className="checkbox mr-2 rtl:ml-2 rtl:mr-0"
            id="legend_checkbox"
            checked={formData.includeLegend}
            onChange={handleCheckboxChange}
            name="includeLegend"
          />
          <label className="tick-label" htmlFor="legend_checkbox">
            <div id="tick_mark"></div>
          </label>
          <span className="ml-2 rtl:mr-2 rtl:ml-0">{t("widgets.print.IncludeLegend")}</span>
        </div>

        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            className="checkbox mr-2 rtl:ml-2 rtl:mr-0"
            id="scale_checkbox"
            checked={formData.includeScale}
            onChange={handleCheckboxChange}
            name="includeScale"
          />
          <label className="tick-label" htmlFor="scale_checkbox">
            <div id="tick_mark"></div>
          </label>
          <span className="ml-2 rtl:mr-2 rtl:ml-0">{t("widgets.print.IncludeScale")}</span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary flex-grow flex justify-stretch w-full"
        >
          {isLoading ? t("widgets.print.printing") : t("widgets.print.print")}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 mt-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {progress && (
        <div className="mb-4 p-3 mt-2 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {progress}
        </div>
      )}

    </div>
  );
};

const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="mb-3">
    <label className="block mb-1">{label}</label>
    {children}
  </div>
);

export default PrintComponent;
