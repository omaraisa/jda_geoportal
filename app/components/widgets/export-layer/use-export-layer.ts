import { useState, useRef } from "react";
import { ExportLayerState } from "./types";
import { LayerProcessor } from "./layer-processor";
import { OutputNameFormatter } from "./output-formatter";
import { ExportService } from "./export-service";

export function useExportLayer(
  view: any,
  sendMessage: any,
  updateStats: any,
  t: any
) {
  const [selectedLayer, setSelectedLayer] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [outputName, setOutputName] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const stopRequestedRef = useRef(false);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "warning" | "">("");

  const EXPORT_GP_URL = process.env.NEXT_PUBLIC_EXPORT_GP_URL!;
  const exportService = new ExportService(EXPORT_GP_URL);

  const handleSelectedLayer = (layerId: string) => {
    const layer = view?.map?.layers?.toArray().find((l: any) => l.id === layerId);
    setSelectedLayer(layer);
  };

  const updateStatus = (type: typeof statusType, message: string) => {
    setStatusType(type);
    setStatus(message);
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
    updateStatus("info", t("widgets.exportLayer.status.submitting") || "Submitting export job...");

    try {
      // Process the layer to get input parameters
      const layerParams = await LayerProcessor.processLayer(selectedLayer);
      
      // Format output name and type
      const outputNameParam = OutputNameFormatter.formatOutputName(
        outputName,
        selectedLayer.title || selectedLayer.name
      );
      const outputType = OutputNameFormatter.normalizeOutputType(exportFormat);

      const params: Record<string, any> = {
        layer_input: layerParams.layerInput,
        input_type: layerParams.inputType,
        output_type: outputType,
        output_name: outputNameParam,
        f: "json",
      };

      // Submit export job
      const jobData = await exportService.submitExportJob(params);
      
      updateStatus("info", t("widgets.exportLayer.status.polling") || "Waiting for export job...");
      
      // Poll for job completion
      const jobStatus = await exportService.pollJobStatus(jobData.jobId);

      if (jobStatus.jobStatus === "esriJobFailed") {
        let errorMsg = "Export job failed.";
        if (Array.isArray(jobStatus.messages)) {
          const errorMsgs = jobStatus.messages
            .filter((m: any) => m.type === "esriJobMessageTypeError")
            .map((m: any) => m.description)
            .join(" ");
          if (errorMsgs) errorMsg += " " + errorMsgs;
        }
        console.error(errorMsg);
        updateStatus("error", t("widgets.exportLayer.status.failed") || "Export failed.");
        throw new Error(errorMsg);
      }

      updateStatus("info", t("widgets.exportLayer.status.fetching") || "Fetching export result...");
      
      // Get the result URL
      const resultUrl = await exportService.getExportResult(jobData.jobId, stopRequestedRef);
      
      updateStatus("success", t("widgets.exportLayer.status.success") || "Export complete.");
      window.open(resultUrl, "_blank");
      
      sendMessage({
        type: "info",
        title: t("widgets.exportLayer.success"),
        body: t("widgets.exportLayer.exportComplete"),
        duration: 6,
      });

      updateStats("Export Layer");

    } catch (error: any) {
      if (error.message === "Export stopped by user.") {
        updateStatus("warning", t("widgets.exportLayer.status.stopped") || "Export stopped by user.");
        sendMessage({
          type: "warning",
          title: t("widgets.exportLayer.stopped") || "Export stopped",
          body: t("widgets.exportLayer.stoppedBody") || "Export was stopped by user.",
          duration: 6,
        });
      } else {
        updateStatus("error", t("widgets.exportLayer.status.failed") || "Export failed.");
        console.error("Export error:", error);
        sendMessage({
          type: "error",
          title: t("systemMessages.error.genericError.title"),
          body: t("systemMessages.error.genericError.body"),
          duration: 8,
        });
      }
    } finally {
      setIsExporting(false);
      setStopRequested(false);
      stopRequestedRef.current = false;
    }
  };

  const handleStop = () => {
    setStopRequested(true);
    stopRequestedRef.current = true;
  };

  return {
    selectedLayer,
    exportFormat,
    setExportFormat,
    outputName,
    setOutputName,
    isExporting,
    status,
    statusType,
    handleSelectedLayer,
    handleExport,
    handleStop,
  };
}
