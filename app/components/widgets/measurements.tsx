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
  const [showDistance, setShowDistance] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const view = useStateStore((state) => state.targetView);
  const updateStats = useStateStore((state) => state.updateStats);

  useEffect(() => {
    if (!view || !showDistance) return;

    if (!distanceMeasurementWidget.current) {
      distanceMeasurementWidget.current = new Measurement({
        view: view,
        container: distanceMeasurementRef.current || undefined,
        activeTool: "distance",
      });
    }

    return () => {
      if (distanceMeasurementWidget.current) {
        distanceMeasurementWidget.current.destroy();
        distanceMeasurementWidget.current = null;
      }
    };
  }, [view, showDistance]);

  useEffect(() => {
    if (!view || !showArea) return;

    if (!areaMeasurementWidget.current) {
      areaMeasurementWidget.current = new Measurement({
        view: view,
        container: areaMeasurementRef.current || undefined,
        activeTool: "area",
      });
    }

    return () => {
      if (areaMeasurementWidget.current) {
        areaMeasurementWidget.current.destroy();
        areaMeasurementWidget.current = null;
      }
    };
  }, [view, showArea]);

  const handleToolChange = (tool: string) => {
    if (activeTool === tool) return;

    if (activeTool === "distance" && distanceMeasurementWidget.current) {
      distanceMeasurementWidget.current.destroy();
      distanceMeasurementWidget.current = null;
    } else if (activeTool === "area" && areaMeasurementWidget.current) {
      areaMeasurementWidget.current.destroy();
      areaMeasurementWidget.current = null;
    }

    if (tool === "distance") {
      setShowDistance(true);
      setShowArea(false);
      updateStats("Distance Measurement");
    } else if (tool === "area") {
      setShowArea(true);
      setShowDistance(false);
      updateStats("Area Measurement");
    }

    setActiveTool(tool);
  };

  const handleClear = () => {
    if (distanceMeasurementWidget.current) {
      distanceMeasurementWidget.current.destroy();
      distanceMeasurementWidget.current = null;
    }
    if (areaMeasurementWidget.current) {
      areaMeasurementWidget.current.destroy();
      areaMeasurementWidget.current = null;
    }

    setShowDistance(false);
    setShowArea(false);
    setActiveTool(null);

    if (view) {
      view.graphics.removeAll();
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4">
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

      {showDistance && (
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground font-semibold">{t('widgets.measurements.distanceMeasurement')}</h3>
          <div
            ref={distanceMeasurementRef}
            className="flex-1"
            style={{ position: "relative" }}
          ></div>
        </div>
      )}

      {showArea && (
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground font-semibold">{t('widgets.measurements.areaMeasurement')}</h3>
          <div
            ref={areaMeasurementRef}
            className="flex-1"
            style={{ position: "relative" }}
          ></div>
        </div>
      )}

      <div className="mt-4">
        <button className="btn btn-danger w-full" onClick={handleClear}>
          {t('widgets.measurements.clear')}
        </button>
      </div>
    </div>
  );
}
