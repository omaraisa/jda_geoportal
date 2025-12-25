import Color from "@arcgis/core/Color";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import Font from "@arcgis/core/symbols/Font";

export interface LabelConfig {
  enabled: boolean;
  field: string;
  font: {
    family: string;
    size: number;
    weight: "normal" | "bold";
    color: string;
  };
  halo: {
    color: string;
    size: number;
  };
  placement?: string;
  minScale?: number;
  maxScale?: number;
}

export const FONT_FAMILIES = [
  { value: "arial", label: "Arial" },
  { value: "arial-black", label: "Arial Black" },
  { value: "comic-sans-ms", label: "Comic Sans MS" },
  { value: "courier-new", label: "Courier New" },
  { value: "georgia", label: "Georgia" },
  { value: "impact", label: "Impact" },
  { value: "times-new-roman", label: "Times New Roman" },
  { value: "trebuchet-ms", label: "Trebuchet MS" },
  { value: "verdana", label: "Verdana" }
];

export class LabelingService {
  /**
   * Apply labeling configuration to a feature layer
   */
  static async applyLabeling(
    layer: __esri.FeatureLayer,
    config: LabelConfig
  ) {
    layer.labelsVisible = config.enabled;

    if (!config.enabled) {
      return;
    }

    const color = new Color(config.font.color);
    const haloColor = new Color(config.halo.color);

    const labelClass = new LabelClass({
      labelExpressionInfo: { expression: `$feature["${config.field}"]` },
      symbol: new TextSymbol({
        color: color,
        haloColor: haloColor,
        haloSize: config.halo.size,
        font: new Font({
          family: config.font.family,
          size: config.font.size,
          weight: config.font.weight
        })
      }),
      minScale: config.minScale || 0,
      maxScale: config.maxScale || 0
    });

    if (config.placement) {
        (labelClass as any).labelPlacement = config.placement;
    }

    layer.labelingInfo = [labelClass];
  }

  /**
   * Get fields from a feature layer
   */
  static getLayerFields(layer: __esri.FeatureLayer) {
    return layer.fields.map(f => ({
        name: f.name,
        alias: f.alias,
        type: f.type
    }));
  }

  /**
   * Get existing label configuration from a layer
   */
  static getExistingLabelConfig(layer: __esri.FeatureLayer): Partial<LabelConfig> | null {
    if (!layer.labelingInfo || layer.labelingInfo.length === 0) {
      return null;
    }

    const info = layer.labelingInfo[0] as __esri.LabelClass;
    const config: Partial<LabelConfig> = {
      enabled: layer.labelsVisible
    };

    // Parse expression to get field
    const match = info.labelExpressionInfo?.expression?.match(/\$feature\["(.+)"\]/);
    if (match && match[1]) {
      config.field = match[1];
    }
    
    const symbol = info.symbol as __esri.TextSymbol;
    if (symbol) {
      config.font = {
        family: symbol.font?.family || "arial",
        size: symbol.font?.size || 10,
        weight: (symbol.font?.weight as "normal" | "bold") || "normal",
        color: symbol.color?.toHex() || "#000000"
      };
      config.halo = {
        color: symbol.haloColor?.toHex() || "#ffffff",
        size: symbol.haloSize || 1
      };
    }
    
    config.placement = (info as any).labelPlacement || "above-center";
    config.minScale = info.minScale || 0;
    config.maxScale = info.maxScale || 0;

    return config;
  }

  /**
   * Get placement options based on geometry type
   */
  static getPlacementOptions(geometryType: string) {
    if (geometryType === "point" || geometryType === "multipoint") {
      return [
        { value: "above-center", label: "Above Center" },
        { value: "above-left", label: "Above Left" },
        { value: "above-right", label: "Above Right" },
        { value: "below-center", label: "Below Center" },
        { value: "below-left", label: "Below Left" },
        { value: "below-right", label: "Below Right" },
        { value: "center-center", label: "Center" },
        { value: "center-left", label: "Center Left" },
        { value: "center-right", label: "Center Right" },
      ];
    } else if (geometryType === "polyline") {
      return [
        { value: "above-along", label: "Above Along" },
        { value: "below-along", label: "Below Along" },
        { value: "center-along", label: "Center Along" },
        { value: "above-start", label: "Above Start" },
        { value: "above-end", label: "Above End" },
        { value: "below-start", label: "Below Start" },
        { value: "below-end", label: "Below End" },
        { value: "center-start", label: "Center Start" },
        { value: "center-end", label: "Center End" },
      ];
    } else {
      return [
        { value: "always-horizontal", label: "Always Horizontal" },
      ];
    }
  }

  /**
   * Clear all labels from a layer
   */
  static clearLabels(layer: __esri.FeatureLayer) {
    layer.labelsVisible = false;
    layer.labelingInfo = [];
  }

  /**
   * Duplicate existing label configuration
   */
  static duplicateLabelConfig(config: LabelConfig): LabelConfig {
    return JSON.parse(JSON.stringify(config));
  }
}
