import { useEffect, useState } from "react";
import useStateStore from "@/stateStore";
import LayerThemeSelector from "../ui/layer-theme-selector";
import LayerItem from "../ui/layer-item";

export default function LayerListComponent() {
  const view = useStateStore((state) => state.targetView);
  const [activeLayerId, setactiveLayerId] = useState<string | null>(null);
  const [layers, setLayers] = useState<__esri.Layer[]>([]);

  useEffect(() => {
    if (view) {
      setLayers(view.map.layers.toArray());
    }
  }, [view?.map.layers]);

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <LayerThemeSelector />
      {view?.map.layers.toArray().map((layer) => (
        <LayerItem
          key={layer.id}
          layer={layer}
          activeLayerId={activeLayerId}
          setactiveLayerId={setactiveLayerId}
          setLayers={setLayers}
        />
      ))}
    </div>
  );
}


