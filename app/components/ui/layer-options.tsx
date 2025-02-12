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
            <i
              className="esri-icon-labels cursor-pointer text-white"
              title={t("layerList.showHideLabels")}
              onClick={() => toggleLayerLabels(layer, setLayers)}
            ></i>
            <i
              className="esri-icon-table cursor-pointer text-white"
              title={t("layerList.showAttributeTable")}
              onClick={() => showAttributeTable(layer, setLayers)}
            ></i>
          </>
        )}
        <i
          className="esri-icon-zoom-out-fixed cursor-pointer text-white"
          title={t("layerList.zoomToLayer")}
          onClick={() => view?.goTo(layer.fullExtent).catch((error) => console.error(error))}
        ></i>
        <i
          className="esri-icon-down cursor-pointer text-white"
          title={t("layerList.moveLayerUp")}
          onClick={() => moveLayer(view?.map, layer, "up", setLayers)}
        ></i>
        <i
          className="esri-icon-up cursor-pointer text-white"
          title={t("layerList.moveLayerDown")}
          onClick={() => moveLayer(view?.map, layer, "down", setLayers)}
        ></i>
        <i
          className="esri-icon-close cursor-pointer text-white"
          title={t("layerList.removeLayer")}
          onClick={() => handleRemoveLayer(layer, setLayers)}
        ></i>
      </div>
    );
  }
  