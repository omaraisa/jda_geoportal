import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, NumberInput } from "../analysis-tools";
import { LabelingService, FONT_FAMILIES } from "./labeling-service";
import SelectDropdown from "../../ui/select-dropdown";
import Button from "../../ui/button";

const LabelingManager: React.FC = () => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [fields, setFields] = useState<{ name: string; alias: string; type: string }[]>([]);
  
  // Labeling State
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedField, setSelectedField] = useState<string>("");
  const [fontFamily, setFontFamily] = useState<string>("arial");
  const [fontSize, setFontSize] = useState<number>(10);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontColor, setFontColor] = useState<string>("#000000");
  const [haloColor, setHaloColor] = useState<string>("#ffffff");
  const [haloSize, setHaloSize] = useState<number>(1);
  const [placement, setPlacement] = useState<string>("above-center");
  const [minScale, setMinScale] = useState<number>(0);
  const [maxScale, setMaxScale] = useState<number>(0);

  const selectedLayer = view?.map.findLayerById(selectedLayerId) as __esri.FeatureLayer;

  useEffect(() => {
    if (selectedLayer) {
      setFields(LabelingService.getLayerFields(selectedLayer));
      
      // Initialize state from layer if possible
      setEnabled(selectedLayer.labelsVisible);
      
      // Try to read existing labeling info
      const existingConfig = LabelingService.getExistingLabelConfig(selectedLayer);
      if (existingConfig) {
        if (existingConfig.field) setSelectedField(existingConfig.field);
        if (existingConfig.font) {
          setFontFamily(existingConfig.font.family);
          setFontSize(existingConfig.font.size);
          setFontWeight(existingConfig.font.weight);
          setFontColor(existingConfig.font.color);
        }
        if (existingConfig.halo) {
          setHaloColor(existingConfig.halo.color);
          setHaloSize(existingConfig.halo.size);
        }
        if (existingConfig.placement) setPlacement(existingConfig.placement);
        if (existingConfig.minScale !== undefined) setMinScale(existingConfig.minScale);
        if (existingConfig.maxScale !== undefined) setMaxScale(existingConfig.maxScale);
      } else {
        // Reset to defaults
        setSelectedField("");
        setFontFamily("arial");
        setFontSize(10);
        setFontWeight("normal");
        setFontColor("#000000");
        setHaloColor("#ffffff");
        setHaloSize(1);
        setPlacement("above-center");
        setMinScale(0);
        setMaxScale(0);
      }
    } else {
      setFields([]);
      setEnabled(false);
    }
  }, [selectedLayer]);

  const handleApply = async () => {
    if (!selectedLayer) return;

    try {
      await LabelingService.applyLabeling(selectedLayer, {
        enabled,
        field: selectedField,
        font: {
          family: fontFamily,
          size: fontSize,
          weight: fontWeight,
          color: fontColor
        },
        halo: {
          color: haloColor,
          size: haloSize
        },
        placement,
        minScale,
        maxScale
      });
    } catch (error) {
      console.error("Failed to apply labeling:", error);
    }
  };

  const handleClear = () => {
    if (!selectedLayer) return;
    LabelingService.clearLabels(selectedLayer);
    setEnabled(false);
  };

  const placementOptions = selectedLayer 
    ? LabelingService.getPlacementOptions(selectedLayer.geometryType)
    : [];

  return (
    <div className="p-4 flex flex-col gap-4">
      
      <div className="flex flex-col gap-2">
        <LayerSelector 
          label={t("widgets.labeling.selectLayer") || "Select Layer"}
          value={selectedLayerId} 
          onChange={setSelectedLayerId} 
          view={view}
          filter={(l) => l.type === "feature"}
        />
      </div>

      {selectedLayer && (
        <>
          <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
            />
            <label className="text-sm font-medium">{t("widgets.labeling.enableLabeling") || "Enable Labeling"}</label>
          </div>

          {enabled && (
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("widgets.labeling.labelField") || "Label Field"}</label>
                    <SelectDropdown
                        options={fields.map(f => ({ value: f.name, label: f.alias || f.name }))}
                        value={selectedField}
                        onChange={(val) => setSelectedField(val as string)}
                        placeholder={t("widgets.labeling.selectField") || "Select a field"}
                    />
                </div>

                <div className="flex flex-col gap-3 p-3 bg-black/10 dark:bg-white/10 rounded-lg">
                    <label className="text-sm font-bold">{t("widgets.labeling.fontSettings") || "Font Settings"}</label>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">{t("widgets.labeling.fontFamily") || "Font Family"}</label>
                        <SelectDropdown
                            options={FONT_FAMILIES}
                            value={fontFamily}
                            onChange={(val) => setFontFamily(val as string)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-sm">{t("widgets.labeling.fontSize") || "Size"}</label>
                            <NumberInput 
                                label=""
                                value={fontSize} 
                                onChange={setFontSize} 
                                min={1} 
                                max={100} 
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-sm">{t("widgets.labeling.fontWeight") || "Weight"}</label>
                            <SelectDropdown
                                options={[
                                    { value: "normal", label: t("widgets.labeling.normal") || "Normal" }, 
                                    { value: "bold", label: t("widgets.labeling.bold") || "Bold" }
                                ]}
                                value={fontWeight}
                                onChange={(val) => setFontWeight(val as any)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm">{t("widgets.labeling.fontColor") || "Color"}</label>
                        <input 
                            type="color" 
                            value={fontColor} 
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 p-3 bg-black/10 dark:bg-white/10 rounded-lg">
                    <label className="text-sm font-bold">{t("widgets.labeling.haloSettings") || "Halo Settings"}</label>
                    <div className="flex items-center justify-between">
                        <label className="text-sm">{t("widgets.labeling.haloColor") || "Color"}</label>
                        <input 
                            type="color" 
                            value={haloColor} 
                            onChange={(e) => setHaloColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">{t("widgets.labeling.haloSize") || "Size"}</label>
                        <NumberInput 
                            label=""
                            value={haloSize} 
                            onChange={setHaloSize} 
                            min={0} 
                            max={20} 
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("widgets.labeling.placement") || "Placement"}</label>
                    <SelectDropdown
                        options={placementOptions}
                        value={placement}
                        onChange={(val) => setPlacement(val as string)}
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm">{t("widgets.labeling.minScale") || "Min Scale"}</label>
                        <NumberInput 
                            label=""
                            value={minScale} 
                            onChange={setMinScale} 
                            min={0} 
                            placeholder="0 = None"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm">{t("widgets.labeling.maxScale") || "Max Scale"}</label>
                        <NumberInput 
                            label=""
                            value={maxScale} 
                            onChange={setMaxScale} 
                            min={0} 
                            placeholder="0 = None"
                        />
                    </div>
                </div>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={handleApply} 
              className="w-full"
              disabled={!selectedLayer || (enabled && !selectedField)}
            >
              {t("widgets.labeling.applyLabels") || "Apply Labels"}
            </Button>
            
            <Button 
              onClick={handleClear} 
              className="w-full"
              disabled={!selectedLayer}
            >
              {t("widgets.labeling.clearLabels") || "Clear Labels"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default LabelingManager;
