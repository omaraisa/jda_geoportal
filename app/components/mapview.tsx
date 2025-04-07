"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
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
  const zoom = useStateStore((state) => state.zoom);
  const targetView = useStateStore((state) => state.targetView);
  const sceneView = useStateStore((state) => state.sceneView);
  const updateMapView = useStateStore((state) => state.updateMapView);
  const updateTargetView = useStateStore((state) => state.updateTargetView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const setAppReady = useStateStore((state) => state.setAppReady);
  const addBasemapLayers = useStateStore((state) => state.addBasemapLayers);
  useCoordinatesDisplay(viewRef.current) 

  useEffect(() => {
    if (!mapInitializedRef.current) {
      mapInitializedRef.current = true;
          try {
            const map = new Map({ basemap: "topo-vector" });

            viewRef.current = new MapView({
              container: mapRef.current as unknown as HTMLDivElement,
              map: map,
              center,
              zoom,
              rotation: 270,
              ui: {
                components: [],
              },
            });

            viewRef.current
              ?.when(() => {
                updateMapView(viewRef.current!);
                updateTargetView(viewRef.current!);
                addBasemapLayers();
                setAppReady(true);
              })
              .catch((error: any) => {
                sendMessage({
                  title: "Map Initialization Error",
                  body: `Failed to initialize the map view. ${(error as Error).message}`,
                  type: "error",
                  duration: 10,
                });
              });
          } catch (error: any) {
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
