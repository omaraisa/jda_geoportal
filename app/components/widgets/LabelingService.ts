import Color from "@arcgis/core/Color";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import Font from "@arcgis/core/symbols/Font";

export class LabelingService {
  static async applyLabeling(
    layer: __esri.FeatureLayer,
    config: {
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

  static getLayerFields(layer: __esri.FeatureLayer) {
    return layer.fields.map(f => ({
        name: f.name,
        alias: f.alias,
        type: f.type
    }));
  }
}
