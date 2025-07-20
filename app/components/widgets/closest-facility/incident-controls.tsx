"use client";

import { useTranslation } from "react-i18next";

interface IncidentControlsProps {
  incident: { x: number; y: number } | null;
  addingIncident: boolean;
  showAddIncidentMsg: boolean;
  onAddIncident: () => void;
}

export default function IncidentControls({
  incident,
  addingIncident,
  showAddIncidentMsg,
  onAddIncident
}: IncidentControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <button
        className={`btn btn-primary w-full ${addingIncident ? "opacity-70" : ""}`}
        onClick={onAddIncident}
        disabled={addingIncident}
      >
        {incident
          ? t("widgets.closestFacility.changeIncident")
          : t("widgets.closestFacility.addIncident")}
      </button>
      
      {showAddIncidentMsg && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded animate-pulse text-center">
          {t("widgets.closestFacility.clickMapToAddIncident") || "Click on the map to add location."}
        </div>
      )}
      
      {incident && (
        <div className="text-sm text-blue-700">
          {t("widgets.closestFacility.incidentLocation")} ({incident.x}, {incident.y})
        </div>
      )}
    </div>
  );
}
