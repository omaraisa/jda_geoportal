import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as projection from "@arcgis/core/geometry/projection";
const Point = require("@arcgis/core/geometry/Point").default;

export interface Facility {
  x: number;
  y: number;
  spatialReference?: { wkid: number };
}

export interface Incident {
  x: number;
  y: number;
}

export class ClosestFacilityService {
  static async extractFacilitiesFromLayer(
    layer: any,
    view: any
  ): Promise<Facility[]> {
    let facilities: Facility[] = [];

    if (layer.type === "feature" && layer.createQuery && layer.queryFeatures) {
      const query = layer.createQuery();
      query.where = "1=1";
      query.outFields = ["*"];
      query.returnGeometry = true;
      const featureSet = await layer.queryFeatures(query);
      
      facilities = featureSet.features.map((f: any) => {
        const geom = f.geometry;
        let x = geom.x ?? geom.longitude;
        let y = geom.y ?? geom.latitude;
        let spatialReference = geom.spatialReference ?? { wkid: 4326 };
        
        if (geom.type === "point" && geom.spatialReference?.wkid === 102100) {
          const pt = new Point({
            x,
            y,
            spatialReference: { wkid: 102100 }
          });
          const projected = projection.project(pt, { wkid: 4326 }) as __esri.Point;
          x = projected.x;
          y = projected.y;
          spatialReference = { wkid: 4326 };
        }
        
        return { x, y, spatialReference };
      });
    } else if (layer.type === "geojson" && layer.source) {
      facilities = layer.source.map((f: any) => ({
        x: f.geometry.coordinates[0],
        y: f.geometry.coordinates[1],
        spatialReference: { wkid: 4326 }
      }));
    } else {
      throw new Error("Layer type not supported for facilities.");
    }

    return facilities;
  }

  static async projectFacilitiesToWGS84(
    facilities: Facility[],
    view: any
  ): Promise<Facility[]> {
    await projection.load();
    
    return facilities.map((f) => {
      if (f.spatialReference?.wkid === 4326) {
        return { x: f.x, y: f.y, spatialReference: { wkid: 4326 } };
      }
      
      const pt = new Point({
        x: f.x,
        y: f.y,
        spatialReference: f.spatialReference || view.spatialReference
      });
      const projected = projection.project(pt, { wkid: 4326 }) as __esri.Point;
      
      return {
        x: projected.x,
        y: projected.y,
        spatialReference: { wkid: 4326 }
      };
    });
  }

  static async performClosestFacilityAnalysis(
    incident: Incident,
    facilities: Facility[],
    numFacilities: number,
    serviceUrl: string
  ): Promise<any> {
    const spatialReference = { wkid: 4326 };

    const incidentsParam = {
      features: [
        {
          geometry: {
            x: incident.x,
            y: incident.y,
            spatialReference: { wkid: 4326 }
          },
          attributes: {
            Name: "Incident 1"
          }
        }
      ],
      geometryType: "esriGeometryPoint",
      spatialReference: { wkid: 4326 }
    };

    const facilitiesParam = {
      features: facilities.map((f, i) => ({
        geometry: {
          x: f.x,
          y: f.y,
          spatialReference
        },
        attributes: {
          Name: `Facility ${i + 1}`
        }
      })),
      geometryType: "esriGeometryPoint",
      spatialReference
    };

    const cookies = Object.fromEntries(document.cookie.split("; ").map(c => c.split("=")));
    const token = cookies["arcgis_token"];
    const url = `${serviceUrl}solveClosestFacility`;

    const params = new URLSearchParams({
      f: "json",
      ...(token ? { token } : {}),
      incidents: JSON.stringify(incidentsParam),
      facilities: JSON.stringify(facilitiesParam),
      travelDirection: "toFacility",
      defaultCutoff: "10000",
      returnCFRoutes: "true",
      returnDirections: "false",
      defaultTargetFacilityCount: numFacilities.toString(),
      outSR: "4326"
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString()
    });

    const text = await response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      throw new Error("Failed to parse response from network analysis service.");
    }
  }

  static renderAnalysisResults(
    data: any,
    numFacilities: number,
    facilitiesParam: any,
    routeGraphicsLayer: GraphicsLayer | null
  ): __esri.Graphic[] {
    if (!routeGraphicsLayer) return [];

    routeGraphicsLayer.removeAll();
    
    if (!data.routes || !data.routes.features || data.routes.features.length === 0) {
      return [];
    }

    const graphics: __esri.Graphic[] = [];
    const labelGraphics: __esri.Graphic[] = [];

    // Draw route lines
    data.routes.features.forEach((route: any) => {
      const graphic = new Graphic({
        geometry: {
          ...route.geometry,
          type: "polyline"
        },
        symbol: {
          type: "simple-line",
          color: [33, 150, 243, 0.8],
          width: 5,
          style: "solid"
        } as __esri.SimpleLineSymbolProperties
      });
      graphics.push(graphic);
    });

    // Find and highlight closest facilities
    const closestRoutes = data.routes.features
      .filter(
        (route: any) =>
          route.attributes &&
          route.attributes.FacilityRank &&
          route.attributes.FacilityRank <= numFacilities
      )
      .sort((a: any, b: any) => a.attributes.FacilityRank - b.attributes.FacilityRank)
      .slice(0, numFacilities);

    const highlightedFacilityIds = new Set<number>();
    
    closestRoutes.forEach((route: any, idx: number) => {
      const facilityIdx = route.attributes.FacilityID - 1;
      if (!highlightedFacilityIds.has(facilityIdx)) {
        highlightedFacilityIds.add(facilityIdx);
        const nearestFacility = facilitiesParam.features[facilityIdx];
        
        if (nearestFacility) {
          const markerSymbol = {
            type: "simple-marker",
            style: "diamond",
            color: [67, 160, 71, 1],
            size: 15,
            outline: { color: "#fff", width: 4 },
            angle: 0,
            xoffset: 0,
            yoffset: 0,
          };
          
          const graphic = new Graphic({
            geometry: {
              ...nearestFacility.geometry,
              type: "point"
            },
            symbol: markerSymbol,
            attributes: { Name: `Nearest Facility ${idx + 1}` }
          });
          graphics.push(graphic);

          const textSymbol = {
            type: "text",
            color: "#388e3c",
            haloColor: "#fff",
            haloSize: "2px",
            text: `#${idx + 1}`,
            xoffset: 0,
            yoffset: -24,
            font: {
              family: "Arial Unicode MS",
              size: 14,
              weight: "normal"
            }
          };
          
          const labelGraphic = new Graphic({
            geometry: {
              ...nearestFacility.geometry,
              type: "point"
            },
            symbol: textSymbol
          });
          labelGraphics.push(labelGraphic);
        }
      }
    });

    // Add all graphics at once for better performance
    routeGraphicsLayer.addMany(graphics);
    routeGraphicsLayer.addMany(labelGraphics);

    return graphics;
  }

  static createIncidentGraphic(incident: Incident): __esri.Graphic {
    const markerSymbol = {
      type: "simple-marker",
      style: "circle",
      color: "#d32f2f",
      size: 18,
      outline: { color: "#fff", width: 2 }
    };
    
    return new Graphic({
      geometry: {
        type: "point",
        x: incident.x,
        y: incident.y,
      } as __esri.Point,
      symbol: markerSymbol,
      attributes: {}
    });
  }

  static getSelectableLayers(view: any): any[] {
    return view?.map?.layers
      ?.toArray()
      ?.filter(
        (l: any) =>
          (l.type === "feature" || l.type === "geojson") &&
          l.geometryType === "point"
      ) || [];
  }
}
