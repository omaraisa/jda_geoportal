import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { AnalysisService } from "../analysis-tools";

export type MeasurementType = "area" | "length" | "distance";
export type MeasurementUnit = "metric" | "imperial";

export interface MeasurementResult {
  type: MeasurementType;
  value: number;
  unit: string;
  geometryType: string;
  featureCount: number;
}

export class MeasurementService {
  /**
   * Calculates measurements for geometries
   */
  static calculateMeasurements(
    geometries: __esri.Geometry[],
    type: MeasurementType,
    unit: MeasurementUnit
  ): MeasurementResult[] {
    if (geometries.length === 0) {
      throw new Error("No geometries provided for measurement");
    }

    const results: MeasurementResult[] = [];
    let totalValue = 0;
    let validCount = 0;

    for (const geometry of geometries) {
      try {
        let value = 0;
        let measurementUnit = "";

        switch (type) {
          case "area":
            if (geometry.type === "polygon" || geometry.type === "extent") {
              const spatialReference = geometry.spatialReference;
              if (unit === "metric") {
                if (spatialReference?.isGeographic) {
                  value = geometryEngine.geodesicArea(geometry as __esri.Polygon, "square-meters");
                } else {
                  value = geometryEngine.planarArea(geometry as __esri.Polygon, "square-meters");
                }
                measurementUnit = "m²";
              } else {
                if (spatialReference?.isGeographic) {
                  value = geometryEngine.geodesicArea(geometry as __esri.Polygon, "square-feet");
                } else {
                  value = geometryEngine.planarArea(geometry as __esri.Polygon, "square-feet");
                }
                measurementUnit = "ft²";
              }
            }
            break;

          case "length":
            if (geometry.type === "polyline") {
              const spatialReference = geometry.spatialReference;
              if (unit === "metric") {
                if (spatialReference?.isGeographic) {
                  value = geometryEngine.geodesicLength(geometry as __esri.Polyline, "meters");
                } else {
                  value = geometryEngine.planarLength(geometry as __esri.Polyline, "meters");
                }
                measurementUnit = "m";
              } else {
                if (spatialReference?.isGeographic) {
                  value = geometryEngine.geodesicLength(geometry as __esri.Polyline, "feet");
                } else {
                  value = geometryEngine.planarLength(geometry as __esri.Polyline, "feet");
                }
                measurementUnit = "ft";
              }
            }
            break;

          case "distance":
            // For distance, we'll calculate the total length of all polylines
            if (geometry.type === "polyline") {
              const spatialReference = geometry.spatialReference;
              if (unit === "metric") {
                if (spatialReference?.isGeographic) {
                  value = geometryEngine.geodesicLength(geometry as __esri.Polyline, "meters");
                } else {
                  value = geometryEngine.planarLength(geometry as __esri.Polyline, "meters");
                }
                measurementUnit = "m";
              } else {
                if (spatialReference?.isGeographic) {
                  value = geometryEngine.geodesicLength(geometry as __esri.Polyline, "feet");
                } else {
                  value = geometryEngine.planarLength(geometry as __esri.Polyline, "feet");
                }
                measurementUnit = "ft";
              }
            }
            break;
        }

        if (value > 0) {
          totalValue += value;
          validCount++;
        }
      } catch (error) {
        console.warn("Measurement failed for geometry:", error);
      }
    }

    if (validCount === 0) {
      throw new Error(`No valid ${type} measurements could be calculated`);
    }

    // Return summary result
    results.push({
      type,
      value: totalValue,
      unit: this.getUnitString(type, unit),
      geometryType: geometries[0]?.type || "unknown",
      featureCount: validCount
    });

    return results;
  }

  /**
   * Gets the unit string for display
   */
  static getUnitString(type: MeasurementType, unit: MeasurementUnit): string {
    if (type === "area") {
      return unit === "metric" ? "m²" : "ft²";
    } else {
      return unit === "metric" ? "m" : "ft";
    }
  }

  /**
   * Runs measurement analysis on a layer
   */
  static async runMeasurementAnalysis(
    layer: __esri.FeatureLayer,
    type: MeasurementType,
    unit: MeasurementUnit
  ): Promise<MeasurementResult[]> {
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

    // Calculate measurements
    return this.calculateMeasurements(geometries, type, unit);
  }

  /**
   * Formats measurement result for display
   */
  static formatResult(result: MeasurementResult): string {
    const formattedValue = result.value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });

    return `${formattedValue} ${result.unit} (${result.featureCount} features)`;
  }
}