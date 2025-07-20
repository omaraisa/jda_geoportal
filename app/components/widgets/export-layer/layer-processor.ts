import { LayerExportParams } from './types';

export class LayerProcessor {
  static async processLayer(layer: any): Promise<LayerExportParams> {
    let layerInput = "";
    let inputType = "geojson";

    // Handle FeatureLayer
    if (layer.type === "feature" && layer.layerId !== undefined) {
      layerInput =
        `${layer.url.replace(/\/+$/, "")}/${layer.layerId}/query` +
        `?where=1%3D1&outFields=*&f=geojson`;
      inputType = "geojson";
    }
    // Handle GeoJSONLayer (esri GeoJSONLayer)
    else if (layer.type === "geojson") {
      layerInput = layer.url;
      inputType = "geojson";
    }
    // Handle CSVLayer (esri CSVLayer)
    else if (layer.type === "csv") {
      if (layer.createQuery && layer.queryFeatures) {
        const query = layer.createQuery();
        query.where = "1=1";
        query.outFields = ["*"];
        query.returnGeometry = true;
        const featureSet = await layer.queryFeatures(query);
        const geojson = this.featureSetToGeoJSON(featureSet);
        layerInput = JSON.stringify(geojson);
        inputType = "geojson";
      } else {
        layerInput = layer.url;
        inputType = "geojson";
      }
    }
    // Handle MapImageLayer (Image Layer)
    else if (layer.type === "map-image") {
      layerInput = this.processMapImageLayer(layer);
    }
    // Handle KML or other types
    else {
      layerInput = layer.url;
      if (layer.url && layer.url.toLowerCase().endsWith(".kml")) {
        inputType = "kml";
      }
    }

    return { layerInput, inputType, outputType: "", outputName: "" };
  }

  private static processMapImageLayer(layer: any): string {
    // Case 1: Whole map service layer (has .layers property)
    if (Array.isArray(layer.layers) && layer.layers.length > 0) {
      const sublayerIds = layer.layers.map((l: any) => l.id);
      const subId = sublayerIds[0];
      return `${layer.url.replace(/\/+$/, "")}/${subId}/query?where=1%3D1&outFields=*&f=geojson`;
    }
    // Case 2: Only a sublayer (has .sublayers property with one item)
    else if (
      Array.isArray(layer.sublayers.toArray()) &&
      layer.sublayers.toArray()[0].id !== undefined
    ) {
      const subId = layer.sublayers.toArray()[0].id;
      return `${layer.url.replace(/\/+$/, "")}/${subId}/query?where=1%3D1&outFields=*&f=geojson`;
    }
    // Fallback: If .layerId exists, use it as sublayer
    else if (
      layer.layerId !== undefined &&
      /\/MapServer\/?$/i.test(layer.url) &&
      Number.isInteger(Number(layer.layerId)) &&
      Number(layer.layerId) >= 0
    ) {
      return `${layer.url.replace(/\/+$/, "")}/${layer.layerId}/query?where=1%3D1&outFields=*&f=geojson`;
    } else {
      return layer.url;
    }
  }

  private static featureSetToGeoJSON(featureSet: any) {
    const geojson: any = {
      type: "FeatureCollection",
      features: []
    };
    
    if (!featureSet || !featureSet.features) return geojson;
    
    for (const f of featureSet.features) {
      const geom = f.geometry && f.geometry.type === "point"
        ? {
            type: "Point",
            coordinates: [f.geometry.x, f.geometry.y]
          }
        : null; // Only handle points for CSVLayer
      geojson.features.push({
        type: "Feature",
        geometry: geom,
        properties: f.attributes
      });
    }
    
    return geojson;
  }
}
