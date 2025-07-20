import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { addQueryResult, runQuery } from "@/lib/utils/query";

export class SpatialQueryService {
  static initializeSketch(
    view: any,
    graphicsLayer: GraphicsLayer,
    container: HTMLDivElement,
    onSketchComplete: (graphic: __esri.Graphic) => void
  ): Sketch {
    const sketch = new Sketch({
      layer: graphicsLayer,
      view,
      container,
      availableCreateTools: ["polygon", "rectangle", "circle"],
      creationMode: "single",
      visibleElements: {
        settingsMenu: false,
        selectionTools: {
          "lasso-selection": false,
          "rectangle-selection": false,
        },
      },
    });

    sketch.on("create", async ({ graphic, state: sketchState }) => {
      if (sketchState === "complete") {
        onSketchComplete(graphic);
      }
    });

    return sketch;
  }

  static async queryByGeometry(
    targetLayer: __esri.FeatureLayer,
    geometry: __esri.Geometry
  ): Promise<__esri.FeatureSet | null> {
    const query = {
      geometry,
      spatialRelationship: "intersects" as __esri.QueryProperties["spatialRelationship"],
      outFields: ["*"],
      returnGeometry: true,
    };

    return await runQuery(targetLayer, query);
  }

  static async queryByLayer(
    targetLayer: __esri.FeatureLayer,
    selectionLayer: __esri.FeatureLayer
  ): Promise<__esri.FeatureSet | null> {
    const selectionFeatures = await selectionLayer.queryFeatures({
      outFields: ["*"],
      where: "1=1",
      returnGeometry: true,
    });

    const combinedGeometry = geometryEngine.union(
      selectionFeatures.features.map((feature) => feature.geometry)
    );

    const query = {
      geometry: combinedGeometry,
      spatialRelationship: "intersects" as __esri.QueryProperties["spatialRelationship"],
      outFields: ["*"],
      returnGeometry: true,
    };

    return await runQuery(targetLayer, query);
  }

  static processQueryResult(
    response: __esri.FeatureSet,
    graphicsLayer: GraphicsLayer,
    view: any,
    targetLayer: __esri.FeatureLayer,
    widgets: any
  ): void {
    if (response && response.features.length) {
      addQueryResult(response.features, graphicsLayer, view, targetLayer, widgets);
    }
  }
}
