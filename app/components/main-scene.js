"use client";

import React, { useRef, useEffect } from "react";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import esriConfig from "@arcgis/core/config";
import dotenv from "dotenv";
import useStateStore from "../stateManager";

dotenv.config();
const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

const MainScene = () => {
  const sceneRef = useRef(null); // Ref to attach the scene view container
  const addMessage = useStateStore((state) => state.addMessage); // Zustand message function
  const center = useStateStore((state) => state.center); // Get the center from the state
  const scale = useStateStore((state) => state.scale); // Get the scale from the state
  const updateView = useStateStore((state) => state.updateView); // Update the view in the state

  useEffect(() => {
    esriConfig.apiKey = ArcGISAPIKey;

    let view;

    try {
      // Create the WebScene instance
      const scene = new WebScene({
        basemap: "arcgis-imagery", // 3D Basemap for the scene
        ground: "world-elevation", // Adds realistic ground surface
      });

      // Create the SceneView instance
      view = new SceneView({
        container: sceneRef.current, // Attach to the DOM element
        map: scene,
        center, // Use the center from the state
        scale, // Use the scale from the state
      });

      // Update the view in the state when it is successfully initialized
      view.when(() => {
        updateView(view);
      }).catch((error) => {
        console.error("Error initializing SceneView:", error);
        addMessage({
          title: "Scene Initialization Error",
          body: `Failed to initialize the scene view. ${error.message}`,
          type: "error",
          duration: 10, // Display for 10 seconds
        });
      });
    } catch (error) {
      console.error("Error creating WebScene or SceneView:", error);
      addMessage({
        title: "Scene Creation Error",
        body: `An error occurred while creating the scene. ${error.message}`,
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
  }, [addMessage, center, scale, updateView]); // Dependencies for initial configuration

  return <div ref={sceneRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainScene;
