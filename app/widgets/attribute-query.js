"use client";

import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import useStateStore from "../stateManager";
import { useTranslation } from "react-i18next";

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

  // Zustand state management
  const view = useStateStore((state) => state.view);
  const layers = useStateStore((state) => state.layers);
  const addMessage = useStateStore((state) => state.addMessage);

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
  });

  const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

  useEffect(() => {
    setState({ ...state, layersArray: layers, activeListener: true });
  }, [layers]);

  function prepareQueryParams(state) {
    const layerIndex = layerSelector.current.value;
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field) => field.name);
    const fetchAllFeaturesQuery = {
      outFields: ["*"],
      returnGeometry: false,
      where: "",
    };

    targetLayer.queryFeatures(fetchAllFeaturesQuery)
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
          title: t('systemMessages.error.queryError.title'),
          body: t('systemMessages.error.failedToCollectData.body'),
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
    const queryParams = {
      queryField: fieldSelector.current.value,
      queryOperator: operatorSelector.current.value,
    };
  
    // Get the selected field's type
    const selectedField = state.targetLayer.fields.find(
      (field) => field.name === queryParams.queryField
    );
    const isTextField = selectedField?.type === "string"; // Check if the field is of type text/string
  
    let queryValue =
      state.inputMethod === "manual"
        ? insertedQueryValue.current.value
        : selectedQueryValue.current.value;
  
    // Surround the query value with single quotes if the field is text
    if (isTextField && !queryValue.startsWith("'") && !queryValue.endsWith("'")) {
      queryValue = `'${queryValue}'`;
    }
  
    const queryIsValid = Object.values(queryParams).every((parameter) => {
      if (parameter !== null && parameter !== undefined) return true;
      return false;
    });
  
    queryIsValid
      ? applyQuery()
      : addMessage({
          title: t('systemMessages.error.queryError.title'),
          body: t('systemMessages.error.completeSearchRequirements.body'),
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
                title: t('systemMessages.error.queryError.title'),
                body: t('systemMessages.error.noResultsFound.body'),
                type: "error",
                duration: 10,
              });
        })
        .catch((error) => {
          addMessage({
            title: t('systemMessages.error.queryError.title'),
            body: t('systemMessages.error.searchError.body'),
            type: "error",
            duration: 10,
          });
          console.log("Query Error", error);
        });
    }
  }

  function addQueryResult(response) {
    const symbols = {
      point: {
        type: "simple-marker",
        style: "circle",
        color: "rgba(0,255,255,1)",
        size: "8px",
      },
      polyline: {
        type: "simple-line",
        color: "rgba(0,255,255,1)",
        width: 3,
      },
      polygon: {
        type: "simple-fill",
        color: "rgba(255,255,255,0)",
        outline: {
          width: 2,
          color: "rgba(0,255,255,1)",
        },
      },
    };
    const querySymbol = symbols[state.targetLayer.geometryType];
    const renderer = {
      type: "simple",
      symbol: querySymbol,
    };

    const source = response.features.map((feature) => {
      const queryGraphic = new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes,
        symbol: querySymbol,
      });
      return queryGraphic;
    });
    const fieldInfos = state.targetLayer.fields.map((field) => {
      return { fieldName: field.name };
    });

    const popupTemplate = {
      content: [
        {
          type: "fields",
          fieldInfos: fieldInfos,
        },
      ],
    };

    const fields = state.targetLayer.fields;
    if (!fields.some((field) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }
    const resultLayerParameters = {
      title: state.targetLayer.title + " Query Result",
      geometryType: state.targetLayer.geometryType,
      spatialReference: state.targetLayer.spatialReference,
      popupEnabled: true,
      source,
      fields,
      renderer,
      popupTemplate,
    };
    const queryResultLayer = new FeatureLayer(resultLayerParameters);

    view.map.add(queryResultLayer);
    queryResultLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
    addMessage({
      type: "info",
      title: t('systemMessages.info.queryCompleted.title'),
      body: `${t('systemMessages.info.queryCompleted.body')} ${state.targetLayer.title}`,
      duration: 10,
    });
      const layersArray = [...view.map.layers.items];
      setState({
        ...state,
        layersArray,
        queryResultLayer,
        queryResult: response.features,
        downloadBtnDisabled: false,
        resultLayerParameters,
      });
    });
  }

  function clearSearch(state) {
    view.map.remove(state.queryResultLayer);
    setState({
      ...state,
      queryResultLayer: null,
      downloadBtnDisabled: true,
      allFeatures: [],
    });
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
    <div className="flex flex-col space-y-4 p-4 ">
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="layerSelector" className="font-semibold text-gray-700">
          {t('widgets.query.selectLayer')}
        </label>
        <select
          ref={layerSelector}
          id="layerSelector"
          className="p-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 w-full"
          onChange={() => prepareQueryParams(state)}
        >
          <option value="" hidden>
            {t('widgets.query.select')}
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
  
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="fieldSelector" className="font-semibold text-gray-700">
          {t('widgets.query.selectField')}
        </label>
        <select
          ref={fieldSelector}
          id="fieldSelector"
          className="p-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 w-full"
        >
          <option value="" hidden>
            {t('widgets.query.select')}
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
  
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="operatorSelector" className="font-semibold text-gray-700">
          {t('widgets.query.selectQueryCondition')}
        </label>
        <select
          ref={operatorSelector}
          id="operatorSelector"
          className="p-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 w-full"
        >
          <option value="" hidden>
            {t('widgets.query.select')}
          </option>
          <option value=">">{t('widgets.query.greaterThan')}</option>
          <option value="<">{t('widgets.query.lessThan')}</option>
          <option value="=">{t('widgets.query.equals')}</option>
        </select>
      </div>
  
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="inputTypeSelector" className="font-semibold text-gray-700">
          {t('widgets.query.selectInputType')}
        </label>
        <select
          ref={inputTypeSelector}
          id="inputTypeSelector"
          onChange={() => toggleInputMode(state, inputTypeSelector.current.value)}
          className="p-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 w-full"
        >
          <option value={"manual"}>{t('widgets.query.manualInput')}</option>
          <option value={"from data"}>{t('widgets.query.fromData')}</option>
        </select>
      </div>
  
      {state.inputMethod === "manual" ? (
        <div className="flex flex-col space-y-2 w-full">
          <label htmlFor="queryInput" className="font-semibold text-gray-700">
            {t('widgets.query.enterValue')}
          </label>
          <input
            ref={insertedQueryValue}
            type="text"
            id="queryInput"
            className="p-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 w-full"
          />
        </div>
      ) : (
        <div className="flex flex-col space-y-2 w-full">
          <label htmlFor="queryValues" className="font-semibold text-gray-700">
            {t('widgets.query.selectValue')}
          </label>
          <select
            ref={selectedQueryValue}
            id="queryValues"
            className="p-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 w-full"
          >
            <option value="" hidden>
              {t('widgets.query.select')}
            </option>
            {state.allFeatures.map((feature, index) => {
              const targetField = fieldSelector.current.value;
              if (feature.attributes[targetField] !== null)
                return (
                  <option key={index} value={feature.attributes[targetField]}>
                    {feature.attributes[targetField]}
                  </option>
                );
            })}
          </select>
        </div>
      )}
  
      <div className="flex space-x-2 w-full">
        <button
          className="flex-grow p-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200"
          onClick={() => search(state)}
        >
          {t('widgets.query.search')}
        </button>
        <button
          className="p-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
          disabled={state.downloadBtnDisabled}
          onClick={() => CreateSeparateLayer(state)}
        >
          {t('widgets.query.createNewLayer')}
        </button>
        <button
          className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
          onClick={() => clearSearch(state)}
        >
          {t('widgets.query.clearSearch')}
        </button>
      </div>
    </div>
  );
}