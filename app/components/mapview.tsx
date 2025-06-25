"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Basemap from "@arcgis/core/Basemap";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import useStateStore from "@/stateStore";
import useCoordinatesDisplay from "@/lib/hooks/use-coordinates-display";

interface CustomMapView extends MapView {
  eventHandlers?: { [key: string]: __esri.WatchHandle };
}

const MainMap = () => {
  const mapRef = useRef(null);
  const viewRef = useRef<CustomMapView | null>(null);
  const mapInitializedRef = useRef(false);

  const sendMessage = useStateStore((state) => state.sendMessage);
  const center = useStateStore((state) => state.center);
  const updateExtent = useStateStore((state) => state.updateExtent);
  const targetView = useStateStore((state) => state.targetView);
  const sceneView = useStateStore((state) => state.sceneView);
  const updateMapView = useStateStore((state) => state.updateMapView);  const updateTargetView = useStateStore((state) => state.updateTargetView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const setAppReady = useStateStore((state) => state.setAppReady);
  const loadUserGroupLayers = useStateStore((state) => state.loadUserGroupLayers);
  const setCustomBasemap = useStateStore((state) => state.setCustomBasemap);
  useCoordinatesDisplay(viewRef.current)

  useEffect(() => {
    if (!mapInitializedRef.current) {
      mapInitializedRef.current = true;
      try {
        const customBasemapLayer = new MapImageLayer({
          url: "https://gis.jda.gov.sa/agserver/rest/services/SDF_Atkins_Basemap/MapServer"
        });        const customBasemap = new Basemap({
          baseLayers: [customBasemapLayer],
          title: "Atkins Basemap",
          id: "atkins-basemap"
        });

        // Store the custom basemap in state store for reuse
        setCustomBasemap(customBasemap);

        // Add JDA Extent Layer (no symbology)
        const jdaExtentLayer = new MapImageLayer({
          url: "https://gis.jda.gov.sa/agserver/rest/services/JDA_Extent/MapServer"
        });

        const map = new Map({
          basemap: customBasemap,
          layers: [jdaExtentLayer],
        });

        viewRef.current = new MapView({
          container: mapRef.current as unknown as HTMLDivElement,
          map: map,
          // scale,center,
          background: {
            color: [255, 255, 255, 1] // white background
          },
          rotation: 277,
          constraints: {
            minScale: 300000, 
            maxScale: 8000    
          },
          ui: {
            components: [],
          },
        });

        viewRef.current
          ?.when(async () => {
            // Wait for the JDA Extent layer to load, then zoom to its full extent
            await jdaExtentLayer.when();
            const extent = jdaExtentLayer.fullExtent;
            if (extent) {
              await viewRef.current!.goTo(extent);
            }
            updateExtent(extent)
            updateMapView(viewRef.current!);
            updateTargetView(viewRef.current!);
            loadUserGroupLayers();
            setAppReady(true);
          })
          .catch((error: unknown) => {
            sendMessage({
              title: "Map Initialization Error",
              body: `Failed to initialize the map view. ${(error as Error).message}`,
              type: "error",
              duration: 10,
            });
          });
      } catch (error: unknown) {
        sendMessage({
          title: "Map Creation Error",
          body: `An error occurred while creating the map. ${(error as Error).message}`,
          type: "error",
          duration: 10,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (viewsSyncOn && viewRef.current && sceneView && targetView) {
      let handleCenterChange: __esri.WatchHandle | undefined;
      if (targetView.type === "2d") {
        handleCenterChange = viewRef.current.watch("center", () => {
          sceneView.center = viewRef.current!.center;
          sceneView.scale = viewRef.current!.scale;
        });
      } else if (handleCenterChange) {
        handleCenterChange.remove();
      }

      return () => {
        if (handleCenterChange) {
          handleCenterChange.remove();
        }
      };
    }
  }, [viewsSyncOn, sceneView, targetView]);

  useEffect(() => {
    if (viewRef.current) {
      if (!viewRef.current.eventHandlers) {
        viewRef.current.eventHandlers = {};
      }

      const existingHandlers = viewRef.current.eventHandlers;

      if (!existingHandlers["pointer-down"]) {
        const handlePointerDown = () => {
          if (viewRef.current !== targetView) {
            updateTargetView(viewRef.current);
          }
        };

        const pointerDownHandler = viewRef.current.on(
          "pointer-down",
          handlePointerDown
        );

        existingHandlers["pointer-down"] = pointerDownHandler;

        return () => {
          if (pointerDownHandler) {
            pointerDownHandler.remove();
            delete existingHandlers["pointer-down"];
          }
        };
      }
    }
  }, [viewsSyncOn, viewRef.current, targetView]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;
