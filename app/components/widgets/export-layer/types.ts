export interface ExportLayerState {
  selectedLayer: any;
  exportFormat: string;
  outputName: string;
  isExporting: boolean;
  stopRequested: boolean;
  status: string;
  statusType: "info" | "success" | "error" | "warning" | "";
}

export interface LayerExportParams {
  layerInput: string;
  inputType: string;
  outputType: string;
  outputName: string;
}

export interface JobResult {
  jobId: string;
  jobStatus: string;
  messages?: Array<{ type: string; description: string }>;
}

export interface ExportResult {
  value?: {
    url: string;
  };
  error?: {
    message: string;
    details?: string[];
  };
}
