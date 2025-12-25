import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, NumberInput } from "./analysis-tools";
import { LabelingService } from "./LabelingService";
import SelectDropdown from "../ui/select-dropdown";
import Button from "../ui/button";

const FONT_FAMILIES = [
  { value: "arial", label: "Arial" },
  { value: "arial-black", label: "Arial Black" },
  { value: "comic-sans-ms", label: "Comic Sans MS" },
  { value: "courier-new", label: "Courier New" },
  { value: "georgia", label: "Georgia" },
  { value: "impact", label: "Impact" },
  { value: "lucida-console", label: "Lucida Console" },
  { value: "palatino-linotype", label: "Palatino Linotype" },
  { value: "tahoma", label: "Tahoma" },
  { value: "times-new-roman", label: "Times New Roman" },
  { value: "trebuchet-ms", label: "Trebuchet MS" },
  { value: "verdana", label: "Verdana" }
];

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
      // Initialize state from layer if possible, or defaults
      setEnabled(selectedLayer.labelsVisible);
      
      // Try to read existing labeling info
      if (selectedLayer.labelingInfo && selectedLayer.labelingInfo.length > 0) {
        const info = selectedLayer.labelingInfo[0] as __esri.LabelClass;
        // Parse expression to get field
        const match = info.labelExpressionInfo?.expression?.match(/\$feature\["(.+)"\]/);
        if (match && match[1]) setSelectedField(match[1]);
        
        const symbol = info.symbol as __esri.TextSymbol;
        if (symbol) {
            setFontColor(symbol.color?.toHex() || "#000000");
            setHaloColor(symbol.haloColor?.toHex() || "#ffffff");
            setHaloSize(symbol.haloSize || 0);
            if (symbol.font) {
                setFontFamily(symbol.font.family || "arial");
                setFontSize(symbol.font.size || 10);
                setFontWeight(symbol.font.weight as "normal" | "bold" || "normal");
            }
        }
        setPlacement((info as any).labelPlacement || "above-center");
        setMinScale(info.minScale || 0);
        setMaxScale(info.maxScale || 0);
      }
    } else {
      setFields([]);
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

  const getPlacementOptions = () => {
    if (!selectedLayer) return [];
    const type = selectedLayer.geometryType;
    
    if (type === "point" || type === "multipoint") {
      return [
        { value: "above-center", label: "Above Center" },
        { value: "above-left", label: "Above Left" },
        { value: "above-right", label: "Above Right" },
        { value: "below-center", label: "Below Center" },
        { value: "below-left", label: "Below Left" },
        { value: "below-right", label: "Below Right" },
        { value: "center-center", label: "Center" },
        { value: "center-left", label: "Center Left" },
        { value: "center-right", label: "Center Right" },
      ];
    } else if (type === "polyline") {
      return [
        { value: "above-along", label: "Above Along" },
        { value: "below-along", label: "Below Along" },
        { value: "center-along", label: "Center Along" },
        { value: "above-start", label: "Above Start" },
        { value: "above-end", label: "Above End" },
      ];
    } else {
      return [
        { value: "always-horizontal", label: "Always Horizontal" },
      ];
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">Labeling Manager</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t("widgets.symbology.selectLayer") || "Select Layer"}</label>
        <LayerSelector 
          label={t("widgets.symbology.selectLayer") || "Select Layer"}
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
                className="w-4 h-4"
            />
            <label className="text-sm font-medium">Enable Labeling</label>
          </div>

          {enabled && (
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Label Field</label>
                    <SelectDropdown
                        options={fields.map(f => ({ value: f.name, label: f.alias || f.name }))}
                        value={selectedField}
                        onChange={(val) => setSelectedField(val as string)}
                    />
                </div>

                <div className="flex flex-col gap-3 p-3 bg-black/10 rounded-lg">
                    <label className="text-sm font-bold">Font Settings</label>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Font Family</label>
                        <SelectDropdown
                            options={FONT_FAMILIES}
                            value={fontFamily}
                            onChange={(val) => setFontFamily(val as string)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-sm">Size</label>
                            <NumberInput 
                                label=""
                                value={fontSize} 
                                onChange={setFontSize} 
                                min={1} 
                                max={100} 
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-sm">Weight</label>
                            <SelectDropdown
                                options={[{ value: "normal", label: "Normal" }, { value: "bold", label: "Bold" }]}
                                value={fontWeight}
                                onChange={(val) => setFontWeight(val as any)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm">Color</label>
                        <input 
                            type="color" 
                            value={fontColor} 
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 p-3 bg-black/10 rounded-lg">
                    <label className="text-sm font-bold">Halo Settings</label>
                    <div className="flex items-center justify-between">
                        <label className="text-sm">Color</label>
                        <input 
                            type="color" 
                            value={haloColor} 
                            onChange={(e) => setHaloColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Size</label>
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
                    <label className="text-sm font-medium">Placement</label>
                    <SelectDropdown
                        options={getPlacementOptions()}
                        value={placement}
                        onChange={(val) => setPlacement(val as string)}
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm">Min Scale (0 = None)</label>
                        <NumberInput 
                            label=""
                            value={minScale} 
                            onChange={setMinScale} 
                            min={0} 
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm">Max Scale (0 = None)</label>
                        <NumberInput 
                            label=""
                            value={maxScale} 
                            onChange={setMaxScale} 
                            min={0} 
                        />
                    </div>
                </div>
            </div>
          )}

          <Button 
            onClick={handleApply} 
            className="mt-4 w-full"
            disabled={!selectedLayer || (enabled && !selectedField)}
          >
            Apply Labels
          </Button>
        </>
      )}
    </div>
  );
};

export default LabelingManager;
