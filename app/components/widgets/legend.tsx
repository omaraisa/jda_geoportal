import { useEffect, useRef } from "react";
import Legend from "@arcgis/core/widgets/Legend";
import useStateStore from "@/stateManager";


export default function LegendComponent() {
  const legendRef = useRef(null);
  const legendWidget =useRef<Legend | null>(null);

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;
    
    // Initialize or update the Legend widget
    if (legendWidget.current) {
      legendWidget.current.view = view; // Update the view of the existing widget
    } else {
      legendWidget.current = new Legend({
        view: view,
        container: legendRef.current || undefined,
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (legendWidget.current) {
        // Do not destroy, simply unbind the view if needed
        // legendWidget.current.destroy();
        // legendWidget.current = null;
      }
    };
  }, [view]); // Re-run when the view changes

  return (
    <div
      ref={legendRef}
      className="h-full w-full"
    ></div>
  );
}
