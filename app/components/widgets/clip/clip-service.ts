import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as projection from "@arcgis/core/geometry/projection";
import { AnalysisService } from "../analysis-tools";
import { getAnalysisPolygonSymbol, getAnalysisPointSymbol, getAnalysisLineSymbol } from "../../../lib/utils/symbols";
import useStateStore from "../../../stateStore";

export type ClipOperation = "clip" | "cut";

export class ClipService {
  /**
   * Performs clip operation on geometries
   */
  static performClip(
    inputGeometries: __esri.Geometry[],
    clipGeometries: __esri.Geometry[],
    operation: ClipOperation,
    targetSpatialReference: __esri.SpatialReference
  ): __esri.Geometry[] {
    if (inputGeometries.length === 0 || clipGeometries.length === 0) {
      throw new Error("Both input and clip geometry sets must contain geometries");
    }

    // Project geometries to target spatial reference if necessary
    const projectedInputGeometries = inputGeometries.map(geom => {
      if (geom.spatialReference?.wkid !== targetSpatialReference.wkid) {
        try {
          return projection.project(geom, targetSpatialReference);
        } catch (error) {
          console.warn("Failed to project input geometry:", error);
          return null;
        }
      }
      return geom;
    }).filter(geom => geom !== null) as __esri.Geometry[];

    const projectedClipGeometries = clipGeometries.map(geom => {
      if (geom.spatialReference?.wkid !== targetSpatialReference.wkid) {
        try {
          return projection.project(geom, targetSpatialReference);
        } catch (error) {
          console.warn("Failed to project clip geometry:", error);
          return null;
        }
      }
      return geom;
    }).filter(geom => geom !== null) as __esri.Geometry[];

    if (projectedInputGeometries.length === 0 || projectedClipGeometries.length === 0) {
      throw new Error("No valid geometries after projection");
    }

    const result: __esri.Geometry[] = [];

    try {
      if (operation === "clip") {
        // For clip, we use intersect as clip is typically for rectangular extents
        // But we'll use intersect for general geometry clipping
        for (const inputGeom of projectedInputGeometries) {
          for (const clipGeom of projectedClipGeometries) {
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
        for (const inputGeom of projectedInputGeometries) {
          // Combine all cutter geometries into a single geometry for cutting
          let combinedCutter: __esri.Geometry | null = null;
          for (const cutterGeom of projectedClipGeometries) {
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
    inputLayer: __esri.FeatureLayer | __esri.GraphicsLayer,
    clipLayer: __esri.FeatureLayer | __esri.GraphicsLayer,
    operation: ClipOperation
  ): Promise<FeatureLayer | GraphicsLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

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
    const resultGeometries = this.performClip(inputGeometries, clipGeometries, operation, view.spatialReference);

    if (resultGeometries.length === 0) {
      throw new Error(`No ${operation} results found`);
    }

    // Create result features grouped by geometry type
    const groups: Record<string, Graphic[]> = { point: [], polyline: [], polygon: [] };
    let objectIdCounter = 1;

    for (const geometry of resultGeometries) {
      const resultFeature = new Graphic({
        geometry,
        attributes: {
          OBJECTID: objectIdCounter++,
          operation: operation,
          input_layer: inputLayer.title,
          clip_layer: clipLayer.title,
          created_at: Date.now()
        }
      });

      if (geometry.type === "point" || geometry.type === "multipoint") {
        groups.point.push(resultFeature);
      } else if (geometry.type === "polyline") {
        groups.polyline.push(resultFeature);
      } else if (geometry.type === "polygon" || geometry.type === "extent") {
        groups.polygon.push(resultFeature);
      } else {
        // Fallback to polygon group
        groups.polygon.push(resultFeature);
      }
    }

    // Define common fields
    const fields = [
      new Field({ name: "OBJECTID", type: "oid" }),
      new Field({ name: "operation", type: "string", alias: "Operation" }),
      new Field({ name: "input_layer", type: "string", alias: "Input Layer" }),
      new Field({ name: "clip_layer", type: "string", alias: "Clip Layer" }),
      new Field({ name: "created_at", type: "date", alias: "Created At" })
    ];

    const layerTitleBase = `${inputLayer.title || "input_layer"}_${clipLayer.title || "clip_layer"}_${operation}_${Date.now()}`;

    // If results are all of one geometry type, return a single FeatureLayer of that type
    const nonEmptyGroups = Object.entries(groups).filter(([, arr]) => arr.length > 0);
    if (nonEmptyGroups.length === 1) {
      const [geomType, features] = nonEmptyGroups[0];
      const symbol = geomType === "point" ? getAnalysisPointSymbol() : geomType === "polyline" ? getAnalysisLineSymbol() : getAnalysisPolygonSymbol();

      const resultLayer = new FeatureLayer({
        title: layerTitleBase,
        geometryType: geomType as any,
        spatialReference: view.spatialReference,
        source: features,
        fields,
        objectIdField: "OBJECTID",
        renderer: new SimpleRenderer({ symbol }),
        popupEnabled: true,
        popupTemplate: {
          title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Feature`,
          content: [{
            type: "fields",
            fieldInfos: fields.map(f => ({ fieldName: f.name, label: f.alias || f.name }))
          }]
        }
      } as any);

      view.map.layers.add(resultLayer);
      return resultLayer;
    }

    // Mixed geometry types: create a GraphicsLayer and add all features to it
    const graphicsLayer = new GraphicsLayer({ title: layerTitleBase });
    Object.values(groups).forEach(arr => {
      for (const g of arr) graphicsLayer.add(g);
    });

    view.map.layers.add(graphicsLayer);
    return graphicsLayer;
  }
}