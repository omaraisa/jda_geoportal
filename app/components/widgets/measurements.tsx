import { useEffect, useRef, useState } from "react";
import Measurement from "@arcgis/core/widgets/Measurement";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";

export default function MeasurementComponent() {
  const { t } = useTranslation();
  const distanceMeasurementRef = useRef(null);
  const areaMeasurementRef = useRef(null);
  const distanceMeasurementWidget = useRef<Measurement | null>(null);
  const areaMeasurementWidget = useRef<Measurement | null>(null);
  const [showDistance, setShowDistance] = useState(false); // Track if Distance widget is visible
  const [showArea, setShowArea] = useState(false); // Track if Area widget is visible
  const [activeTool, setActiveTool] = useState<string | null>(null); // Track which tool is active (distance/area)

  const view = useStateStore((state) => state.targetView);

  // Initialize or destroy Distance Measurement widget
  useEffect(() => {
    if (!view || !showDistance) return;

    if (!distanceMeasurementWidget.current) {
      distanceMeasurementWidget.current = new Measurement({
        view: view,
        container: distanceMeasurementRef.current || undefined,
        activeTool: "distance", // Set to distance measurement
      });
    }

    // Cleanup when Distance widget is hidden or tool changes
    return () => {
      if (distanceMeasurementWidget.current) {
        distanceMeasurementWidget.current.destroy();
        distanceMeasurementWidget.current = null;
      }
    };
  }, [view, showDistance]); // Re-run when view or showDistance changes

  // Initialize or destroy Area Measurement widget
  useEffect(() => {
    if (!view || !showArea) return;

    if (!areaMeasurementWidget.current) {
      areaMeasurementWidget.current = new Measurement({
        view: view,
        container: areaMeasurementRef.current || undefined,
        activeTool: "area", // Set to area measurement
      });
    }

    // Cleanup when Area widget is hidden or tool changes
    return () => {
      if (areaMeasurementWidget.current) {
        areaMeasurementWidget.current.destroy();
        areaMeasurementWidget.current = null;
      }
    };
  }, [view, showArea]); // Re-run when view or showArea changes

  // Handle tool switching and cleanup
  const handleToolChange = (tool: string) => {
    if (activeTool === tool) return; // Prevent redundant toggles

    // Cleanup the current active tool drawing before switching to a new one
    if (activeTool === "distance" && distanceMeasurementWidget.current) {
      distanceMeasurementWidget.current.destroy();
      distanceMeasurementWidget.current = null;
    } else if (activeTool === "area" && areaMeasurementWidget.current) {
      areaMeasurementWidget.current.destroy();
      areaMeasurementWidget.current = null;
    }

    // Activate the new tool
    if (tool === "distance") {
      setShowDistance(true);
      setShowArea(false);
    } else if (tool === "area") {
      setShowArea(true);
      setShowDistance(false);
    }

    // Update active tool state
    setActiveTool(tool);
  };

  // Clear the drawing and reset the view
  const handleClear = () => {
    // Clear the drawing if active
    if (distanceMeasurementWidget.current) {
      distanceMeasurementWidget.current.destroy();
      distanceMeasurementWidget.current = null;
    }
    if (areaMeasurementWidget.current) {
      areaMeasurementWidget.current.destroy();
      areaMeasurementWidget.current = null;
    }

    // Reset tool states
    setShowDistance(false);
    setShowArea(false);
    setActiveTool(null);

    // Optionally clear the view (map) here if needed
    if (view) {
      view.graphics.removeAll(); // Removes all graphics from the view
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4">
      {/* Buttons to toggle between Distance and Area */}
      <div className="flex gap-4">
        <button
          className={`btn ${showDistance ? "btn-primary" : "btn-gray"} flex-grow`}
          onClick={() => handleToolChange("distance")}
        >
          {t('widgets.measurements.distance')}
        </button>
        <button
          className={`btn ${showArea ? "btn-primary" : "btn-gray"} flex-grow`}
          onClick={() => handleToolChange("area")}
        >
          {t('widgets.measurements.area')}
        </button>
      </div>

      {/* Distance Measurement Widget */}
      {showDistance && (
        <div className="flex flex-col gap-2">
          <h3 className="text-white font-semibold">{t('widgets.measurements.distanceMeasurement')}</h3>
          <div
            ref={distanceMeasurementRef}
            className="flex-1"
            style={{ position: "relative" }}
          ></div>
        </div>
      )}

      {/* Area Measurement Widget */}
      {showArea && (
        <div className="flex flex-col gap-2">
          <h3 className="text-white font-semibold">{t('widgets.measurements.areaMeasurement')}</h3>
          <div
            ref={areaMeasurementRef}
            className="flex-1"
            style={{ position: "relative" }}
          ></div>
        </div>
      )}

      {/* Clear Button */}
      <div className="mt-4">
        <button className="btn btn-danger w-full" onClick={handleClear}>
          {t('widgets.measurements.clear')}
        </button>
      </div>
    </div>
  );
}
