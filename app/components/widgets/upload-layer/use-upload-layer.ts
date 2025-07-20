import { useState } from "react";
import { UploadState, MessagePayload } from "./types";
import { UploadService } from "./upload-service";
import { LayerFactory } from "./layer-factory";

export const useUploadLayer = (
  view: __esri.MapView | __esri.SceneView | null,
  sendMessage: (message: MessagePayload) => void,
  updateStats: (action: string) => void,
  t: (key: string) => string
) => {
  const [state, setState] = useState<UploadState>({
    file: null,
    title: "",
    loading: false,
  });

  const setFile = (file: File | null) => {
    setState(prev => ({ ...prev, file }));
  };

  const setTitle = (title: string) => {
    setState(prev => ({ ...prev, title }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const resetForm = () => {
    setState({
      file: null,
      title: "",
      loading: false,
    });
  };

  const showError = (title: string, body: string) => {
    sendMessage({
      type: "error",
      title,
      body,
      duration: 8,
    });
  };

  const showSuccess = (title: string, body: string) => {
    sendMessage({
      type: "info",
      title,
      body,
      duration: 12,
    });
  };

  const handleUploadLayer = async () => {
    if (!state.file) {
      showError(
        t("systemMessages.error.uploadLayerError.title"),
        t("systemMessages.error.completeUploadLayerRequirements.body")
      );
      return;
    }

    if (!view || !view.map || typeof view.map.add !== "function") {
      showError(
        t("systemMessages.error.uploadLayerError.title"),
        "Map view is not available"
      );
      return;
    }

    setLoading(true);
    
    try {
      // 1. Submit job
      const submitRes = await UploadService.submitJob(state.file);
      if (!submitRes.jobId) {
        throw new Error(submitRes.messages?.[0]?.description || "Failed to submit job");
      }

      // 2. Poll for job status
      await UploadService.pollJobStatus(submitRes.jobId);

      // 3. Get output results
      const outputRes = await UploadService.fetchJobResult(submitRes.jobId);
      const { urls, fileType, fileNames, subLayers } = outputRes;

      // 4. Add layer(s) to map
      const layersToZoom: __esri.Layer[] = [];
      const layerTitles: string[] = [];

      for (let i = 0; i < urls.length; i++) {
        const outputUrl = urls[i];
        const layerTitle = LayerFactory.generateLayerTitle(
          subLayers[i],
          state.title,
          fileNames[i],
          state.file.name
        );

        const layer = LayerFactory.createLayer({
          url: outputUrl,
          title: layerTitle,
          fileType,
        });

        if (layer) {
          LayerFactory.addLayerToMap(layer, view, false);
          layersToZoom.push(layer);
          layerTitles.push(layerTitle);
        }
      }

      // 5. Zoom to all layers and show success message
      if (layersToZoom.length > 0) {
        await LayerFactory.zoomToLayers(layersToZoom, view);
        showSuccess(
          t("widgets.uploadLayer.success"),
          layerTitles.join(", ") + t("widgets.uploadLayer.layerUploaded")
        );
      }

      resetForm();
    } catch (error) {
      console.error("Upload error:", error);
      showError(
        t("systemMessages.error.uploadLayerError.title"),
        (error as Error).message
      );
    } finally {
      setLoading(false);
      updateStats("Upload Layer");
    }
  };

  return {
    file: state.file,
    title: state.title,
    loading: state.loading,
    setFile,
    setTitle,
    handleUploadLayer,
  };
};
