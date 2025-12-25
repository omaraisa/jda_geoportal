import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Color from "@arcgis/core/Color";
import * as typeRendererCreator from "@arcgis/core/smartMapping/renderers/type";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

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
}
