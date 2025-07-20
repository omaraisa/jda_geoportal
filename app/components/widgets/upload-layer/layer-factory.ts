import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import KMLLayer from "@arcgis/core/layers/KMLLayer";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import { LayerCreationOptions } from './types';

export class LayerFactory {
  static createLayer(options: LayerCreationOptions): __esri.Layer | null {
    const { url, title, fileType } = options;

    if (fileType === "geojson" || url.endsWith(".geojson") || url.endsWith(".json")) {
      return new GeoJSONLayer({
        url,
        title,
      });
    }
    else if (fileType === "kml" || url.endsWith(".kml") || url.endsWith(".kmz")) {
      return new KMLLayer({
        url,
        title,
      });
    }
    else if (fileType === "csv" || url.endsWith(".csv")) {
      return new CSVLayer({
        url,
        title,
      });
    }

    return null;
  }

  static addLayerToMap(
    layer: __esri.Layer, 
    view: __esri.MapView | __esri.SceneView,
    shouldZoom = true, 
    onAfterZoom?: () => void
  ): void {
    if (view && view.map && typeof view.map.add === "function") {
      (layer as any).group = "My Layers";
      view.map.add(layer);
      
      if (shouldZoom) {
        layer.when(() => {
          view.goTo(layer.fullExtent).then(() => {
            if (onAfterZoom) onAfterZoom();
          });
        });
      } else {
        if (onAfterZoom) onAfterZoom();
      }
    }
  }

  static async zoomToLayers(
    layers: __esri.Layer[], 
    view: __esri.MapView | __esri.SceneView
  ): Promise<void> {
    if (layers.length === 0) return;

    await Promise.all(layers.map(l => l.when()));
    
    // Calculate union of all extents
    const extents = layers
      .map(l => l.fullExtent)
      .filter(Boolean);
      
    if (extents.length === 1) {
      await view.goTo(extents[0]);
    } else if (extents.length > 1) {
      // Union extents
      let unionExtent = extents[0].clone();
      for (let i = 1; i < extents.length; i++) {
        unionExtent = unionExtent.union(extents[i]);
      }
      await view.goTo(unionExtent);
    }
  }

  static generateLayerTitle(
    subLayer: string | undefined, 
    customTitle: string, 
    fileName: string, 
    originalFileName: string
  ): string {
    return subLayer || 
           customTitle || 
           fileName?.replace(/\.[^/.]+$/, "") || 
           originalFileName.replace(/\.[^/.]+$/, "");
  }
}
