import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { AnalysisService } from "../analysis-tools";

export type GeometryOperation = "offset" | "densify" | "simplify";

export class GeometryModifyService {
  /**
   * Performs geometry modification operations
   */
  static modifyGeometries(
    geometries: __esri.Geometry[],
    operation: GeometryOperation,
    options: { distance?: number; maxSegmentLength?: number; tolerance?: number }
  ): __esri.Geometry[] {
    if (geometries.length === 0) {
      throw new Error("No geometries provided for modification");
    }

    const result: __esri.Geometry[] = [];

    for (const geometry of geometries) {
      try {
        let modifiedGeometry: __esri.Geometry | null = null;

        switch (operation) {
          case "offset":
            if (options.distance !== undefined && (geometry.type === "polygon" || geometry.type === "polyline")) {
              const spatialReference = geometry.spatialReference;
              let offsetResult: __esri.Geometry | __esri.Geometry[];

              if (spatialReference?.isGeographic) {
                // For geographic coordinate systems, use geodesic buffer as approximation of offset
                offsetResult = geometryEngine.geodesicBuffer([geometry], options.distance, "meters");
              } else {
                offsetResult = geometryEngine.offset(geometry, options.distance, "meters");
              }

              if (Array.isArray(offsetResult)) {
                result.push(...offsetResult);
              } else if (offsetResult) {
                result.push(offsetResult);
              }
            }
            break;

          case "densify":
            if (options.maxSegmentLength !== undefined && geometry.type === "polyline") {
              const spatialReference = geometry.spatialReference;
              let densifyResult: __esri.Geometry;

              if (spatialReference?.isGeographic) {
                // For geographic coordinate systems, use geodesic densify
                densifyResult = geometryEngine.geodesicDensify(geometry as __esri.Polyline, options.maxSegmentLength, "meters");
              } else {
                densifyResult = geometryEngine.densify(geometry as __esri.Polyline, options.maxSegmentLength, "meters");
              }

              result.push(densifyResult);
            }
            break;

          case "simplify":
            if (geometry.type === "polygon" || geometry.type === "polyline") {
              const simplifyResult = geometryEngine.simplify(geometry);
              if (Array.isArray(simplifyResult)) {
                result.push(...simplifyResult);
              } else if (simplifyResult) {
                result.push(simplifyResult);
              }
            }
            break;
        }
      } catch (error) {
        console.warn(`Geometry modification failed for geometry:`, error);
      }
    }

    return result.filter(geom => geom !== null);
  }

  /**
   * Runs geometry modification analysis on a layer
   */
  static async runGeometryModifyAnalysis(
    layer: __esri.FeatureLayer | __esri.GraphicsLayer,
    operation: GeometryOperation,
    options: { distance?: number; maxSegmentLength?: number; tolerance?: number }
  ): Promise<FeatureLayer> {
    // Validate input layer
    const hasFeatures = await AnalysisService.validateLayerHasFeatures(layer);
    if (!hasFeatures) {
      throw new Error("Input layer has no features");
    }

    // Get features from layer
    const features = await AnalysisService.getFeaturesFromLayer(layer);
    const geometries = AnalysisService.getGeometriesFromFeatures(features);

    if (geometries.length === 0) {
      throw new Error("No valid geometries found in input layer");
    }

    // Modify geometries
    const modifiedGeometries = this.modifyGeometries(geometries, operation, options);

    if (modifiedGeometries.length === 0) {
      throw new Error("Geometry modification produced no results");
    }

    // Create result layer with new naming convention
    const layerName = layer.title || "unknown_layer";
    let value: string = operation;
    if (operation === "offset" && options.distance !== undefined) {
      value = `${operation}_${options.distance}m`;
    } else if (operation === "densify" && options.maxSegmentLength !== undefined) {
      value = `${operation}_${options.maxSegmentLength}m`;
    }
    
    const layerTitle = AnalysisService.generateOutputLayerName(
      layerName,
      "geometry_modify",
      value
    );
    const geometryType = modifiedGeometries[0]?.type || "polygon";
    const resultLayer = AnalysisService.createResultLayer(layerTitle, geometryType);

    // Add modified geometries to layer
    AnalysisService.addGeometriesToLayer(modifiedGeometries, resultLayer);

    return resultLayer;
  }
}