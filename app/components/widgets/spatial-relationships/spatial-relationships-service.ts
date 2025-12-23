import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { AnalysisService } from "../analysis-tools";

export type SpatialRelationship =
  | "intersects"
  | "within"
  | "contains"
  | "touches"
  | "crosses"
  | "overlaps"
  | "equals";

export interface RelationshipResult {
  relationship: SpatialRelationship;
  matchingGeometries: __esri.Geometry[];
  count: number;
}

export class SpatialRelationshipsService {
  /**
   * Checks spatial relationships between geometries from two sets
   */
  static checkRelationships(
    geometries1: __esri.Geometry[],
    geometries2: __esri.Geometry[],
    relationship: SpatialRelationship
  ): RelationshipResult {
    const matchingGeometries: __esri.Geometry[] = [];

    for (const geom1 of geometries1) {
      for (const geom2 of geometries2) {
        try {
          let matches = false;

          switch (relationship) {
            case "intersects":
              matches = geometryEngine.intersects(geom1, geom2);
              break;
            case "within":
              matches = geometryEngine.within(geom1, geom2);
              break;
            case "contains":
              matches = geometryEngine.contains(geom2, geom1); // Note: contains is reversed
              break;
            case "touches":
              matches = geometryEngine.touches(geom1, geom2);
              break;
            case "crosses":
              matches = geometryEngine.crosses(geom1, geom2);
              break;
            case "overlaps":
              matches = geometryEngine.overlaps(geom1, geom2);
              break;
            case "equals":
              matches = geometryEngine.equals(geom1, geom2);
              break;
          }

          if (matches) {
            matchingGeometries.push(geom1);
            break; // Only add each geometry once
          }
        } catch (error) {
          console.warn(`Spatial relationship check failed for geometry pair:`, error);
        }
      }
    }

    return {
      relationship,
      matchingGeometries,
      count: matchingGeometries.length
    };
  }

  /**
   * Runs spatial relationship analysis between two layers
   */
  static async runSpatialRelationshipsAnalysis(
    layer1: __esri.FeatureLayer | __esri.GraphicsLayer,
    layer2: __esri.FeatureLayer | __esri.GraphicsLayer,
    relationship: SpatialRelationship,
    outputName?: string
  ): Promise<{ result: RelationshipResult; resultLayer: FeatureLayer }> {
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

    // Check relationships
    const result = this.checkRelationships(geometries1, geometries2, relationship);

    // Create result layer with new naming convention
    const layerName = `${layer1.title || "layer1"}_${layer2.title || "layer2"}`;
    const defaultTitle = AnalysisService.generateOutputLayerName(
      layerName,
      "spatial_relationships",
      relationship
    );
    const layerTitle = outputName && outputName.trim() ? outputName : defaultTitle;
    const geometryType = result.matchingGeometries[0]?.type || "polygon";
    const resultLayer = AnalysisService.createResultLayer(layerTitle, geometryType);

    // Add matching geometries to layer
    if (result.matchingGeometries.length > 0) {
      AnalysisService.addGeometriesToLayer(result.matchingGeometries, resultLayer);
    }

    return { result, resultLayer };
  }
}