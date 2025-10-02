import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { AnalysisService } from "../analysis-tools";

export class BufferService {
  /**
   * Creates buffer geometries around input features
   */
  static async createBuffers(
    inputLayer: __esri.FeatureLayer,
    distances: number[],
    unit: string
  ): Promise<__esri.Geometry[]> {
    // Validate input layer
    const hasFeatures = await AnalysisService.validateLayerHasFeatures(inputLayer);
    if (!hasFeatures) {
      throw new Error("Input layer has no features");
    }

    // Get features from input layer
    const features = await AnalysisService.getFeaturesFromLayer(inputLayer);
    const geometries = AnalysisService.getGeometriesFromFeatures(features);

    if (geometries.length === 0) {
      throw new Error("No valid geometries found in input layer");
    }

    // Create buffers for each distance
    const allBuffers: __esri.Geometry[] = [];

    for (const distance of distances) {
      try {
        // Check if we need geodesic or planar buffering
        const spatialReference = geometries[0]?.spatialReference;
        let buffers: __esri.Geometry[];

        if (spatialReference?.isGeographic) {
          // Use geodesic buffering for geographic coordinate systems
          buffers = geometryEngine.geodesicBuffer(geometries, distance, unit as __esri.LinearUnits) as __esri.Geometry[];
        } else {
          // Use planar buffering for projected coordinate systems
          buffers = geometryEngine.buffer(geometries, distance, unit as __esri.LinearUnits) as __esri.Geometry[];
        }

        if (Array.isArray(buffers)) {
          allBuffers.push(...buffers);
        } else if (buffers) {
          allBuffers.push(buffers);
        }
      } catch (error) {
        console.error(`Error creating buffer for distance ${distance}:`, error);
        // Continue with other distances
      }
    }

    if (allBuffers.length === 0) {
      throw new Error("No buffers could be created");
    }

    return allBuffers;
  }

  /**
   * Runs buffer analysis and adds results to map
   */
  static async runBufferAnalysis(
    inputLayer: __esri.FeatureLayer,
    distances: number[],
    unit: string
  ): Promise<GraphicsLayer> {
    const buffers = await this.createBuffers(inputLayer, distances, unit);

    // Dissolve all buffers into a single geometry by default
    let finalGeometries: __esri.Geometry[] = buffers;
    if (buffers.length > 1) {
      try {
        const dissolved = geometryEngine.union(buffers);
        finalGeometries = Array.isArray(dissolved) ? dissolved : [dissolved];
      } catch (error) {
        console.warn("Could not dissolve buffers, using individual buffers:", error);
        finalGeometries = buffers;
      }
    }

    // Create result layer with new naming convention
    const layerName = inputLayer.title || "unknown_layer";
    const distanceValue = distances.length === 1 ? distances[0] : distances.join("_");
    const layerTitle = AnalysisService.generateOutputLayerName(
      layerName,
      "buffer",
      `${distanceValue}${unit}`
    );
    const resultLayer = AnalysisService.createResultLayer(layerTitle);

    // Add dissolved buffers to layer
    AnalysisService.addGeometriesToLayer(finalGeometries, resultLayer);

    return resultLayer;
  }
}