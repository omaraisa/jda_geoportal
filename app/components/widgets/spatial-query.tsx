"use client";

import { useState, useRef, useEffect } from "react";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import styles from "./spatial-query.module.css";
import { addQueryResult, clearSelection, runQuery } from "@/lib/utils/query";
import {featureBasedLayerTypes} from "@/lib/globalConstants";

export default function SpatialQueryComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const widgets = useStateStore((state) => state.widgets);
  const targetLayerRef = useRef<HTMLSelectElement>(null);
  const selectionLayerRef = useRef<HTMLSelectElement>(null);
  const sketchContainerRef = useRef<HTMLDivElement>(null);
  const graphicsLayerRef = useRef<GraphicsLayer>(null);
  const sketchInitialized = useRef<boolean>(false);

  const [state, setState] = useState<{
    targetLayer: __esri.Layer | null;
    selectionGeometry: __esri.Geometry | null;
    selectionMethodChecked: boolean;
  }>({
    targetLayer: null,
    selectionGeometry: null,
    selectionMethodChecked: true,
  });


  useEffect(() => {
    if (view && !sketchInitialized.current) {
      sketchInitialized.current = true;

      graphicsLayerRef.current = new GraphicsLayer({
        title: t("widgets.query.queryLayerTitle"),
      });
      view.map.add(graphicsLayerRef.current);

      const sketch = new Sketch({
        layer: graphicsLayerRef.current,
        view,
        container: sketchContainerRef.current || undefined,
        availableCreateTools: ["polygon", "rectangle", "circle"],
        creationMode: "single",
        visibleElements: {
          settingsMenu: false,
          selectionTools: {
            "lasso-selection": false,
            "rectangle-selection": false,
          },
        },
      });

      sketch.on("create", async ({ graphic, state: sketchState }) => {
        if (sketchState === "complete") {
          const query = {
            geometry: graphic.geometry,
            spatialRelationship: "intersects" as __esri.QueryProperties["spatialRelationship"],
            outFields: ["*"],
            returnGeometry: true,
          };
          const targetLayer =
            view && targetLayerRef.current
              ? (view.map.layers.toArray()[Number(targetLayerRef.current.value)] as __esri.FeatureLayer)
              : null;
          if (!targetLayer) {
            sendMessage({
              type: "error",
              title: t("systemMessages.error.queryError.title"),
              body: t("systemMessages.error.completeSearchRequirements.body"),
              duration: 10,
            });
            return;
          }
          await handleQuery(targetLayer, query);
        }
      });
    }
  }, [view]);

  async function runQueryByLayer() {
    const targetLayer =
      view && targetLayerRef.current
        ? (view.map.layers.toArray()[Number(targetLayerRef.current.value)] as __esri.FeatureLayer)
        : null;
    const selectionLayer = view
      ? view.map.layers.toArray()[Number(selectionLayerRef.current?.value)]
      : null;

    if (!targetLayer || !selectionLayer) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        duration: 10,
      });
      return;
    }

    try {
      const selectionFeatures = await (selectionLayer as __esri.FeatureLayer).queryFeatures({
        outFields: ["*"],
        where: "1=1",
        returnGeometry: true,
      });

      const combinedGeometry = geometryEngine.union(
        selectionFeatures.features.map((feature) => feature.geometry)
      );

      const query = {
        geometry: combinedGeometry,
        spatialRelationship: "intersects" as __esri.QueryProperties["spatialRelationship"],
        outFields: ["*"],
        returnGeometry: true,
      };

      await handleQuery(targetLayer, query);
    } catch (error) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        duration: 10,
      });
    }
  }

  async function handleQuery(targetLayer: __esri.FeatureLayer, query: __esri.QueryProperties) {
    try {
      const response = await runQuery(targetLayer, query);
      if (response && response.features.length) {
        addQueryResult(response.features, graphicsLayerRef.current, view, targetLayer, widgets);
      } else {
        sendMessage({
          type: "error",
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.noResultsFound.body"),
          duration: 10,
        });
      }
    } catch (error) {
      sendMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        duration: 10,
      });
      console.error("Query Error:", error);
    }
  }

  const selectionMethodHandler = () => {
    setState((prevState) => ({
      ...prevState,
      selectionMethodChecked: !prevState.selectionMethodChecked,
    }));
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="targetLayer" className="font-semibold text-white">
          {t("widgets.query.selectLayer")}
        </label>

        <div className="select">
          <select ref={targetLayerRef} id="targetLayer">
            <option value="" hidden>
              {t("widgets.query.selectLayer")}
            </option>
            {view?.map.layers.toArray().map((layer, index) => {
              if (featureBasedLayerTypes.includes(layer.type)) {
                return (
                  <option key={layer.id} value={index}>
                    {layer.title}
                  </option>
                );
              }
            })}
          </select>
        </div>

        <label
          className={styles.label}
          style={{
            background: "white",
            border: !state.selectionMethodChecked ? "2px solid var(--secondary)" : " 2px solid var(--primary)",
          }}
        >
          <input
            type="checkbox"
            className={styles.input}
            checked={state.selectionMethodChecked}
            onChange={selectionMethodHandler}
          />
          <span
            className={styles.circle}
            style={{
              backgroundColor: !state.selectionMethodChecked ? "var(--secondary)" : "var(--primary)",
              right: state.selectionMethodChecked ? "calc(100% - 45px)" : "5px",
            }}
          ></span>
          <p
            className={`${styles.title} ${!state.selectionMethodChecked ? styles.visible : styles.hidden}`}
            style={{
              color: "var(--secondary-dark)",
            }}
          >
            By Layer
          </p>
          <p
            className={`${styles.title} ${state.selectionMethodChecked ? styles.visible : styles.hidden}`}
            style={{
              color: "var(--primary)",
            }}
          >
            By Drawing
          </p>
        </label>
      </div>
      <div
        ref={sketchContainerRef}
        style={{
          display: state.selectionMethodChecked ? "block" : "none",
        }}
      ></div>
      <div
        className="flex flex-col w-full space-y-2"
        style={{
          display: !state.selectionMethodChecked ? "flex" : "none",
        }}
      >
        <label htmlFor="selectionLayer" className="font-semibold text-white">
          {t("widgets.query.selectionLayer")}
        </label>

        <div className="select">
          <select ref={selectionLayerRef} id="selectionLayer">
            <option value="" hidden>
              {t("widgets.query.select")}
            </option>
            {view?.map.layers.toArray().map((layer, index) => {
              if (featureBasedLayerTypes.includes(layer.type)) {
                return (
                  <option key={layer.id} value={index}>
                    {layer.title}
                  </option>
                );
              }
            })}
          </select>
        </div>

        <button className="btn btn-primary w-full" onClick={runQueryByLayer}>
          {t("widgets.query.search")}
        </button>
      </div>
      <button
        className="btn btn-danger w-full"
        onClick={() =>
          clearSelection(graphicsLayerRef.current, view, state.targetLayer as __esri.FeatureLayer, widgets)
        }
      >
        {t("widgets.query.clearSearch")}
      </button>
    </div>
  );
}
