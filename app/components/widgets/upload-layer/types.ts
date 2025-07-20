export interface UploadState {
  file: File | null;
  title: string;
  loading: boolean;
}

export interface JobSubmissionResult {
  jobId: string;
  messages?: Array<{ description: string }>;
}

export interface JobResult {
  fileType: string;
  subLayers: string[];
  fileNames: string[];
  urls: string[];
  jobId: string;
}

export interface UploadJobParams {
  File: string;
  f: string;
  [key: string]: string;
}

export interface LayerCreationOptions {
  url: string;
  title: string;
  fileType: string;
}

export interface MessagePayload {
  type: "error" | "warning" | "info";
  title: string;
  body: string;
  duration: number;
}
