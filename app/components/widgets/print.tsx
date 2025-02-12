import { useEffect, useRef } from "react";
import Print from "@arcgis/core/widgets/Print";
import useStateStore from "@/stateStore";

export default function PrintComponent() {
  const printRef = useRef(null);
  const printWidget = useRef<Print | null>(null); // Persist the Print widget

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;

    // Initialize or update the Print widget
    if (printWidget.current) {
      if (view.type === "2d") {
        printWidget.current.view = view; // Update the view of the existing widget
      }
    } else {
      if (view.type === "2d") {
        printWidget.current = new Print({
          view: view,
          container: printRef.current || undefined,
          printServiceUrl:
            "https://gis.jda.gov.sa/agserver/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task", // Update to your print service URL if different
          // printTemplate: "CustomLayout", // Replace this with your custom layout name
          // titleText: "Custom Map Title", // Optional: Title to add to the print output
        });
      }
    }

    return () => {
      if (printWidget.current) {
        // Widget destruction is disabled to preserve state. Uncomment to enable cleanup:
        // printWidget.current.destroy();
        // printWidget.current = null;
      }
    };
  }, [view]); 

  return <div ref={printRef} className="h-full w-full"></div>;
}
