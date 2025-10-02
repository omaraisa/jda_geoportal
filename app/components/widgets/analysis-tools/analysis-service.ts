import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import useStateStore from "@/stateStore";
import { getAnalysisPointSymbol, getAnalysisLineSymbol, getAnalysisPolygonSymbol } from "@/lib/utils/symbols";

export class AnalysisService {
  /**
   * Creates a new temporary GraphicsLayer for analysis results
   */
  static createResultLayer(title: string): GraphicsLayer {
    const graphicsLayer = new GraphicsLayer({
      title,
      visible: true,
      listMode: "show"
    });

    const view = useStateStore.getState().targetView;
    if (view?.map) {
      view.map.add(graphicsLayer);
      // Move to top
      view.map.reorder(graphicsLayer, view.map.layers.length - 1);
    }

    return graphicsLayer;
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
   * Adds geometries to a graphics layer with a consistent random symbol for the entire layer
   */
  static addGeometriesToLayer(geometries: __esri.Geometry[], graphicsLayer: GraphicsLayer): void {
    // Clear any existing graphics
    graphicsLayer.removeAll();

    // Generate one random symbol for the entire layer
    const randomSymbol = this.getRandomDefaultSymbol(geometries[0]?.type || "polygon");

    const graphics = geometries.map(geometry => {
      const graphic = new Graphic({
        geometry,
        symbol: randomSymbol
      });
      return graphic;
    });

    graphicsLayer.addMany(graphics);
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