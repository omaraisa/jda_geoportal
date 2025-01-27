"use client";

import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import useStateStore from "@/stateManager";
import { useTranslation } from "react-i18next";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export default function AttributeQueryComponent() {
  const { t } = useTranslation();
  const [
    layerSelector,
    fieldSelector,
    operatorSelector,
    inputTypeSelector,
    insertedQueryValue,
    selectedQueryValue,
  ] = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const view = useStateStore((state) => state.targetView);
  const addMessage = useStateStore((state) => state.addMessage);
  const widgets = useStateStore((state) => state.widgets);

  const [state, setState] = useState({
    targetLayer: null,
    queryResultLayer: null,
    resultLayerParameters: null,
    fieldsNames: [],
    layersArray: [],
    inputMethod: "manual",
    downloadBtnDisabled: true,
    allFeatures: [],
    activeListener: false,
    graphicsLayer: null, // Added empty graphic layer parameter
  });

  const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

  useEffect(() => {
    if (view) {
      setState({
        ...state,
        layersArray: view.map.layers.items,
        activeListener: true,
      });
    }
  }, [view]);

  function prepareQueryParams(state) {
    const layerIndex = layerSelector.current.value;
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field) => field.name);
    const fetchAllFeaturesQuery = {
      outFields: ["*"],
      returnGeometry: false,
      where: "",
    };

    targetLayer
      .queryFeatures(fetchAllFeaturesQuery)
      .then(function (result) {
        setState({
          ...state,
          targetLayer,
          fieldsNames,
          allFeatures: result.features,
        });
      })
      .catch((error) => {
        addMessage({
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.failedToCollectData.body"),
          type: "error",
          duration: 10,
        });
        console.log("Query Error", error);
      });
  }

  function toggleInputMode(state, mode) {
    setState({ ...state, inputMethod: mode });
  }

  function search(state) {
    let queryValue =
      state.inputMethod === "manual"
        ? insertedQueryValue.current.value
        : selectedQueryValue.current.value;

    const queryParams = {
      queryField: fieldSelector.current.value,
      queryOperator: operatorSelector.current.value,
      queryValue,
    };

    // Get the selected field's type
    const selectedField = state.targetLayer?.fields?.find(
      (field) => field.name === queryParams.queryField
    );
    const isTextField = selectedField?.type === "string"; // Check if the field is of type text/string
    // Surround the query value with single quotes if the field is text
    if (
      isTextField &&
      !queryValue.startsWith("'") &&
      !queryValue.endsWith("'")
    ) {
      queryValue = `'${queryValue}'`;
    }

    const queryIsValid = Object.values(queryParams).every((parameter) => {
      return (
        parameter != null && parameter.trim() !== "" && parameter !== undefined
      );
    });

    queryIsValid
      ? applyQuery()
      : addMessage({
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.completeSearchRequirements.body"),
          type: "error",
          duration: 10,
        });

    function applyQuery() {
      if (state.queryResultLayer) view.map.remove(state.queryResultLayer);
      const queryExpression =
        queryParams.queryField + queryParams.queryOperator + queryValue;
      const query = {
        outFields: ["*"],
        returnGeometry: true,
        where: queryExpression,
      };

      state.targetLayer
        .queryFeatures(query)
        .then(function (response) {
          response.features.length
            ? addQueryResult(response)
            : addMessage({
                title: t("systemMessages.error.queryError.title"),
                body: t("systemMessages.error.noResultsFound.body"),
                type: "error",
                duration: 10,
              });
        })
        .catch((error) => {
          addMessage({
            title: t("systemMessages.error.queryError.title"),
            body: t("systemMessages.error.searchError.body"),
            type: "error",
            duration: 10,
          });
          console.log("Query Error", error);
        });
    }
  }

  function addQueryResult(response) {
    // Remove any existing graphics from the map
    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll();
      view.map.remove(state.graphicsLayer);
    }

    // Get the layer view for the target layer
    view.whenLayerView(state.targetLayer).then((layerView) => {
      const objectIds = response.features.map(
        (feature) => feature.attributes[state.targetLayer.objectIdField]
      );
      // Extract the geometries of the selected features
      const features = response.features;

      layerView.featureEffect = {
        filter: {
          where: `${state.targetLayer.objectIdField} IN (${objectIds.join(
            ","
          )})`,
        },
        excludedEffect: "blur(2px) opacity(50%)", // Dim and blur non-selected features
      };

      // Create a graphics layer to hold the outline graphics
      const graphicsLayer =
        state.graphicsLayer || new GraphicsLayer({ title: "Query Results" });
      view.map.add(graphicsLayer);

      // Loop through the selected features and create outline graphics
      features.forEach((feature) => {
        const geometry = feature.geometry;

        // Create a graphic with a cyan outline
        const outlineGraphic = new Graphic({
          geometry: geometry,
          symbol: {
            type: "simple-fill", // For polygon features
            color: [0, 0, 0, 0], // Transparent fill
            outline: {
              color: "cyan",
              width: "2px",
            },
          },
        });

        // Add the graphic to the graphics layer
        graphicsLayer.add(outlineGraphic);
      });

      // Update the FeatureTable widget
      if (widgets.featureTableWidget) {
        const highlightIds = objectIds; // Use object IDs for highlighting
        widgets.featureTableWidget.highlightIds.removeAll();
        widgets.featureTableWidget.highlightIds.addMany(highlightIds);
        widgets.featureTableWidget.filterBySelection();
      }

      setState((prevState) => ({
        ...prevState,
        graphicsLayer: graphicsLayer, // Store the new graphics layer in state
        queryResult: response.features,
        downloadBtnDisabled: false,
      }));

      // Zoom to the selected features
      view.goTo(response.features);

      // Show a success message
      // addMessage({
      //   type: "info",
      //   title: t('systemMessages.info.queryCompleted.title'),
      //   body: `${t('systemMessages.info.queryCompleted.body')} ${state.targetLayer.title}`,
      //   duration: 10,
      // });

      // Update the state with the query result
    });
  }

  function clearSearch(state) {
    // Clear the feature effect
    view.whenLayerView(state.targetLayer).then((layerView) => {
      layerView.featureEffect = null; // Remove the highlight effect
    });

    view.map.layers.forEach((layer) => {
      if (layer.title === "Query Layer" || layer.title === "Query Results") {
        view.map.remove(layer);
      }
    });

    view.graphics.removeAll();

    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll(); // Remove all graphics from the layer
    }

    if (widgets.featureTableWidget) {
      widgets.featureTableWidget.highlightIds.removeAll();
    }

    // Update the state
    setState((prevState) => ({
      ...prevState,
      queryResult: null,
      downloadBtnDisabled: true,
      graphicsLayer: null, // Clear the graphics layer reference
    }));
  }

  function CreateSeparateLayer(state) {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    const symbols = {
      point: {
        type: "simple-marker",
        style: "circle",
        color: randomColor,
        size: "8px",
      },
      polyline: {
        type: "simple-line",
        color: randomColor,
        width: 2,
      },
      polygon: {
        type: "simple-fill",
        color: randomColor,
        outline: {
          width: 2,
          color: "#fff",
        },
      },
    };
    const newSymbol = symbols[state.targetLayer.geometryType];

    const renderer = {
      type: "simple",
      symbol: newSymbol,
    };

    const newSelectionLayer = new FeatureLayer(state.resultLayerParameters);
    newSelectionLayer.title = state.targetLayer.title + "_modified_copy";
    newSelectionLayer.renderer = renderer;
    view.map.layers.add(newSelectionLayer);
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col  w-full">
        <label htmlFor="layerSelector" className="font-semibold text-white">
          {t("widgets.query.selectLayer")}
        </label>
        <div className="select">
          <select
            defaultValue=""
            ref={layerSelector}
            id="layerSelector"
            onChange={() => prepareQueryParams(state)}
          >
            <option value="" hidden>
              {t("widgets.query.select")}
            </option>
            {state.layersArray.map((layer, index) => {
              if (supportedLayerTypes.includes(layer.type)) {
                return (
                  <option key={layer.id} value={index}>
                    {layer.title}
                  </option>
                );
              }
            })}
          </select>
        </div>
      </div>

      <div className="flex flex-col  w-full">
        <label htmlFor="fieldSelector" className="font-semibold text-white">
          {t("widgets.query.selectField")}
        </label>
        <div className="select">
          <select ref={fieldSelector} id="fieldSelector">
            <option value="" hidden>
              {t("widgets.query.select")}
            </option>
            {state.fieldsNames.map((fieldName, index) => {
              return (
                <option key={index} value={fieldName}>
                  {fieldName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="flex flex-col  w-full">
        <label htmlFor="operatorSelector" className="font-semibold text-white">
          {t("widgets.query.selectQueryCondition")}
        </label>
        <div className="select">
          <select ref={operatorSelector} id="operatorSelector">
            <option value="=">{t("widgets.query.equals")}</option>
            <option value=">">{t("widgets.query.greaterThan")}</option>
            <option value="<">{t("widgets.query.lessThan")}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col  w-full">
        <label htmlFor="inputTypeSelector" className="font-semibold text-white">
          {t("widgets.query.selectInputType")}
        </label>
        <div className="select">
          <select
            ref={inputTypeSelector}
            id="inputTypeSelector"
            onChange={() =>
              toggleInputMode(state, inputTypeSelector.current.value)
            }
          >
            <option value={"manual"}>{t("widgets.query.manualInput")}</option>
            <option value={"from data"}>{t("widgets.query.fromData")}</option>
          </select>
        </div>
      </div>

      {state.inputMethod === "manual" ? (
        <label htmlFor="queryInput" className="textInput">
          <input
            ref={insertedQueryValue}
            type="text"
            className="input-text"
            id="queryInput"
            placeholder="&nbsp;"
          />
          <span className="label">{t("widgets.query.enterValue")}</span>
        </label>
      ) : (
        <div className="flex flex-col  w-full">
          <label htmlFor="queryValues" className="font-semibold text-white">
            {t("widgets.query.selectValue")}
          </label>
          <div className="select">
            <select ref={selectedQueryValue} id="queryValues">
              <option value="" hidden>
                {t("widgets.query.select")}
              </option>
              {(() => {
                const targetField = fieldSelector.current.value;

                // Extract unique values using a Set
                const uniqueValues = [
                  ...new Set(
                    state.allFeatures
                      .map((feature) => feature.attributes[targetField])
                      .filter((value) => value !== null) // Filter out null values
                  ),
                ];

                // Render unique values as options
                return uniqueValues.map((value, index) => (
                  <option key={index} value={value}>
                    {value}
                  </option>
                ));
              })()}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-2 w-full">
        <button
          className="btn btn-primary flex-grow"
          onClick={() => search(state)}
        >
          {t("widgets.query.search")}
        </button>
        <button
          className="btn btn-secondary flex-grow"
          onClick={() => clearSearch(state)}
        >
          {t("widgets.query.clearSearch")}
        </button>
      </div>

      <div className="flex gap-2 w-full">
        <button
          className="btn btn-green flex-grow"
          disabled={state.downloadBtnDisabled}
          onClick={() => CreateSeparateLayer(state)}
        >
          {t("widgets.query.createNewLayer")}
        </button>
      </div>

      <div className="flex gap-2 w-full">
        <button
          className="flex-grow p-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 transition-all duration-200 text-center"
          onClick={() =>
            addMessage({
              type: "info",
              title: t("systemMessages.info.genericSuccess.title"),
              body: t("systemMessages.info.genericSuccess.body"),
              duration: 15,
            })
          }
        >
          Info Message
        </button>
        <button
          className="flex-grow p-2 bg-yellow-500 text-white rounded-sm hover:bg-yellow-600 transition-all duration-200 text-center"
          onClick={() =>
            addMessage({
              type: "warning",
              title: t("systemMessages.warning.genericWarning.title"),
              body: t("systemMessages.warning.genericWarning.body"),
              duration: 15,
            })
          }
        >
          Warning Message
        </button>
        <button
          className="flex-grow p-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-all duration-200 text-center"
          onClick={() =>
            addMessage({
              type: "error",
              title: t("systemMessages.error.genericError.title"),
              body: t("systemMessages.error.genericError.body"),
              duration: 15,
            })
          }
        >
          Error Message
        </button>
      </div>
    </div>
  );
}
