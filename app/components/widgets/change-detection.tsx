import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import RasterControls from "./change-detection/raster-controls";
import AnalysisControls from "./change-detection/analysis-controls";
import { ChangeDetectionService } from "./change-detection/change-detection-service";

const CHANGE_DETECTION_GP_URL = process.env.NEXT_PUBLIC_CHANGE_DETECTION_GP_URL!;

const ChangeDetection: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const gisToken = useStateStore((state) => state.gisToken);
  const view = useStateStore((state) => state.targetView);

  const [raster1, setRaster1] = useState<string>("");
  const [raster2, setRaster2] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [imageryLayers, setImageryLayers] = useState<any[]>([]);

  useEffect(() => {
    if (view?.map) {
      const layers = view.map.layers.toArray().filter((l: any) => l.type === "imagery");
      setImageryLayers(layers);
    }
  }, [view]);

  const handleRun = async () => {
    setStatusType("info");
    setStatus(t("widgets.changeDetection.status.running") || "Running change detection analysis...");

    try {
      if (!raster1 || !raster2) throw new Error("Both rasters must be selected.");
      if (!gisToken) throw new Error("GIS token not available.");

      // Generate service name
      const serviceName = ChangeDetectionService.generateServiceName(raster1, raster2);

      // Submit the job
      const jobId = await ChangeDetectionService.submitJob(
        CHANGE_DETECTION_GP_URL,
        raster1,
        raster2,
        serviceName,
        true, // publish_to_online
        gisToken
      );

      // Poll for job status
      const result = await ChangeDetectionService.pollJobStatus(CHANGE_DETECTION_GP_URL, jobId, gisToken);

      if (result.success) {
        // Add the resulting layer to the map
        const serviceUrl = result.serviceUrl;
        if (serviceUrl) {
          await ChangeDetectionService.addResultLayer(serviceUrl, serviceName);
        }
        setStatusType("success");
        setStatus(t("widgets.changeDetection.status.success") || "Change detection analysis completed successfully.");
      } else {
        setStatusType("error");
        setStatus(result.error || "Analysis failed.");
      }
    } catch (err: any) {
      setStatusType("error");
      setStatus(err.message || "Analysis failed.");
    }

    updateStats("Change Detection");
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">{t("widgets.changeDetection.title") || "Change Detection"}</h2>

      <RasterControls
        raster1={raster1}
        raster2={raster2}
        onRaster1Change={setRaster1}
        onRaster2Change={setRaster2}
        imageryLayers={imageryLayers}
      />

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
      />
    </div>
  );
};

export default ChangeDetection;
