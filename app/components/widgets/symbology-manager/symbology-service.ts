import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Color from "@arcgis/core/Color";
import * as typeRendererCreator from "@arcgis/core/smartMapping/renderers/type";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";
import * as sizeRendererCreator from "@arcgis/core/smartMapping/renderers/size";
import * as heatmapRendererCreator from "@arcgis/core/smartMapping/renderers/heatmap";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import HeatmapRenderer from "@arcgis/core/renderers/HeatmapRenderer";

export interface ColorRamp {
  name: string;
  colors: string[];
}

export const COLOR_RAMPS: ColorRamp[] = [
  { name: "Blue", colors: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"] },
  { name: "Green", colors: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"] },
  { name: "Red", colors: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"] },
  { name: "Orange", colors: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"] },
  { name: "Purple", colors: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"] },
  { name: "Red-Yellow-Blue", colors: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"] },
  { name: "Spectral", colors: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"] },
  { name: "Viridis", colors: ["#440154", "#482777", "#3e4989", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6ece58", "#b5de2b"] },
];

export class SymbologyService {
  static async applySimpleRenderer(
    layer: __esri.FeatureLayer,
    symbolConfig: {
      color: string;
      outlineColor?: string;
      outlineWidth?: number;
      size?: number;
      opacity?: number;
      style?: "circle" | "square" | "cross" | "x" | "diamond" | "triangle" | "path" | "solid" | "dash" | "dot" | "dash-dot" | "long-dash-dot-dot" | "backward-diagonal" | "forward-diagonal" | "horizontal" | "vertical" | "diagonal-cross";
    }
  ) {
    const geometryType = layer.geometryType;
    let symbol: __esri.Symbol;

    const color = new Color(symbolConfig.color);
    if (symbolConfig.opacity !== undefined) {
      color.a = symbolConfig.opacity;
    }

    if (geometryType === "point" || geometryType === "multipoint") {
      symbol = new SimpleMarkerSymbol({
        color: color,
        size: symbolConfig.size || 8,
        style: (symbolConfig.style as any) || "circle",
        outline: {
          color: symbolConfig.outlineColor || "white",
          width: symbolConfig.outlineWidth || 1,
        },
      });
    } else if (geometryType === "polyline") {
      symbol = new SimpleLineSymbol({
        color: color,
        width: symbolConfig.size || 2,
        style: (symbolConfig.style as any) || "solid",
      });
    } else {
      symbol = new SimpleFillSymbol({
        color: color,
        style: (symbolConfig.style as any) || "solid",
        outline: {
          color: symbolConfig.outlineColor || "white",
          width: symbolConfig.outlineWidth || 1,
        },
      });
    }

    layer.renderer = new SimpleRenderer({
      symbol: symbol,
    });
  }

  static async generateUniqueValueRenderer(
    layer: __esri.FeatureLayer,
    field: string
  ) {
    const result = await typeRendererCreator.createRenderer({
      layer: layer,
      field: field,
      defaultSymbolEnabled: true
    });
    return result.renderer as UniqueValueRenderer;
  }

  static async generateClassBreaksRenderer(
    layer: __esri.FeatureLayer,
    field: string,
    classificationMethod: "natural-breaks" | "equal-interval" | "quantile" | "standard-deviation",
    classCount: number = 5
  ) {
    const result = await (colorRendererCreator as any).createRenderer({
      layer: layer,
      field: field,
      classificationMethod: classificationMethod,
      numClasses: classCount,
      defaultSymbolEnabled: true
    });
    return result.renderer as ClassBreaksRenderer;
  }

  static async applyUniqueValueRenderer(
    layer: __esri.FeatureLayer,
    fields: string[],
    uniqueValues: { value: any; color: string; label: string; style?: string }[]
  ) {
    const geometryType = layer.geometryType;
    
    const renderer = new UniqueValueRenderer({
      field: fields[0],
      field2: fields[1] || undefined,
      field3: fields[2] || undefined,
      fieldDelimiter: ", ",
      defaultSymbol: this.getDefaultSymbol(geometryType),
      uniqueValueInfos: uniqueValues.map((uv) => ({
        value: uv.value,
        symbol: this.getSymbolForGeometry(geometryType, uv.color, uv.style),
        label: uv.label,
      })),
    });

    layer.renderer = renderer;
  }

  static async applyClassBreaksRenderer(
    layer: __esri.FeatureLayer,
    field: string,
    classBreaks: { min: number; max: number; color: string; label: string; style?: string }[]
  ) {
    const geometryType = layer.geometryType;

    const renderer = new ClassBreaksRenderer({
      field: field,
      defaultSymbol: this.getDefaultSymbol(geometryType),
      classBreakInfos: classBreaks.map((cb) => ({
        minValue: cb.min,
        maxValue: cb.max,
        symbol: this.getSymbolForGeometry(geometryType, cb.color, cb.style),
        label: cb.label,
      })),
    });

    layer.renderer = renderer;
  }

  private static getDefaultSymbol(geometryType: string): __esri.Symbol {
    return this.getSymbolForGeometry(geometryType, "#cccccc");
  }

  private static getSymbolForGeometry(geometryType: string, colorStr: string, style?: string): __esri.Symbol {
    const color = new Color(colorStr);
    if (geometryType === "point" || geometryType === "multipoint") {
      return new SimpleMarkerSymbol({
        color: color,
        size: 8,
        style: (style as any) || "circle",
        outline: { color: "white", width: 1 },
      });
    } else if (geometryType === "polyline") {
      return new SimpleLineSymbol({
        color: color,
        width: 2,
        style: (style as any) || "solid",
      });
    } else {
      return new SimpleFillSymbol({
        color: color,
        style: (style as any) || "solid",
        outline: { color: "white", width: 1 },
      });
    }
  }

  static getLayerFields(layer: __esri.FeatureLayer) {
    return layer.fields.map(f => ({
        name: f.name,
        alias: f.alias,
        type: f.type
    }));
  }

  static async getFieldStatistics(layer: __esri.FeatureLayer, fieldName: string) {
    const query = layer.createQuery();
    query.outStatistics = [
      {
        statisticType: "min",
        onStatisticField: fieldName,
        outStatisticFieldName: "min_value"
      } as any,
      {
        statisticType: "max",
        onStatisticField: fieldName,
        outStatisticFieldName: "max_value"
      } as any,
      {
        statisticType: "avg",
        onStatisticField: fieldName,
        outStatisticFieldName: "avg_value"
      } as any,
      {
        statisticType: "count",
        onStatisticField: fieldName,
        outStatisticFieldName: "count_value"
      } as any
    ];

    try {
      const result = await layer.queryFeatures(query);
      if (result.features.length > 0) {
        const attrs = result.features[0].attributes;
        return {
          min: attrs.min_value,
          max: attrs.max_value,
          avg: attrs.avg_value,
          count: attrs.count_value
        };
      }
    } catch (error) {
      console.error("Error getting field statistics:", error);
    }
    return null;
  }

  static applyColorRamp(ramp: ColorRamp, count: number): string[] {
    if (count <= 1) return [ramp.colors[0]];
    if (count >= ramp.colors.length) return ramp.colors;
    
    const step = ramp.colors.length / count;
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const index = Math.floor(i * step);
      result.push(ramp.colors[index]);
    }
    return result;
  }

  static reverseColors(colors: string[]): string[] {
    return [...colors].reverse();
  }

  static async generateHeatmapRenderer(layer: __esri.FeatureLayer, field?: string) {
    try {
      // Heatmap renderer doesn't need view in this context
      return null; // Placeholder - heatmap needs different approach
    } catch (error) {
      console.error("Error generating heatmap:", error);
      return null;
    }
  }

  static async applyHeatmapRenderer(layer: __esri.FeatureLayer, field?: string) {
    // Simple heatmap fallback using color renderer
    try {
      const result = await (colorRendererCreator as any).createContinuousRenderer({
        layer: layer,
        field: field || layer.fields.find(f => f.type === "integer" || f.type === "double")?.name,
        theme: "high-to-low"
      });
      if (result && result.renderer) {
        layer.renderer = result.renderer;
      }
    } catch (error) {
      console.error("Error applying heatmap:", error);
    }
  }

  static cloneRenderer(renderer: __esri.Renderer): __esri.Renderer {
    // Use JSON serialization for cloning
    return (renderer as any).clone ? (renderer as any).clone() : renderer;
  }

  static exportRendererToJSON(renderer: __esri.Renderer): any {
    return renderer.toJSON();
  }
}
