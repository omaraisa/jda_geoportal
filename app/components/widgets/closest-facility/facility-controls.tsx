"use client";

import { useTranslation } from "react-i18next";

interface FacilityControlsProps {
  targetLayerId: string;
  numFacilities: number;
  layers: any[];
  onLayerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNumFacilitiesChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function FacilityControls({
  targetLayerId,
  numFacilities,
  layers,
  onLayerChange,
  onNumFacilitiesChange
}: FacilityControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <label className="font-semibold mb-1 block">
          {t("widgets.closestFacility.targetLayer")}
        </label>
        <div className="select">
          <select
            className="input-select w-full"
            value={targetLayerId}
            onChange={onLayerChange}
          >
            <option value="">{t("widgets.closestFacility.selectLayer")}</option>
            {layers.map((layer: any) => (
              <option key={layer.id} value={layer.id}>
                {layer.title || layer.name || layer.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="font-semibold mb-1 block">
          {t("widgets.closestFacility.numFacilities")}
        </label>
        <div className="select">
          <select
            className="input-select w-full"
            value={numFacilities}
            onChange={onNumFacilitiesChange}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
