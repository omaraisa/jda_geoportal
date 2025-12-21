import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { addQueryResult, runQuery, createSeparateLayer } from "@/lib/utils/query";
import Graphic from "@arcgis/core/Graphic";

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

  static async switchSelection(
    targetLayer: __esri.FeatureLayer,
    graphicsLayer: GraphicsLayer,
    view: any,
    widgets: any
  ): Promise<void> {
    try {
      // Query all features from the target layer
      const allFeaturesQuery = {
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true,
      };

      const allFeaturesResponse = await targetLayer.queryFeatures(allFeaturesQuery);
      const allFeatures = allFeaturesResponse.features || [];

      // Get currently selected features from the graphics layer
      const currentSelection = graphicsLayer.graphics.toArray();

      // Find features that are not currently selected
      const unselectedFeatures = allFeatures.filter((feature) => {
        return !currentSelection.some((selectedGraphic) => {
          // Compare by OBJECTID or another unique identifier
          return selectedGraphic.attributes?.OBJECTID === feature.attributes?.OBJECTID;
        });
      });

      // Clear current selection
      graphicsLayer.removeAll();

      // Add the previously unselected features to create the switched selection
      if (unselectedFeatures.length > 0) {
        addQueryResult(unselectedFeatures, graphicsLayer, view, targetLayer, widgets);
      }
    } catch (error) {
      console.error("Error switching selection:", error);
    }
  }

  static createLayerFromResults(
    targetLayer: __esri.FeatureLayer,
    resultLayerSource: Graphic[],
    view: any,
    uniqueTitle: string
  ): void {
    createSeparateLayer(targetLayer, resultLayerSource, view, uniqueTitle);
  }
}
