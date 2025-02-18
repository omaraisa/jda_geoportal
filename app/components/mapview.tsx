"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import useStateStore from "@/stateStore";
import wgs84ToUtmZone37N from "@/lib/utils/wgs84ToUtmZone37N";
import { authenticateArcGIS } from "@/lib/authenticateArcGIS";
// import { baseMapLayerConfigurations } from "@/lib/initial-layers";

interface CustomMapView extends MapView {
  eventHandlers?: { [key: string]: __esri.WatchHandle };
}

const MainMap = () => {
  const mapRef = useRef(null); // Reference to the MapView container
  const viewRef = useRef<CustomMapView | null>(null); // Reference to the MapView instance
  const mapInitializedRef = useRef(false);

  // Extract state and actions from Zustand store
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

  useEffect(() => {
    // Authenticate first, then initialize the map
    if (!mapInitializedRef.current) {
      mapInitializedRef.current = true;
      authenticateArcGIS()
        .then(() => {
          try {
            // Initialize the Map and MapView
            const map = new Map({ basemap: "topo-vector" });

            viewRef.current = new MapView({
              container: mapRef.current as unknown as HTMLDivElement,
              map: map,
              center,
              zoom,
              rotation: 270, // Set default rotation to 90 degrees
              ui: {
                components: [],
              },
            });

            viewRef.current
              ?.when(() => {
                // Create a div for coordinates
                const coordinatesContainer = document.createElement("div");
                coordinatesContainer.style.position = "absolute";
                coordinatesContainer.style.bottom = "1em";
                coordinatesContainer.style.left = "1em";
                coordinatesContainer.style.padding = "0.5em";
                coordinatesContainer.style.color = "rgb(85, 85, 85)";
                coordinatesContainer.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                coordinatesContainer.style.fontSize = "0.75em";
                coordinatesContainer.style.zIndex = "10";
                coordinatesContainer.innerHTML = "Lat: 0, Lon: 0, UTM: 0, 0";
                viewRef.current!.container.appendChild(coordinatesContainer);

                const pointerMoveHandler = viewRef.current!.on("pointer-move", (event: any) => {
                  // Get the screen point (x, y) of the mouse pointer
                  const screenPoint = {
                    x: event.x,
                    y: event.y,
                  };

                  // Convert the screen point to a map point (longitude, latitude)
                  const mapPoint = viewRef.current!.toMap(screenPoint);

                  // Convert the map point to geographic coordinates (longitude, latitude)
                  const lon = mapPoint.longitude.toFixed(6);
                  const lat = mapPoint.latitude.toFixed(6);

                  const utmPoint = wgs84ToUtmZone37N(lat, lon);

                  // Get the UTM coordinates
                  const utmPointX = utmPoint.x.toFixed(1); // UTM Easting
                  const utmPointY = utmPoint.y.toFixed(1); // UTM Northing

                  // Update the coordinates display
                  coordinatesContainer.innerHTML = `Lat: ${lat}, Lon: ${lon}     |     UTM Z37 N: ${utmPointX}, ${utmPointY}`;
                });

                updateMapView(viewRef.current!);
                updateTargetView(viewRef.current!);
                addBasemapLayers();
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
        })
        .catch((error: any) => {
          sendMessage({
            title: "Authentication Error",
            body: `Failed to authenticate. ${(error as Error).message}`,
            type: "error",
            duration: 10,
          });
        });
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
        handleCenterChange.remove(); // Cleanup watcher if it exists
      }

      return () => {
        if (handleCenterChange) {
          handleCenterChange.remove(); // Cleanup watcher
        }
      };
    }
  }, [viewsSyncOn, sceneView, targetView]);

  useEffect(() => {
    if (viewRef.current) {
      // Initialize eventHandlers if it doesn't exist
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

        // Add the event handler
        const pointerDownHandler = viewRef.current.on(
          "pointer-down",
          handlePointerDown
        );

        // Track the handler for cleanup
        existingHandlers["pointer-down"] = pointerDownHandler;

        // Cleanup listener
        return () => {
          if (pointerDownHandler) {
            pointerDownHandler.remove(); // Properly remove the listener
            delete existingHandlers["pointer-down"]; // Remove the handler reference
          }
        };
      }
    }
  }, [viewsSyncOn, viewRef.current, targetView]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;
