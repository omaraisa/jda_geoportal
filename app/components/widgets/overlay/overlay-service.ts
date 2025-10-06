import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { getAnalysisPolygonSymbol } from "../../../lib/utils/symbols";
import useStateStore from "../../../stateStore";
import { AnalysisService } from "../analysis-tools";

export type OverlayOperation = "union" | "intersect" | "difference";

export class OverlayService {
  /**
   * Performs overlay operation on two sets of geometries
   */
  static performOverlay(
    geometries1: __esri.Geometry[],
    geometries2: __esri.Geometry[],
    operation: OverlayOperation
  ): __esri.Geometry[] {
    if (geometries1.length === 0 || geometries2.length === 0) {
      throw new Error("Both input geometry sets must contain geometries");
    }

    let result: __esri.Geometry[] = [];

    try {
      switch (operation) {
        case "union":
          // Union all geometries from both sets
          const allGeometries = [...geometries1, ...geometries2];
          const unionResult = geometryEngine.union(allGeometries);
          result = Array.isArray(unionResult) ? unionResult : [unionResult];
          break;

        case "intersect":
          // Intersect geometries pairwise
          for (const geom1 of geometries1) {
            for (const geom2 of geometries2) {
              try {
                const intersectResult = geometryEngine.intersect(geom1, geom2);
                if (intersectResult) {
                  if (Array.isArray(intersectResult)) {
                    result.push(...intersectResult);
                  } else {
                    result.push(intersectResult);
                  }
                }
              } catch (error) {
                // Skip invalid intersections
                console.warn("Intersection failed for geometry pair:", error);
              }
            }
          }
          break;

        case "difference":
          // Difference: geometries1 minus geometries2
          for (const geom1 of geometries1) {
            let diffGeom = geom1;
            for (const geom2 of geometries2) {
              try {
                const diffResult = geometryEngine.difference(diffGeom, geom2);
                if (Array.isArray(diffResult)) {
                  diffGeom = diffResult[0] || null;
                } else {
                  diffGeom = diffResult;
                }
                if (!diffGeom) break; // Geometry was completely erased
              } catch (error) {
                console.warn("Difference failed for geometry pair:", error);
              }
            }
            if (diffGeom) {
              result.push(diffGeom);
            }
          }
          break;

        default:
          throw new Error(`Unknown overlay operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Overlay operation ${operation} failed:`, error);
      throw new Error(`Failed to perform ${operation} operation`);
    }

    return result.filter(geom => geom !== null);
  }

  /**
   * Runs overlay analysis between two layers
   */
  static async runOverlayAnalysis(
    layer1: __esri.FeatureLayer | __esri.GraphicsLayer,
    layer2: __esri.FeatureLayer | __esri.GraphicsLayer,
    operation: OverlayOperation
  ): Promise<FeatureLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

    // Validate input layers
    const [hasFeatures1, hasFeatures2] = await Promise.all([
      AnalysisService.validateLayerHasFeatures(layer1),
      AnalysisService.validateLayerHasFeatures(layer2)
    ]);

    if (!hasFeatures1 || !hasFeatures2) {
      throw new Error("Both input layers must contain features");
    }

    // Get features from both layers
    const [features1, features2] = await Promise.all([
      AnalysisService.getFeaturesFromLayer(layer1),
      AnalysisService.getFeaturesFromLayer(layer2)
    ]);

    const geometries1 = AnalysisService.getGeometriesFromFeatures(features1);
    const geometries2 = AnalysisService.getGeometriesFromFeatures(features2);

    if (geometries1.length === 0 || geometries2.length === 0) {
      throw new Error("No valid geometries found in input layers");
    }

    // Perform overlay operation
    const resultGeometries = this.performOverlay(geometries1, geometries2, operation);

    if (resultGeometries.length === 0) {
      throw new Error(`No ${operation} results found`);
    }

    // Create individual overlay features
    const overlayFeatures: Graphic[] = [];
    let objectIdCounter = 1;

    for (let i = 0; i < resultGeometries.length; i++) {
      const geometry = resultGeometries[i];

      // Create feature with overlay geometry and attributes
      const overlayFeature = new Graphic({
        geometry: geometry,
        attributes: {
          OBJECTID: objectIdCounter++,
          operation_type: operation,
          source_layer1: layer1.title || "layer1",
          source_layer2: layer2.title || "layer2",
          result_index: i + 1,
          total_results: resultGeometries.length,
          area: geometry.type === "polygon" ? geometryEngine.geodesicArea(geometry as __esri.Polygon, "square-meters") : null,
          length: geometry.type === "polyline" ? geometryEngine.geodesicLength(geometry as __esri.Polyline, "meters") : null,
          created_at: Date.now()
        }
      });

      overlayFeatures.push(overlayFeature);
    }

    // Define fields
    const fields = [
      new Field({ name: "OBJECTID", type: "oid" }),
      new Field({ name: "operation_type", type: "string", alias: "Operation Type" }),
      new Field({ name: "source_layer1", type: "string", alias: "Source Layer 1" }),
      new Field({ name: "source_layer2", type: "string", alias: "Source Layer 2" }),
      new Field({ name: "result_index", type: "integer", alias: "Result Index" }),
      new Field({ name: "total_results", type: "integer", alias: "Total Results" }),
      new Field({ name: "area", type: "double", alias: "Area (sq meters)" }),
      new Field({ name: "length", type: "double", alias: "Length (meters)" }),
      new Field({ name: "created_at", type: "date", alias: "Created At" })
    ];

    // Create symbol using the shared utility
    const symbol = getAnalysisPolygonSymbol();

    // Create result layer
    const layerTitle = `${layer1.title || "layer1"}_${layer2.title || "layer2"}_${operation}_${Date.now()}`;
    const resultLayer = new FeatureLayer({
      title: layerTitle,
      geometryType: "polygon",
      spatialReference: view.spatialReference,
      source: overlayFeatures,
      fields,
      objectIdField: "OBJECTID",
      renderer: new SimpleRenderer({ symbol }),
      popupEnabled: true,
      popupTemplate: {
        title: "Overlay Feature",
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