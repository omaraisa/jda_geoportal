export interface SpatialQueryState {
  targetLayer: __esri.Layer | null;
  selectionGeometry: __esri.Geometry | null;
  selectionMethodChecked: boolean;
}

export interface SpatialQueryRefs {
  targetLayerRef: React.RefObject<HTMLSelectElement | null>;
  selectionLayerRef: React.RefObject<HTMLSelectElement | null>;
  sketchContainerRef: React.RefObject<HTMLDivElement | null>;
  graphicsLayerRef: React.RefObject<__esri.GraphicsLayer | null>;
  sketchInitialized: React.RefObject<boolean>;
}

export interface MessagePayload {
  type: "error" | "warning" | "info";
  title: string;
  body: string;
  duration?: number;
}

export interface SpatialQueryHandlers {
  handleSketchComplete: (graphic: __esri.Graphic) => Promise<void>;
  runQueryByLayer: () => Promise<void>;
  handleClearSelection: () => void;
  selectionMethodHandler: () => void;
}

export interface LayerSelectionResult {
  targetLayer: __esri.FeatureLayer | null;
  selectionLayer: __esri.FeatureLayer | null;
}
