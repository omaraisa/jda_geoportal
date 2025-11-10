"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
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
  const updateExtent = useStateStore((state) => state.updateExtent);
  const targetView = useStateStore((state) => state.targetView);
  const sceneView = useStateStore((state) => state.sceneView);
  const updateMapView = useStateStore((state) => state.updateMapView); const updateTargetView = useStateStore((state) => state.updateTargetView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const setAppReady = useStateStore((state) => state.setAppReady);
  const loadUserGroupLayers = useStateStore((state) => state.loadUserGroupLayers);
  useCoordinatesDisplay(viewRef.current)

  useEffect(() => {
    if (!mapInitializedRef.current) {
      mapInitializedRef.current = true;
      try {
        const jdaExtentLayer = new MapImageLayer({
          url: process.env.NEXT_PUBLIC_JDA_EXTENT_URL!
        });
        (jdaExtentLayer as any).group = "HiddenLayers";

        const map = new Map({
          basemap: "satellite",
          layers: [jdaExtentLayer],
        });

        viewRef.current = new MapView({
          container: mapRef.current as unknown as HTMLDivElement,
          map: map,
          background: {
            color: [255, 255, 255, 1]
          },
          rotation: 277,
          ui: {
            components: [],
          },
          constraints: {
            snapToZoom: false,
            // Optionally define custom lods for finer zoom steps
          }
        });

        viewRef.current
          ?.when(async () => {
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

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%", position: "relative" }}>
    </div>
  );
};

export default MainMap;
