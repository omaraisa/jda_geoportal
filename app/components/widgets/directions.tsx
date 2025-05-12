import { useEffect, useRef } from "react";
import Directions from "@arcgis/core/widgets/Directions";
import RouteLayer from "@arcgis/core/layers/RouteLayer";
import useStateStore from "@/stateStore";

export default function DirectionsComponent() {
  const directionsRef = useRef<HTMLDivElement>(null);
  const directionsWidget = useRef<Directions | null>(null);
  const routeLayerRef = useRef<RouteLayer | null>(null);

  const view = useStateStore((state) => state.targetView);
  const addWidget = useStateStore((state) => state.addWidget);

  useEffect(() => {
    if (!view || !directionsRef.current) return;

    // Ensure a single RouteLayer exists
    if (!routeLayerRef.current || !view.map.layers.includes(routeLayerRef.current)) {
      // Remove any previous RouteLayer
      view.map.layers.forEach((layer: any) => {
        if (layer.type === "route") {
          view.map.remove(layer);
        }
      });
      // Add new RouteLayer
      routeLayerRef.current = new RouteLayer();
      view.map.add(routeLayerRef.current);
    }

    // Initialize or update the Directions widget
    if (
      directionsWidget.current &&
      directionsWidget.current.container instanceof HTMLElement &&
      directionsRef.current.contains(directionsWidget.current.container)
    ) {
      directionsWidget.current.view = view;
      directionsWidget.current.layer = routeLayerRef.current || undefined;
    } else {
      directionsWidget.current = new Directions({
        view: view,
        layer: routeLayerRef.current || undefined,
        container: directionsRef.current,
      });
      addWidget("directionsWidget", directionsWidget.current);
    }

    // No destroy/cleanup to preserve widget state, just like Legend
  }, [view]);

  return (
    <div
      ref={directionsRef}
      className="h-full w-full"
    ></div>
  );
}
