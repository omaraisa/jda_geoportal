"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import dotenv from "dotenv";
import useStateStore from "../stateManager";

dotenv.config();
const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

const MainMap = () => {
  const mapRef = useRef(null);
  const addMessage = useStateStore((state) => state.addMessage); // Zustand message function
  const center = useStateStore((state) => state.center); // Get the center from the state
  const zoom = useStateStore((state) => state.zoom); // Get the zoom from the state
  const updateView = useStateStore((state) => state.updateView); // Update the view in the state

  useEffect(() => {
    esriConfig.apiKey = ArcGISAPIKey;

    let view;

    try {
      // Create the Map instance
      const map = new Map({
        basemap: "arcgis-topographic", // Example basemap
      });

      // Create the MapView instance
      view = new MapView({
        container: mapRef.current, // Attach to the DOM element
        map: map,
        center, // Use the center from the state
        zoom, // Use the zoom level from the state
      });

      // Add the FeatureLayer to the map when the view is ready
      view.when(() => {
        // Update the view in the state when it is successfully initialized
        updateView(view);

        try {
          const featureLayer = new FeatureLayer({
            url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/SAU_Boundaries_2022/FeatureServer/1",
          });

          const featureLayer3 = new FeatureLayer({
            url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
          });

          // Add the layers to the map
          map.add(featureLayer);
          map.add(featureLayer3);
        } catch (error) {
          console.error("Error adding feature layers to the map:", error);
          addMessage({
            title: "Map Error",
            body: `Failed to add layers to the map. ${error.message}`,
            type: "error",
            duration: 10, // Display for 10 seconds
          });
        }
      }).catch((error) => {
        console.error("Error initializing the map view:", error);
        addMessage({
          title: "Map Initialization Error",
          body: `Failed to initialize the map view. ${error.message}`,
          type: "error",
          duration: 10, // Display for 10 seconds
        });
      });
    } catch (error) {
      console.error("Error creating Map or MapView:", error);
      addMessage({
        title: "Map Creation Error",
        body: `An error occurred while creating the map. ${error.message}`,
        type: "error",
        duration: 10, // Display for 10 seconds
      });
    }

    // Cleanup: Destroy the view when the component is unmounted
    return () => {
      if (view) {
        view.destroy();
        updateView(null); // Reset the view in the state when unmounting
      }
    };
  }, [addMessage, center, zoom, updateView]); // Dependencies for initial configuration

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;
