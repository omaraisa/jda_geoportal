import { useEffect, useRef } from "react";
import Sketch from "@arcgis/core/widgets/Sketch";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import useStateStore from "@/stateManager";

export default function SketchComponent() {
  const sketchRef = useRef(null);
  const sketchWidget = useRef(null);
  const graphicsLayer = useRef(null);

  const view = useStateStore((state) => state.targetView);
  const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);

  useEffect(() => {
    if (!view) return;

    // Initialize or update the Sketch widget
    if (sketchWidget.current) {
      sketchWidget.current.view = view; // Update the view of the existing widget
    } else {
      // Create a new GraphicsLayer and add it to the view if it doesn't exist
      const existingLayer = view.map.layers.find(layer => layer.title === "drawing Layer");
      if (existingLayer) {
        graphicsLayer.current = existingLayer;
      } else {
        graphicsLayer.current = new GraphicsLayer({ title: "drawing Layer" });
        view.map.add(graphicsLayer.current);
      }

      sketchWidget.current = new Sketch({
        view: view,
        layer: graphicsLayer.current,
        container: sketchRef.current,
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (graphicsLayer.current && graphicsLayer.current.graphics.length === 0) {
        view.map.remove(graphicsLayer.current);
        graphicsLayer.current = null;
      }
    };
  }, [view, sidebarOpen]); // Re-run when the view changes

  return (
    <div
      ref={sketchRef}
      className="h-full w-full"
    ></div>
  );
}
