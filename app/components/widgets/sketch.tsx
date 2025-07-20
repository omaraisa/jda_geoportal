import { useEffect, useRef } from "react";
import Sketch from "@arcgis/core/widgets/Sketch";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { pointSymbol, lineSymbol, polygonSymbol } from "@/lib/symbols";

export default function SketchComponent() {
  const { t } = useTranslation();
  const sketchRef = useRef(null);
  const sketchWidget = useRef<Sketch | null>(null);
  const graphicsLayer = useRef<GraphicsLayer | null>(null);

  const view = useStateStore((state) => state.targetView);
  const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);

  useEffect(() => {
    if (!view) return;

    if (sketchWidget.current) {
      sketchWidget.current.view = view; 
    } else {
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
        creationMode: "update", 
      });

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
      <div ref={sketchRef} className="flex flex-grow"></div>
    </div>
  );
}