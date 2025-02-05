import { useEffect, useRef } from "react";
import CoordinateConversion from "@arcgis/core/widgets/CoordinateConversion";
import useStateStore from "@/stateManager";

export default function CoordinateConversionComponent() {
  const coordinateConversionRef = useRef(null);
  const coordinateConversionWidget = useRef<CoordinateConversion | null>(null);

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;
    
    // Initialize or update the CoordinateConversion widget
    if (coordinateConversionWidget.current) {
      coordinateConversionWidget.current.view = view; // Update the view of the existing widget
    } else {
      coordinateConversionWidget.current = new CoordinateConversion({
        view: view,
        container: coordinateConversionRef.current || undefined,
      });
    }

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
