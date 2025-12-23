import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import useStateStore from "../../../stateStore";

export type SpatialJoinRelationship = "intersects" | "contains" | "within" | "overlaps" | "touches" | "crosses";

export class SpatialJoinService {
  static async runSpatialJoin(
    targetLayer: __esri.FeatureLayer,
    joinLayer: __esri.FeatureLayer,
    relationship: SpatialJoinRelationship,
    outputName: string
  ): Promise<FeatureLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

    // 1. Get all features from both layers
    const targetQuery = targetLayer.createQuery();
    targetQuery.where = "1=1";
    targetQuery.returnGeometry = true;
    targetQuery.outFields = ["*"];
    const targetFeatureSet = await targetLayer.queryFeatures(targetQuery);

    const joinQuery = joinLayer.createQuery();
    joinQuery.where = "1=1";
    joinQuery.returnGeometry = true;
    joinQuery.outFields = ["*"];
    const joinFeatureSet = await joinLayer.queryFeatures(joinQuery);

    if (targetFeatureSet.features.length === 0 || joinFeatureSet.features.length === 0) {
      throw new Error("No features found in one or both layers");
    }

    // 2. Prepare fields
    // Combine fields from both layers, prefixing join layer fields to avoid collision
    const targetFields = targetLayer.fields.filter(f => 
      f.type !== "oid" && f.name !== "Shape" && f.name !== "Shape_Length" && f.name !== "Shape_Area"
    );
    
    const joinFields = joinLayer.fields.filter(f => 
      f.type !== "oid" && f.name !== "Shape" && f.name !== "Shape_Length" && f.name !== "Shape_Area"
    ).map(f => {
      const newField = new Field({
        name: `JOIN_${f.name}`,
        alias: `Join: ${f.alias || f.name}`,
        type: f.type,
        length: f.length
      });
      return newField;
    });

    const fields = [
      new Field({ name: "ObjectID", alias: "ObjectID", type: "oid" }),
      ...targetFields,
      ...joinFields,
      new Field({ name: "Join_Count", alias: "Join Count", type: "integer" })
    ];

    // 3. Perform Spatial Join
    const graphics: Graphic[] = [];
    let objectIdCounter = 1;

    for (const targetFeature of targetFeatureSet.features) {
      if (!targetFeature.geometry) continue;

      let joinCount = 0;
      let joinedAttributes: any = {};

      // Find matching features in join layer
      const matchingFeatures = joinFeatureSet.features.filter(joinFeature => {
        if (!joinFeature.geometry) return false;
        
        switch (relationship) {
          case "intersects": return geometryEngine.intersects(targetFeature.geometry, joinFeature.geometry);
          case "contains": return geometryEngine.contains(targetFeature.geometry, joinFeature.geometry);
          case "within": return geometryEngine.within(targetFeature.geometry, joinFeature.geometry);
          case "overlaps": return geometryEngine.overlaps(targetFeature.geometry, joinFeature.geometry);
          case "touches": return geometryEngine.touches(targetFeature.geometry, joinFeature.geometry);
          case "crosses": return geometryEngine.crosses(targetFeature.geometry, joinFeature.geometry);
          default: return false;
        }
      });

      joinCount = matchingFeatures.length;

      // For one-to-one join (taking the first match if multiple)
      if (joinCount > 0) {
        const firstMatch = matchingFeatures[0];
        joinFields.forEach(field => {
          const originalFieldName = field.name.replace("JOIN_", "");
          if (firstMatch.attributes && firstMatch.attributes[originalFieldName] !== undefined) {
            joinedAttributes[field.name] = firstMatch.attributes[originalFieldName];
          }
        });
      }

      // Construct new attributes
      const newAttributes: any = {
        ObjectID: objectIdCounter++,
        Join_Count: joinCount,
        ...joinedAttributes
      };

      // Copy target attributes
      targetFields.forEach(field => {
        if (targetFeature.attributes && targetFeature.attributes[field.name] !== undefined) {
          newAttributes[field.name] = targetFeature.attributes[field.name];
        }
      });

      graphics.push(new Graphic({
        geometry: targetFeature.geometry,
        attributes: newAttributes
      }));
    }

    // 4. Create Output Layer
    const resultLayer = new FeatureLayer({
      source: graphics,
      fields: fields,
      objectIdField: "ObjectID",
      geometryType: targetLayer.geometryType,
      title: outputName || `Spatial Join Result`,
      spatialReference: view.spatialReference
    });

    // 5. Set Renderer
    if (targetLayer.renderer) {
        try {
            // @ts-ignore - clone exists on Renderer but might not be in type definition
            resultLayer.renderer = targetLayer.renderer.clone();
        } catch {
            resultLayer.renderer = new SimpleRenderer({
                symbol: this.getDefaultSymbol(targetLayer.geometryType)
            });
        }
    } else {
        resultLayer.renderer = new SimpleRenderer({
            symbol: this.getDefaultSymbol(targetLayer.geometryType)
        });
    }

    // 6. Add to map
    view.map.add(resultLayer);

    return resultLayer;
  }

  private static getDefaultSymbol(geometryType: string): any {
    switch (geometryType) {
      case "point":
      case "multipoint":
        return {
          type: "simple-marker",
          style: "circle",
          color: [255, 0, 197, 0.7],
          size: "8px",
          outline: { color: [255, 255, 255], width: 1 }
        };
      case "polyline":
        return {
          type: "simple-line",
          color: [255, 0, 197, 0.8],
          width: 2,
          style: "solid"
        };
      case "polygon":
        return {
          type: "simple-fill",
          color: [255, 0, 197, 0.5],
          style: "solid",
          outline: { color: [200, 0, 150], width: 1 }
        };
      default:
        return null;
    }
  }
}
