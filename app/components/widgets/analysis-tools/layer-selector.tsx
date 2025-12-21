import React from "react";
import { useTranslation } from "react-i18next";
import SearchableSelect from '../../ui/searchable-select';
import { featureBasedLayerTypes } from "@/lib/utils/global-constants";

interface LayerSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  view: __esri.MapView | __esri.SceneView | null;
  placeholder?: string;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({
  label,
  value,
  onChange,
  view,
  placeholder
}) => {
  const { t } = useTranslation();

  const layerOptions = view?.map.layers.toArray()
    .filter(layer => featureBasedLayerTypes.includes(layer.type))
    .map(layer => ({
      value: layer.id,
      label: layer.title || layer.id
    })) || [];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={[
          { value: "", label: placeholder || t("widgets.analysis.selectLayer") || "Select Layer" },
          ...layerOptions
        ]}
        placeholder={placeholder || t("widgets.analysis.selectLayer") || "Select Layer"}
        maxHeight={300}
      />
    </div>
  );
};

export default LayerSelector;