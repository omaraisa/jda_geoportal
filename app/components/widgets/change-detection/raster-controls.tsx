import React from "react";
import { useTranslation } from "react-i18next";
import SelectDropdown from '../../ui/select-dropdown';

interface RasterControlsProps {
  raster1: string;
  raster2: string;
  onRaster1Change: (value: string) => void;
  onRaster2Change: (value: string) => void;
  imageryLayers: any[];
}

const RasterControls: React.FC<RasterControlsProps> = ({
  raster1,
  raster2,
  onRaster1Change,
  onRaster2Change,
  imageryLayers,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("widgets.changeDetection.raster1") || "Input Raster 1"}
        </label>
        <div className="select">
          <SelectDropdown
            value={raster1}
            onChange={onRaster1Change}
            options={[
              { value: "", label: t("widgets.changeDetection.selectRaster") || "Select Raster" },
              ...imageryLayers.map((layer: any) => ({ 
                value: layer.url, 
                label: layer.title || layer.id 
              }))
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("widgets.changeDetection.raster2") || "Input Raster 2"}
        </label>
        <div className="select">
          <SelectDropdown
            value={raster2}
            onChange={onRaster2Change}
            options={[
              { value: "", label: t("widgets.changeDetection.selectRaster") || "Select Raster" },
              ...imageryLayers.map((layer: any) => ({ 
                value: layer.url, 
                label: layer.title || layer.id 
              }))
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default RasterControls;
