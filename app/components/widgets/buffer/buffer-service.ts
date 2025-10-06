import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { getAnalysisPolygonSymbol } from "../../../lib/utils/symbols";
import useStateStore from "../../../stateStore";

export class BufferService {
  /**
   * Simple buffer analysis - creates individual buffer features for each input feature
   */
  static async runBufferAnalysis(
    inputLayer: __esri.FeatureLayer,
    distances: number[],
    unit: string
  ): Promise<FeatureLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

    // Get all features from input layer
    const query = inputLayer.createQuery();
    query.where = "1=1";
    query.returnGeometry = true;
    const featureSet = await inputLayer.queryFeatures(query);

    if (featureSet.features.length === 0) {
      throw new Error("No features found in input layer");
    }

    // Create buffers for each distance
    const bufferFeatures: Graphic[] = [];
    let objectIdCounter = 1;

    for (const distance of distances) {
      for (let i = 0; i < featureSet.features.length; i++) {
        const feature = featureSet.features[i];
        const geometry = feature.geometry;

        if (!geometry) continue;

        // Create buffer for this feature and distance
        let buffer: __esri.Geometry;
        if (geometry.spatialReference?.isGeographic) {
          buffer = geometryEngine.geodesicBuffer(geometry, distance, unit as __esri.LinearUnits) as __esri.Geometry;
        } else {
          buffer = geometryEngine.buffer(geometry, distance, unit as __esri.LinearUnits) as __esri.Geometry;
        }

        // Create feature with buffer geometry
        const bufferFeature = new Graphic({
          geometry: buffer,
          attributes: {
            OBJECTID: objectIdCounter++,
            buffer_distance: distance,
            buffer_unit: unit,
            source_layer: inputLayer.title,
            source_objectid: feature.attributes[inputLayer.objectIdField],
            created_at: Date.now()
          }
        });

        bufferFeatures.push(bufferFeature);
      }
    }

    // Define fields
    const fields = [
      new Field({ name: "OBJECTID", type: "oid" }),
      new Field({ name: "buffer_distance", type: "double", alias: "Buffer Distance" }),
      new Field({ name: "buffer_unit", type: "string", alias: "Buffer Unit" }),
      new Field({ name: "source_layer", type: "string", alias: "Source Layer" }),
      new Field({ name: "source_objectid", type: "integer", alias: "Source Object ID" }),
      new Field({ name: "created_at", type: "date", alias: "Created At" })
    ];

  // Create symbol using the shared utility (keeps outline settings from symbols.ts)
  const symbol = getAnalysisPolygonSymbol();

    // Create result layer
    const distanceText = distances.length === 1 ? distances[0] : distances.join('_');
    const layerTitle = `${inputLayer.title}_buffer_${distanceText}${unit}_${Date.now()}`;
    const resultLayer = new FeatureLayer({
      title: layerTitle,
      geometryType: "polygon",
      spatialReference: view.spatialReference,
      source: bufferFeatures,
      fields,
      objectIdField: "OBJECTID",
  renderer: new SimpleRenderer({ symbol }),
      popupEnabled: true,
      popupTemplate: {
        title: "Buffer Feature",
        content: [{
          type: "fields",
          fieldInfos: fields.map(f => ({
            fieldName: f.name,
            label: f.alias || f.name
          }))
        }]
      }
    } as any);

    // Add to map
    view.map.layers.add(resultLayer);

    return resultLayer;
  }
}