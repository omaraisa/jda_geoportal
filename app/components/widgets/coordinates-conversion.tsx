import { useEffect, useRef } from "react";
import CoordinateConversion from "@arcgis/core/widgets/CoordinateConversion";
import useStateStore from "@/stateStore";

export default function CoordinateConversionComponent() {
  const coordinateConversionRef = useRef(null);
  const coordinateConversionWidget = useRef<CoordinateConversion | null>(null);
  const view = useStateStore((state) => state.targetView);
  const updateStats = useStateStore((state) => state.updateStats);

  useEffect(() => {
    if (!view) return;
    
    if (coordinateConversionWidget.current) {
      coordinateConversionWidget.current.view = view;
    } else {
      coordinateConversionWidget.current = new CoordinateConversion({
        view: view,
        container: coordinateConversionRef.current || undefined,
      });
    }

    updateStats("Coordinates Converter");
    return () => {
      if (coordinateConversionWidget.current) {
        // Widget destruction is disabled to preserve state. Uncomment to enable cleanup:
        // coordinateConversionWidget.current.destroy();
        // coordinateConversionWidget.current = null;
      }
    };

  }, [view]); 

  return (
    <div
      ref={coordinateConversionRef}
      className="h-full w-full overflow-hidden"
      style={{ maxWidth: "100%" }}
    ></div>
  );
}
