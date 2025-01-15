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
        const map = new Map({ basemap: "satellite" });

        viewRef.current = new MapView({
          container: mapRef.current,
          map: map,
          center,
          zoom,
        });


        viewRef.current
          .when(() => {
            updateMapView(viewRef.current);
          updateTargetView(viewRef.current);
          addInitialLayers(maplayers, viewRef.current);
            
            
            // try {
            //   const pacelLayer = new FeatureLayer({
            //     url: "https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer",
            //     visible: false,
            //     renderer: {
            //       type: "simple",
            //       symbol: {
            //         type: "simple-fill",
            //         // White with 50% transparency
            //         outline: {
            //           color: [255, 255, 0, 1], // Yellow outline
            //           width: 1
            //         }
            //       }
            //     },
            //     labelingInfo: [{
            //       labelExpressionInfo: { expression: "$feature.parcelnumber" },
            //       symbol: {
            //         type: "text",
            //         color: "yellow",
            //         haloColor: "black",
            //         haloSize: "1px",
            //         font: {
            //           size: 12,
            //           family: "Arial",
            //           weight: "bold"
            //         }
            //       },
            //       minScale: 5000,
            //       maxScale: 100
            //     }]
            //   });
            //   addLayer(pacelLayer);

            //   const JeddahHistorical = new FeatureLayer({
            //     url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
            //     // visible: false
            //   });
            //   addLayer(JeddahHistorical);

            //   pacelLayer.when(() => {
            //   const fieldInfos = pacelLayer.fields.map((field) => {
            //     return { fieldName: field.name };
            //   });
          
            //   const popupTemplate = {
            //     content: [
            //       {
            //         type: "fields",
            //         fieldInfos: fieldInfos,
            //       },
            //     ],
            //   };
            //   pacelLayer.popupTemplate = popupTemplate;
            // });

            // } catch (error) {
            //   addMessage({
            //     title: "Map Error",
            //     body: `Failed to add layers to the map. ${error.message}`,
            //     type: "error",
            //     duration: 10,
            //   });
            // }
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

  // useEffect(() => {
  //   if (viewsSyncOn && viewRef.current) {
  //     updateMapView(viewRef.current);
  //   }
  // }, [viewsSyncOn]);

  

   useEffect(() => {
      if (viewsSyncOn && viewRef.current && sceneView) {
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
