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
  static createResultLayer(title: string, geometryType?: string, geometries?: __esri.Geometry[]): FeatureLayer {
    console.log("AnalysisService.createResultLayer - Creating result layer:", title, "geometryType:", geometryType, "geometries:", geometries?.length || 0);

    const view = useStateStore.getState().targetView;
    console.log("AnalysisService.createResultLayer - Map view spatial reference:", view?.spatialReference);
    
    // Check geometries spatial reference
    if (geometries && geometries.length > 0) {
      console.log("AnalysisService.createResultLayer - First geometry spatial reference:", geometries[0].spatialReference);
      console.log("AnalysisService.createResultLayer - First geometry type:", geometries[0].type);
      console.log("AnalysisService.createResultLayer - First geometry coordinates sample:", geometries[0].type === "polygon" ? (geometries[0] as __esri.Polygon).rings?.[0]?.slice(0, 3) : "N/A");
    }
    
    // Generate one random symbol for the entire layer
    const defaultGeometryType = geometryType || "polygon";
    const rendererSymbol = this.getRandomDefaultSymbol(defaultGeometryType);
    console.log("AnalysisService.createResultLayer - Using symbol for geometry type:", defaultGeometryType);

    // If geometries are provided, create features
    let source: __esri.Graphic[] = [];
    if (geometries && geometries.length > 0) {
      console.log("AnalysisService.createResultLayer - Creating features from", geometries.length, "geometries");
      source = geometries.map((geometry, index) => {
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
          symbol: rendererSymbol
        });
      });
      console.log("AnalysisService.createResultLayer - Created", source.length, "features");
    }

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

    // Wrap source in a Collection to ensure the client-side FeatureLayer behaves correctly
    const sourceCollection = new Collection(source as any);
    console.log("AnalysisService.createResultLayer - Creating FeatureLayer with source length:", sourceCollection.length);

    // Use a safe id derived from the title so the layer can be reliably referenced by id
    const safeId = title.replace(/[^a-zA-Z0-9_\-]/g, "_");

    const featureLayer = new FeatureLayer({
      id: safeId,
      title,
      visible: true,
      listMode: "show",
      source: sourceCollection as any,
      fields,
      objectIdField: "OBJECTID",
      geometryType: defaultGeometryType as any,
      spatialReference: view?.spatialReference || { wkid: 4326 },
      popupEnabled: true,
      renderer: new SimpleRenderer({
        symbol: rendererSymbol
      })
    });

    console.log("AnalysisService.createResultLayer - FeatureLayer created, source length:", featureLayer.source?.length || 0);

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

    if (view?.map) {
      console.log("AnalysisService.createResultLayer - Adding layer to map");
      view.map.layers.add(featureLayer);
      // Move to top
      view.map.reorder(featureLayer, view.map.layers.length - 1);
      console.log("AnalysisService.createResultLayer - Layer added to map at position:", view.map.layers.length - 1);
    } else {
      console.warn("AnalysisService.createResultLayer - No view or map available to add layer");
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
        const features = graphicsLayer.graphics.toArray();
        console.log("AnalysisService.getFeaturesFromLayer - GraphicsLayer features:", features.length);
        return features;
      } else {
        // FeatureLayer
        const featureLayer = layer as __esri.FeatureLayer;
        const query = featureLayer.createQuery();
        query.where = "1=1";
        query.outFields = ["*"];
        query.returnGeometry = true;

        console.log("AnalysisService.getFeaturesFromLayer - Querying FeatureLayer:", featureLayer.title);
        const result = await featureLayer.queryFeatures(query);
        console.log("AnalysisService.getFeaturesFromLayer - FeatureLayer query result features:", result.features.length);
        return result.features;
      }
    } catch (error) {
      console.error("AnalysisService.getFeaturesFromLayer - Error querying features:", error);
      return [];
    }
  }

  /**
   * Extracts geometries from features
   */
  static getGeometriesFromFeatures(features: __esri.Graphic[]): __esri.Geometry[] {
    const geometries = features
      .map(f => f.geometry)
      .filter(g => g !== null) as __esri.Geometry[];
    console.log("AnalysisService.getGeometriesFromFeatures - Input features:", features.length, "Valid geometries:", geometries.length);
    return geometries;
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

  // Set the source as a Collection of Graphics so the layer is queryable by FeatureTable
  featureLayer.source = new Collection(features as any) as any;

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
        const count = graphicsLayer.graphics.length;
        console.log("AnalysisService.validateLayerHasFeatures - GraphicsLayer graphics count:", count);
        return count > 0;
      } else {
        // FeatureLayer
        const featureLayer = layer as __esri.FeatureLayer;
        if (!featureLayer.url) {
          // Client-side FeatureLayer
          const count = featureLayer.source?.length || 0;
          console.log("AnalysisService.validateLayerHasFeatures - Client-side FeatureLayer source count:", count);
          return count > 0;
        } else {
          // Server-side FeatureLayer
          const count = await featureLayer.queryFeatureCount({ where: "1=1" });
          console.log("AnalysisService.validateLayerHasFeatures - Server-side FeatureLayer feature count:", count);
          return count > 0;
        }
      }
    } catch (error) {
      console.error("AnalysisService.validateLayerHasFeatures - Error validating layer:", error);
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