"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import ServerInfo from "@arcgis/core/identity/ServerInfo";
import useStateStore from "../stateManager";

const MainMap = () => {
  const mapRef = useRef(null); // Reference to the MapView container
  const viewRef = useRef(null); // Reference to the MapView instance

  // Extract state and actions from Zustand store
  const addMessage = useStateStore((state) => state.addMessage);
  const center = useStateStore((state) => state.center);
  const zoom = useStateStore((state) => state.zoom);
  const stateView = useStateStore((state) => state.view);
  const secondaryView = useStateStore((state) => state.secondaryView);
  const updateView = useStateStore((state) => state.updateView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const swapViews = useStateStore((state) => state.swapViews);
  const addLayer = useStateStore((state) => state.addLayer);
  const setAppReady = useStateStore((state) => state.setAppReady);

  useEffect(() => {
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;
    const username = process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_USERNAME;
    const password = process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_PASSWORD;
    let serverInfo = new ServerInfo();
    serverInfo.server = process.env.NEXT_PUBLIC_PORTAL_URL;
    serverInfo.tokenServiceUrl = process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL;
    serverInfo.hasServer = true;
    IdentityManager.registerServers([serverInfo]);

    IdentityManager.generateToken(serverInfo, {
      username: username,
      password: password,
      client: "referer",
      referer: window.location.origin
    })
    .then(function(response) {
      IdentityManager.registerToken({
        server: serverInfo.server,
        token: response.token,
        expires: response.expires
      });

      try {
        // Initialize the Map and MapView
        const map = new Map({ basemap: "satellite" });

        const mapView = new MapView({
          container: mapRef.current,
          map: map,
          center,
          zoom,
        });

        viewRef.current = mapView;

        mapView
          .when(() => {
            updateView(mapView);
            // setAppReady(true); 

            // Add FeatureLayers to the map
            try {
              const pacelLayer = new FeatureLayer({
                url: "https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer",
                visible: false,
                renderer: {
                  type: "simple",
                  symbol: {
                    type: "simple-fill",
                    // White with 50% transparency
                    outline: {
                      color: [255, 255, 0, 1], // Yellow outline
                      width: 1
                    }
                  }
                },
                labelingInfo: [{
                  labelExpressionInfo: { expression: "$feature.parcelnumber" },
                  symbol: {
                    type: "text",
                    color: "yellow",
                    haloColor: "black",
                    haloSize: "1px",
                    font: {
                      size: 12,
                      family: "Arial",
                      weight: "bold"
                    }
                  },
                  minScale: 5000,
                  maxScale: 100
                }]
              });
              addLayer(pacelLayer);

              const JeddahHistorical = new FeatureLayer({
                url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
                // visible: false
              });
              addLayer(JeddahHistorical);

            } catch (error) {
              addMessage({
                title: "Map Error",
                body: `Failed to add layers to the map. ${error.message}`,
                type: "error",
                duration: 10,
              });
            }
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

    // Cleanup on component unmount
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        // updateView(null);
      }
    };
  }, [addMessage, center, zoom, updateView, setAppReady]);

  useEffect(() => {
    if (viewsSyncOn && !secondaryView && viewRef.current) {
      updateView(viewRef.current);
    }
  }, [viewsSyncOn]);

  useEffect(() => {
    if (viewsSyncOn && viewRef.current && secondaryView) {
      // Sync the MapView's center and scale with the secondaryView
      let handleCenterChange
      if(secondaryView.type === "3d")
        { 
        handleCenterChange = viewRef.current.watch("center", () => {
          secondaryView.center = viewRef.current.center;
          secondaryView.scale = viewRef.current.scale;
      });
    }

      return () => {
        if (handleCenterChange) {
          handleCenterChange.remove(); // Cleanup watcher
        }
      };
    }
  }, [viewsSyncOn,secondaryView]);

  useEffect(() => {
    if (viewRef.current) {
      // Ensure no duplicate listeners are attached
      const existingHandlers = viewRef.current.eventHandlers || {};

      if (!existingHandlers["pointer-down"]) {
        const handlePointerDown = () => {
          if (viewRef.current !== stateView) {
            swapViews(); // Swap views only if the current view does not match the state view
          }
        };

        // Add the event handler
        const pointerDownHandler = viewRef.current.on("pointer-down", handlePointerDown);

        // Track the handler for cleanup
        existingHandlers["pointer-down"] = pointerDownHandler;
        viewRef.current.eventHandlers = existingHandlers;

        // Cleanup listener
        return () => {
          if (pointerDownHandler) {
            pointerDownHandler.remove(); // Properly remove the listener
            delete viewRef.current.eventHandlers["pointer-down"];
          }
        };
      }
    }
  }, [viewsSyncOn, stateView, swapViews]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;
