"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as projection from "@arcgis/core/geometry/projection";
const Point = require("@arcgis/core/geometry/Point").default;

const CLOSEST_FACILITY_URL = "https://gis.jda.gov.sa/agserver/rest/services/JeddahNetwork/NAServer/Closest%20Facility/";
const INCIDENT_GRAPHICS_LAYER_ID = "closest-facility-incident";
const FACILITY_GRAPHICS_LAYER_ID = "closest-facility-facilities";
const ROUTE_LAYER_ID = "Closest_Facility_Route"


const ClosestFacility: React.FC = () => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const updateStats = useStateStore((state) => state.updateStats);
  const [incident, setIncident] = useState<{ x: number; y: number } | null>(null);
  const [addingIncident, setAddingIncident] = useState(false);
  const [numFacilities, setNumFacilities] = useState<number>(1);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [addingFacility, setAddingFacility] = useState(false);
  const [facilities, setFacilities] = useState<{ x: number; y: number; spatialReference?: { wkid: number } }[]>([]);
  const mapClickHandlerRef = useRef<any>(null);
  const graphicsLayerRef = useRef<__esri.GraphicsLayer | null>(null);
  const facilityGraphicsLayerRef = useRef<__esri.GraphicsLayer | null>(null);
  const routeGraphicsLayerRef = useRef<__esri.GraphicsLayer | null>(null);
  const [targetLayerId, setTargetLayerId] = useState<string>("");
  const [layers, setLayers] = useState<any[]>([]);
  const [showAddIncidentMsg, setShowAddIncidentMsg] = useState(false);


  useEffect(() => {
    if (view && view.map) {
      let layer = view.map.findLayerById(INCIDENT_GRAPHICS_LAYER_ID) as __esri.GraphicsLayer;
      if (!layer) {
        layer = new GraphicsLayer({ id: INCIDENT_GRAPHICS_LAYER_ID });
        view.map.add(layer);
      }
      graphicsLayerRef.current = layer;

      let facilityLayer = view.map.findLayerById(FACILITY_GRAPHICS_LAYER_ID) as __esri.GraphicsLayer;
      if (!facilityLayer) {
        facilityLayer = new GraphicsLayer({ id: FACILITY_GRAPHICS_LAYER_ID });
        view.map.add(facilityLayer);
      }
      facilityGraphicsLayerRef.current = facilityLayer;
    }

    let routeLayer = view?.map.findLayerById(ROUTE_LAYER_ID) as __esri.GraphicsLayer;
    if (!routeLayer) {
      routeLayer = new GraphicsLayer({ id: ROUTE_LAYER_ID });
      view?.map.add(routeLayer);
    }
    routeGraphicsLayerRef.current = routeLayer;
    projection.load(); // load the module once

  }, [view]);

  useEffect(() => {
    const layer = graphicsLayerRef.current;
    if (!layer) return;
    layer.removeAll();
    if (incident) {
      const markerSymbol = {
        type: "simple-marker",
        style: "circle",
        color: "#d32f2f",
        size: 18,
        outline: { color: "#fff", width: 2 }
      };
      const graphic = new Graphic({
        geometry: {
          type: "point",
          x: incident.x,
          y: incident.y,
        } as __esri.Point,
        symbol: markerSymbol,
        attributes: {}
      });
      layer.add(graphic);
    }
  }, [incident]);

  const handleAddIncident = () => {
    setAddingIncident(true);
    setShowAddIncidentMsg(true);
    if (view) {
      view.container.style.cursor = "crosshair";
    }
  };

  useEffect(() => {
    if (!addingIncident && view) {
      view.container.style.cursor = "";
      setShowAddIncidentMsg(false);
    }
  }, [addingIncident, view]);

  useEffect(() => {
    if ((addingIncident || addingFacility) && view) {
      const handler = (event: any) => {
        const pt = event.mapPoint;
        if (pt) {
          if (addingIncident) {
            setIncident({ x: +pt.longitude.toFixed(6), y: +pt.latitude.toFixed(6) });
            setAddingIncident(false);
            setShowAddIncidentMsg(false);
            setStatus("");
          } else if (addingFacility) {
            setFacilities((prev) => [
              ...prev,
              { x: +pt.longitude.toFixed(6), y: +pt.latitude.toFixed(6) }
            ]);
            setAddingFacility(false);
          }
        }
      };
      mapClickHandlerRef.current = view.on("click", handler);
      return () => {
        if (mapClickHandlerRef.current) {
          mapClickHandlerRef.current.remove();
          mapClickHandlerRef.current = null;
        }
      };
    }
    return () => {
      if (mapClickHandlerRef.current) {
        mapClickHandlerRef.current.remove();
        mapClickHandlerRef.current = null;
      }
    };
  }, [addingIncident, addingFacility, view]);

  const handleAddFacility = () => setAddingFacility(true);

  const handleNumFacilitiesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNumFacilities(Number(e.target.value));
  };
  const handleRun = async () => {
    setStatusType("info");
    setStatus(t("widgets.closestFacility.status.running") || "Running analysis...");
    try {
      if (!incident) throw new Error("Incident location not set.");
      if (!view) throw new Error("Map view not available.");
      if (!targetLayerId) throw new Error("No target layer selected.");

      const layer = view.map.layers.find((l: any) => l.id === targetLayerId) as any;
      if (!layer) throw new Error("Selected layer not found.");

      let facilities: { x: number; y: number; spatialReference?: { wkid: number } }[] = [];
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
          return {
            x,
            y,
            spatialReference
          };
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

      if (facilities.length === 0) throw new Error("No facilities found in selected layer.");

      await projection.load();
      const facilitiesWGS = facilities.map((f) => {
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

      const incidentWGS = {
        x: incident.x,
        y: incident.y,
        spatialReference: { wkid: 4326 }
      };


      const spatialReference = { wkid: 4326 };

      const incidentsParam = {
        features: [
          {
            geometry: incidentWGS,
            attributes: {
              Name: "Incident 1"
            }
          }
        ],
        geometryType: "esriGeometryPoint",
        spatialReference: { wkid: 4326 }
      };

      const facilitiesParam = {
        features: facilitiesWGS.map((f, i) => ({
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
      const url = `${CLOSEST_FACILITY_URL}solveClosestFacility`;

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

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        setStatusType("error");
        setStatus("Failed to parse response from network analysis service.");
        routeGraphicsLayerRef.current?.removeAll();
        return;
      }

      if (data.error) {
        console.error("Network Analysis Error:", data.error);
        setStatusType("error");
        setStatus(data.error.message || "Analysis failed.");
        routeGraphicsLayerRef.current?.removeAll();
        return;
      }

      routeGraphicsLayerRef.current?.removeAll();
      if (data.routes && data.routes.features && data.routes.features.length > 0) {
        // Draw all graphics first, then update status and zoom
        const graphics: __esri.Graphic[] = [];
        const labelGraphics: __esri.Graphic[] = [];

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

        // Find the nearest facility from the route attributes
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
                  // @ts-ignore
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
                  weight: "normal" // Use "normal" instead of "bold" to avoid font fallback error
                }
              };
              const labelGraphic = new Graphic({
                geometry: {
                  ...nearestFacility.geometry,
                  // @ts-ignore
                  type: "point"
                },
                symbol: textSymbol
              });
              labelGraphics.push(labelGraphic);
            }
          }
        });

        // Add all graphics at once for better performance
        if (routeGraphicsLayerRef.current) {
          routeGraphicsLayerRef.current.addMany(graphics);
          routeGraphicsLayerRef.current.addMany(labelGraphics);
        }

        // Zoom to the result graphics (routes and facilities)
        if (view && graphics.length > 0) {
          // Collect all geometries for zoom
          const allGeoms = graphics.map(g => g.geometry).filter(Boolean);
          view.goTo(allGeoms, { duration: 1800 }).catch(() => {});
        }

        // Set status after drawing and zooming
        setTimeout(() => {
          setStatusType("success");
          setStatus(
            t("widgets.closestFacility.status.success") ||
            `Analysis complete. Found ${data.routes.features.length} route(s).`
          );
        }, 400); // Small delay to ensure graphics/zoom are visible before message
      } else {
        setStatusType("info");
        setStatus(
          t("widgets.closestFacility.status.noRoutes") ||
          "No routes found. Please check your incident and facilities."
        );
      }
    } catch (err: any) {
      setStatusType("error");
      setStatus(err.message || "Analysis failed.");
      routeGraphicsLayerRef.current?.removeAll();
    }

    updateStats("closest_facility_performed");
  };

  useEffect(() => {
    if (view?.map) {
      const selectableLayers = view.map.layers
        .toArray()
        .filter(
          (l: any) =>
            (l.type === "feature" || l.type === "geojson") &&
            l.geometryType === "point"
        );
      setLayers(selectableLayers);
    }
  }, [view]);

  const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetLayerId(e.target.value);
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">{t("widgets.closestFacility.title")}</h2>
      <button
        className={`btn btn-primary flex-grow ${addingIncident ? "opacity-70" : ""}`}
        onClick={handleAddIncident}
        disabled={addingIncident}
      >
        {incident
          ? t("widgets.closestFacility.changeIncident")
          : t("widgets.closestFacility.addIncident")}
      </button>
      {showAddIncidentMsg && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded animate-pulse text-center">
          {t("widgets.closestFacility.clickMapToAddIncident") || "Click on the map to add location."}
        </div>
      )}
      {incident && (
        <div className="text-sm text-blue-700">
          {t("widgets.closestFacility.incidentLocation")} ({incident.x}, {incident.y})
        </div>
      )}
      <div>
        <label className="font-semibold mb-1 block">
          {t("widgets.closestFacility.targetLayer")}
        </label>
        <div className="select">
          <select
            className="input-select w-full"
            value={targetLayerId}
            onChange={handleLayerChange}
          >
            <option value="">{t("widgets.closestFacility.selectLayer")}</option>
            {layers.map((layer: any) => (
              <option key={layer.id} value={layer.id}>
                {layer.title || layer.name || layer.id}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="font-semibold mb-1 block">
          {t("widgets.closestFacility.numFacilities")}
        </label>
        <div className="select">
          <select
            className="input-select w-full"
            value={numFacilities}
            onChange={handleNumFacilitiesChange}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          className="btn btn-success w-full mt-2"
          onClick={handleRun}
        >
          {t("widgets.closestFacility.run")}
        </button>
      </div>
      {status && (
        <div className={`mb-4 p-3 mt-2 ${statusType === "success"
            ? "bg-[rgba(122,181,122,0.3)] border-green-400 text-[rgb(67, 90, 67)]"
            : statusType === "error"
              ? "bg-red-100 border-red-400 text-red-700"
              : "bg-blue-100 border-blue-400 text-blue-700"
          } border rounded`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default ClosestFacility;
