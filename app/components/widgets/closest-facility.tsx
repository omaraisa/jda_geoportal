"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import * as projection from "@arcgis/core/geometry/projection";
import IncidentControls from "./closest-facility/incident-controls";
import FacilityControls from "./closest-facility/facility-controls";
import AnalysisControls from "./closest-facility/analysis-controls";
import { ClosestFacilityService } from "./closest-facility/closest-facility-service";
import { useMapInteractions, useGraphicsLayers } from "./closest-facility/use-closest-facility-hooks";

const CLOSEST_FACILITY_URL = process.env.NEXT_PUBLIC_CLOSEST_FACILITY_URL!;
const INCIDENT_GRAPHICS_LAYER_ID = "closest-facility-incident";
const FACILITY_GRAPHICS_LAYER_ID = "closest-facility-facilities";
const ROUTE_LAYER_ID = "Closest_Facility_Route";

const ClosestFacility: React.FC = () => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const updateStats = useStateStore((state) => state.updateStats);
  
  const [incident, setIncident] = useState<{ x: number; y: number } | null>(null);
  const [addingIncident, setAddingIncident] = useState(false);
  const [numFacilities, setNumFacilities] = useState<number>(1);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [targetLayerId, setTargetLayerId] = useState<string>("");
  const [layers, setLayers] = useState<any[]>([]);
  const [showAddIncidentMsg, setShowAddIncidentMsg] = useState(false);

  // Custom hooks for map interactions and graphics layers
  useMapInteractions(
    view,
    addingIncident,
    setIncident,
    setAddingIncident,
    setShowAddIncidentMsg,
    setStatus
  );

  const { routeGraphicsLayerRef } = useGraphicsLayers(
    view,
    incident,
    INCIDENT_GRAPHICS_LAYER_ID,
    FACILITY_GRAPHICS_LAYER_ID,
    ROUTE_LAYER_ID,
    t("widgets.closestFacility.layerTitles.incident"),
    t("widgets.closestFacility.layerTitles.facilities"),
    t("widgets.closestFacility.layerTitles.route")
  );

  useEffect(() => {
    projection.load(); // load the module once
  }, []);

  useEffect(() => {
    if (view?.map) {
      const selectableLayers = ClosestFacilityService.getSelectableLayers(view);
      setLayers(selectableLayers);
    }
  }, [view]);

  const handleAddIncident = () => {
    setAddingIncident(true);
    setShowAddIncidentMsg(true);
    if (view) {
      view.container.style.cursor = "crosshair";
    }
  };

  const handleNumFacilitiesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNumFacilities(Number(e.target.value));
  };

  const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetLayerId(e.target.value);
  };

  const handleRun = async () => {
    setStatusType("info");
    setStatus(t("widgets.closestFacility.status.running") || "Running analysis...");
    
    try {
      if (!incident) throw new Error("Incident location not set.");
      if (!view) throw new Error("Map view not available.");
      if (!targetLayerId) throw new Error("No target layer selected.");

      const layer = view.map.layers.find((l: any) => l.id === targetLayerId) as any;
      if (!layer) throw new Error("Selected layer not found.");

      // Extract facilities from the selected layer
      const facilities = await ClosestFacilityService.extractFacilitiesFromLayer(layer, view);
      if (facilities.length === 0) throw new Error("No facilities found in selected layer.");

      // Project facilities to WGS84
      const facilitiesWGS = await ClosestFacilityService.projectFacilitiesToWGS84(facilities, view);

      // Perform the closest facility analysis
      const data = await ClosestFacilityService.performClosestFacilityAnalysis(
        incident,
        facilitiesWGS,
        numFacilities,
        CLOSEST_FACILITY_URL
      );

      if (data.error) {
        console.error("Network Analysis Error:", data.error);
        setStatusType("error");
        setStatus(data.error.message || "Analysis failed.");
        routeGraphicsLayerRef.current?.removeAll();
        return;
      }

      // Render the results
      const facilitiesParam = {
        features: facilitiesWGS.map((f, i) => ({
          geometry: {
            x: f.x,
            y: f.y,
            spatialReference: { wkid: 4326 }
          },
          attributes: {
            Name: `Facility ${i + 1}`
          }
        }))
      };

      const graphics = ClosestFacilityService.renderAnalysisResults(
        data,
        numFacilities,
        facilitiesParam,
        routeGraphicsLayerRef.current
      );

      // Zoom to the result graphics
      if (view && graphics.length > 0) {
        const allGeoms = graphics.map(g => g.geometry).filter(Boolean);
        view.goTo(allGeoms, { duration: 1800 }).catch(() => {});
      }

      // Set success status
      if (data.routes && data.routes.features && data.routes.features.length > 0) {
        setTimeout(() => {
          setStatusType("success");
          setStatus(
            t("widgets.closestFacility.status.success") ||
            `Analysis complete. Found ${data.routes.features.length} route(s).`
          );
        }, 400);
      } else {
        setStatusType("info");
        setStatus(
          t("widgets.closestFacility.status.noRoutes") ||
          "No routes found. Please check your incident and facilities."
        );
      }
    } catch (err: any) {
      setStatusType("error");
      setStatus(err.message || "Analysis failed.");
      routeGraphicsLayerRef.current?.removeAll();
    }

    updateStats("Closest Facility");
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">{t("widgets.closestFacility.title")}</h2>
      
      <IncidentControls
        incident={incident}
        addingIncident={addingIncident}
        showAddIncidentMsg={showAddIncidentMsg}
        onAddIncident={handleAddIncident}
      />

      <FacilityControls
        targetLayerId={targetLayerId}
        numFacilities={numFacilities}
        layers={layers}
        onLayerChange={handleLayerChange}
        onNumFacilitiesChange={handleNumFacilitiesChange}
      />

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
      />
    </div>
  );
};

export default ClosestFacility;
