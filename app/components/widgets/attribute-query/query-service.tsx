import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { addQueryResult, clearSelection, createSeparateLayer } from "@/lib/utils/query";
import { AttributeQueryState } from "@/interface";

export class AttributeQueryService {
  static async getUniqueValues(
    layer: FeatureLayer,
    fieldName: string
  ): Promise<any[]> {
    const query = {
      where: "1=1",
      returnDistinctValues: true,
      outFields: [fieldName],
      orderByFields: [fieldName],
      returnGeometry: false,
    };

    const response = await layer.queryFeatures(query);
    return response.features.map((feature: any) => feature.attributes[fieldName]);
  }

  static async executeQuery(
    layer: FeatureLayer,
    queryExpression: string
  ): Promise<any> {
    const query = {
      outFields: ["*"],
      returnGeometry: true,
      where: queryExpression,
    };

    return await layer.queryFeatures(query);
  }

  static buildQueryExpression(
    queryField: string,
    queryOperator: string,
    queryValue: string,
    layer: FeatureLayer
  ): string {
    const selectedField = layer.fields?.find(
      (field: any) => field.name === queryField
    );
    const isTextField = selectedField?.type === "string";
    
    let processedValue = queryValue;
    if (isTextField && queryValue && !queryValue.startsWith("'") && !queryValue.endsWith("'")) {
      processedValue = `'${queryValue}'`;
    }

    return queryField + queryOperator + processedValue;
  }

static processQueryResult(
    response: any,
    state: AttributeQueryState,
    view: any,
    widgets: any
): {
    graphicsLayer: GraphicsLayer;
    resultLayerSource: Graphic[];
    uniqueTitle: string;
} {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const timeCode = `${hours}${minutes}${seconds}`;
    const uniqueTitle = `${state.targetLayer?.title || "Layer"} - Query ${timeCode}`;

    const graphicsLayer =
        state.graphicsLayer ||
        new GraphicsLayer({ title: uniqueTitle, group: "My Layers" } as any);
    view?.map.add(graphicsLayer);

    addQueryResult(response.features, graphicsLayer, view, state.targetLayer, widgets);

    const resultLayerSource = response.features.map(
        (feature: any) =>
            new Graphic({
                geometry: feature.geometry,
                attributes: feature.attributes,
            })
    );

    return { graphicsLayer, resultLayerSource, uniqueTitle };
}

static clearQueryResults(
    state: AttributeQueryState,
    view: any,
    widgets: any
): void {
    clearSelection(state.graphicsLayer, view, state.targetLayer, widgets);
}

  static async switchSelection(
    targetLayer: FeatureLayer,
    graphicsLayer: GraphicsLayer,
    view: any,
    widgets: any
  ): Promise<void> {
    if (!targetLayer || !graphicsLayer) return;

    // Get all features from the target layer
    const allFeaturesQuery = {
      where: "1=1",
      outFields: ["*"],
      returnGeometry: true,
    };

    const allFeatures = await targetLayer.queryFeatures(allFeaturesQuery);
    
    // Get currently selected features (those in the graphics layer)
    const selectedFeatures = graphicsLayer.graphics.toArray();
    
    // Create a set of selected feature IDs for quick lookup
    const selectedIds = new Set(
      selectedFeatures.map(feature => {
        // Use objectId or create a unique identifier
        return feature.attributes?.OBJECTID || feature.attributes?.objectId || 
               JSON.stringify(feature.attributes);
      })
    );

    // Find features that are NOT currently selected
    const unselectedFeatures = allFeatures.features.filter(feature => {
      const featureId = feature.attributes?.OBJECTID || feature.attributes?.objectId || 
                       JSON.stringify(feature.attributes);
      return !selectedIds.has(featureId);
    });

    // Clear current selection
    graphicsLayer.removeAll();

    // Add the previously unselected features to create the switched selection
    if (unselectedFeatures.length > 0) {
      addQueryResult(unselectedFeatures, graphicsLayer, view, targetLayer, widgets);
    }
  }

  static createLayerFromResults(
    targetLayer: FeatureLayer,
    resultLayerSource: Graphic[],
    view: any,
    uniqueTitle: string
  ): void {
    createSeparateLayer(targetLayer, resultLayerSource, view, uniqueTitle);
  }
}
