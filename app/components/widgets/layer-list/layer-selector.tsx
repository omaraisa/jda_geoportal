import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { featureBasedLayerTypes } from "@/lib/utils/global-constants";
import SearchableSelect from '../../ui/searchable-select';

interface LayerSelectorProps {
  getSelectedValue: (layerId: string) => void;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ getSelectedValue }) => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const [selectedValue, setSelectedValue] = useState("");

  const handleChange = useCallback((value: string) => {
    setSelectedValue(value);
    getSelectedValue(value);
  }, [getSelectedValue]);

  const layerOptions = view?.map.layers.toArray()
    .filter(layer => featureBasedLayerTypes.includes(layer.type))
    .map(layer => ({
      value: layer.id,
      label: layer.title || layer.id
    })) || [];

  return (
    <div className="flex flex-col w-full">
      <label htmlFor="layerSelector" className="font-semibold text-2c2c2c mb-2">
        {t("widgets.query.selectLayer")}
      </label>
      <SearchableSelect
        value={selectedValue}
        onChange={handleChange}
        options={[
          { value: "", label: t("widgets.query.select") },
          ...layerOptions
        ]}
        placeholder={t("widgets.query.selectLayer")}
        maxHeight={300}
      />
    </div>
  );
};

export default LayerSelector;
