import { useEffect, useRef } from "react";
import Legend from "@arcgis/core/widgets/Legend";
import useStateStore from "../stateManager";

let legendWidget; // Keep the widget as a persistent instance

export default function LegendWidgetComponent() {
  const legendRef = useRef(null);

  const view = useStateStore((state) => state.view);

  useEffect(() => {
    if (!view) return;

    // Initialize or update the Legend widget
    if (legendWidget) {
      legendWidget.view = view; // Update the view of the existing widget
    } else {
      legendWidget = new Legend({
        view: view,
        container: legendRef.current,
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (legendWidget) {
        // Do not destroy, simply unbind the view if needed
        legendWidget.view = null;
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
