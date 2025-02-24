interface MenuOption {
  name: string;
  icon: string;
}

interface MenuOptions {
  [key: string]: MenuOption[];
}

const menuOptions: MenuOptions = {
  settings: [
    { name: "userSettings", icon: "system-management" },
    { name: "systemSettings", icon: "gear" },
  ],
  tools: [
    { name: "MeasurementComponent", icon: "measure" },
    { name: "EditorComponent", icon: "vertex-edit" },
    { name: "SketchComponent", icon: "pencil-mark" },
    { name: "LegendComponent", icon: "legend" },
    { name: "PrintComponent", icon: "print" },
    { name: "BasemapGalleryComponent", icon: "basemap" },
    { name: "BookmarkComponent", icon: "bookmark" },
    { name: "CoordinateConversionComponent", icon: "coordinate-system" },
  ],
  analysis: [
    { name: "bufferAnalysis", icon: "buffer-polygon" },
    { name: "overlayAnalysis", icon: "analysis-overlay" },
    { name: "proximityAnalysis", icon: "geographic-link-chart-layout" },
    { name: "statisticalAnalysis", icon: "box-chart" },
    { name: "terrainAnalysis", icon: "raster-analysis" },
    { name: "networkAnalysis", icon: "utility-network" },
    { name: "visibilityAnalysis", icon: "data-clock-chart" },
    { name: "heatmapAnalysis", icon: "heat-chart" },
    { name: "clusterAnalysis", icon: "knowledge-graph-data-model" },
    { name: "suitabilityAnalysis", icon: "check-circle" },
  ],
  query: [
    { name: "AttributeQueryComponent", icon: "file-magnifying-glass" },
    { name: "SpatialQueryComponent", icon: "image-magnifying-glass" },
  ],
  layers: [
    { name: "LayerListComponent", icon: "list" },
    { name: "addLayer", icon: "add-layer" },
    { name: "removeLayer", icon: "x-circle" },
  ],
};

export default menuOptions;