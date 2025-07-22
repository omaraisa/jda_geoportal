import { featureBasedLayerTypes } from "@/lib/utils/global-constants";
import useLayerActions from "@/lib/hooks/use-layer-list";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from '@esri/calcite-components-react';
import { useState } from "react";

export default function LayerOptions({ layer, setLayers }: { layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void }) {
  const { moveLayer, toggleLayerLabels, toggleLayerPopup, showAttributeTable, handleRemoveLayer } = useLayerActions();
  const view = useStateStore((state) => state.targetView);
  const sceneView = useStateStore((state) => state.sceneView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const { t } = useTranslation();

  const handleCopyToScene = async () => {
    if (!sceneView || !sceneView.map) {
      sendMessage({
        title: t("layerList.unknownAction"),
        body: t("SceneView is not available"),
        type: "error",
        duration: 5,
      });
      return;
    }
    try {
      // Only support feature and map-image layers for now
      if (layer.type === "feature") {
        const FeatureLayer = (await import("@arcgis/core/layers/FeatureLayer")).default;
        const cloned = typeof (layer as any).toJSON === "function"
          ? new FeatureLayer((layer as any).toJSON())
          : new FeatureLayer({ ...layer });
        sceneView.map.add(cloned);
        sendMessage({
          title: t("layerList.renameLayer"),
          body: t("Layer copied to SceneView"),
          type: "info",
          duration: 5,
        });
      } else if (layer.type === "map-image") {
        const MapImageLayer = (await import("@arcgis/core/layers/MapImageLayer")).default;
        const cloned = typeof (layer as any).toJSON === "function"
          ? new MapImageLayer((layer as any).toJSON())
          : new MapImageLayer({ ...layer });
        sceneView.map.add(cloned);
        sendMessage({
          title: t("layerList.renameLayer"),
          body: t("Layer copied to SceneView"),
          type: "info",
          duration: 5,
        });
      } else {
        sendMessage({
          title: t("layerList.unknownAction"),
          body: t("Layer type not supported for SceneView copy"),
          type: "warning",
          duration: 5,
        });
      }
    } catch (err) {
      sendMessage({
        title: t("layerList.unknownAction"),
        body: t("Failed to copy layer to SceneView"),
        type: "error",
        duration: 5,
      });
    }
  };

  const langDir = document?.documentElement?.dir || "ltr";

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
            <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
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
            <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
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
            <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
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
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
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
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
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
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
          {t("layerList.moveLayerDown")}
        </div>
      </div>
      <div className="relative group">
        <CalciteIcon icon="trash" scale="s" className="cursor-pointer" onClick={() => handleRemoveLayer(layer, setLayers)} />
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px]">
          {t("layerList.removeLayer")}
        </div>
      </div>
      {/* Tooltip positioning: shift left if near right edge (LTR), right if near left edge (RTL) */}
      {view?.type === "2d" && (
        <div className="relative group">
          <CalciteIcon
            icon="overwrite-features"
            scale="s"
            className="cursor-pointer"
            onClick={handleCopyToScene}
          />
          <div
            className={`absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block z-50 min-w-[120px] text-center ${langDir === "rtl" ? "left-0 right-auto" : "right-0 left-auto"}`}
          >
            {t("layerList.copyToScene", "Copy to SceneView")}
          </div>
        </div>
      )}
    </div>
  );
}
