import { submitJob } from "@arcgis/core/rest/geoprocessor";
import request from "@arcgis/core/request";
import { WebMapJSON, PrintJobParams, LayerGroup } from './types';
import { POLLING_CONFIG } from './constants';

export const pollJobStatus = async (
  jobId: string, 
  GP_URL: string,
  onProgress: (message: string) => void,
  onError: (error: string) => void,
  t: (key: string) => string
): Promise<void> => {
  const jobStatusUrl = `${GP_URL}/jobs/${jobId}?f=json`;
  let attempts = 0;

  while (attempts < POLLING_CONFIG.maxAttempts) {
    try {
      const response = await request(jobStatusUrl, {
        query: { f: "json" },
        responseType: "json"
      });

      const jobStatus = response.data.jobStatus;

      if (jobStatus === "esriJobSucceeded") {
        return;
      } else if (jobStatus === "esriJobFailed") {
        const errorMsg = `Print job failed: ${response.data.messages ? response.data.messages.map((m: any) => m.description).join(', ') : 'Unknown error'}`;
        onError(errorMsg);
        throw new Error(errorMsg);
      } else if (jobStatus === "esriJobCancelled") {
        const errorMsg = "Print job was cancelled.";
        onError(errorMsg);
        throw new Error(errorMsg);
      } else if (jobStatus === "esriJobWaiting" || jobStatus === "esriJobExecuting") {
        onProgress(t("widgets.print.processing"));
      }
    } catch (error: any) {
      const errorMsg = `Error polling job status: ${error.message}`;
      onError(errorMsg);
      throw error;
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, POLLING_CONFIG.intervalMs));
  }

  const timeoutError = "Print job timed out after waiting for too long.";
  onError(timeoutError);
  throw new Error(timeoutError);
};

export const buildWebMapJSON = (
  view: any,
  operationalLayers: LayerGroup[],
  resolution: number,
  formData: any,
  userInfo: any
): WebMapJSON => {
  const baseMap = view.map.basemap.toJSON();
  const extent = view.extent.toJSON();

  return {
    mapOptions: {
      extent,
      ...(view.type === "2d" ? { rotation: -view.rotation } : {}),
    },
    operationalLayers: operationalLayers
      .filter((layer: LayerGroup) => layer.title !== "JDA Extent")
      .map((layer: LayerGroup) => {
        const mappedLayer: any = {
          id: layer.id,
          title: layer.title,
          opacity: layer.opacity,
          visible: layer.visible,
          url: layer.url,
          layerType: layer.layerType
        };

        // Add visibleLayers for MapServices
        if (layer.visibleLayers && Array.isArray(layer.visibleLayers)) {
          mappedLayer.visibleLayers = layer.visibleLayers;
        }

        // Add dynamic layer definitions for better control
        if (layer.layerDefinition && layer.layerDefinition.dynamicLayers) {
          mappedLayer.layerDefinition = layer.layerDefinition;
        }

        // Add definition expression for FeatureLayers
        if (layer.definitionExpression) {
          mappedLayer.definitionExpression = layer.definitionExpression;
        }

        return mappedLayer;
      }),
    baseMap,
    exportOptions: {
      dpi: resolution,
      outputSize: [view.width, view.height],
    },
    layoutOptions: {
      legendOptions: formData.includeLegend ? {
        operationalLayers: operationalLayers
          .filter((layer: LayerGroup) => layer.title !== "JDA Extent")
          .map((layer: LayerGroup) => ({ id: layer.id })),
      } : undefined,
      customTextElements: [
        { Title: formData.title },
        { Classification: formData.classification },
        ...Array.from({ length: 18 }, (_, i) => ({
          [`Author_${i + 1}`]: userInfo?.fullName || ""
        })),
      ],
    },
  };
};

export const submitPrintJob = async (
  GP_URL: string,
  webMapJSON: WebMapJSON,
  formData: any,
  extent: any
) => {
  // Determine the actual layout to use based on legend setting
  const actualLayout = formData.includeLegend 
    ? formData.layout 
    : `${formData.layout}_NoLegend`;

  const params: PrintJobParams = {
    Web_Map_as_JSON: JSON.stringify(webMapJSON),
    Format: formData.format.toUpperCase(),
    Layout_Template: actualLayout,
    Title: formData.title,
    Extent: JSON.stringify(extent)
  };

  return await submitJob(GP_URL, params);
};

export const fetchPrintResult = async (GP_URL: string, jobId: string): Promise<string> => {
  const resultUrl = `${GP_URL}/jobs/${jobId}/results/Output_File?f=json`;
  const resultResponse = await request(resultUrl);
  return resultResponse.data.value.url;
};
