"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import LayerSelector from "../../ui/layer-selector";
import Selector from "../../ui/selector";
import { AttributeQueryState } from "@/interface";

interface QueryFormProps {
  state: AttributeQueryState;
  onLayerSelect: (layerId: string) => void;
  onFieldChange: (selectedField: string) => void;
  onInputModeToggle: (mode: string) => void;
  onSearch: (selectedQueryValue?: string) => void;
  operatorRef: React.RefObject<HTMLSelectElement | null>;
  inputTypeRef: React.RefObject<HTMLSelectElement | null>;
  queryValueRef: React.RefObject<HTMLInputElement | null>;
}

export default function QueryForm({
  state,
  onLayerSelect,
  onFieldChange,
  onInputModeToggle,
  onSearch,
  operatorRef,
  inputTypeRef,
  queryValueRef
}: QueryFormProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-4">
      <LayerSelector getSelectedValue={onLayerSelect} />

      <Selector 
        label={t("widgets.query.selectField")} 
        options={state.fieldsNames.map(name => ({ value: name, label: name }))} 
        getSelectedValue={onFieldChange} 
      />

      <div className="flex flex-col w-full">
        <label htmlFor="operatorSelector" className="font-semibold text-2c2c2c">
          {t("widgets.query.selectQueryCondition")}
        </label>
        <div className="select">
          <select ref={operatorRef} id="operatorSelector">
            <option value="=">{t("widgets.query.equals")}</option>
            <option value=">">{t("widgets.query.greaterThan")}</option>
            <option value="<">{t("widgets.query.lessThan")}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col w-full">
        <label htmlFor="inputTypeSelector" className="font-semibold text-2c2c2c">
          {t("widgets.query.selectInputType")}
        </label>
        <div className="select">
          <select
            ref={inputTypeRef}
            id="inputTypeSelector"
            onChange={() => onInputModeToggle(inputTypeRef.current!.value)}
          >
            <option value={"manual"}>{t("widgets.query.manualInput")}</option>
            <option value={"from data"}>{t("widgets.query.fromData")}</option>
          </select>
        </div>
      </div>

      {state.inputMethod === "manual" ? (
        <label htmlFor="queryInput" className="textInput">
          <input
            ref={queryValueRef}
            type="text"
            className="input-text"
            id="queryInput"
            placeholder="&nbsp;"
          />
          <span className="label">{t("widgets.query.enterValue")}</span>
        </label>
      ) : (
        <Selector 
          label={t("widgets.query.selectField")} 
          options={state.uniqueValues.map(value => ({ value, label: value }))} 
          getSelectedValue={onSearch} 
        />
      )}
    </div>
  );
}
