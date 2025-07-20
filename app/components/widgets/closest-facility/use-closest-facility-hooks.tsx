import { useEffect, useRef } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { ClosestFacilityService } from "./closest-facility-service";

export const useMapInteractions = (
  view: any,
  addingIncident: boolean,
  setIncident: (incident: { x: number; y: number } | null) => void,
  setAddingIncident: (adding: boolean) => void,
  setShowAddIncidentMsg: (show: boolean) => void,
  setStatus: (status: string) => void
) => {
  const mapClickHandlerRef = useRef<any>(null);

  useEffect(() => {
    if (!addingIncident && view) {
      view.container.style.cursor = "";
      setShowAddIncidentMsg(false);
    }
  }, [addingIncident, view, setShowAddIncidentMsg]);

  useEffect(() => {
    if (addingIncident && view) {
      const handler = (event: any) => {
        const pt = event.mapPoint;
        if (pt) {
          setIncident({ x: +pt.longitude.toFixed(6), y: +pt.latitude.toFixed(6) });
          setAddingIncident(false);
          setShowAddIncidentMsg(false);
          setStatus("");
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
  }, [addingIncident, view, setIncident, setAddingIncident, setShowAddIncidentMsg, setStatus]);
};

export const useGraphicsLayers = (
  view: any,
  incident: { x: number; y: number } | null,
  incidentLayerId: string,
  facilityLayerId: string,
  routeLayerId: string
) => {
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const facilityGraphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const routeGraphicsLayerRef = useRef<GraphicsLayer | null>(null);

  useEffect(() => {
    if (view && view.map) {
      let layer = view.map.findLayerById(incidentLayerId) as GraphicsLayer;
      if (!layer) {
        layer = new GraphicsLayer({ id: incidentLayerId });
        view.map.add(layer);
      }
      graphicsLayerRef.current = layer;

      let facilityLayer = view.map.findLayerById(facilityLayerId) as GraphicsLayer;
      if (!facilityLayer) {
        facilityLayer = new GraphicsLayer({ id: facilityLayerId });
        view.map.add(facilityLayer);
      }
      facilityGraphicsLayerRef.current = facilityLayer;

      let routeLayer = view.map.findLayerById(routeLayerId) as GraphicsLayer;
      if (!routeLayer) {
        routeLayer = new GraphicsLayer({ id: routeLayerId });
        view.map.add(routeLayer);
      }
      routeGraphicsLayerRef.current = routeLayer;
    }
  }, [view, incidentLayerId, facilityLayerId, routeLayerId]);

  useEffect(() => {
    const layer = graphicsLayerRef.current;
    if (!layer) return;
    
    layer.removeAll();
    if (incident) {
      const graphic = ClosestFacilityService.createIncidentGraphic(incident);
      layer.add(graphic);
    }
  }, [incident]);

  return {
    graphicsLayerRef,
    facilityGraphicsLayerRef,
    routeGraphicsLayerRef
  };
};
