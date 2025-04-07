import { useEffect, useRef } from "react";
import wgs84ToUtmZone37N from "@/lib/utils/wgs84ToUtmZone37N";

const useCoordinatesDisplay = (view: __esri.MapView | null) => {
  const coordinatesContainerRef = useRef<HTMLDivElement | null>(null);
  const pointerMoveHandleRef = useRef<__esri.Handle | null>(null);

  useEffect(() => {
    if (view && view.ready) {
      if (!coordinatesContainerRef.current) {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.bottom = "1em";
        div.style.left = "1em";
        div.style.padding = "0.5em";
        div.style.color = "rgb(85, 85, 85)";
        div.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        div.style.fontSize = "0.75em";
        div.style.zIndex = "2";
        div.innerHTML = "Lat: 0, Lon: 0, UTM: 0, 0";
        view.container.appendChild(div);
        coordinatesContainerRef.current = div;
      }

      if (pointerMoveHandleRef.current) {
        pointerMoveHandleRef.current.remove();
      }

      const handlePointerMove = (event: __esri.ViewPointerMoveEvent) => {
        if (!coordinatesContainerRef.current) return;

        const screenPoint = { x: event.x, y: event.y };
        const mapPoint = view.toMap(screenPoint);

        if (!mapPoint) return;

        const lon = mapPoint.longitude.toFixed(6);
        const lat = mapPoint.latitude.toFixed(6);

        try {
          const utmPoint = wgs84ToUtmZone37N(
            mapPoint.latitude,
            mapPoint.longitude
          );
          const utmPointX = utmPoint.x.toFixed(1);
          const utmPointY = utmPoint.y.toFixed(1);
          coordinatesContainerRef.current.innerHTML = `Lat: ${lat}, Lon: ${lon} &nbsp; | &nbsp; UTM Z37 N: ${utmPointX}, ${utmPointY}`;
        } catch (error) {
          console.error("Error converting coordinates to UTM:", error);
          coordinatesContainerRef.current.innerHTML = `Lat: ${lat}, Lon: ${lon} | UTM Error`;
        }
      };

      pointerMoveHandleRef.current = view.on("pointer-move", handlePointerMove);

      return () => {
        if (pointerMoveHandleRef.current) {
          pointerMoveHandleRef.current.remove();
          pointerMoveHandleRef.current = null;
        }
        if (coordinatesContainerRef.current) {
          coordinatesContainerRef.current.remove();
          coordinatesContainerRef.current = null;
        }
      };
    } else {
      if (pointerMoveHandleRef.current) {
        pointerMoveHandleRef.current.remove();
        pointerMoveHandleRef.current = null;
      }
       if (coordinatesContainerRef.current) {
          coordinatesContainerRef.current.remove();
          coordinatesContainerRef.current = null;
        }
    }
  }, [view]);
};

export default useCoordinatesDisplay;
