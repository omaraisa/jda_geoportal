import { LayerGroup } from './types';

export const processMapServiceSublayer = (
  baseServiceUrl: string, 
  sublayerId: number, 
  layer: any, 
  mapServiceGroups: Map<string, LayerGroup>
) => {
  if (!mapServiceGroups.has(baseServiceUrl)) {
    // Create a new MapService group
    mapServiceGroups.set(baseServiceUrl, {
      id: `mapservice_${Date.now()}`, // Use timestamp to ensure uniqueness
      title: baseServiceUrl.split('/').slice(-2, -1)[0] || 'MapService', // Extract service name
      opacity: layer.opacity,
      visible: true,
      url: baseServiceUrl,
      layerType: "ArcGISMapServiceLayer",
      visibleLayers: [],
      layerDefinition: {
        dynamicLayers: []
      }
    });
  }

  const group = mapServiceGroups.get(baseServiceUrl)!;
  
  // Add sublayer to visibleLayers if not already present
  if (!group.visibleLayers!.includes(sublayerId)) {
    group.visibleLayers!.push(sublayerId);
    
    // Add dynamic layer definition
    group.layerDefinition!.dynamicLayers.push({
      id: sublayerId,
      source: {
        type: "mapLayer",
        mapLayerId: sublayerId
      },
      definitionExpression: layer.definitionExpression || null
    });
  }
};

export const processFeatureLayer = (layer: any): LayerGroup => {
  return {
    id: layer.id,
    title: layer.title,
    opacity: layer.opacity,
    visible: layer.visible,
    url: layer.url,
    layerType: "FeatureLayer",
    definitionExpression: layer.definitionExpression || null
  };
};

export const processMapImageLayer = (layer: any, mapServiceGroups: Map<string, LayerGroup>) => {
  const baseUrl = layer.url.split('?')[0];
  
  if (!mapServiceGroups.has(baseUrl)) {
    mapServiceGroups.set(baseUrl, {
      id: layer.id,
      title: layer.title,
      opacity: layer.opacity,
      visible: true,
      url: baseUrl,
      layerType: "ArcGISMapServiceLayer",
      visibleLayers: [],
      layerDefinition: {
        dynamicLayers: []
      }
    });
  }

  const group = mapServiceGroups.get(baseUrl)!;
  
  // Add visible sublayers
  if (layer.sublayers && layer.sublayers.length > 0) {
    layer.sublayers.forEach((sublayer: { id: number; visible: boolean }) => {
      if (sublayer.visible && !group.visibleLayers!.includes(sublayer.id)) {
        group.visibleLayers!.push(sublayer.id);
        group.layerDefinition!.dynamicLayers.push({
          id: sublayer.id,
          source: {
            type: "mapLayer",
            mapLayerId: sublayer.id
          }
        });
      }
    });
  }
};

export const processOtherLayer = (layer: any): LayerGroup | null => {
  if (!('url' in layer) || !layer.url) return null;

  let layerType = "";
  switch (layer.type) {
    case "tile":
      layerType = "ArcGISTiledMapServiceLayer";
      break;
    case "vector-tile":
      layerType = "VectorTileLayer";
      break;
    case "imagery":
      layerType = "ArcGISImageServiceLayer";
      break;
    case "csv":
      layerType = "CSV";
      break;
    case "kml":
      layerType = "KML";
      break;
    default:
      return null;
  }

  return {
    id: layer.id,
    title: layer.title,
    opacity: layer.opacity,
    visible: layer.visible,
    url: layer.url,
    layerType,
  };
};

export const processAllLayers = (view: any): LayerGroup[] => {
  const allLayers = view.map.layers.toArray();
  const mapServiceGroups = new Map<string, LayerGroup>();
  const standaloneFeatureLayers: LayerGroup[] = [];

  allLayers.forEach((layer: any) => {
    if (!layer.visible) return;

    // Check if this is a sublayer from a MapService
    if (layer.type === "feature" && "url" in layer && layer.url) {
      const layerUrl = layer.url;
      const layerId = layer.id;
      
      // First try the URL pattern (for properly formatted URLs)
      const sublayerMatch = layerUrl.match(/(.+\/MapServer)\/(\d+)$/);
      
      // If URL doesn't have sublayer ID, check if layer ID contains sublayer info
      // Pattern: "serviceId_sublayerId" (e.g., "201ad290ac2d419da2090b057214d94e_3")
      const layerIdMatch = layerId.match(/^(.+)_(\d+)$/);
      
      if (sublayerMatch) {
        // URL-based sublayer detection
        const baseServiceUrl = sublayerMatch[1];
        const sublayerId = parseInt(sublayerMatch[2]);
        
        // Process as MapService sublayer
        processMapServiceSublayer(baseServiceUrl, sublayerId, layer, mapServiceGroups);
        
      } else if (layerIdMatch && layerUrl.endsWith('/MapServer')) {
        // ID-based sublayer detection
        const baseServiceUrl = layerUrl;
        const sublayerId = parseInt(layerIdMatch[2]);
        
        // Process as MapService sublayer
        processMapServiceSublayer(baseServiceUrl, sublayerId, layer, mapServiceGroups);
        
      } else {
        // This is a standalone FeatureLayer
        standaloneFeatureLayers.push(processFeatureLayer(layer));
      }
    } else if (layer.type === "map-image" && "url" in layer && layer.url) {
      // Handle existing MapImageLayers
      processMapImageLayer(layer, mapServiceGroups);
    } else {
      // Handle other layer types (Tile, VectorTile, etc.)
      const processedLayer = processOtherLayer(layer);
      if (processedLayer) {
        standaloneFeatureLayers.push(processedLayer);
      }
    }
  });

  // Combine all layers
  return [
    ...Array.from(mapServiceGroups.values()),
    ...standaloneFeatureLayers
  ];
};
