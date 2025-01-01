import { useEffect, useRef } from "react";
import Print from "@arcgis/core/widgets/Print";
import useStateStore from "../stateManager";

export default function PrintWidgetComponent() {
  const printRef = useRef(null);

  const view = useStateStore((state) => state.view);

  useEffect(() => {
    if (!view) return;

    const printWidget = new Print({
      view: view,
      container: printRef.current,
      printServiceUrl: "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task", // Update to your print service URL if different
    });

    return () => {
      if (printWidget) {
        printWidget.destroy();
      }
    };
  }, [view]);

  return (
    <div
      ref={printRef}
      className="h-full w-full"
    ></div>
  );
}
