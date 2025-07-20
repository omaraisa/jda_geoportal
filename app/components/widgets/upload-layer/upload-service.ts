import { JobSubmissionResult, JobResult, UploadJobParams } from './types';
import { GP_URL, UPLOAD_URL, POLLING_CONFIG, STATUS_URLS } from './constants';

export class UploadService {
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      body: formData,
    });
    
    const text = await res.text();
    let itemID: string | null = null;
    const match = text.match(/<td>\s*Item ID:\s*<\/td>\s*<td><a [^>]*>([a-zA-Z0-9\-]+)<\/a><\/td>/i);
    
    if (match) {
      itemID = match[1];
    }
    
    if (!itemID) {
      throw new Error("File upload failed: could not extract itemID");
    }
    
    return itemID;
  }

  static async submitJob(file: File): Promise<JobSubmissionResult> {
    const itemID = await this.uploadFile(file);
    const params: UploadJobParams = {
      File: JSON.stringify({ itemID }),
      f: "json",
    };

    const response = await fetch(GP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params as Record<string, string>),
    });
    
    const data = await response.json();
    return data;
  }

  static async pollJobStatus(jobId: string): Promise<any> {
    const statusUrl = STATUS_URLS.getStatusUrl(jobId);
    
    for (let i = 0; i < POLLING_CONFIG.maxTries; i++) {
      const res = await fetch(statusUrl);
      const data = await res.json();
      
      if (data.jobStatus === "esriJobSucceeded") {
        return data;
      }
      
      if (data.jobStatus === "esriJobFailed") {
        console.error("Job failed:", data.messages?.[0]?.description || "Job failed");
        throw new Error(data.messages?.[0]?.description || "Job failed");
      }
      
      await new Promise((r) => setTimeout(r, POLLING_CONFIG.interval));
    }
    
    throw new Error("Timeout waiting for job completion");
  }

  static async fetchJobResult(jobId: string): Promise<JobResult> {
    const resultUrl = STATUS_URLS.getResultUrl(jobId);
    const res = await fetch(resultUrl);
    const data = await res.json();

    if (!data.value?.fileNames || !Array.isArray(data.value.fileNames)) {
      throw new Error("Output does not contain fileNames");
    }

    // Construct URLs for each output file
    const urls = data.value.fileNames.map((fileName: string) =>
      STATUS_URLS.getFileUrl(jobId, fileName)
    );

    return {
      fileType: data.value.fileType,
      subLayers: data.value.subLayers || [],
      fileNames: data.value.fileNames,
      urls,
      jobId
    };
  }
}
