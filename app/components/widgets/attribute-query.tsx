"use client";

import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { addQueryResult, clearSelection, createSeparateLayer } from "@/lib/utils/query";
import LayerSelector from "../ui/layer-selector";

interface LocalState {
  targetLayer: FeatureLayer | null;
  queryResultLayer: FeatureLayer | null;
  resultLayerSource: Graphic[] | null;
  fieldsNames: string[];
  layersArray: any[];
  inputMethod: string;
  downloadBtnDisabled: boolean;
  allFeatures: any[];
  graphicsLayer: GraphicsLayer | null;
  queryResult?: any[];
}

export default function AttributeQueryComponent() {
  const { t } = useTranslation();
  const [state, setState] = useState<LocalState>({
    targetLayer: null,
    queryResultLayer: null,
    resultLayerSource: null,
    fieldsNames: [],
    layersArray: [],
    inputMethod: "manual",
    downloadBtnDisabled: true,
    allFeatures: [],
    graphicsLayer: null,
  });

  const layerSelector = useRef<HTMLSelectElement>(null);
  const fieldSelector = useRef<HTMLSelectElement>(null);
  const operatorSelector = useRef<HTMLSelectElement>(null);
  const inputTypeSelector = useRef<HTMLSelectElement>(null);
  const insertedQueryValue = useRef<HTMLInputElement>(null);
  const selectedQueryValue = useRef<HTMLSelectElement>(null);

  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const widgets = useStateStore((state) => state.widgets);
  const targetLayerId = useStateStore((state) => state.targetLayerId);


  useEffect(() => {
    if (view) {
      setState((prevState) => ({
        ...prevState,
        layersArray: view.map.layers.toArray(),
      }));
    }
  }, [view]);

  const getSelectedValue = (layerId: string) => {
    const selectedLayer = view?.map.layers.toArray().find((layer) => layer.id === layerId);
    if (selectedLayer) {
      setState((prevState) => ({
        ...prevState,
        targetLayer: selectedLayer as FeatureLayer,
      }));
    }
  }

  
  const prepareQueryParams = () => {
    const layerIndex = Number(layerSelector.current?.value);
    if (layerIndex === undefined || layerIndex === null) {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        type: "error",
        duration: 10,
      });
      return;
    }
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field: any) => field.name);
    const fetchAllFeaturesQuery = {
      outFields: ["*"],
      returnGeometry: false,
      where: "",
    };

    targetLayer.queryFeatures(fetchAllFeaturesQuery)
      .then((result: any) => {
        setState((prevState) => ({
          ...prevState,
          targetLayer,
          fieldsNames,
          allFeatures: result.features,
        }));
      })
      .catch(() => {
        sendMessage({
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.failedToCollectData.body"),
          type: "error",
          duration: 10,
        });
      });
  };

  const toggleInputMode = (mode: string) => {
    setState((prevState) => ({ ...prevState, inputMethod: mode }));
  };

  const search = () => {
    
    let queryValue = state.inputMethod === "manual"
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
    if (isTextField && queryValue && !queryValue.startsWith("'") && !queryValue.endsWith("'")) {
      queryValue = `'${queryValue}'`;
    }

    const queryIsValid = Object.values(queryParams).every((parameter) => {
      return parameter != null && parameter.trim() !== "" && parameter !== undefined;
    });

    if (queryIsValid) {
      applyQuery(queryParams, queryValue || "");
    } else {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        type: "error",
        duration: 10,
      });
    }
  };

  const applyQuery = (queryParams: any, queryValue: string) => {
    const targetLayer = view?.map.layers.find((layer) => layer.id === targetLayerId) as FeatureLayer;
    if (!targetLayer) {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        type: "error",
        duration: 10,
      });
      return;
    }

    if (view && state.queryResultLayer) view.map.remove(state.queryResultLayer);
    if (!queryParams.queryField) {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        type: "error",
        duration: 10,
      });
      return;
    }
    const queryExpression = queryParams.queryField + queryParams.queryOperator + queryValue;
    const query = {
      outFields: ["*"],
      returnGeometry: true,
      where: queryExpression,
    };

    targetLayer?.queryFeatures(query)
      .then((response: any) => {
        if (response.features.length) {
          findQueryResult(response);
        } else {
          sendMessage({
            title: t("systemMessages.error.queryError.title"),
            body: t("systemMessages.error.noResultsFound.body"),
            type: "error",
            duration: 10,
          });
        }
      })
      .catch(() => {
        sendMessage({
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.searchError.body"),
          type: "error",
          duration: 10,
        });
      });
  };

  const findQueryResult = (response: any) => {
    const graphicsLayer = state.graphicsLayer || new GraphicsLayer({ title: "Query Results" });
    view?.map.add(graphicsLayer);

    addQueryResult(response.features, graphicsLayer, view, state.targetLayer, widgets);

    setState((prevState) => ({
      ...prevState,
      resultLayerSource: response.features.map((feature: any) => new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes,
      })),
      graphicsLayer,
      queryResult: response.features,
      downloadBtnDisabled: false,
    }));

    sendMessage({
      type: "info",
      title: t("systemMessages.info.queryCompleted.title"),
      body: `${t("systemMessages.info.queryCompleted.body")} ${state.targetLayer!.title}`,
      duration: 10,
    });
  };

  const clearSearch = () => {
    clearSelection(state.graphicsLayer, view, state.targetLayer, widgets);

    setState((prevState) => ({
      ...prevState,
      queryResult: [],
      downloadBtnDisabled: true,
      graphicsLayer: null,
    }));
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <LayerSelector getSelectedValue={getSelectedValue} />

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
              toggleInputMode(inputTypeSelector.current!.value)
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
            <select ref={selectedQueryValue} id="queryValues" onChange={search}>
              <option value="" hidden>
              {t("widgets.query.select")}
              </option>
              {(() => {
              const targetField = fieldSelector.current?.value;

              const uniqueValues = [
                ...new Set(
                state.allFeatures
                  .map((feature) => targetField ? feature.attributes[targetField] : null)
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
          onClick={search}
        >
          {t("widgets.query.search")}
        </button>
        <button
          className="btn btn-secondary flex-grow"
          onClick={clearSearch}
        >
          {t("widgets.query.clearSearch")}
        </button>
      </div>

      <div className="flex gap-2 w-full">
        <button
          className="btn btn-green flex-grow"
          disabled={state.downloadBtnDisabled}
          onClick={() => {
            if (state.targetLayer && state.resultLayerSource) {
                createSeparateLayer(state.targetLayer, state.resultLayerSource, view);
            }
          }}
        >
          {t("widgets.query.createNewLayer")}
        </button>
      </div>
    </div>
  );
}
