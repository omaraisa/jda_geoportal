interface MenuOption {
  name: string;
  icon: string;
  subMenuComponent?: string;
}

interface MenuOptions {
  [key: string]: MenuOption[];
}

const menuOptions: MenuOptions = {
  settings: [
    { name: "ViewSwitcher", icon: "system-management", subMenuComponent: "ViewSwitcher",  },
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
    { name: "NetworkAnalysis", icon: "utility-network" },
  ],
  query: [
    { name: "AttributeQueryComponent", icon: "file-magnifying-glass" },
    { name: "SpatialQueryComponent", icon: "image-magnifying-glass" },
  ],
  layers: [
    { name: "LayerListComponent", icon: "list" },
    { name: "AddLayer", icon: "add-layer" },
  ],
};

export default menuOptions;