"use client";

import React, { useRef, useEffect } from "react";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import esriConfig from "@arcgis/core/config";
import dotenv from "dotenv";

dotenv.config();
const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

const MainScene = () => {
  const sceneRef = useRef(null); // Ref to attach the scene view container

  useEffect(() => {
    // Set the ArcGIS API Key
    esriConfig.apiKey = ArcGISAPIKey;

    // Create the WebScene instance
    const scene = new WebScene({
      basemap: "arcgis-imagery", // 3D Basemap for the scene
      ground: "world-elevation", // Adds realistic ground surface
    });

    // Create the SceneView instance
    const view = new SceneView({
      container: sceneRef.current, // Attach to the DOM element
      map: scene,
      center: [39.19797, 21.48581], // Default center (Jeddah, Saudi Arabia)
      scale: 500000, // Default scale for the 3D view
    });

    // Cleanup: Destroy the view when the component is unmounted
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []); // Run once when the component mounts

  return <div ref={sceneRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainScene;
