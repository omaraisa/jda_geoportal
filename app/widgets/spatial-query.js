"use client";

import { useState, useRef, useEffect } from "react";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import useStateStore from "../stateManager";
import { useTranslation } from "react-i18next";
import styles from "./spatial-query.module.css";

export default function SpatialQueryComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const addMessage = useStateStore((state) => state.addMessage);
  const widgets = useStateStore((state) => state.widgets);
  const setTargetLayerId = useStateStore((state) => state.setTargetLayerId);
  const targetLayerRef = useRef();
  const selectionLayerRef = useRef();
  const sketchContainerRef = useRef();
  const graphicsLayerRef = useRef();

  const [state, setState] = useState({
    targetLayer: null,
    selectionGeometry: null,
    sketchInitialized: false,
    selectionMethodChecked: true,
  });

  const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

  useEffect(() => {
    if (view && !state.sketchInitialized) {
      graphicsLayerRef.current = new GraphicsLayer({ title: "Query Layer" });
      view.map.add(graphicsLayerRef.current);

      const sketch = new Sketch({
        layer: graphicsLayerRef.current,
        view,
        container: sketchContainerRef.current,
        availableCreateTools: ["polygon", "rectangle", "circle"],
        creationMode: "single",
        visibleElements: {
          selectionTools: false,
          settingsMenu: false,
        },
      });

      sketch.on("create", ({ graphic, state: sketchState }) => {
        if (sketchState === "complete") {
          runQuery({
            geometry: graphic.geometry,
            spatialRelationship: "intersects",
          });
        }
      });

      setState((prevState) => ({ ...prevState, sketchInitialized: true }));
    }
  }, [view, state.sketchInitialized]);

  function setTargetLayer() {
    const layerIndex = targetLayerRef.current.value;
    const targetLayer = view.map.layers.items[layerIndex];
    setState((prevState) => ({ ...prevState, targetLayer }));
    setTargetLayerId(targetLayer.id);
  }

  async function runQuery({ geometry, spatialRelationship }) {
    const targetLayer =
      state.targetLayer || view.map.layers.items[targetLayerRef.current.value];
    if (!targetLayer) {
      addMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        duration: 10,
      });
      return;
    }

    const query = {
      geometry,
      spatialRelationship,
      outFields: ["*"],
      returnGeometry: true,
    };

    try {
      const response = await targetLayer.queryFeatures(query);
      if (response.features.length) {
        addQueryResult(response.features);
      } else {
        addMessage({
          type: "error",
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.noResultsFound.body"),
          duration: 10,
        });
      }
    } catch (error) {
      addMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        duration: 10,
      });
      console.error("Query Error:", error);
    }
  }

  async function runQueryByLayer() {
    const targetLayer =
      state.targetLayer || view.map.layers.items[targetLayerRef.current.value];
    const selectionLayer =
      view.map.layers.items[selectionLayerRef.current.value];

    if (!targetLayer || !selectionLayer) {
      addMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        duration: 10,
      });
      return;
    }

    try {
      // Query all features from the selection layer
      const selectionFeatures = await selectionLayer.queryFeatures({
        outFields: ["*"],
        where: "1=1",
        returnGeometry: true,
      });

      // Combine geometries from the selection layer
      const combinedGeometry = geometryEngine.union(
        selectionFeatures.features.map((feature) => feature.geometry)
      );

      // Run query on the target layer using the combined geometry
      const query = {
        geometry: combinedGeometry,
        spatialRelationship: "intersects",
        outFields: ["*"],
        returnGeometry: true,
      };

      const response = await targetLayer.queryFeatures(query);
      if (response.features.length) {
        addQueryResult(response.features);
      } else {
        addMessage({
          type: "error",
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.noResultsFound.body"),
          duration: 10,
        });
      }
    } catch (error) {
      addMessage({
        type: "error",
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        duration: 10,
      });
      console.error("Query Error:", error);
    }
  }

  function addQueryResult(features) {
    if (!graphicsLayerRef.current) {
      return;
    }
    // Clear existing graphics
    graphicsLayerRef.current.removeAll();

    // Add outline graphics for selected features
    features.forEach((feature) => {
      const outlineGraphic = new Graphic({
        geometry: feature.geometry,
        symbol: {
          type: "simple-fill",
          color: [0, 0, 0, 0],
        outline: {
          color: "cyan",
          width: "2px",
        },
      },
    });
    graphicsLayerRef.current.add(outlineGraphic);
  });

  // Update FeatureTable widget
  if (widgets.featureTableWidget) {
    const objectIds = features.map(
      (feature) =>
        feature.attributes[
          view.map.layers.items[targetLayerRef.current.value].objectIdField
        ]
    );
    widgets.featureTableWidget.highlightIds.removeAll();
    widgets.featureTableWidget.highlightIds.addMany(objectIds);
    widgets.featureTableWidget.filterBySelection();
  }

  // Zoom to selected features
  view.goTo(features);
}

function clearSelection() {
  // Clear graphics and FeatureTable selection
  graphicsLayerRef.current.removeAll();
  if (widgets.featureTableWidget) {
    widgets.featureTableWidget.highlightIds.removeAll();
  }


  view.whenLayerView(state.targetLayer).then((layerView) => {
    layerView.featureEffect = null; // Remove the highlight effect
  });

  view.map.layers.forEach((layer) => {
    if (layer.title === "Query Layer" || layer.title === "Query Results") {
      view.map.remove(layer);
    }
  });

  view.graphics.removeAll();

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
      <select
        ref={targetLayerRef}
        id="targetLayer"
        className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
        onChange={setTargetLayer}
      >
        <option value="" hidden>
          {t("widgets.query.select")}
        </option>
        {view?.map.layers.items.map((layer, index) => {
          if (supportedLayerTypes.includes(layer.type)) {
            return (
              <option key={layer.id} value={index}>
                {layer.title}
              </option>
            );
          }
        })}
      </select>

      <label
        className={styles.label}
        style={{
          border: !state.selectionMethodChecked
            ? "2px solid #1FAAA8"
            : " 2px solid #cb69ce",
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
            backgroundColor: !state.selectionMethodChecked
              ? "#1FAAA8"
              : "#cb69ce",
            right: state.selectionMethodChecked ? "calc(100% - 45px)" : "5px",
          }}
        ></span>
        <p
          className={`${styles.title} ${
            !state.selectionMethodChecked ? styles.visible : styles.hidden
          }`}
        >
          By Drawing
        </p>
        <p
          className={`${styles.title} ${
            state.selectionMethodChecked ? styles.visible : styles.hidden
          }`}
        >
          By Layer
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
      style={{
        display: !state.selectionMethodChecked ? "block" : "none",
      }}
    >
      <label htmlFor="selectionLayer" className="font-semibold text-white">
        {t("widgets.query.selectionLayer")}
      </label>
      <select
        ref={selectionLayerRef}
        id="selectionLayer"
        className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
      >
        <option value="" hidden>
          {t("widgets.query.select")}
        </option>
        {view?.map.layers.items.map((layer, index) => {
          if (supportedLayerTypes.includes(layer.type)) {
            return (
              <option key={layer.id} value={index}>
                {layer.title}
              </option>
            );
          }
        })}
      </select>
      <button
        className="flex-grow p-2 bg-primary rounded-sm hover:bg-primary-dark transition-all duration-200 text-center text-white mt-2"
        onClick={runQueryByLayer}
      >
        {t("widgets.query.runQuery")}
      </button>
    </div>
    <div className="flex space-x-2 w-full">
      <button
        className="flex-grow p-2 bg-primary rounded-sm hover:bg-primary-dark transition-all duration-200 text-center text-white"
        onClick={clearSelection}
      >
        {t("widgets.query.clearSearch")}
      </button>
    </div>
  </div>
);
}