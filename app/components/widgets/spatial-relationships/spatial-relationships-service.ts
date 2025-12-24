import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { runQuery } from "@/lib/utils/query";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import { queryPointSymbol, queryLineSymbol, queryPolygonSymbol } from "@/lib/utils/symbols";

export type SpatialRelationship = 
  | "intersects" 
  | "contains" 
  | "crosses" 
  | "envelope-intersects" 
  | "index-intersects" 
  | "overlaps" 
  | "touches" 
  | "within" 
  | "relation"
  | "equals";

export interface RelationshipResult {
  count: number;
  message: string;
}

export class SpatialRelationshipsService {
  
  static async runSpatialRelationshipsAnalysis(
    layer1: FeatureLayer | GraphicsLayer,
    layer2: FeatureLayer | GraphicsLayer,
    relationship: SpatialRelationship,
    outputName: string
  ): Promise<{ result: RelationshipResult; resultLayer: FeatureLayer }> {
    
    // 1. Get geometry from Layer 2 (the reference layer)
    let geometry2: __esri.Geometry | null = null;

    if (layer2.type === "graphics") {
      const graphics = (layer2 as GraphicsLayer).graphics.toArray();
      if (graphics.length > 0) {
        geometry2 = geometryEngine.union(graphics.map(g => g.geometry));
      }
    } else {
      // FeatureLayer
      const query = (layer2 as FeatureLayer).createQuery();
      query.where = "1=1";
      query.returnGeometry = true;
      query.outFields = ["*"]; // We might not need fields, just geometry
      
      const result = await (layer2 as FeatureLayer).queryFeatures(query);
      if (result.features.length > 0) {
        geometry2 = geometryEngine.union(result.features.map(f => f.geometry));
      }
    }

    if (!geometry2) {
      throw new Error("Layer 2 has no features or geometry.");
    }

    // 2. Query Layer 1 using the geometry from Layer 2 and the relationship
    let resultFeatures: Graphic[] = [];

    if (layer1.type === "graphics") {
      // Client-side check for GraphicsLayer
      const graphics = (layer1 as GraphicsLayer).graphics.toArray();
      resultFeatures = graphics.filter(g => {
        if (!g.geometry) return false;
        
        switch (relationship) {
          case "intersects": return geometryEngine.intersects(g.geometry, geometry2!);
          case "contains": return geometryEngine.contains(g.geometry, geometry2!);
          case "crosses": return geometryEngine.crosses(g.geometry, geometry2!);
          case "overlaps": return geometryEngine.overlaps(g.geometry, geometry2!);
          case "touches": return geometryEngine.touches(g.geometry, geometry2!);
          case "within": return geometryEngine.within(g.geometry, geometry2!);
          case "equals": return geometryEngine.equals(g.geometry, geometry2!);
          default: return false;
        }
      });
    } else {
      // Server-side query for FeatureLayer
      const query = (layer1 as FeatureLayer).createQuery();
      query.geometry = geometry2;
      query.spatialRelationship = relationship as any;
      query.returnGeometry = true;
      query.outFields = ["*"];
      
      const featureSet = await (layer1 as FeatureLayer).queryFeatures(query);
      resultFeatures = featureSet.features;
    }

    // 3. Create Result Layer
    const resultLayer = await this.createResultLayer(layer1, resultFeatures, outputName);

    return {
      result: {
        count: resultFeatures.length,
        message: `Found ${resultFeatures.length} features.`
      },
      resultLayer
    };
  }

  private static async createResultLayer(
    sourceLayer: FeatureLayer | GraphicsLayer,
    features: Graphic[],
    title: string
  ): Promise<FeatureLayer> {
    
    let geometryType = sourceLayer.type === "feature" 
      ? (sourceLayer as FeatureLayer).geometryType 
      : features.length > 0 ? features[0].geometry.type : "polygon";

    // Fallback if geometryType is still unknown (e.g. empty features)
    if (!geometryType && sourceLayer.type === "graphics") {
        geometryType = "polygon"; // Default
    }

    const symbols: any = {
      point: queryPointSymbol,
      multipoint: queryPointSymbol,
      polyline: queryLineSymbol,
      polygon: queryPolygonSymbol,
    };
    
    const symbol = symbols[geometryType] || queryPolygonSymbol;

    let fields: Field[] = [];
    if (sourceLayer.type === "feature") {
      fields = (sourceLayer as FeatureLayer).fields.map(f => new Field({
        name: f.name,
        alias: f.alias,
        type: f.type,
        domain: f.domain,
        editable: f.editable,
        nullable: f.nullable,
        defaultValue: f.defaultValue,
        length: f.length
      }));
    } else {
      // For graphics layer, try to infer fields from first feature attributes
      if (features.length > 0 && features[0].attributes) {
        fields = Object.keys(features[0].attributes).map((key, index) => {
            const val = features[0].attributes[key];
            let type: "string" | "double" | "integer" = "string";
            if (typeof val === 'number') type = Number.isInteger(val) ? "integer" : "double";
            return new Field({
                name: key,
                alias: key,
                type: type
            });
        });
      }
      // Ensure OID
      if (!fields.some(f => f.type === "oid")) {
          fields.unshift(new Field({
              name: "ObjectID",
              alias: "ObjectID",
              type: "oid"
          }));
          
          // Assign OIDs if missing
          features.forEach((f, i) => {
              if (!f.attributes) f.attributes = {};
              f.attributes["ObjectID"] = i + 1;
          });
      }
    }

    const layer = new FeatureLayer({
      title: title || `Spatial Analysis Result`,
      source: features,
      fields: fields,
      objectIdField: fields.find(f => f.type === "oid")?.name || "ObjectID",
      geometryType: geometryType as any,
      renderer: new SimpleRenderer({ symbol }),
      popupTemplate: (sourceLayer.type === "feature" ? (sourceLayer as FeatureLayer).popupTemplate?.clone() : null) || {
        title: "{title}",
        content: [{
            type: "fields",
            fieldInfos: fields.map(f => ({ fieldName: f.name }))
        }]
      }
    });

    return layer;
  }
}
