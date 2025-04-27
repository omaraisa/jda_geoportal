"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";

const LAYER_TYPES = [
  { value: "csv", labelKey: "widgets.addLayer.csv" },
  { value: "geojson", labelKey: "widgets.addLayer.geojson" },
  { value: "kml", labelKey: "widgets.addLayer.kml" },
  { value: "map-service", labelKey: "widgets.addLayer.mapService" },
];

export default function AddLayer() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);

  const [layerType, setLayerType] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const handleAddLayer = async () => {
    if (!layerType || !url) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.addLayerError.title"),
        body: t("systemMessages.error.completeAddLayerRequirements.body"),
        duration: 8,
      });
      return;
    }
  
    try {
      let layer: __esri.Layer | null = null;
  
      const layerProps: any = { url, group: "My Layers" };
      if (title) layerProps.title = title;
  
      switch (layerType) {
        case "csv": {
          const module = await import("@arcgis/core/layers/CSVLayer");
          layer = new module.default(layerProps);
          break;
        }
        case "geojson": {
          const module = await import("@arcgis/core/layers/GeoJSONLayer");
          layer = new module.default(layerProps);
          break;
        }
        case "kml": {
          const module = await import("@arcgis/core/layers/KMLLayer");
          layer = new module.default(layerProps);
          break;
        }
        case "map-service": {
  // Remove trailing slash if present
  const cleanUrl = url.replace(/\/+$/, "");
  // Try to fetch the service metadata
  const serviceUrl = cleanUrl;
  let serviceInfo: any;
  try {
    const resp = await fetch(`${serviceUrl}?f=json`);
    serviceInfo = await resp.json();
  } catch (err) {
    sendMessage({
      type: "error",
      title: t("systemMessages.error.addLayerError.title"),
      body: t("systemMessages.error.invalidLayerTypeOrUrl.body"),
      duration: 10,
    });
    return;
  }

  if (serviceInfo.type === "Feature Layer" || /FeatureServer/i.test(serviceUrl)) {
    // If it's a Feature Layer or FeatureServer endpoint
    const module = await import("@arcgis/core/layers/FeatureLayer");
    layer = new module.default({ ...layerProps, url: serviceUrl });
  } else if (serviceInfo.type === "Map Service" || /MapServer/i.test(serviceUrl)) {
    // If it's a Map Service, add as MapImageLayer
    const module = await import("@arcgis/core/layers/MapImageLayer");
    layer = new module.default({ ...layerProps, url: serviceUrl });
  } else if (serviceInfo.serviceDataType === "esriImageServiceDataType" || /ImageServer/i.test(serviceUrl)) {
    // If it's an Image Service
    const module = await import("@arcgis/core/layers/ImageryLayer");
    layer = new module.default({ ...layerProps, url: serviceUrl });
  } else if (serviceInfo.layers && Array.isArray(serviceInfo.layers) && /FeatureServer/i.test(serviceUrl)) {
    // If it's a FeatureServer with multiple layers, add all as FeatureLayers
    const module = await import("@arcgis/core/layers/FeatureLayer");
    // Add all sublayers
    for (const sub of serviceInfo.layers) {
      const subLayer = new module.default({
        ...layerProps,
        url: `${serviceUrl}/${sub.id}`,
        title: sub.name,
      });
      if (view) {
        view.map.add(subLayer);
      }
    }
    // Don't add a single layer in this case
    layer = null;
  } else {
    sendMessage({
      type: "error",
      title: t("systemMessages.error.addLayerError.title"),
      body: t("systemMessages.error.unknownLayerType.body"),
      duration: 8,
    });
    return;
  }
  break;
}

        default:
          sendMessage({
            type: "error",
            title: t("systemMessages.error.addLayerError.title"),
            body: t("systemMessages.error.unknownLayerType.body"),
            duration: 8,
          });
          return;
      }
  
      if (layer && view) {
        view.map.add(layer);
  
        // Wait for the layer to load, then zoom to it appropriately
        layer.when(async () => {
          if (layer.fullExtent) {
            await view.goTo(layer.fullExtent);
          }
          sendMessage({
            type: "info",
            title: t("widgets.addLayer.success"),
            body: t("widgets.addLayer.layerAdded"),
            duration: 6,
          });
          setUrl("");
          setTitle("");
        }).catch((err: any) => {
          // Remove the layer if it failed to load
          view.map.remove(layer);
          sendMessage({
            type: "error",
            title: t("systemMessages.error.addLayerError.title"),
            body: t("systemMessages.error.invalidLayerTypeOrUrl.body"),
            duration: 10,
          });
          // console.error("Layer failed to load:", err);
        });
      }
    } catch (error) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.addLayerError.title"),
        body: t("systemMessages.error.addLayerError.body"),
        duration: 10,
      });
      // console.error("Add Layer Error:", error);
    }
  };
  
  

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="layerType" className="font-semibold text-foreground">
          {t("widgets.addLayer.selectType")}
        </label>
        <div className="select">
          <select
            id="layerType"
            value={layerType}
            onChange={(e) => setLayerType(e.target.value)}
          >
            <option value="" hidden>
              {t("widgets.addLayer.selectType")}
            </option>
            {LAYER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <label htmlFor="layerTitle" className="font-semibold text-foreground">
          {t("widgets.addLayer.enterTitle")}
          <span className="text-xs text-muted ml-2 mr-2">
            ({t("widgets.addLayer.optional")})
          </span>
        </label>
        <label htmlFor="layerTitle" className="textInput">
          <input
            id="layerTitle"
            type="text"
            className="input-text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="&nbsp;"
          />
          <span className="label">{t("widgets.addLayer.titlePlaceholder")}</span>
        </label>
        <label htmlFor="layerUrl" className="font-semibold text-foreground">
          {t("widgets.addLayer.enterUrl")}
        </label>
        <label htmlFor="layerUrl" className="textInput">
          <input
            id="layerUrl"
            type="text"
            className="input-text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="&nbsp;"
          />
          <span className="label">{t("widgets.addLayer.urlPlaceholder")}</span>
        </label>
        <button className="btn btn-primary w-full" onClick={handleAddLayer}>
          {t("widgets.addLayer.add")}
        </button>
      </div>
    </div>
  );
}
