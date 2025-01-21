"use client";

import React, { useRef, useEffect, useState } from "react";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import useStateStore from "../stateManager";
import Loading from "./sub_components/loading";

const MainScene = () => {
  const sceneRef = useRef(null); // Reference to the SceneView container
  const viewRef = useRef(null); // Reference to the SceneView instance
  const [loading, setLoading] = useState(true); // Loading state

  // Extract state and actions from Zustand store
  const addMessage = useStateStore((state) => state.addMessage);
  const center = useStateStore((state) => state.center);
  const zoom = useStateStore((state) => state.zoom);
  const scale = useStateStore((state) => state.scale);
  const mapView = useStateStore((state) => state.mapView);
  const targetView = useStateStore((state) => state.targetView);
  const updateSceneView = useStateStore((state) => state.updateSceneView);
  const updateTargetView = useStateStore((state) => state.updateTargetView);
  // const updatemapView = useStateStore((state) => state.updatemapView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const scenelayers = useStateStore((state) => state.scenelayers);
  const addInitialLayers = useStateStore((state) => state.addInitialLayers);

  useEffect(() => {
    // Set the ArcGIS API Key
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;
    if(!viewRef.current) {
    try {
      // Initialize the WebScene
      const scene = new WebScene({
        basemap: "arcgis-imagery",
        ground: "world-elevation",
      });

      // Initialize the SceneView
      viewRef.current = new SceneView({
        container: sceneRef.current,
        map: scene,
        center,
        zoom,
        scale,
        ui: {
          components: []
        }
      });


      // When the SceneView is ready, perform additional setup
      viewRef.current
        .when(() => {
          updateSceneView(viewRef.current);
          setLoading(false); // Set loading to false when the scene view is ready
          addInitialLayers(scenelayers, viewRef.current);

        })
        .catch((error) => {
          addMessage({
            title: "Scene Initialization Error",
            body: `Failed to initialize the scene view. ${error.message}`,
            type: "error",
            duration: 10,
          });
        });
    } catch (error) {
      addMessage({
        title: "Scene Creation Error",
        body: `An error occurred while creating the scene. ${error.message}`,
        type: "error",
        duration: 10,
      });
    }
  }
  else {
      setLoading(false);
  }

    // Cleanup function to destroy the SceneView
    return () => {
      if (viewRef.current) {
        // viewRef.current.destroy();
        // updateSceneView(null); // Reset the view in the Zustand store
      }
    };
  }, [addMessage, center, zoom, scale, updateSceneView]);


  useEffect(() => {
    if (viewsSyncOn && viewRef.current && mapView) {
      let handleCenterChange;
      if (targetView.type === "3d") {
        handleCenterChange = viewRef.current.watch("center", () => {
          mapView.center = viewRef.current.center;
          mapView.scale = viewRef.current.scale;
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
  }, [viewsSyncOn,mapView,targetView]);

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
  
  return (
    <div style={{ width: "100%", height: "100%" }}>
      {loading && <Loading />}
      <div ref={sceneRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MainScene;
