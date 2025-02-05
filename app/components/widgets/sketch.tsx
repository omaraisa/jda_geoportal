import { useEffect, useRef } from "react";
import Sketch from "@arcgis/core/widgets/Sketch";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Color from "@arcgis/core/Color";
import useStateStore from "@/stateManager";
import { useTranslation } from "react-i18next";

export default function SketchComponent() {
  const { t } = useTranslation();
  const sketchRef = useRef(null);
  const sketchWidget =useRef<Sketch | null>(null);
  const graphicsLayer = useRef<GraphicsLayer | null>(null);

  const view = useStateStore((state) => state.targetView);
  const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);

  useEffect(() => {
    if (!view) return;

    // Define colorful symbols
    const pointSymbol = new SimpleMarkerSymbol({
      color: [4, 123, 139, 1], // Primary color
      outline: {
      color: [29, 29, 29, 1], // Foreground color
      width: 2,
      },
      size: 12,
      style: "circle",
    });

    const lineSymbol = new SimpleLineSymbol({
      color: [231, 175, 57, 1], // Secondary color
      width: 3,
      style: "solid",
    });

    const polygonSymbol = new SimpleFillSymbol({
      color: [59, 191, 173, 0.5], // Tertiary color with 50% opacity
      outline: {
      color: [29, 29, 29, 1], // Foreground color
      width: 2,
      },
      style: "solid",
    });

    // Initialize or update the Sketch widget
    if (sketchWidget.current) {
      sketchWidget.current.view = view; // Update the view of the existing widget
    } else {
      // Create a new GraphicsLayer and add it to the view if it doesn't exist
      const existingLayer = view.map.layers.find(
        (layer) => layer.title === "drawing Layer"
      );
      if (existingLayer) {
        graphicsLayer.current = existingLayer as GraphicsLayer;
      } else {
        graphicsLayer.current = new GraphicsLayer({ title: "drawing Layer" });
        view.map.add(graphicsLayer.current);
      }

      sketchWidget.current = new Sketch({
        view: view,
        layer: graphicsLayer.current,
        container: sketchRef.current || undefined,
        creationMode: "update", // Allow updating graphics after creation
      });

      // Set default symbols for different geometry types
      sketchWidget.current.on("create", (event) => {
        if (event.state === "complete") {
          const graphic = event.graphic;
          switch (graphic.geometry.type) {
            case "point":
              graphic.symbol = pointSymbol;
              break;
            case "polyline":
              graphic.symbol = lineSymbol;
              break;
            case "polygon":
              graphic.symbol = polygonSymbol;
              break;
            default:
              break;
          }
        }
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (graphicsLayer.current && graphicsLayer.current.graphics.length === 0) {
        // view.map.remove(graphicsLayer.current);
        // graphicsLayer.current = null;
        // Widget destruction is disabled to preserve state. Uncomment to enable cleanup:
        // sketchWidget.current.destroy();
        // sketchWidget.current = null;
      }
    };
  }, [view, sidebarOpen]); // Re-run when the view changes

  const clearDrawings = () => {
    if (graphicsLayer.current) {
      graphicsLayer.current.removeAll();
    }
  };

  return (
    <div className="h-full w-full flex flex-col">


      <button onClick={clearDrawings} className="btn btn-danger w-full">
        {t('widgets.sketch.clear')}
      </button>
      <div ref={sketchRef} className="flex flex-grow" ></div>
    </div>
  );
}