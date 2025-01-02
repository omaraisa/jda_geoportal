"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import dotenv from "dotenv";
import useAppStore from "../stateManager";

dotenv.config();
const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

// Singleton instances to persist the map and view
let mapInstance = null;
let viewInstance = null;

const MainMap = () => {
  const mapRef = useRef(null);
  const updateMap = useAppStore((state) => state.updateMap);
  const updateView = useAppStore((state) => state.updateView);
  const center = useAppStore((state) => state.center); // Get the center from the state
  const zoom = useAppStore((state) => state.zoom); // Get the zoom from the state
  const updateViewLocation = useAppStore((state) => state.updateViewLocation); // Update the view location in the state

  useEffect(() => {
    // Set the ArcGIS API Key
    esriConfig.apiKey = ArcGISAPIKey;

    // If the map and view are already created, just attach the view to the DOM container
    if (mapInstance && viewInstance) {
      viewInstance.container = mapRef.current;

      // Reapply the center and zoom to maintain the state
      viewInstance.center = center;
      viewInstance.zoom = zoom;
    } else {
      // Create the Map instance
      mapInstance = new Map({
        basemap: "arcgis-topographic",
      });

      // Create the MapView instance
      viewInstance = new MapView({
        container: mapRef.current,
        map: mapInstance,
        center: center, // Use the center from the state
        zoom: zoom, // Use the zoom from the state
      });

      // Load layers only for the first time
      viewInstance.when(() => {
        updateMap(mapInstance); // Update map in the global state
        updateView(viewInstance); // Update view in the global state

        const featureLayer = new FeatureLayer({
          url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/SAU_Boundaries_2022/FeatureServer/1",
        });

        const featureLayer3 = new FeatureLayer({
          url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
        });

        // Add the layers to the map
        try {
          mapInstance.add(featureLayer);
          mapInstance.add(featureLayer3);
        } catch (error) {
          console.error("Error adding feature layers to the map:", error);
        }

        // Update the center and zoom in the state when the view is initialized
        updateViewLocation(viewInstance.center, viewInstance.zoom, null);
      });

      // Listen to view changes and update the state
      viewInstance.watch(["center", "zoom"], () => {
        updateViewLocation(viewInstance.center, viewInstance.zoom, null);
      });
    }

    // Cleanup: Only remove the view's container, but keep the instance alive
    return () => {
      if (viewInstance) {
        viewInstance.container = null;
      }
    };
  }, [updateMap, updateView, center, zoom, updateViewLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;
