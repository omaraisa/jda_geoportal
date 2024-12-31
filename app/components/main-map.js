"use client";

import React, { useRef, useEffect } from 'react';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import dotenv from 'dotenv'
dotenv.config();
const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;


const MainMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    esriConfig.apiKey = ArcGISAPIKey; 

    const map = new Map({
      basemap: "arcgis-topographic" // Example basemap
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: [39.19797, 21.48581], 
      zoom: 12
    });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []); 

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default MainMap;