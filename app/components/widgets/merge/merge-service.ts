import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import useStateStore from "../../../stateStore";

export class MergeService {
  static async runMergeAnalysis(
    inputLayers: __esri.FeatureLayer[],
    outputName: string
  ): Promise<FeatureLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

    if (inputLayers.length < 2) {
      throw new Error("At least two layers are required for merge analysis");
    }

    // 1. Verify geometry types
    const geometryType = inputLayers[0].geometryType;
    for (const layer of inputLayers) {
      if (layer.geometryType !== geometryType) {
        throw new Error("All input layers must have the same geometry type");
      }
    }

    // 2. Collect all features
    let allFeatures: Graphic[] = [];
    
    for (const layer of inputLayers) {
      const query = layer.createQuery();
      query.where = "1=1";
      query.returnGeometry = true;
      query.outFields = ["*"];
      
      const featureSet = await layer.queryFeatures(query);
      allFeatures = [...allFeatures, ...featureSet.features];
    }

    if (allFeatures.length === 0) {
      throw new Error("No features found in input layers");
    }

    // 3. Define fields (using the first layer's fields as schema)
    // We filter out system fields like OID, Shape_Length, etc.
    const sourceFields = inputLayers[0].fields.filter(f => 
      f.type !== "oid" && 
      f.name !== "Shape" && 
      f.name !== "Shape_Length" && 
      f.name !== "Shape_Area"
    );

    const fields = [
      new Field({
        name: "ObjectID",
        alias: "ObjectID",
        type: "oid"
      }),
      ...sourceFields
    ];

    // 4. Prepare graphics with normalized attributes
    const graphics = allFeatures.map((feature, index) => {
      const attributes: any = {
        ObjectID: index + 1
      };

      // Copy attributes that match the schema
      sourceFields.forEach(field => {
        if (feature.attributes && feature.attributes[field.name] !== undefined) {
          attributes[field.name] = feature.attributes[field.name];
        } else {
          attributes[field.name] = null; // Or default value
        }
      });

      return new Graphic({
        geometry: feature.geometry,
        attributes: attributes
      });
    });

    // 5. Create output layer
    const resultLayer = new FeatureLayer({
      source: graphics,
      fields: fields,
      objectIdField: "ObjectID",
      geometryType: geometryType,
      title: outputName || `Merge Result`,
      spatialReference: view.spatialReference
    });

    // 6. Set a default renderer
    resultLayer.renderer = new SimpleRenderer({
      symbol: this.getDefaultSymbol(geometryType)
    });

    // 7. Add to map
    view.map.add(resultLayer);

    return resultLayer;
  }

  private static getDefaultSymbol(geometryType: string): any {
    switch (geometryType) {
      case "point":
      case "multipoint":
        return {
          type: "simple-marker",
          style: "circle",
          color: [0, 255, 197, 0.7],
          size: "8px",
          outline: {
            color: [255, 255, 255],
            width: 1
          }
        };
      case "polyline":
        return {
          type: "simple-line",
          color: [0, 255, 197, 0.8],
          width: 2,
          style: "solid"
        };
      case "polygon":
        return {
          type: "simple-fill",
          color: [0, 255, 197, 0.5],
          style: "solid",
          outline: {
            color: [0, 150, 150],
            width: 1
          }
        };
      default:
        return null;
    }
  }
}
