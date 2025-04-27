"use client";

import React, { useRef, useEffect, useState } from "react";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import esriConfig from "@arcgis/core/config";
import useStateStore from "@/stateStore";
import Loading from "./ui/loading";
// import { sceneBasemapConfigurations } from "@/lib/initial-layers";

declare module "@arcgis/core/views/SceneView" {
  interface SceneView {
    eventHandlers?: Record<string, __esri.Handle>;
  }
}
const MainScene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<__esri.SceneView | null>(null);
  const [loading, setLoading] = useState(true);
  const eventHandlersRef = useRef<Record<string, __esri.Handle>>({});

  const { sendMessage, center, zoom, scale, mapView, targetView, updateSceneView, updateTargetView, viewsSyncOn, addBasemapLayers } = useStateStore((state) => state);
  
  useEffect(() => {
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey as string;
    if (!viewRef.current) {
      try {
        const scene = new WebScene({
          basemap: "arcgis-imagery",
          ground: "world-elevation",
        });

        viewRef.current = new SceneView({
          container: sceneRef.current as HTMLDivElement,
          map: scene,
          camera: {
            position: { x: 39.03797, y: 21.51581, z: 4000 },
            heading: 90,
            tilt: 80,
          },
          ui: {
            components: [],
          },
        });

        viewRef.current
          .when(() => {
            updateSceneView(viewRef.current);
            setLoading(false);
            // if(viewRef.current) addBasemapLayers();
          })
          .catch((error: Error) => {
            sendMessage({
              title: "Scene Initialization Error",
              body: `Failed to initialize the scene view. ${error.message}`,
              type: "error",
              duration: 10,
            });
          });
      } catch (error: any) {
        sendMessage({
          title: "Scene Creation Error",
          body: `An error occurred while creating the scene. ${error.message}`,
          type: "error",
          duration: 10,
        });
      }
    } else {
      setLoading(false);
    }

    return () => {
      if (viewRef.current) {
        // viewRef.current.destroy();
        // updateSceneView(null);
      }
    };
  }, [sendMessage, center, zoom, scale, updateSceneView]);

  useEffect(() => {
    if (viewsSyncOn && viewRef.current && mapView && targetView) {
      let handleCenterChange: __esri.WatchHandle | undefined;
      if (targetView.type === "3d") {
        handleCenterChange = viewRef.current.watch("center", () => {
          mapView.center = viewRef.current!.center;
          mapView.scale = viewRef.current!.scale;
        });
      } else if (handleCenterChange) {
        handleCenterChange.remove();
      }

      return () => {
        if (handleCenterChange) {
          handleCenterChange.remove();
        }
      };
    }
  }, [viewsSyncOn, mapView, targetView]);

  useEffect(() => {
    if (viewRef.current) {
      const existingHandlers = eventHandlersRef.current;
  
      if (!existingHandlers["pointer-down"]) {
        const handlePointerDown = () => {
          if (viewRef.current !== targetView) {
            updateTargetView(viewRef.current);
          }
        };
  
        const pointerDownHandler = viewRef.current.on(
          "pointer-down",
          handlePointerDown
        );
  
        existingHandlers["pointer-down"] = pointerDownHandler;
  
        return () => {
          if (pointerDownHandler) {
            pointerDownHandler.remove();
            delete existingHandlers["pointer-down"];
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
