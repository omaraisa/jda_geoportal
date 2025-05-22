"use client";

import React, { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import useStateStore from "@/stateStore";
import useCoordinatesDisplay from "@/lib/hooks/use-coordinates-display";

interface CustomMapView extends MapView {
  eventHandlers?: { [key: string]: __esri.WatchHandle };
}

const MainMap = () => {
  // solveClosestFacility()


  const mapRef = useRef(null);
  const viewRef = useRef<CustomMapView | null>(null);
  const mapInitializedRef = useRef(false);

  const sendMessage = useStateStore((state) => state.sendMessage);
  const center = useStateStore((state) => state.center);
  const zoom = useStateStore((state) => state.zoom);
  const targetView = useStateStore((state) => state.targetView);
  const sceneView = useStateStore((state) => state.sceneView);
  const updateMapView = useStateStore((state) => state.updateMapView);
  const updateTargetView = useStateStore((state) => state.updateTargetView);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);
  const setAppReady = useStateStore((state) => state.setAppReady);
  const loadUserGroupLayers = useStateStore((state) => state.loadUserGroupLayers);
  useCoordinatesDisplay(viewRef.current) 

  useEffect(() => {
    if (!mapInitializedRef.current) {
      mapInitializedRef.current = true;
          try {
            const map = new Map({ basemap: "topo-vector" });

            viewRef.current = new MapView({
              container: mapRef.current as unknown as HTMLDivElement,
              map: map,
              center,
              zoom,
              rotation: 270,
              ui: {
                components: [],
              },
            });

            viewRef.current
              ?.when(() => {
                updateMapView(viewRef.current!);
                updateTargetView(viewRef.current!);
                loadUserGroupLayers();
                setAppReady(true);
              })
              .catch((error: any) => {
                sendMessage({
                  title: "Map Initialization Error",
                  body: `Failed to initialize the map view. ${(error as Error).message}`,
                  type: "error",
                  duration: 10,
                });
              });
          } catch (error: any) {
            sendMessage({
              title: "Map Creation Error",
              body: `An error occurred while creating the map. ${(error as Error).message}`,
              type: "error",
              duration: 10,
            });
          }
    }
  }, []);

  useEffect(() => {
    if (viewsSyncOn && viewRef.current && sceneView && targetView) {
      let handleCenterChange: __esri.WatchHandle | undefined;
      if (targetView.type === "2d") {
        handleCenterChange = viewRef.current.watch("center", () => {
          sceneView.center = viewRef.current!.center;
          sceneView.scale = viewRef.current!.scale;
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
  }, [viewsSyncOn, sceneView, targetView]);

  useEffect(() => {
    if (viewRef.current) {
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

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default MainMap;

function solveClosestFacility() {
  const token = "TU_C3t7ur96bsZCfKR0XPRUxzMvoUpcLwyrJrnZ3DgNJv0i-aSSeiRAYhZHgnOCAhF3kcnLFIGOIklG3cV3edC3SWmTeosWSVJHYWX5Jbqsa7VDDBsCp9ECUDMuh8qupiXnMtM-IDuwruWC4RF8eOgjuVsGmHfPsrceuScPT3Io."; // Replace with your actual token

  const url = "https://gis.jda.gov.sa/agserver/rest/services/JeddahNetwork/NAServer/Closest%20Facility/solveClosestFacility";

  // Coordinates in WGS84 (will still try to send them as 4326, assuming the server supports it)
  const incident = {
    geometry: { x: 39.1263, y: 21.6578, spatialReference: { wkid: 4326 } },
    attributes: { Name: "Incident 1", ID: 1 }
  };

  const facility = {
    geometry: { x: 39.163857, y: 21.6064, spatialReference: { wkid: 4326 } },
    attributes: { Name: "Facility 1", ID: 1 }
  };

  // Construct POST body
  const params = new URLSearchParams({
    f: "json",
    token,
    incidents: JSON.stringify({
      features: [incident],
      geometryType: "esriGeometryPoint",
      spatialReference: { wkid: 4326 }
    }),
    facilities: JSON.stringify({
      features: [facility],
      geometryType: "esriGeometryPoint",
      spatialReference: { wkid: 4326 }
    }),
    travelDirection: "toFacility", // or "fromFacility"
    defaultCutoff: "10000", // max distance in meters (arbitrary large value)
    returnCFRoutes: "true",
    returnDirections: "false",
    outSR: "4326"
  });

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Closest Facility Result:", data);
      if (data.routes && data.routes.features.length) {
        console.log("Found Route:", data.routes.features[0].attributes);
      } else {
        console.warn("No route found or response did not include routes.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

}
