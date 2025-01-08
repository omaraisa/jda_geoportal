"use client";

import React, { useRef, useEffect } from "react";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import useStateStore from "../stateManager";

const MainScene = () => {
  const sceneRef = useRef(null); // Reference to the SceneView container
  const viewRef = useRef(null); // Reference to the SceneView instance

  // Extract state and actions from Zustand store
  const addMessage = useStateStore((state) => state.addMessage);
  const center = useStateStore((state) => state.center);
  const zoom = useStateStore((state) => state.zoom);
  const scale = useStateStore((state) => state.scale);
  const stateView = useStateStore((state) => state.view);
  const secondaryView = useStateStore((state) => state.secondaryView);
  const updateView = useStateStore((state) => state.updateView);
  const updateSecondaryView = useStateStore((state) => state.updateSecondaryView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const swapViews = useStateStore((state) => state.swapViews);

  useEffect(() => {
    // Set the ArcGIS API Key
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

    try {
      // Initialize the WebScene
      const scene = new WebScene({
        basemap: "arcgis-imagery",
        ground: "world-elevation",
      });

      // Initialize the SceneView
      const sceneView = new SceneView({
        container: sceneRef.current,
        map: scene,
        center,
        zoom,
        scale,
      });

      viewRef.current = sceneView;

      // When the SceneView is ready, perform additional setup
      sceneView
        .when(() => {
            if (!viewsSyncOn) {
            updateView(sceneView);
            }

          try {
            // Add FeatureLayers to the scene
            // scene.addMany([
            //   new FeatureLayer({
            //     url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/SAU_Boundaries_2022/FeatureServer/1",
            //   }),
            //   new FeatureLayer({
            //     url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
            //   }),
            // ]);
          } catch (error) {
            addMessage({
              title: "Scene Error",
              body: `Failed to add layers to the scene. ${error.message}`,
              type: "error",
              duration: 10,
            });
          }
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

    // Cleanup function to destroy the SceneView
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        // updateView(null); // Reset the view in the Zustand store
      }
    };
  }, [addMessage, center, zoom, scale, updateView]);

  
    // useEffect(() => {
    //   if (viewsSyncOn && viewRef.current) {
    //     // Sync the MapView's center and scale with the secondaryView
    //     const handleCenterChange = viewRef.current.watch("center", () => {
    //       if (secondaryView) {
    //         updateSecondaryView({
    //           ...secondaryView,
    //           center: {
    //             ...secondaryView.center,
    //             longitude: viewRef.current.center.longitude,
    //             latitude: viewRef.current.center.latitude,
    //           },
    //           scale: viewRef.current.scale,
    //         });
    //       }
    //     });
  
    //     return () => {
    //       handleCenterChange.remove(); // Cleanup watcher
    //     };
    //   }
    // }, [viewsSyncOn, secondaryView, updateSecondaryView]);
  useEffect(() => {
    if (viewsSyncOn && viewRef.current && secondaryView) {
      // Sync the MapView's center and scale with the secondaryView
      let handleCenterChange
      if(secondaryView.type === "2d")
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
    // Sync the SceneView with secondaryView on initial load
    if (viewsSyncOn && viewRef.current && !secondaryView) {
      updateSecondaryView(viewRef.current);
    }
  }, [viewsSyncOn]);

  
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
  

  return <div ref={sceneRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainScene;
