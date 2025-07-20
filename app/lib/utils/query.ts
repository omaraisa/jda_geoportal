import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import { queryPointSymbol, queryLineSymbol, queryPolygonSymbol } from "@/lib/symbols";

export function addQueryResult(
  features: __esri.Graphic[],
  graphicsLayer: GraphicsLayer | null,
  view: __esri.MapView | __esri.SceneView | null,
  targetLayer: __esri.FeatureLayer | null,
  widgets: any
) {
  if (!graphicsLayer || !view || !targetLayer) return;

  graphicsLayer.removeAll();

  features.forEach((feature) => {
    const outlineGraphic = new Graphic({
      geometry: feature.geometry,
      symbol: {
        type: "simple-fill",
        color: [0, 0, 0, 0],
        outline: {
          color: "cyan",
          width: "2px",
        },
      } as __esri.SimpleFillSymbolProperties,
    });
    graphicsLayer.add(outlineGraphic);
  });

  if (widgets.featureTableWidget) {
    const objectIds = features.map(
      (feature) => feature.attributes[targetLayer.objectIdField]
    );
    const featureTable = widgets.featureTableWidget as __esri.FeatureTable;
    featureTable.highlightIds.removeAll();
    featureTable.highlightIds.addMany(objectIds);
    featureTable.filterBySelection();
  }

  view.goTo(features);
}

export function clearSelection(
  graphicsLayer: GraphicsLayer | null,
  view: __esri.MapView | __esri.SceneView | null,
  targetLayer: __esri.FeatureLayer | null,
  widgets: any
) {
  if (!view) return;

  if (graphicsLayer) {
    graphicsLayer.removeAll();
  }

  if (widgets.featureTableWidget) {
    (widgets.featureTableWidget as __esri.FeatureTable).highlightIds.removeAll();
  }

  if (targetLayer) {
    view.whenLayerView(targetLayer).then((layerView) => {
      if (layerView) {
        (layerView as __esri.FeatureLayerView).featureEffect = {} as __esri.FeatureEffect;
      }
    });
  }

  view.map.layers.forEach((layer) => {
    if (layer.title === "Query Results") {
      view.map.remove(layer);
    }
  });

  view.graphics.removeAll();
}

export async function runQuery(
  targetLayer: __esri.FeatureLayer,
  query: __esri.QueryProperties
): Promise<__esri.FeatureSet | null> {
  try {
    const response = await targetLayer.queryFeatures(query);
    return response;
  } catch (error) {
    console.error("Query Error:", error);
    return null;
  }
}

export function createSeparateLayer(
    targetLayer: __esri.FeatureLayer,
    source: __esri.Graphic[],
    view: __esri.MapView | __esri.SceneView | null,
    customTitle?: string
) {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    const symbols: any = {
        point: queryPointSymbol,
        polyline: queryLineSymbol,
        polygon: queryPolygonSymbol,
    };
    const newSymbol = symbols[targetLayer.geometryType];

    const fieldInfos = targetLayer.fields.map((field: any) => {
        return { fieldName: field.name };
    });

    const popupTemplate = {
        content: [
            {
                type: "fields",
                fieldInfos: fieldInfos,
            },
        ],
    };

    const fields = targetLayer.fields;
    if (!fields.some((field: any) => field.type === "oid")) {
        fields.unshift({
            name: "ObjectID",
            type: "oid",
        } as Field);
    }

    const newSelectionLayer = new FeatureLayer({
        title: customTitle || `${targetLayer.title}_${Date.now()}`,
        geometryType: targetLayer.geometryType,
        spatialReference: targetLayer.spatialReference,
        popupEnabled: true,
        source: source,
        fields,
        renderer: new SimpleRenderer({
            symbol: newSymbol,
        }),
        popupTemplate,
    });
    (newSelectionLayer as any).group = "MyLayers";

    if (view) {
        view.map.layers.add(newSelectionLayer);
    }
}
