"use client";

import { useState, useRef } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { AttributeQueryState } from "@/interface";
import QueryForm from "./attribute-query/query-form";
import QueryActions from "./attribute-query/query-actions";
import { AttributeQueryService } from "./attribute-query/query-service";

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
  };

  const handleFieldChange = async (selectedField: string) => {
    if (!selectedField || selectedField.trim() === "" || !state.targetLayer) return;

    try {
      const uniqueValues = await AttributeQueryService.getUniqueValues(state.targetLayer, selectedField);
      setState((prevState) => ({
        ...prevState,
        uniqueValues,
        selectedField
      }));
    } catch (error) {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.failedToCollectData.body"),
        type: "error",
        duration: 10,
      });
    }
  };

  const toggleInputMode = (mode: string) => {
    setState((prevState) => ({ ...prevState, inputMethod: mode }));
  };

  const search = async (selectedQueryValue?: string) => {
    let queryValue = state.inputMethod === "manual"
      ? insertedQueryValue.current?.value
      : selectedQueryValue;

    const queryParams = {
      queryField: state.selectedField,
      queryOperator: operatorSelector.current?.value,
      queryValue,
    };

    const queryIsValid = Object.values(queryParams).every((parameter) => {
      return parameter != null && parameter.trim() !== "" && parameter !== undefined;
    });

    if (queryIsValid && state.targetLayer) {
      await applyQuery(queryParams, queryValue || "");
    } else {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.completeSearchRequirements.body"),
        type: "error",
        duration: 10,
      });
    }
  };

  const applyQuery = async (queryParams: any, queryValue: string) => {
    const targetLayer = state.targetLayer as FeatureLayer;
    if (!targetLayer) return;

    if (view && state.queryResultLayer) view.map.remove(state.queryResultLayer);

    try {
      const queryExpression = AttributeQueryService.buildQueryExpression(
        queryParams.queryField,
        queryParams.queryOperator,
        queryValue,
        targetLayer
      );

      const response = await AttributeQueryService.executeQuery(targetLayer, queryExpression);

      if (response.features.length) {
        await findQueryResult(response);
      } else {
        sendMessage({
          title: t("systemMessages.error.queryError.title"),
          body: t("systemMessages.error.noResultsFound.body"),
          type: "error",
          duration: 10,
        });
      }
    } catch (error) {
      sendMessage({
        title: t("systemMessages.error.queryError.title"),
        body: t("systemMessages.error.searchError.body"),
        type: "error",
        duration: 10,
      });
    }
  };

  const findQueryResult = async (response: any) => {
    const { graphicsLayer, resultLayerSource } = AttributeQueryService.processQueryResult(
      response,
      state,
      view,
      widgets
    );

    setState((prevState) => ({
      ...prevState,
      resultLayerSource,
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
    AttributeQueryService.clearQueryResults(state, view, widgets);

    setState((prevState) => ({
      ...prevState,
      queryResult: [],
      downloadBtnDisabled: true,
      graphicsLayer: null,
    }));
  };

  const handleCreateLayer = () => {
    if (state.targetLayer && state.resultLayerSource) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const timeCode = `${hours}${minutes}${seconds}`;
      
      const uniqueTitle = `Query Result - ${state.targetLayer.title} ${timeCode}`;
      
      AttributeQueryService.createLayerFromResults(
        state.targetLayer,
        state.resultLayerSource,
        view,
        uniqueTitle
      );
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <QueryForm
        state={state}
        onLayerSelect={handleSelectedLayer}
        onFieldChange={handleFieldChange}
        onInputModeToggle={toggleInputMode}
        onSearch={search}
        operatorRef={operatorSelector}
        inputTypeRef={inputTypeSelector}
        queryValueRef={insertedQueryValue}
      />

      <QueryActions
        state={state}
        onSearch={() => search()}
        onClearSearch={clearSearch}
        onCreateLayer={handleCreateLayer}
      />
    </div>
  );
}
