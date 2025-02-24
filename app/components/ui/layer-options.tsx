import {featureBasedLayerTypes} from "@/lib/globalConstants";
import useLayerActions from "@/lib/hooks/use-layer-list";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";

export default function LayerOptions({layer,setLayers}: {layer: __esri.Layer,setLayers: (layers: __esri.Layer[]) => void}) {
    const { moveLayer, toggleLayerLabels, showAttributeTable, handleRemoveLayer } = useLayerActions()
    
  const view = useStateStore((state) => state.targetView);
  const { t } = useTranslation();

    return (
      <div className="flex gap-2 mt-2 p-2">
        {featureBasedLayerTypes.includes(layer.type) && (
          <>
            <calcite-icon
        icon="label"
        scale="s"
        className="cursor-pointer"
        onClick={() => toggleLayerLabels(layer, setLayers)}
      />
      <calcite-icon
        icon="table"
        scale="s"
        className="cursor-pointer"
        onClick={() => showAttributeTable(layer, setLayers)}
      />
      </>
    )}
    <calcite-icon
      icon="layer-zoom-to"
      scale="s"
      className="cursor-pointer"
      onClick={() => view?.goTo(layer.fullExtent).catch((error) => console.error(error))}
    />
    <calcite-icon
      icon="arrow-down"
      scale="s"
      className="cursor-pointer"
      onClick={() => moveLayer(view?.map, layer, "up", setLayers)}
    />
    <calcite-icon
      icon="arrow-up"
      scale="s"
      className="cursor-pointer"
      onClick={() => moveLayer(view?.map, layer, "down", setLayers)}
    />
    <calcite-icon
      icon="trash"
      scale="s"
      className="cursor-pointer"
      onClick={() => handleRemoveLayer(layer, setLayers)}
    />
      </div>
    );
  }
  