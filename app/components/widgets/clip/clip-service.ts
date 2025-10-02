import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { AnalysisService } from "../analysis-tools";

export type ClipOperation = "clip" | "cut";

export class ClipService {
  /**
   * Performs clip operation on geometries
   */
  static performClip(
    inputGeometries: __esri.Geometry[],
    clipGeometries: __esri.Geometry[],
    operation: ClipOperation
  ): __esri.Geometry[] {
    if (inputGeometries.length === 0 || clipGeometries.length === 0) {
      throw new Error("Both input and clip geometry sets must contain geometries");
    }

    const result: __esri.Geometry[] = [];

    try {
      if (operation === "clip") {
        // For clip, we use intersect as clip is typically for rectangular extents
        // But we'll use intersect for general geometry clipping
        for (const inputGeom of inputGeometries) {
          for (const clipGeom of clipGeometries) {
            try {
              const clipped = geometryEngine.intersect(inputGeom, clipGeom);
              if (clipped) {
                if (Array.isArray(clipped)) {
                  result.push(...clipped);
                } else {
                  result.push(clipped);
                }
              }
            } catch (error) {
              console.warn("Clip operation failed for geometry pair:", error);
            }
          }
        }
      } else if (operation === "cut") {
        // Cut: split input geometries by cutter geometries (must be polylines)
        for (const inputGeom of inputGeometries) {
          // Combine all cutter geometries into a single geometry for cutting
          let combinedCutter: __esri.Geometry | null = null;
          for (const cutterGeom of clipGeometries) {
            if (cutterGeom.type === "polyline") {
              combinedCutter = combinedCutter
                ? geometryEngine.union([combinedCutter, cutterGeom])
                : cutterGeom;
            }
          }

          if (combinedCutter && combinedCutter.type === "polyline") {
            try {
              const cutResult = geometryEngine.cut(inputGeom, combinedCutter as __esri.Polyline);
              if (cutResult && Array.isArray(cutResult)) {
                result.push(...cutResult);
              }
            } catch (error) {
              console.warn("Cut operation failed for geometry:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Clip operation ${operation} failed:`, error);
      throw new Error(`Failed to perform ${operation} operation`);
    }

    return result.filter(geom => geom !== null);
  }

  /**
   * Runs clip/cut analysis between two layers
   */
  static async runClipAnalysis(
    inputLayer: __esri.FeatureLayer,
    clipLayer: __esri.FeatureLayer,
    operation: ClipOperation
  ): Promise<GraphicsLayer> {
    // Validate input layers
    const [hasFeatures1, hasFeatures2] = await Promise.all([
      AnalysisService.validateLayerHasFeatures(inputLayer),
      AnalysisService.validateLayerHasFeatures(clipLayer)
    ]);

    if (!hasFeatures1 || !hasFeatures2) {
      throw new Error("Both input layers must contain features");
    }

    // Get features from both layers
    const [inputFeatures, clipFeatures] = await Promise.all([
      AnalysisService.getFeaturesFromLayer(inputLayer),
      AnalysisService.getFeaturesFromLayer(clipLayer)
    ]);

    const inputGeometries = AnalysisService.getGeometriesFromFeatures(inputFeatures);
    const clipGeometries = AnalysisService.getGeometriesFromFeatures(clipFeatures);

    if (inputGeometries.length === 0 || clipGeometries.length === 0) {
      throw new Error("No valid geometries found in input layers");
    }

    // Perform clip/cut operation
    const resultGeometries = this.performClip(inputGeometries, clipGeometries, operation);

    if (resultGeometries.length === 0) {
      throw new Error(`No ${operation} results found`);
    }

    // Create result layer with new naming convention
    const layerName = `${inputLayer.title || "input_layer"}_${clipLayer.title || "clip_layer"}`;
    const layerTitle = AnalysisService.generateOutputLayerName(
      layerName,
      "clip",
      operation
    );
    const resultLayer = AnalysisService.createResultLayer(layerTitle);

    // Add results to layer
    AnalysisService.addGeometriesToLayer(resultGeometries, resultLayer);

    return resultLayer;
  }
}