import { useEffect, useState, useRef } from "react";
import useStateStore from "@/stateStore";
import LayerGroup from "./layer-group";

export default function LayerListComponent() {
  const view = useStateStore((state) => state.targetView);
  const [uniqueGroups, setUniqueGroups] = useState<string[]>([]);
  const layerListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layerListRef.current || !view) return;

    const updateGroups = () => {
      const layersArr = view.map.layers.toArray();
      const groups = Array.from(
        new Set(
          layersArr
            .map((layer: any) => (layer as any).group || "MyLayers") // Treat ungrouped layers as MyLayers
            .filter((group: string) => group !== "HiddenLayers")
        )
      );
      setUniqueGroups(groups);
    };

    updateGroups();

    const handleChange = view.map.layers.on("change", updateGroups);

    return () => {
      handleChange.remove();
    };
  }, [view]);
  
  return (
    <div className="h-full w-full">
      <div ref={layerListRef}></div>
      <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
        {uniqueGroups.map((group, index) => (
          <LayerGroup key={index} group={group} />
        ))}
      </div>
    </div>
  );
}
