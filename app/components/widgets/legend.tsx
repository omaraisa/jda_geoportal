import { useEffect, useRef } from "react";
import Legend from "@arcgis/core/widgets/Legend";
import useStateStore from "@/stateStore";


export default function LegendComponent() {
  const legendRef = useRef(null);
  const legendWidget =useRef<Legend | null>(null);

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;
    
    if (legendWidget.current) {
      legendWidget.current.view = view; 
    } else {
      legendWidget.current = new Legend({
        view: view,
        container: legendRef.current || undefined,
      });
    }

    return () => {
      if (legendWidget.current) {
        // Do not destroy, simply unbind the view if needed
        // legendWidget.current.destroy();
        // legendWidget.current = null;
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
