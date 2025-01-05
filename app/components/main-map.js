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

const MainMap = () => {
  const mapRef = useRef(null);
  const updateMap = useAppStore((state) => state.updateMap);
  const updateView = useAppStore((state) => state.updateView);

  useEffect(() => {
    esriConfig.apiKey = ArcGISAPIKey;

    const map = new Map({
      basemap: "arcgis-topographic", // Example basemap
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: [39.19797, 21.48581], // Coordinates for Jeddah, Saudi Arabia
      zoom: 12,
    });

    // Add the FeatureLayer to the map when the view is ready
    view.when(() => {
      updateMap(map); // Update map in the global state
      updateView(view); // Update view in the global state

      const featureLayer = new FeatureLayer({
        url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/SAU_Boundaries_2022/FeatureServer/1",
      });

    //   const featureLayer2 = new FeatureLayer({
    //     url: "https://services8.arcgis.com/G62CNq4aRFEDWLdk/arcgis/rest/services/Jazan_Borders/FeatureServer",
    //   });

      const featureLayer3 = new FeatureLayer({
        url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
      });

      // Add the layer to the map
    try {
      map.add(featureLayer);
      // map.add(featureLayer2);
      map.add(featureLayer3);
    } catch (error) {
      console.error("Error adding feature layers to the map:", error);
    }
    });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [updateMap, updateView]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;
