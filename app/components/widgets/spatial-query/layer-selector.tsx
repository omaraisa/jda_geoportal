"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import SearchableSelect from "../../ui/searchable-select";

interface LayerSelectorProps {
  view: any;
  onTargetLayerChange: (value: string) => void;
  onSelectionLayerChange: (value: string) => void;
  selectionMethodChecked: boolean;
  targetLayerValue?: string;
  selectionLayerValue?: string;
}

export default function LayerSelector({
  view,
  onTargetLayerChange,
  onSelectionLayerChange,
  selectionMethodChecked,
  targetLayerValue = "",
  selectionLayerValue = ""
}: LayerSelectorProps) {
  const { t } = useTranslation();

  const layerOptions = view?.map.layers.toArray()
    .filter((layer: any) => layer.type === "feature" && typeof layer.queryFeatures === "function")
    .map((layer: any) => ({
      value: layer.id,
      label: layer.title || layer.id
    })) || [];

  return (
    <div className="flex flex-col space-y-2 w-full">
      <label htmlFor="targetLayer" className="font-semibold text-foreground">
        {t("widgets.query.selectLayer")}
      </label>

      <SearchableSelect
        value={targetLayerValue}
        onChange={onTargetLayerChange}
        options={[
          { value: "", label: t("widgets.query.selectLayer") },
          ...layerOptions
        ]}
        placeholder={t("widgets.query.selectLayer")}
        maxHeight={300}
      />

      {!selectionMethodChecked && (
        <div className="flex flex-col w-full space-y-2">
          <label htmlFor="selectionLayer" className="font-semibold text-foreground">
            {t("widgets.query.selectionLayer")}
          </label>

          <SearchableSelect
            value={selectionLayerValue}
            onChange={onSelectionLayerChange}
            options={[
              { value: "", label: t("widgets.query.select") },
              ...layerOptions
            ]}
            placeholder={t("widgets.query.select")}
            maxHeight={300}
          />
        </div>
      )}
    </div>
  );
}
