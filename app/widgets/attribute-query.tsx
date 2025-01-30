"use client";

import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import useStateStore from "@/stateManager";
import { useTranslation } from "react-i18next";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

interface State {
  targetLayer: FeatureLayer | null;
  queryResultLayer: FeatureLayer | null;
  resultLayerSource: Graphic[] | null;
  fieldsNames: string[];
  layersArray: any[];
  inputMethod: string;
  downloadBtnDisabled: boolean;
  allFeatures: any[];
  activeListener: boolean;
  graphicsLayer: GraphicsLayer | null;
  queryResult?: any[];
}

export default function AttributeQueryComponent() {
  const { t } = useTranslation();
  const [
    layerSelector,
    fieldSelector,
    operatorSelector,
    inputTypeSelector,
    insertedQueryValue,
    selectedQueryValue,
  ] = [useRef<HTMLSelectElement>(null), useRef<HTMLSelectElement>(null), useRef<HTMLSelectElement>(null), useRef<HTMLSelectElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLSelectElement>(null)];

  const view = useStateStore((state) => state.targetView);
  const addMessage = useStateStore((state) => state.addMessage);
  const widgets = useStateStore((state) => state.widgets);

  const [state, setState] = useState<State>({
    targetLayer: null,
    queryResultLayer: null,
    resultLayerSource: null,
    fieldsNames: [],
    layersArray: [],
    inputMethod: "manual",
    downloadBtnDisabled: true,
    allFeatures: [],
    activeListener: false,
    graphicsLayer: null,
  });

  const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

  useEffect(() => {
    if (view) {
      setState((prevState) => ({
        ...prevState,
        layersArray: view.map.layers.items,
        activeListener: true,
      }));
    }
  }, [view]);

  function prepareQueryParams(state: State) {
    const layerIndex = layerSelector.current?.value;
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field: any) => field.name);
    const fetchAllFeaturesQuery = {
      outFields: ["*"],
      returnGeometry: false,
      where: "",
    };

    targetLayer
      .queryFeatures(fetchAllFeaturesQuery)
      .then(function (result: any) {
        setState((prevState) => ({
          ...prevState,
          targetLayer,
          fieldsNames,
          allFeatures: result.features,
        }));
      })
      .catch((error: any) => {
        addMessage({
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.failedToCollectData.body"),
          type: "error",
          duration: 10,
        });
      });
  }

  function toggleInputMode(state: State, mode: string) {
    setState((prevState) => ({ ...prevState, inputMethod: mode }));
  }

  function search(state: State) {
    let queryValue =
      state.inputMethod === "manual"
        ? insertedQueryValue.current?.value
        : selectedQueryValue.current?.value;

    const queryParams = {
      queryField: fieldSelector.current?.value,
      queryOperator: operatorSelector.current?.value,
      queryValue,
    };

    const selectedField = state.targetLayer?.fields?.find(
      (field: any) => field.name === queryParams.queryField
    );
    const isTextField = selectedField?.type === "string";
    if (
      isTextField &&
      queryValue &&
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
        ?.queryFeatures(query)
        .then(function (response: any) {
          response.features.length
            ? addQueryResult(response)
            : addMessage({
                title: t("systemMessages.error.queryError.title"),
                body: t("systemMessages.error.noResultsFound.body"),
                type: "error",
                duration: 10,
              });
        })
        .catch((error: any) => {
          addMessage({
            title: t("systemMessages.error.queryError.title"),
            body: t("systemMessages.error.searchError.body"),
            type: "error",
            duration: 10,
          });
        });
    }
  }

  function addQueryResult(response: any) {
    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll();
      view.map.remove(state.graphicsLayer);
    }

    view.whenLayerView(state.targetLayer).then((layerView: any) => {
      const objectIds = response.features.map(
        (feature: any) => feature.attributes[state.targetLayer!.objectIdField]
      );
      const features = response.features;

      layerView.featureEffect = {
        filter: {
          where: `${state.targetLayer!.objectIdField} IN (${objectIds.join(
            ","
          )})`,
        },
        excludedEffect: "blur(2px) opacity(50%)",
      };

      const graphicsLayer =
        state.graphicsLayer || new GraphicsLayer({ title: "Query Results" });
      view.map.add(graphicsLayer);

      features.forEach((feature: any) => {
        const geometry = feature.geometry;

        const outlineGraphic = new Graphic({
          geometry: geometry,
          symbol: {
            type: "simple-fill",
            color: [0, 0, 0, 0],
            outline: {
              color: "cyan",
              width: "2px",
            },
          },
        });

        graphicsLayer.add(outlineGraphic);
      });

      const resultLayerSource = response.features.map((feature: any) => {
        const queryGraphic = new Graphic({
          geometry: feature.geometry,
          attributes: feature.attributes,
        });
        return queryGraphic;
      });
      setState((prevState) => ({
        ...prevState,
        resultLayerSource,
      }));

      if (widgets.featureTableWidget) {
        const highlightIds = objectIds;
        widgets.featureTableWidget.highlightIds.removeAll();
        widgets.featureTableWidget.highlightIds.addMany(highlightIds);
        widgets.featureTableWidget.filterBySelection();
      }

      setState((prevState) => ({
        ...prevState,
        graphicsLayer: graphicsLayer,
        queryResult: response.features,
        downloadBtnDisabled: false,
      }));

      view.goTo(response.features);

      addMessage({
        type: "info",
        title: t('systemMessages.info.queryCompleted.title'),
        body: `${t('systemMessages.info.queryCompleted.body')} ${state.targetLayer!.title}`,
        duration: 10,
      });
    });
  }

  function clearSearch(state: State) {
    view.whenLayerView(state.targetLayer).then((layerView: any) => {
      layerView.featureEffect = null;
    });

    view.map.layers.forEach((layer: any) => {
      if (layer.title === "Query Layer" || layer.title === "Query Results") {
        view.map.remove(layer);
      }
    });

    view.graphics.removeAll();

    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll();
    }

    if (widgets.featureTableWidget) {
      widgets.featureTableWidget.highlightIds.removeAll();
    }

    setState((prevState) => ({
      ...prevState,
      queryResult: null,
      downloadBtnDisabled: true,
      graphicsLayer: null,
    }));
  }

  function CreateSeparateLayer(state: State) {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    const symbols: any = {
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
    const newSymbol = symbols[state.targetLayer!.geometryType];

    const renderer = {
      type: "simple",
      symbol: newSymbol,
    };

    const fieldInfos = state.targetLayer!.fields.map((field: any) => {
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

    const fields = state.targetLayer!.fields;
    if (!fields.some((field: any) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }

    const newSelectionLayer = new FeatureLayer({
      title: state.targetLayer!.title + "_modified",
      geometryType: state.targetLayer!.geometryType,
      spatialReference: state.targetLayer!.spatialReference,
      popupEnabled: true,
      source: state.resultLayerSource,
      fields,
      renderer,
      popupTemplate,
    });

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
              toggleInputMode(state, inputTypeSelector.current!.value)
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
                const targetField = fieldSelector.current?.value;

                const uniqueValues = [
                  ...new Set(
                    state.allFeatures
                      .map((feature) => feature.attributes[targetField])
                      .filter((value) => value !== null)
                  ),
                ];

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
    </div>
  );
}
