import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as projection from "@arcgis/core/geometry/projection";
import { getAnalysisPolygonSymbol, getAnalysisPointSymbol, getAnalysisLineSymbol } from "../../../lib/utils/symbols";
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
    operation: OverlayOperation,
    targetSpatialReference: __esri.SpatialReference
  ): { geometry: __esri.Geometry; sourceIndex1?: number }[] {
    if (geometries1.length === 0 || geometries2.length === 0) {
      throw { key: 'widgets.overlay.errors.noGeometries', message: 'Both input geometry sets must contain geometries' };
    }

    // Project geometries to target spatial reference if necessary
    const projectedGeometries1 = geometries1.map(geom => {
      if (geom.spatialReference?.wkid !== targetSpatialReference.wkid) {
        try {
          return projection.project(geom, targetSpatialReference);
        } catch (error) {
          console.warn("Failed to project geometry1:", error);
          return null;
        }
      }
      return geom;
    }).filter(geom => geom !== null) as __esri.Geometry[];

    const projectedGeometries2 = geometries2.map(geom => {
      if (geom.spatialReference?.wkid !== targetSpatialReference.wkid) {
        try {
          return projection.project(geom, targetSpatialReference);
        } catch (error) {
          console.warn("Failed to project geometry2:", error);
          return null;
        }
      }
      return geom;
    }).filter(geom => geom !== null) as __esri.Geometry[];

    if (projectedGeometries1.length === 0 || projectedGeometries2.length === 0) {
      throw { key: 'widgets.overlay.errors.noValidGeometries', message: 'No valid geometries after projection' };
    }

    const result: { geometry: __esri.Geometry; sourceIndex1?: number }[] = [];

    try {
      switch (operation) {
        case "union":
          // Union all geometries from both sets
          const allGeometries = [...projectedGeometries1, ...projectedGeometries2];
          const unionResult = geometryEngine.union(allGeometries);
          const unionGeoms = Array.isArray(unionResult) ? unionResult : [unionResult];
          for (const geom of unionGeoms) {
            result.push({ geometry: geom });
          }
          break;

        case "intersect":
          // Intersect geometries pairwise
          for (let i = 0; i < projectedGeometries1.length; i++) {
            for (let j = 0; j < projectedGeometries2.length; j++) {
              try {
                const intersectResult = geometryEngine.intersect(projectedGeometries1[i], projectedGeometries2[j]);
                if (intersectResult) {
                  if (Array.isArray(intersectResult)) {
                    for (const ir of intersectResult) {
                      result.push({ geometry: ir, sourceIndex1: i });
                    }
                  } else {
                    result.push({ geometry: intersectResult, sourceIndex1: i });
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
          for (let i = 0; i < projectedGeometries1.length; i++) {
            let diffGeom = projectedGeometries1[i];
            for (const geom2 of projectedGeometries2) {
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
              result.push({ geometry: diffGeom, sourceIndex1: i });
            }
          }
          break;

        default:
          throw new Error(`Unknown overlay operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Overlay operation ${operation} failed:`, error);
      throw { key: 'widgets.overlay.errors.operationFailed', message: 'Failed to perform overlay operation' };
    }

    return result.filter(item => item.geometry !== null);
  }

  /**
   * Runs overlay analysis between two layers
   */
  static async runOverlayAnalysis(
    layer1: __esri.FeatureLayer | __esri.GraphicsLayer,
    layer2: __esri.FeatureLayer | __esri.GraphicsLayer,
    operation: OverlayOperation,
    outputName?: string
  ): Promise<FeatureLayer | GraphicsLayer> {
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
    const resultGeometries = this.performOverlay(geometries1, geometries2, operation, view.spatialReference);

    if (resultGeometries.length === 0) {
      throw { key: 'widgets.overlay.errors.noResults', message: 'No overlay results found' };
    }

    // Create individual overlay features
    const groups: Record<string, Graphic[]> = { point: [], polyline: [], polygon: [] };
    let objectIdCounter = 1;

    for (const result of resultGeometries) {
      const attributes: any = {
        OBJECTID: objectIdCounter++,
        operation_type: operation,
        source_layer1: layer1.title || "layer1",
        source_layer2: layer2.title || "layer2",
        result_index: groups.point.length + groups.polyline.length + groups.polygon.length + 1,
        total_results: resultGeometries.length,
        area: result.geometry.type === "polygon" ? geometryEngine.geodesicArea(result.geometry as __esri.Polygon, "square-meters") : null,
        length: result.geometry.type === "polyline" ? geometryEngine.geodesicLength(result.geometry as __esri.Polyline, "meters") : null,
        created_at: Date.now()
      };

      // Include attributes from layer1 if available
      if (result.sourceIndex1 !== undefined) {
        Object.assign(attributes, features1[result.sourceIndex1].attributes);
      }

      const overlayFeature = new Graphic({
        geometry: result.geometry,
        attributes
      });

      if (result.geometry.type === "point" || result.geometry.type === "multipoint") {
        groups.point.push(overlayFeature);
      } else if (result.geometry.type === "polyline") {
        groups.polyline.push(overlayFeature);
      } else if (result.geometry.type === "polygon" || result.geometry.type === "extent") {
        groups.polygon.push(overlayFeature);
      } else {
        // Fallback to polygon group
        groups.polygon.push(overlayFeature);
      }
    }

    // Define common fields - include layer1 fields plus new ones
    const layer1Typed = layer1 as __esri.FeatureLayer;
    const inputFields = layer1Typed.fields || [];
    const newFields = [
      new Field({ name: "operation_type", type: "string", alias: "Operation Type" }),
      new Field({ name: "source_layer1", type: "string", alias: "Source Layer 1" }),
      new Field({ name: "source_layer2", type: "string", alias: "Source Layer 2" }),
      new Field({ name: "result_index", type: "integer", alias: "Result Index" }),
      new Field({ name: "total_results", type: "integer", alias: "Total Results" }),
      new Field({ name: "area", type: "double", alias: "Area (sq meters)" }),
      new Field({ name: "length", type: "double", alias: "Length (meters)" }),
      new Field({ name: "created_at", type: "date", alias: "Created At" })
    ];
    const fields = [...inputFields, ...newFields];

    const defaultTitle = `${layer1.title || "layer1"}_${layer2.title || "layer2"}_${operation}_${Date.now()}`;
    const layerTitleBase = outputName && outputName.trim() ? outputName : defaultTitle;

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
          title: "Overlay Feature",
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