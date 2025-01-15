import { useEffect, useRef } from "react";
import Print from "@arcgis/core/widgets/Print";
import useStateStore from "../stateManager";

export default function PrintWidgetComponent() {
  const printRef = useRef(null);
  const printWidget = useRef(null); // Persist the Print widget

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;

    // Initialize or update the Print widget
    if (printWidget.current) {
      printWidget.current.view = view; // Update the view of the existing widget
    } else {
      printWidget.current = new Print({
        view: view,
        container: printRef.current,
        printServiceUrl: "https://gis.jda.gov.sa/agserver/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task", // Update to your print service URL if different
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (printWidget.current) {
        // Do not destroy, simply unbind the view if needed
        printWidget.current.view = null;
      }
    };
  }, [view]); // Re-run when the view changes

  return (
    <div
      ref={printRef}
      className="h-full w-full"
    ></div>
  );
}