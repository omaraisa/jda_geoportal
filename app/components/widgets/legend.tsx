import { useEffect, useRef } from "react";
import Legend from "@arcgis/core/widgets/Legend";
import useStateStore from "@/stateStore";


export default function LegendComponent() {
  const legendRef = useRef(null);
  const legendWidget =useRef<Legend | null>(null);

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;
    
    const updateLayerInfos = () => {
      if (legendWidget.current) {
        legendWidget.current.layerInfos = view.map.layers
          .toArray()
          .filter((layer: any) => (layer as any).group !== "HiddenLayers")
          .map((layer: any) => ({
            layer: layer,
            title: layer.title || layer.id
          }));
      }
    };

    if (legendWidget.current) {
      legendWidget.current.view = view;
      updateLayerInfos();
    } else {
      legendWidget.current = new Legend({
        view: view,
        container: legendRef.current || undefined,
        layerInfos: view.map.layers
          .toArray()
          .filter((layer: any) => (layer as any).group !== "HiddenLayers")
          .map((layer: any) => ({
            layer: layer,
            title: layer.title || layer.id
          }))
      });
    }

    // Watch for layer changes
    const layerWatchHandle = view.map.layers.on("change", updateLayerInfos);

    return () => {
      if (layerWatchHandle) {
        layerWatchHandle.remove();
      }
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
