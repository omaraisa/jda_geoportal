import { useEffect, useRef } from "react";
import Legend from "@arcgis/core/widgets/Legend";
import useStateStore from "../stateManager";

export default function LegendWidgetComponent() {
  const legendRef = useRef(null);

  const view = useStateStore((state) => state.view);

  useEffect(() => {
    if (!view) return;

    // Initialize the Legend widget
    const legendWidget = new Legend({
      view: view,
      container: legendRef.current,
    });

    // Cleanup on unmount
    return () => {
      if (legendWidget) {
        legendWidget.destroy();
      }
    };
  }, [view]);

  return (
    <div
      ref={legendRef}
      className="h-full w-full"
    ></div>
  );
}
