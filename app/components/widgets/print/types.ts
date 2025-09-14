export interface PrintFormData {
  title: string;
  format: 'pdf' | 'png8' | 'jpg';
  layout: string;
  includeLegend: boolean;
  scalebarUnit: 'metric' | 'imperial';
  classification: 'Restricted' | 'Confidential' | 'Internal';
}

export interface PrintState {
  isLoading: boolean;
  error: string | null;
  progress: string | null;
  resolution: number;
  formData: PrintFormData;
}

export interface LayerGroup {
  id: string;
  title: string;
  opacity: number;
  visible: boolean;
  url: string;
  layerType: string;
  visibleLayers?: number[];
  layerDefinition?: {
    dynamicLayers: Array<{
      id: number;
      source: {
        type: string;
        mapLayerId: number;
      };
      definitionExpression?: string | null;
    }>;
  };
  definitionExpression?: string | null;
}

export interface WebMapJSON {
  mapOptions: {
    extent: any;
    rotation?: number;
  };
  operationalLayers: LayerGroup[];
  baseMap: any;
  exportOptions: {
    dpi: number;
    outputSize: number[];
  };
  layoutOptions: {
    legendOptions?: {
      operationalLayers: Array<{ id: string }>;
    };
    customTextElements: Array<Record<string, string>>;
  };
}

export interface PrintJobParams {
  Web_Map_as_JSON: string;
  Format: string;
  Layout_Template: string;
  Title: string;
  Extent: string;
}
