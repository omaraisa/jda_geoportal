import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { featureBasedLayerTypes } from "@/lib/globalConstants";

interface LayerSelectorProps {
  getSelectedValue: (layerId: string) => void;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ getSelectedValue }) => {
  const layerSelector = useRef<HTMLSelectElement>(null);
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);

  const handleChange = useCallback(() => {
    const selectedLayerId = layerSelector.current?.value || "";
    getSelectedValue(selectedLayerId);
  }, [ getSelectedValue]);

  return (
    <div className="flex flex-col w-full">
      <label htmlFor="layerSelector" className="font-semibold text-white">
        {t("widgets.query.selectLayer")}
      </label>
      <div className="select">
        <select
          defaultValue=""
          ref={layerSelector}
          id="layerSelector"
          onChange={handleChange}
        >
          <option value="" hidden>
            {t("widgets.query.select")}
          </option>
          {view?.map.layers.toArray().map((layer) => 
            featureBasedLayerTypes.includes(layer.type) ? (
              <option key={layer.id} value={layer.id}>
                {layer.title}
              </option>
            ) : null
          )}
        </select>
      </div>
    </div>
  );
};

export default LayerSelector;
