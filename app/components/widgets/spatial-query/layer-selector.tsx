"use client";

import { useTranslation } from "react-i18next";
import { featureBasedLayerTypes } from "@/lib/global-constants";

interface LayerSelectorProps {
  view: any;
  targetLayerRef: React.RefObject<HTMLSelectElement | null>;
  selectionLayerRef: React.RefObject<HTMLSelectElement | null>;
  selectionMethodChecked: boolean;
}

export default function LayerSelector({
  view,
  targetLayerRef,
  selectionLayerRef,
  selectionMethodChecked
}: LayerSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-2 w-full">
      <label htmlFor="targetLayer" className="font-semibold text-foreground">
        {t("widgets.query.selectLayer")}
      </label>

      <div className="select">
        <select ref={targetLayerRef} id="targetLayer">
          <option value="" hidden>
            {t("widgets.query.selectLayer")}
          </option>
          {view?.map.layers.toArray().map((layer: any, index: number) => {
            if (featureBasedLayerTypes.includes(layer.type)) {
              return (
                <option key={layer.id} value={index}>
                  {layer.title}
                </option>
              );
            }
          })}
        </select>
      </div>

      {!selectionMethodChecked && (
        <div className="flex flex-col w-full space-y-2">
          <label htmlFor="selectionLayer" className="font-semibold text-foreground">
            {t("widgets.query.selectionLayer")}
          </label>

          <div className="select">
            <select ref={selectionLayerRef} id="selectionLayer">
              <option value="" hidden>
                {t("widgets.query.select")}
              </option>
              {view?.map.layers.toArray().map((layer: any, index: number) => {
                if (featureBasedLayerTypes.includes(layer.type)) {
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
      )}
    </div>
  );
}
