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
  const userInfo = useStateStore((state) => state.userInfo)
  const updateStats = useStateStore((state) => state.updateStats);
  const [formData, setFormData] = useState<PrintFormData>({
    title: "My Map",
    format: "pdf",
    layout: "Standard",
    includeLegend: true,
    includeScale: true,
    scalebarUnit: "metric",
  });

  const JDALAYOUTS = ["Standard", "Presentation", "MAP_ONLY"]
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
      // Retrieve the basemap layer (if needed for further processing)
      const basemapLayer = view.map.basemap.baseLayers.at(0);

      // Gather all layers from the map
      const allLayers = view.map.layers.toArray();

      // Group MapImageLayers (MapServices) by their base URL
      const mapServiceGroups = new Map<string, any>();

      allLayers.forEach(layer => {
        if (!layer.visible) return;

        if (layer.type === "map-image" && "url" in layer && layer.url) {
          const baseUrl = (layer as any).url.split('?')[0];

          if (!mapServiceGroups.has(baseUrl)) {
            mapServiceGroups.set(baseUrl, {
              id: layer.id.split('_')[0] || layer.id,
              title: layer.title,
              opacity: layer.opacity,
              visible: true,
              url: baseUrl,
              layerType: "MapImageLayer",
              visibleLayers: []
            });
          }

          if ((layer as any).sublayers && (layer as any).sublayers.length > 0) {
            (layer as any).sublayers.forEach((sublayer: { id: number; visible: boolean }) => {
              if (sublayer.visible) {
                const group = mapServiceGroups.get(baseUrl);
                if (!group.visibleLayers.includes(sublayer.id)) {
                  group.visibleLayers.push(sublayer.id);
                }
              }
            });
          }

          return;
        }
      });

      // Process other supported layer types
      const otherLayers = allLayers.map(layer => {
        if (
          layer.type === "map-image" &&
          "url" in layer &&
          layer.url &&
          mapServiceGroups.has((layer as any).url.split('?')[0])
        ) {
          return null;
        }

        if (!('url' in layer) || !layer.url || !layer.visible) {
          return null;
        }

        let layerType = "";
        switch (layer.type) {
          case "feature":
            layerType = "FeatureLayer";
            break;
          case "map-image":
            layerType = "ArcGISMapServiceLayer";
            break;
          case "tile":
            layerType = "ArcGISTiledMapServiceLayer";
            break;
          case "vector-tile":
            layerType = "VectorTileLayer";
            break;
          case "csv":
            layerType = "CSV";
            break;
          case "kml":
            layerType = "KML";
            break;
          case "imagery":
            layerType = "ArcGISImageServiceLayer";
            break;
          default:
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
      }).filter(Boolean);

      // Combine MapService groups and other layers into operationalLayers
      const operationalLayers = [
        ...Array.from(mapServiceGroups.values()),
        ...otherLayers
      ];

      // console.log("Operational Layers:", operationalLayers);

      const baseMap = view.map.basemap.toJSON();
      const extent = view.extent.toJSON();

      // Construct the web map JSON for the print service
      const webMapJSON = {
        mapOptions: {
          extent,
          ...(view.type === "2d" ? { rotation: -view.rotation } : {}),
        },
        operationalLayers: operationalLayers
          .filter((layer: any) => layer.title !== "Extent")
          .map((layer: any) => ({
        id: layer.id,
        title: layer.title,
        opacity: layer.opacity,
        visible: layer.visible,
        url: layer.url,
        ...(layer.visibleLayers ? { visibleLayers: layer.visibleLayers } : {}),
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
          operationalLayers: operationalLayers
            .filter((layer: any) => layer.title !== "Extent")
            .map((layer: any) => ({
          id: layer.id,
            })),
        }
        : undefined,
          customTextElements: [
        { CustomTitle: formData.title },
        { CustomAuthor: userInfo?.fullName || "" },
          ],
        },
      };


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
      updateStats("Print Map");
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
          {t("widgets.print.nonSupportedLayerError")}
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
