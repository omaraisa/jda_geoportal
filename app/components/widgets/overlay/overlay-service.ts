import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
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
  ): Promise<GraphicsLayer> {
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

    // Create result layer with new naming convention
    const layerName = `${layer1.title || "layer1"}_${layer2.title || "layer2"}`;
    const layerTitle = AnalysisService.generateOutputLayerName(
      layerName,
      "overlay",
      operation
    );
    const resultLayer = AnalysisService.createResultLayer(layerTitle);

    // Add results to layer
    AnalysisService.addGeometriesToLayer(resultGeometries, resultLayer);

    return resultLayer;
  }
}