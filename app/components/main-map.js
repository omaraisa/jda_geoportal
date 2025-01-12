"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
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

  useEffect(() => {
    // Set the ArcGIS API Key
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

    try {
      // Initialize the Map and MapView
      const map = new Map({ basemap: "arcgis-topographic" });

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

          // Add FeatureLayers to the map
          try {
            const pacelLayer =  new FeatureLayer({
                url: "https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer",
              })
              addLayer(pacelLayer)
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

    // Cleanup on component unmount
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        // updateView(null);
      }
    };
  }, [addMessage, center, zoom, updateView]);
  
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
