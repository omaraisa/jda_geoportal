import { hasPermission } from "./hasPermission";
import useStateStore from "@/stateStore"; // or your user role source

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
    { name: "BasemapSwitcher", icon: "basemap", subMenuComponent: "BasemapSwitcher",  },
    { name: "PrintComponent", icon: "print" },
  ],
  tools: [
    { name: "MeasurementComponent", icon: "measure" },
    { name: "EditorComponent", icon: "vertex-edit" },
    { name: "SketchComponent", icon: "pencil-mark" },
    { name: "BookmarkComponent", icon: "bookmark" },
    { name: "CoordinateConversionComponent", icon: "coordinate-system" },
  ],
  analysis: [
    { name: "NetworkAnalysis", icon: "utility-network" },
    { name: "DirectionsComponent", icon: "tour" }, // <-- Add this line
  ],
  query: [
    { name: "AttributeQueryComponent", icon: "file-magnifying-glass" },
    { name: "SpatialQueryComponent", icon: "image-magnifying-glass" },
  ],
  layers: [
    { name: "LayerListComponent", icon: "list" },
    { name: "LegendComponent", icon: "legend" },
    { name: "AddLayer", icon: "add-layer" },
    { name: "UploadLayer", icon: "upload" },
    { name: "ExportLayer", icon: "export" },
  ],
};

export function getMenuOptionsForRole(userRole: string, menuOptions: MenuOptions): MenuOptions {
  const filtered: MenuOptions = {};
  for (const [section, options] of Object.entries(menuOptions)) {
    filtered[section] = options.filter(opt => hasPermission(userRole, opt.name));
  }
  return filtered;
}

export default menuOptions;