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
      // Ensure the graphics layer has a proper title and is added to the map
      if (!graphicsLayer.title) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        const timeCode = `${hours}${minutes}${seconds}`;
        graphicsLayer.title = `${targetLayer?.title || "Layer"} - Spatial Query ${timeCode}`;
        (graphicsLayer as any).group = "My Layers";
      }
      
      // Ensure the graphics layer is added to the map and visible
      if (view && !view.map.layers.includes(graphicsLayer)) {
        view.map.add(graphicsLayer);
      }
      
      // Make sure the layer is visible and on top
      graphicsLayer.visible = true;
      graphicsLayer.listMode = "show";
      
      // Move the graphics layer to the top
      if (view && view.map.layers.includes(graphicsLayer)) {
        view.map.reorder(graphicsLayer, view.map.layers.length - 1);
      }
      
      // Clear any existing graphics
      graphicsLayer.removeAll();
      
      addQueryResult(response.features, graphicsLayer, view, targetLayer, widgets);
    }
  }
}
