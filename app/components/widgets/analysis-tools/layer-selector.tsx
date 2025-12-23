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
  filter?: (layer: __esri.Layer) => boolean;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({
  label,
  value,
  onChange,
  view,
  placeholder,
  filter
}) => {
  const { t } = useTranslation();

  const layerOptions = view?.map.layers.toArray()
    .filter(layer => featureBasedLayerTypes.includes(layer.type))
    .filter(layer => filter ? filter(layer) : true)
    .map(layer => ({
      value: layer.id,
      label: layer.title || layer.id
    })) || [];

  const defaultPlaceholder = t("widgets.analysis.selectLayer", { defaultValue: "Select Layer" });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={[
          { value: "", label: placeholder || defaultPlaceholder },
          ...layerOptions
        ]}
        placeholder={placeholder || defaultPlaceholder}
        maxHeight={300}
      />
    </div>
  );
};

export default LayerSelector;