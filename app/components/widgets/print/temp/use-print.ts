import { useState, FormEvent } from "react";
import { PrintFormData, PrintState } from "./types";
import { DEFAULT_FORM_DATA } from "./constants";
import { processAllLayers } from "./layer-processor";
import { pollJobStatus, buildWebMapJSON, submitPrintJob, fetchPrintResult } from "./print-service";

export const usePrint = (
  view: any,
  userInfo: any,
  updateStats: (action: string) => void,
  t: (key: string) => string
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [resolution, setResolution] = useState(300);
  const [formData, setFormData] = useState<PrintFormData>(DEFAULT_FORM_DATA);

  const GP_URL = process.env.NEXT_PUBLIC_PRINT_GP_URL!;

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
      // Process all layers
      const operationalLayers = processAllLayers(view);

      // Build web map JSON
      const webMapJSON = buildWebMapJSON(view, operationalLayers, resolution, formData, userInfo);
      const extent = view.extent.toJSON();

      // Submit print job
      setProgress(t("widgets.print.submitting"));
      const jobInfo = await submitPrintJob(GP_URL, webMapJSON, formData, extent);
      
      if (!jobInfo.jobId) {
        throw new Error("Failed to submit job");
      }

      // Poll job status
      setProgress(t("widgets.print.polling"));
      await pollJobStatus(
        jobInfo.jobId, 
        GP_URL, 
        setProgress, 
        setError, 
        t
      );

      // Fetch result
      setProgress(t("widgets.print.fetching"));
      const outputUrl = await fetchPrintResult(GP_URL, jobInfo.jobId);

      // Open result
      window.open(outputUrl, "_blank");
      setProgress(t("widgets.print.complete"));
      updateStats("Print Map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to print map");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return {
    isLoading,
    error,
    progress,
    resolution,
    formData,
    handleInputChange,
    handleCheckboxChange,
    handleResolutionChange,
    handlePrint,
  };
};
