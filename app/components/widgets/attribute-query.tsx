"use client";

import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { addQueryResult, clearSelection, createSeparateLayer } from "@/lib/utils/query";
import LayerSelector from "../ui/layer-selector";
import Selector from "../ui/selector";
import {AttributeQueryState} from "@/interface"

export default function AttributeQueryComponent() {
  const { t } = useTranslation();
  const [state, setState] = useState<AttributeQueryState>({
    targetLayer: null,
    queryResultLayer: null,
    resultLayerSource: null,
    fieldsNames: [],
    inputMethod: "manual",
    downloadBtnDisabled: true,
    uniqueValues: [],
    graphicsLayer: null,
    selectedField: ""
  });

  const operatorSelector = useRef<HTMLSelectElement>(null);
  const inputTypeSelector = useRef<HTMLSelectElement>(null);
  const insertedQueryValue = useRef<HTMLInputElement>(null);

  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const widgets = useStateStore((state) => state.widgets);
  const updateStats = useStateStore((state) => state.updateStats);

  const handleSelectedLayer = (layerId: string) => {
    const selectedLayer = view?.map.layers.toArray().find((layer) => layer.id === layerId) as FeatureLayer;
    const fieldsNames = selectedLayer.fields.map((field: any) => field.name);

      setState((prevState) => ({
        ...prevState,
        targetLayer: selectedLayer,
        fieldsNames,
      }));
         
  }

  const handleFieldChange = (selectedField: string) => {
    if (!selectedField || selectedField.trim() === "") return;

    const query = {
      where: "1=1",
      returnDistinctValues: true,
      outFields: [selectedField],
      orderByFields: [selectedField],
      returnGeometry: false,
    };

    state.targetLayer?.queryFeatures(query)
      .then((response: any) => {
        const uniqueValues = response.features.map((feature: any) => feature.attributes[selectedField]);
        setState((prevState) => ({
          ...prevState,
          uniqueValues,
          selectedField
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

  const search = (selectedQueryValue?:string) => {
    let queryValue = state.inputMethod === "manual"
      ? insertedQueryValue.current?.value
      : selectedQueryValue;

    const queryParams = {
      queryField: state.selectedField,
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
    const targetLayer = state.targetLayer as FeatureLayer;
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
    updateStats("Attribute Query");
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
      <LayerSelector getSelectedValue={handleSelectedLayer} />

      <Selector label={t("widgets.query.selectField")} options={state.fieldsNames.map(name => ({ value: name, label: name }))} getSelectedValue={handleFieldChange} />

      <div className="flex flex-col  w-full">
        <label htmlFor="operatorSelector" className="font-semibold text-2c2c2c">
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
        <label htmlFor="inputTypeSelector" className="font-semibold text-2c2c2c">
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
      <Selector label={t("widgets.query.selectField")} options={state.uniqueValues.map(value => ({ value, label: value }))} getSelectedValue={search} />
      )}

      <div className="flex gap-2 w-full">
        <button
          className="btn btn-primary flex-grow"
          onClick={() => search()}
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
          className={`btn ${state.downloadBtnDisabled ? 'btn-gray' : 'btn-primary'} flex-grow`}
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
