import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Collection from "@arcgis/core/core/Collection";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import useStateStore from "@/stateStore";
import { getAnalysisPointSymbol, getAnalysisLineSymbol, getAnalysisPolygonSymbol } from "@/lib/utils/symbols";

export class AnalysisService {
  /**
   * Creates a new temporary FeatureLayer for analysis results with popup enabled
   */
  static createResultLayer(title: string, geometryType?: string): FeatureLayer {
    const view = useStateStore.getState().targetView;
    
    // Define fields for the FeatureLayer
    const fields = [
      new Field({
        name: "OBJECTID",
        alias: "Object ID",
        type: "oid"
      }),
      new Field({
        name: "geometry_type",
        alias: "Geometry Type",
        type: "string"
      }),
      new Field({
        name: "area",
        alias: "Area (sq meters)",
        type: "double"
      }),
      new Field({
        name: "length",
        alias: "Length (meters)",
        type: "double"
      }),
      new Field({
        name: "created_at",
        alias: "Created At",
        type: "date"
      })
    ];

    // Determine geometry type and create appropriate symbol
    const defaultGeometryType = geometryType || "polygon";
    const rendererSymbol = this.getRandomDefaultSymbol(defaultGeometryType);

    const featureLayer = new FeatureLayer({
      title,
      visible: true,
      listMode: "show",
      source: [], // Start with empty source
      fields,
      objectIdField: "OBJECTID",
      geometryType: defaultGeometryType as any,
      spatialReference: view?.spatialReference || { wkid: 4326 },
      popupEnabled: true,
      renderer: new SimpleRenderer({
        symbol: rendererSymbol
      })
    });

    if (view?.map) {
      view.map.add(featureLayer);
      // Move to top
      view.map.reorder(featureLayer, view.map.layers.length - 1);
    }

    return featureLayer;
  }

  /**
   * Gets all features from a layer (supports both FeatureLayer and GraphicsLayer)
   */
  static async getFeaturesFromLayer(layer: __esri.FeatureLayer | __esri.GraphicsLayer): Promise<__esri.Graphic[]> {
    try {
      if (layer.type === "graphics") {
        // GraphicsLayer
        const graphicsLayer = layer as __esri.GraphicsLayer;
        return graphicsLayer.graphics.toArray();
      } else {
        // FeatureLayer
        const featureLayer = layer as __esri.FeatureLayer;
        const query = featureLayer.createQuery();
        query.where = "1=1";
        query.outFields = ["*"];
        query.returnGeometry = true;

        const result = await featureLayer.queryFeatures(query);
        return result.features;
      }
    } catch (error) {
      console.error("Error querying features:", error);
      return [];
    }
  }

  /**
   * Extracts geometries from features
   */
  static getGeometriesFromFeatures(features: __esri.Graphic[]): __esri.Geometry[] {
    return features
      .map(f => f.geometry)
      .filter(g => g !== null) as __esri.Geometry[];
  }

  /**
   * Adds geometries to a feature layer with popup configuration for all fields
   */
  static addGeometriesToLayer(geometries: __esri.Geometry[], featureLayer: FeatureLayer): void {
    if (geometries.length === 0) return;

    // Generate one random symbol for the entire layer
    const randomSymbol = this.getRandomDefaultSymbol(geometries[0]?.type || "polygon");

    // Create features with attributes for popup
    const features = geometries.map((geometry, index) => {
      const attributes: any = {
        OBJECTID: index + 1,
        geometry_type: geometry.type,
        area: geometry.type === "polygon" ? geometryEngine.geodesicArea(geometry as __esri.Polygon, "square-meters") : null,
        length: geometry.type === "polyline" ? geometryEngine.geodesicLength(geometry as __esri.Polyline, "meters") : null,
        created_at: new Date().toISOString()
      };

      return new Graphic({
        geometry,
        attributes,
        symbol: randomSymbol
      });
    });

    // Set the source
    featureLayer.source = new Collection(features);

    // Configure popup template with all fields
    const fieldInfos = featureLayer.fields.map(field => ({
      fieldName: field.name,
      label: field.alias || field.name,
      visible: true
    }));

    featureLayer.popupTemplate = {
      title: featureLayer.title,
      fieldInfos,
      content: [{
        type: "fields"
      }]
    } as any;
  }

  /**
   * Gets a random default symbol based on geometry type
   */
  static getRandomDefaultSymbol(geometryType: string): __esri.Symbol {
    switch (geometryType) {
      case "point":
      case "multipoint":
        return getAnalysisPointSymbol();

      case "polyline":
        return getAnalysisLineSymbol();

      case "polygon":
      case "extent":
        return getAnalysisPolygonSymbol();

      default:
        return getAnalysisPolygonSymbol(); // Default to polygon symbol
    }
  }

  /**
   * Validates that a layer has features (supports both FeatureLayer and GraphicsLayer)
   */
  static async validateLayerHasFeatures(layer: __esri.FeatureLayer | __esri.GraphicsLayer): Promise<boolean> {
    try {
      if (layer.type === "graphics") {
        // GraphicsLayer
        const graphicsLayer = layer as __esri.GraphicsLayer;
        return graphicsLayer.graphics.length > 0;
      } else {
        // FeatureLayer
        const featureLayer = layer as __esri.FeatureLayer;
        const count = await featureLayer.queryFeatureCount({ where: "1=1" });
        return count > 0;
      }
    } catch (error) {
      console.error("Error validating layer:", error);
      return false;
    }
  }

  /**
   * Generates a unique layer title with timestamp
   */
  static generateLayerTitle(baseTitle: string): string {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '');
    return `${baseTitle} ${timestamp}`;
  }

  /**
   * Generates output layer name in format: layername_toolname_value_minsec
   */
  static generateOutputLayerName(layerName: string, toolName: string, value: string | number): string {
    const now = new Date();
    const minsec = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/:/g, '');
    
    // Clean layer name (remove special characters and spaces)
    const cleanLayerName = layerName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanToolName = toolName.toLowerCase();
    const cleanValue = String(value).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    return `${cleanLayerName}_${cleanToolName}_${cleanValue}_${minsec}`;
  }
}