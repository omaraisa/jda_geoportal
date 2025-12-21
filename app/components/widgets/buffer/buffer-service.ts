import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import Geometry from "@arcgis/core/geometry/Geometry";
import Polygon from "@arcgis/core/geometry/Polygon";
import esriRequest from "@arcgis/core/request";
import { getAnalysisPolygonSymbol } from "../../../lib/utils/symbols";
import useStateStore from "../../../stateStore";
import { getArcGISToken } from "../../../lib/utils/authenticate-arcgis";

export class BufferService {
  /**
   * Simple buffer analysis - creates individual buffer features for each input feature
   */
  static async runBufferAnalysis(
    inputLayer: __esri.FeatureLayer,
    distances: number[],
    unit: string
  ): Promise<FeatureLayer> {
    const view = useStateStore.getState().targetView;
    if (!view) throw new Error("No view available");

    // Get all features from input layer
    const query = inputLayer.createQuery();
    query.where = "1=1";
    query.returnGeometry = true;
    const featureSet = await inputLayer.queryFeatures(query);

    if (featureSet.features.length === 0) {
      throw new Error("No features found in input layer");
    }

    // Create buffers for each distance
    const bufferFeatures: Graphic[] = [];
    let objectIdCounter = 1;

    for (const distance of distances) {
      const inputGeometries = featureSet.features.map(f => f.geometry).filter(g => g !== null && g !== undefined);

      if (inputGeometries.length === 0) continue;

      // Group geometries by type since ArcGIS buffer requires same geometry type per request
      const geometriesByType: Map<string, __esri.Geometry[]> = new Map();
      inputGeometries.forEach(geom => {
        const type = geom.type;
        if (!geometriesByType.has(type)) {
          geometriesByType.set(type, []);
        }
        geometriesByType.get(type)!.push(geom);
      });

      // Process each geometry type separately
      for (const [geometryType, geometries] of geometriesByType) {
        // Get current ArcGIS token
        const token = await getArcGISToken();
        if (!token) {
          throw new Error('No valid ArcGIS token available. Please authenticate.');
        }

        // Use server-side geometry service for buffering via REST API
        const bufferUrl = `${process.env.NEXT_PUBLIC_GP_SERVICE_URL}/buffer`;
        
        // Prepare geometries in the correct format for ArcGIS GeometryServer buffer operation
        const geometriesParam = {
          geometryType: geometryType === "point" ? "esriGeometryPoint" : 
                        geometryType === "polyline" ? "esriGeometryPolyline" : 
                        geometryType === "polygon" ? "esriGeometryPolygon" : 
                        geometryType === "multipoint" ? "esriGeometryMultipoint" : "esriGeometryPolygon",
          geometries: geometries.map(g => {
            const geomJson = g.toJSON();
            // Remove spatial reference from individual geometries as it goes in the main parameter
            delete geomJson.spatialReference;
            return geomJson;
          })
        };

        const inSR = geometries[0].spatialReference?.wkid || 4326;
        const unitCode = unit === "meters" ? 9001 : 
                         unit === "kilometers" ? 9036 : 
                         unit === "feet" ? 9002 : 
                         unit === "yards" ? 9096 : 
                         unit === "miles" ? 9035 : 9001;

        // Use FormData for proper ArcGIS Server request
        const formData = new FormData();
        formData.append('geometries', JSON.stringify(geometriesParam));
        formData.append('inSR', inSR.toString());
        formData.append('outSR', view.spatialReference.wkid.toString());
        formData.append('bufferSR', inSR.toString());
        formData.append('distances', distance.toString());
        formData.append('unit', unitCode.toString());
        formData.append('unionResults', 'false');
        formData.append('token', token);
        formData.append('f', 'json');

        const response = await esriRequest(bufferUrl, {
          method: "post",
          body: formData
        });

        // Check for ArcGIS Server errors
        if (response.data.error) {
          console.error('ArcGIS Server error:', response.data.error);
          throw new Error(`Buffer operation failed: ${response.data.error.message || 'Unknown error'}. Details: ${JSON.stringify(response.data.error.details || [])}`);
        }

        if (!response.data || !response.data.geometries) {
          console.error('Invalid response structure:', response.data);
          throw new Error('Invalid response from buffer service - no geometries returned');
        }

        const bufferResults = response.data.geometries;

        // Buffer results are always polygons regardless of input geometry type
        for (let i = 0; i < bufferResults.length; i++) {
          const bufferGeometryJson = bufferResults[i];

          // Create polygon geometry from buffer result
          let bufferGeometry: __esri.Polygon;
          try {
            // Construct proper polygon from the geometry service response
            bufferGeometry = new Polygon({
              rings: bufferGeometryJson.rings,
              spatialReference: bufferGeometryJson.spatialReference || { wkid: view.spatialReference.wkid }
            });
          } catch (error) {
            console.error(`Error creating buffer geometry for feature ${i}:`, error, bufferGeometryJson);
            continue;
          }

          // Validate polygon geometry
          if (!bufferGeometry || !bufferGeometry.rings || bufferGeometry.rings.length === 0) {
            console.warn(`Invalid buffer polygon geometry for feature ${i}, skipping`);
            continue;
          }

          const originalFeature = featureSet.features.find(f => f.geometry === geometries[i]);
          if (!originalFeature) continue;

          // Create feature with buffer polygon geometry
          const bufferFeature = new Graphic({
            geometry: bufferGeometry,
            attributes: {
              ...originalFeature.attributes,
              OBJECTID: objectIdCounter++,
              buffer_distance: distance,
              buffer_unit: unit,
              source_layer: inputLayer.title,
              source_objectid: originalFeature.attributes[inputLayer.objectIdField],
              created_at: Date.now()
            }
          });

          bufferFeatures.push(bufferFeature);
        }
      }
    }

    // Define fields - include input layer fields plus new ones
    const inputFields = inputLayer.fields || [];
    const newFields = [
      new Field({ name: "buffer_distance", type: "double", alias: "Buffer Distance" }),
      new Field({ name: "buffer_unit", type: "string", alias: "Buffer Unit" }),
      new Field({ name: "source_layer", type: "string", alias: "Source Layer" }),
      new Field({ name: "source_objectid", type: "integer", alias: "Source Object ID" }),
      new Field({ name: "created_at", type: "date", alias: "Created At" })
    ];
    const fields = [...inputFields, ...newFields];

    // Create polygon symbol for buffer results (all buffers are polygons)
    const symbol = getAnalysisPolygonSymbol();

    // Create result layer - buffers always result in polygon geometry
    const distanceText = distances.length === 1 ? distances[0] : distances.join('_');
    const layerTitle = `${inputLayer.title} ${distanceText}${unit}`;
    const resultLayer = new FeatureLayer({
      title: layerTitle,
      geometryType: "polygon",
      spatialReference: view.spatialReference,
      source: bufferFeatures,
      fields,
      objectIdField: inputLayer.objectIdField,
      renderer: new SimpleRenderer({ symbol }),
      popupEnabled: true,
      popupTemplate: {
        title: "Buffer Feature",
        content: [{
          type: "fields",
          fieldInfos: fields.map(f => ({
            fieldName: f.name,
            label: f.alias || f.name
          }))
        }]
      }
    } as any);

    // Set custom group property for layer organization
    (resultLayer as any).group = "My Layers";

    // Add to map
    view.map.layers.add(resultLayer);

    return resultLayer;
  }
}