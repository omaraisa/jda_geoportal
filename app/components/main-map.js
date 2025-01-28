"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import ServerInfo from "@arcgis/core/identity/ServerInfo";
import useStateStore from "@/stateManager";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";
import wgs84ToUtmZone37N from "@/modules/utils/wgs84ToUtmZone37N";

const MainMap = () => {
  const mapRef = useRef(null); // Reference to the MapView container
  const viewRef = useRef(null); // Reference to the MapView instance

  // Extract state and actions from Zustand store
  const addMessage = useStateStore((state) => state.addMessage);
  const center = useStateStore((state) => state.center);
  const zoom = useStateStore((state) => state.zoom);
  const targetView = useStateStore((state) => state.targetView);
  const sceneView = useStateStore((state) => state.sceneView);
  const updateMapView = useStateStore((state) => state.updateMapView);
  const updateTargetView = useStateStore((state) => state.updateTargetView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const setAppReady = useStateStore((state) => state.setAppReady);
  const maplayers = useStateStore((state) => state.maplayers);
  const addInitialLayers = useStateStore((state) => state.addInitialLayers);

  if (!viewRef.current) {
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;
    const username = process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_USERNAME;
    const password = process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_PASSWORD;
    let serverInfo = new ServerInfo();
    serverInfo.server = process.env.NEXT_PUBLIC_PORTAL_URL;
    serverInfo.tokenServiceUrl =
      process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL;
    serverInfo.hasServer = true;
    IdentityManager.registerServers([serverInfo]);

    IdentityManager.generateToken(serverInfo, {
      username: username,
      password: password,
      client: "referer",
      referer: window.location.origin,
    }).then(function (response) {
      IdentityManager.registerToken({
        server: serverInfo.server,
        token: response.token,
        expires: response.expires,
      });

      try {
        // Initialize the Map and MapView
        const map = new Map({ basemap: "dark-gray" });

        viewRef.current = new MapView({
          container: mapRef.current,
          map: map,
          center,
          zoom,
          rotation: 270, // Set default rotation to 90 degrees
          ui: {
            components: [],
          },
        });

        viewRef.current
          .when(() => {
            const basemapToggle = new BasemapToggle({
              view: viewRef.current,
              nextBasemap: "satellite",
            });

            viewRef.current.ui.add(basemapToggle, {
              position: "bottom-right",
            });

            // Create a div for coordinates
            const coordinatesDiv = document.createElement("div");
            coordinatesDiv.style.position = "absolute";
            coordinatesDiv.style.bottom = "10px";
            coordinatesDiv.style.left = "10px";
            coordinatesDiv.style.padding = "5px";
            coordinatesDiv.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
            coordinatesDiv.style.fontSize = "12px";
            coordinatesDiv.style.zIndex = "10";
            coordinatesDiv.innerHTML = "Lat: 0, Lon: 0, UTM: 0, 0";
            viewRef.current.container.appendChild(coordinatesDiv);

            const pointerMoveHandler = viewRef.current.on("pointer-move", (event) => {
              // Get the screen point (x, y) of the mouse pointer
              const screenPoint = {
                x: event.x,
                y: event.y,
              };

              // Convert the screen point to a map point (longitude, latitude)
              const mapPoint = viewRef.current.toMap(screenPoint);

              // Convert the map point to geographic coordinates (longitude, latitude)
              const lon = mapPoint.longitude.toFixed(6);
              const lat = mapPoint.latitude.toFixed(6);

              const utmPoint = wgs84ToUtmZone37N(lat, lon);

                // Get the UTM coordinates
                const utmPointX = utmPoint.x.toFixed(1); // UTM Easting
                const utmPointY = utmPoint.y.toFixed(1); // UTM Northing

                // Update the coordinates display
                coordinatesDiv.innerHTML = `Lat: ${lat}, Lon: ${lon}     |     UTM: ${utmPointX}, ${utmPointY}`;
         
            });

            
            updateMapView(viewRef.current);
            updateTargetView(viewRef.current);
            addInitialLayers(maplayers, viewRef.current);
          })
          .catch((error) => {
            addMessage({
              title: "Map Initialization Error",
              body: `Failed to initialize the map view. ${error.message}`,
              type: "error",
              duration: 10,
            });
          });
      } catch (error) {
        addMessage({
          title: "Map Creation Error",
          body: `An error occurred while creating the map. ${error.message}`,
          type: "error",
          duration: 10,
        });
      }
    });
  }

  useEffect(() => {
    if (viewsSyncOn && viewRef.current && sceneView && targetView) {
      let handleCenterChange;
      if (targetView.type === "2d") {
        handleCenterChange = viewRef.current.watch("center", () => {
          sceneView.center = viewRef.current.center;
          sceneView.scale = viewRef.current.scale;
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
