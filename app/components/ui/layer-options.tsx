import {featureBasedLayerTypes} from "@/lib/globalConstants";
import useLayerActions from "@/lib/hooks/use-layer-list";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from '@esri/calcite-components-react';

export default function LayerOptions({layer,setLayers}: {layer: __esri.Layer,setLayers: (layers: __esri.Layer[]) => void}) {
    const { moveLayer, toggleLayerLabels,toggleLayerPopup, showAttributeTable, handleRemoveLayer } = useLayerActions()
    
  const view = useStateStore((state) => state.targetView);
  const { t } = useTranslation();

    return (
      <div className="flex gap-2 mt-2 p-2">
        {featureBasedLayerTypes.includes(layer.type) && (
          <>
        <CalciteIcon
          icon="label"
          scale="s"
          className="cursor-pointer"
          onClick={() => toggleLayerLabels(layer, setLayers)}
        />
        <CalciteIcon
          icon="table"
          scale="s"
          className="cursor-pointer"
          onClick={() => showAttributeTable(layer, setLayers)}
        />
          </>
        )}
        <CalciteIcon
          icon="layer-zoom-to"
          scale="s"
          className="cursor-pointer"
          onClick={() => view?.goTo(layer.fullExtent).catch((error) => console.error(error))}
        />
        <CalciteIcon
          icon={"popupEnabled" in layer && layer.popupEnabled ? "popup" : "pop-up-blank"}
          scale="s"
          className="cursor-pointer"
          onClick={() => toggleLayerPopup(layer, setLayers)}
        />
        <CalciteIcon
          icon="arrow-down"
          scale="s"
          className="cursor-pointer"
          onClick={() => moveLayer(view?.map, layer, "up", setLayers)}
        />
        <CalciteIcon
          icon="arrow-up"
          scale="s"
          className="cursor-pointer"
          onClick={() => moveLayer(view?.map, layer, "down", setLayers)}
        />
        <CalciteIcon
          icon="trash"
          scale="s"
          className="cursor-pointer"
          onClick={() => handleRemoveLayer(layer, setLayers)}
        />
      </div>
    );
  }
  