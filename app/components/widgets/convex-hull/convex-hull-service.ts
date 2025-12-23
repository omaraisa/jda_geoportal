import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import useStateStore from "../../../stateStore";

export class ConvexHullService {
  static async runConvexHullAnalysis(
    inputLayer: __esri.FeatureLayer,
    merge: boolean,
    outputName: string
  ): Promise<FeatureLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

    // 1. Get all features
    const query = inputLayer.createQuery();
    query.where = "1=1";
    query.returnGeometry = true;
    query.outFields = ["*"];
    
    const featureSet = await inputLayer.queryFeatures(query);
    
    if (featureSet.features.length === 0) {
      throw new Error("No features found in input layer");
    }

    const geometries = featureSet.features.map(f => f.geometry).filter(g => g);

    // 2. Calculate Convex Hull
    let resultGeometries: __esri.Geometry | __esri.Geometry[];
    
    try {
      // geometryEngine.convexHull(geometries, merge)
      // Note: The type definition might vary slightly depending on version, but generally supports this.
      // If merge is true, it returns a single Geometry. If false, it returns Geometry[].
      resultGeometries = geometryEngine.convexHull(geometries, merge);
    } catch (e) {
      console.error("Convex Hull calculation failed", e);
      throw new Error("Failed to calculate convex hull. Geometries might be invalid.");
    }

    // 3. Create Graphics
    let graphics: Graphic[] = [];
    let fields: Field[] = [
      new Field({
        name: "ObjectID",
        alias: "ObjectID",
        type: "oid"
      })
    ];

    if (merge) {
      // Single result
      if (!resultGeometries) {
         throw new Error("Convex hull result is empty");
      }
      graphics = [
        new Graphic({
          geometry: resultGeometries as __esri.Geometry,
          attributes: { ObjectID: 1 }
        })
      ];
    } else {
      // Multiple results - try to preserve attributes
      const results = resultGeometries as __esri.Geometry[];
      
      // Copy fields from source (excluding system fields)
      const sourceFields = inputLayer.fields.filter(f => 
        f.type !== "oid" && 
        f.name !== "Shape" && 
        f.name !== "Shape_Length" && 
        f.name !== "Shape_Area"
      );
      
      fields = [...fields, ...sourceFields];

      graphics = results.map((geom, index) => {
        const originalFeature = featureSet.features[index];
        const attributes: any = { ObjectID: index + 1 };
        
        sourceFields.forEach(field => {
           if (originalFeature.attributes && originalFeature.attributes[field.name] !== undefined) {
             attributes[field.name] = originalFeature.attributes[field.name];
           }
        });

        return new Graphic({
          geometry: geom,
          attributes: attributes
        });
      });
    }

    // 4. Create Output Layer
    const resultLayer = new FeatureLayer({
      source: graphics,
      fields: fields,
      objectIdField: "ObjectID",
      geometryType: "polygon", // Convex hull is always polygon
      title: outputName || `Convex Hull (${merge ? "Merged" : "Individual"})`,
      spatialReference: view.spatialReference
    });

    // 5. Set Renderer
    resultLayer.renderer = new SimpleRenderer({
      symbol: {
        type: "simple-fill",
        color: [255, 170, 0, 0.5],
        style: "solid",
        outline: {
          color: [255, 170, 0],
          width: 2
        }
      } as any
    });

    // 6. Add to map
    view.map.add(resultLayer);

    return resultLayer;
  }
}
