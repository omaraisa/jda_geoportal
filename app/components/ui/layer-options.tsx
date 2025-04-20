import { featureBasedLayerTypes } from "@/lib/globalConstants";
import useLayerActions from "@/lib/hooks/use-layer-list";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from '@esri/calcite-components-react';

export default function LayerOptions({ layer, setLayers }: { layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void }) {
  const { moveLayer, toggleLayerLabels, toggleLayerPopup, showAttributeTable, handleRemoveLayer } = useLayerActions();

  const view = useStateStore((state) => state.targetView);
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 mt-2 p-2 relative">
      {featureBasedLayerTypes.includes(layer.type) && (
        <>
          <div className="relative group">
            <CalciteIcon
              icon="label"
              scale="s"
              className="cursor-pointer"
              onClick={() => toggleLayerLabels(layer, setLayers)}
            />
            <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
              {t("layerList.showHideLabels")}
            </div>
          </div>
          <div className="relative group">
            <CalciteIcon
              icon="table"
              scale="s"
              className="cursor-pointer"
              onClick={() => showAttributeTable(layer, setLayers)}
            />
            <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
              {t("layerList.showAttributeTable")}
            </div>
          </div>
          <div className="relative group">
            <CalciteIcon
              icon={"popupEnabled" in layer && layer.popupEnabled ? "popup" : "pop-up-blank"}
              scale="s"
              className="cursor-pointer"
              onClick={() => toggleLayerPopup(layer, setLayers)}
            />
            <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
              {t("layerList.togglePopup")}
            </div>
          </div>
        </>
      )}
      <div className="relative group">
        <CalciteIcon
          icon="layer-zoom-to"
          scale="s"
          className="cursor-pointer"
          onClick={() => view?.goTo(layer.fullExtent).catch((error) => console.error(error))}
        />
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {t("layerList.zoomToLayer")}
        </div>
      </div>
      <div className="relative group">
        <CalciteIcon
          icon="arrow-down"
          scale="s"
          className="cursor-pointer"
          onClick={() => moveLayer(view?.map, layer, "up", setLayers)}
        />
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {t("layerList.moveLayerUp")}
        </div>
      </div>
      <div className="relative group">
        <CalciteIcon
          icon="arrow-up"
          scale="s"
          className="cursor-pointer"
          onClick={() => moveLayer(view?.map, layer, "down", setLayers)}
        />
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {t("layerList.moveLayerDown")}
        </div>
      </div>
      <div className="relative group">
      <CalciteIcon icon="trash" scale="s" className="cursor-pointer" onClick={() => handleRemoveLayer(layer, setLayers)} />
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {t("layerList.removeLayer")}
        </div>
      </div>
    </div>
  );
}
