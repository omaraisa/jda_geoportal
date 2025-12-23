import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import useStateStore from "../../../stateStore";

export class AttributeJoinService {
  static async runAttributeJoin(
    targetLayer: __esri.FeatureLayer,
    joinLayer: __esri.FeatureLayer,
    targetField: string,
    joinField: string,
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
    joinQuery.returnGeometry = false; // We only need attributes from join layer
    joinQuery.outFields = ["*"];
    const joinFeatureSet = await joinLayer.queryFeatures(joinQuery);

    if (targetFeatureSet.features.length === 0 || joinFeatureSet.features.length === 0) {
      throw new Error("No features found in one or both layers");
    }

    // 2. Index join features for faster lookup
    const joinMap = new Map<string | number, any>();
    joinFeatureSet.features.forEach(f => {
      const key = f.attributes[joinField];
      if (key !== undefined && key !== null) {
        joinMap.set(key, f.attributes);
      }
    });

    // 3. Prepare fields
    const targetFields = targetLayer.fields.filter(f => 
      f.type !== "oid" && f.name !== "Shape" && f.name !== "Shape_Length" && f.name !== "Shape_Area"
    );
    
    const joinFields = joinLayer.fields.filter(f => 
      f.type !== "oid" && f.name !== "Shape" && f.name !== "Shape_Length" && f.name !== "Shape_Area" && f.name !== joinField
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
      ...joinFields
    ];

    // 4. Perform Attribute Join
    const graphics: Graphic[] = [];
    let objectIdCounter = 1;

    for (const targetFeature of targetFeatureSet.features) {
      const key = targetFeature.attributes[targetField];
      const joinedAttributes = joinMap.get(key);

      const newAttributes: any = {
        ObjectID: objectIdCounter++
      };

      // Copy target attributes
      targetFields.forEach(field => {
        if (targetFeature.attributes && targetFeature.attributes[field.name] !== undefined) {
          newAttributes[field.name] = targetFeature.attributes[field.name];
        }
      });

      // Copy joined attributes
      if (joinedAttributes) {
        joinFields.forEach(field => {
          const originalFieldName = field.name.replace("JOIN_", "");
          if (joinedAttributes[originalFieldName] !== undefined) {
            newAttributes[field.name] = joinedAttributes[originalFieldName];
          }
        });
      }

      graphics.push(new Graphic({
        geometry: targetFeature.geometry,
        attributes: newAttributes
      }));
    }

    // 5. Create Output Layer
    const resultLayer = new FeatureLayer({
      source: graphics,
      fields: fields,
      objectIdField: "ObjectID",
      geometryType: targetLayer.geometryType,
      title: outputName || `Attribute Join Result`,
      spatialReference: view.spatialReference
    });

    // 6. Set Renderer
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

    // 7. Add to map
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
          color: [0, 197, 255, 0.7],
          size: "8px",
          outline: { color: [255, 255, 255], width: 1 }
        };
      case "polyline":
        return {
          type: "simple-line",
          color: [0, 197, 255, 0.8],
          width: 2,
          style: "solid"
        };
      case "polygon":
        return {
          type: "simple-fill",
          color: [0, 197, 255, 0.5],
          style: "solid",
          outline: { color: [0, 150, 200], width: 1 }
        };
      default:
        return null;
    }
  }
}
