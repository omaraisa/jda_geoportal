import { useEffect, useState } from "react";
import useStateStore from "@/stateStore";
import LayerGroup from "../ui/layer-group";
import {layerGroups} from "@/lib/globalConstants";

export default function LayerListComponent() {
  const view = useStateStore((state) => state.targetView);

  return (
    <div className="h-full w-full">
      <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
        {layerGroups.map((group, index) => (
          <LayerGroup key={index} group={group} />
        ))}
      </div>
    </div>
  );
}