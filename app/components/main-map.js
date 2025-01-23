"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import ServerInfo from "@arcgis/core/identity/ServerInfo";
import useStateStore from "../stateManager";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";

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
  // const swapViews = useStateStore((state) => state.swapViews);
  const addLayer = useStateStore((state) => state.addLayer);
  const setAppReady = useStateStore((state) => state.setAppReady);
  const maplayers = useStateStore((state) => state.maplayers);
  const addInitialLayers = useStateStore((state) => state.addInitialLayers);

  useEffect(() => {

    if(!viewRef.current) {
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
        const map = new Map({ basemap: "dark-gray" });

        viewRef.current = new MapView({
          container: mapRef.current,
          map: map,
          center,
          zoom,
          rotation: 270, // Set default rotation to 90 degrees
          ui: {
            components: [] 
          }
        });

        viewRef.current
          .when(() => {
            const basemapToggle = new BasemapToggle({
              view: viewRef.current,
              nextBasemap: "satellite"
            });

            viewRef.current.ui.add(basemapToggle, {
              position: "bottom-right"
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
    // Cleanup on component unmount
    return () => {
      if (viewRef.current) {
        // viewRef.current.destroy();
        // updateMapView(null);

      }
    };
  }, [addMessage, center, zoom, updateMapView, setAppReady]);

   useEffect(() => {
      if (viewsSyncOn && viewRef.current && sceneView && targetView) {
        console.log(targetView)
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
    }, [viewsSyncOn,sceneView,targetView]);


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
        const pointerDownHandler = viewRef.current.on("pointer-down", handlePointerDown);
  
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
