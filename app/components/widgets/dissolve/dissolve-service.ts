import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { AnalysisService } from "../analysis-tools";

export class DissolveService {
  /**
   * Dissolves geometries by merging overlapping or adjacent geometries
   */
  static dissolveGeometries(geometries: __esri.Geometry[]): __esri.Geometry[] {
    if (geometries.length === 0) {
      throw new Error("No geometries provided for dissolve operation");
    }

    try {
      // Use union to merge all geometries
      const dissolved = geometryEngine.union(geometries);

      // Handle the result - union can return a single geometry or array
      if (Array.isArray(dissolved)) {
        return dissolved.filter(geom => geom !== null);
      } else if (dissolved) {
        return [dissolved];
      } else {
        return [];
      }
    } catch (error) {
      console.error("Dissolve operation failed:", error);
      throw new Error("Failed to dissolve geometries");
    }
  }

  /**
   * Runs dissolve analysis on a layer
   */
  static async runDissolveAnalysis(layer: __esri.FeatureLayer | __esri.GraphicsLayer): Promise<FeatureLayer> {
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

    // Dissolve geometries
    const dissolvedGeometries = this.dissolveGeometries(geometries);

    if (dissolvedGeometries.length === 0) {
      throw new Error("Dissolve operation produced no results");
    }

    // Create result layer with new naming convention
    const layerName = layer.title || "unknown_layer";
    const layerTitle = AnalysisService.generateOutputLayerName(
      layerName,
      "dissolve",
      "dissolved"
    );
    const geometryType = dissolvedGeometries[0]?.type || "polygon";
    const resultLayer = AnalysisService.createResultLayer(layerTitle, geometryType);

    // Add dissolved geometries to layer
    AnalysisService.addGeometriesToLayer(dissolvedGeometries, resultLayer);

    return resultLayer;
  }
}