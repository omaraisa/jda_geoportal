import { useEffect, useRef } from "react";
import Directions from "@arcgis/core/widgets/Directions";
import RouteLayer from "@arcgis/core/layers/RouteLayer";
import useStateStore from "@/stateStore";

const ROUTE_SERVICE_URL = "https://gis.jda.gov.sa/agserver/rest/services/JeddahNetwork/NAServer/Route";

export default function DirectionsComponent() {
  const directionsRef = useRef<HTMLDivElement>(null);
  const directionsWidget = useRef<Directions | null>(null);
  const routeLayerRef = useRef<RouteLayer | null>(null);

  const view = useStateStore((state) => state.targetView);
  const addWidget = useStateStore((state) => state.addWidget);
  const updateStats = useStateStore((state) => state.updateStats);

  useEffect(() => {
    if (!view || !directionsRef.current) return;

    if (!routeLayerRef.current) {
      routeLayerRef.current = new RouteLayer({
        url: ROUTE_SERVICE_URL
      });
      view.map.add(routeLayerRef.current);
    }

    if (!directionsWidget.current) {
      directionsWidget.current = new Directions({
        view,
        layer: routeLayerRef.current,
        container: directionsRef.current,
        visibleElements: {
          saveButton: false,
          saveAsButton: false,
        },
      });
      addWidget("directionsWidget", directionsWidget.current);
    } else {
      directionsWidget.current.view = view;
      if (directionsWidget.current.layer !== routeLayerRef.current) {
        directionsWidget.current.layer = routeLayerRef.current;
      }
    }
    updateStats("directions_performed");
  }, [view]);

  return (
    <div
      ref={directionsRef}
      className="h-full w-full"
    ></div>
  );
}
