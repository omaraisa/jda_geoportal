import { JobResult, ExportResult } from './types';

export class ExportService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    const cookies = Object.fromEntries(document.cookie.split("; ").map(c => c.split("=")));
    return cookies["arcgis_token"] || null;
  }

  async submitExportJob(params: Record<string, any>): Promise<{ jobId: string }> {
    const token = this.getToken();
    const submitUrl = this.baseUrl + "/submitJob" + (token ? `?token=${token}` : "");
    
    const response = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });

    const data = await response.json();
    
    if (!data.jobId) {
      let errorMsg = "Failed to submit export job.";
      if (data.error?.message) errorMsg += " " + data.error.message;
      if (data.error?.details && Array.isArray(data.error.details)) {
        errorMsg += " " + data.error.details.join(" ");
      }
      errorMsg += " " + JSON.stringify(data);
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  }

  async pollJobStatus(jobId: string, interval = 2000, maxTries = 30): Promise<JobResult> {
    const token = this.getToken();
    const statusUrl = `${this.baseUrl}/jobs/${jobId}?f=json${token ? `&token=${token}` : ""}`;

    for (let i = 0; i < maxTries; i++) {
      const res = await fetch(statusUrl);
      const data = await res.json();
      
      if (data.jobStatus === "esriJobSucceeded" || data.jobStatus === "esriJobFailed") {
        return data;
      }
      
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    
    throw new Error("Export job timed out.");
  }

  async getExportResult(jobId: string, stopRequestedRef: React.MutableRefObject<boolean>): Promise<string> {
    const token = this.getToken();
    let resultUrl = `${this.baseUrl}/jobs/${jobId}/results/output_file?f=json${token ? `&token=${token}` : ""}`;
    
    let resultResponse = await fetch(resultUrl);
    if (!resultResponse.ok) {
      throw new Error(`HTTP error! status: ${resultResponse.status}`);
    }
    
    let resultData = await resultResponse.json();

    // If value is null, wait and retry a few times (the file may not be ready yet)
    let tries = 0;
    while (resultData.value == null && tries < 50) {
      if (stopRequestedRef.current) {
        throw new Error("Export stopped by user.");
      }
      
      if (resultData.error) {
        throw new Error(
          `Export failed. ${resultData.error.message || ""} ${resultData.error.details?.join(" ") || ""}`
        );
      }
      
      await new Promise(res => setTimeout(res, 1500));
      resultResponse = await fetch(resultUrl);
      
      if (!resultResponse.ok) {
        throw new Error(`HTTP error! status: ${resultResponse.status}`);
      }
      
      resultData = await resultResponse.json();
      tries++;
    }

    if (resultData.value?.url) {
      return resultData.value.url;
    } else {
      throw new Error("Export failed. No output URL found.");
    }
  }
}
