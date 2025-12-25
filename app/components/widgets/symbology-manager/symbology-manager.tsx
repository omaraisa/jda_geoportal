import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector } from "../analysis-tools";
import { SymbologyService } from "./symbology-service";
import SelectDropdown from "../../ui/select-dropdown";
import TextInput from "../../ui/text-input";
import { NumberInput } from "../analysis-tools";
import Button from "../../ui/button";
import { COLOR_RAMPS, ColorRamp } from "./symbology-service";

const RENDERER_TYPES = [
  { value: "simple", label: "Simple Renderer" },
  { value: "unique-value", label: "Unique Value Renderer" },
  { value: "class-breaks", label: "Class Breaks Renderer" },
  { value: "heatmap", label: "Heatmap" },
];

const SymbologyManager: React.FC = () => {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [rendererType, setRendererType] = useState<string>("simple");
  const [fields, setFields] = useState<{ name: string; alias: string; type: string }[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([""]);
  
  // Simple Renderer State
  const [simpleColor, setSimpleColor] = useState<string>("#0078d4");
  const [simpleSize, setSimpleSize] = useState<number>(8);
  const [simpleOpacity, setSimpleOpacity] = useState<number>(1);
  const [simpleStyle, setSimpleStyle] = useState<string>("circle");
  const [outlineColor, setOutlineColor] = useState<string>("#ffffff");
  const [outlineWidth, setOutlineWidth] = useState<number>(1);

  // Unique Value State
  const [uniqueValues, setUniqueValues] = useState<{ value: any; color: string; label: string; style?: string }[]>([]);

  // Class Breaks State
  const [classBreaks, setClassBreaks] = useState<{ min: number; max: number; color: string; label: string; style?: string }[]>([]);
  const [classificationMethod, setClassificationMethod] = useState<"natural-breaks" | "equal-interval" | "quantile" | "standard-deviation">("natural-breaks");
  const [classCount, setClassCount] = useState<number>(5);
  const [selectedColorRamp, setSelectedColorRamp] = useState<string>("Blue");
  const [fieldStats, setFieldStats] = useState<any>(null);
  const [originalRenderer, setOriginalRenderer] = useState<__esri.Renderer | null>(null);

  const selectedLayer = view?.map.findLayerById(selectedLayerId) as __esri.FeatureLayer;

  useEffect(() => {
    if (selectedLayer) {
      setFields(SymbologyService.getLayerFields(selectedLayer));
      // Store original renderer
      if (selectedLayer.renderer) {
        setOriginalRenderer(SymbologyService.cloneRenderer(selectedLayer.renderer));
      }
      // Set default style based on geometry
      if (selectedLayer.geometryType === "polyline") setSimpleStyle("solid");
      else if (selectedLayer.geometryType === "polygon") setSimpleStyle("solid");
      else setSimpleStyle("circle");
    } else {
      setFields([]);
      setOriginalRenderer(null);
    }
  }, [selectedLayer]);

  // Auto-generate when field changes
  useEffect(() => {
    if (!selectedLayer || !selectedFields[0]) return;
    
    // Load field statistics
    const field = fields.find(f => f.name === selectedFields[0]);
    if (field && (field.type === "integer" || field.type === "double" || field.type === "small-integer")) {
      SymbologyService.getFieldStatistics(selectedLayer, selectedFields[0]).then(stats => {
        setFieldStats(stats);
      });
    } else {
      setFieldStats(null);
    }
    
    const timer = setTimeout(() => {
      if (rendererType === "unique-value") {
        generateUniqueValues();
      } else if (rendererType === "class-breaks") {
        generateClassBreaks();
      }
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [selectedFields, rendererType, classificationMethod, classCount]);

  const handleApply = async () => {
    if (!selectedLayer) return;

    try {
      if (rendererType === "simple") {
        await SymbologyService.applySimpleRenderer(selectedLayer, {
          color: simpleColor,
          size: simpleSize,
          opacity: simpleOpacity,
          style: simpleStyle as any,
          outlineColor: outlineColor,
          outlineWidth: outlineWidth,
        });
      } else if (rendererType === "unique-value") {
        await SymbologyService.applyUniqueValueRenderer(selectedLayer, selectedFields.filter(f => f !== ""), uniqueValues);
      } else if (rendererType === "class-breaks") {
        await SymbologyService.applyClassBreaksRenderer(selectedLayer, selectedFields[0], classBreaks);
      } else if (rendererType === "heatmap") {
        await SymbologyService.applyHeatmapRenderer(selectedLayer, selectedFields[0] || undefined);
      }
      // Force refresh layer
      const oldRenderer = selectedLayer.renderer;
      selectedLayer.renderer = oldRenderer;
    } catch (error) {
      console.error("Failed to apply symbology:", error);
    }
  };

  const handleReset = () => {
    if (selectedLayer && originalRenderer) {
      selectedLayer.renderer = SymbologyService.cloneRenderer(originalRenderer);
    }
  };

  const applyColorRampToClasses = () => {
    const ramp = COLOR_RAMPS.find(r => r.name === selectedColorRamp);
    if (!ramp || classBreaks.length === 0) return;
    
    const colors = SymbologyService.applyColorRamp(ramp, classBreaks.length);
    const newBreaks = classBreaks.map((cb, idx) => ({
      ...cb,
      color: colors[idx]
    }));
    setClassBreaks(newBreaks);
  };

  const applyColorRampToUniqueValues = () => {
    const ramp = COLOR_RAMPS.find(r => r.name === selectedColorRamp);
    if (!ramp || uniqueValues.length === 0) return;
    
    const colors = SymbologyService.applyColorRamp(ramp, uniqueValues.length);
    const newValues = uniqueValues.map((uv, idx) => ({
      ...uv,
      color: colors[idx]
    }));
    setUniqueValues(newValues);
  };

  const reverseClassBreakColors = () => {
    const colors = classBreaks.map(cb => cb.color);
    const reversed = SymbologyService.reverseColors(colors);
    const newBreaks = classBreaks.map((cb, idx) => ({
      ...cb,
      color: reversed[idx]
    }));
    setClassBreaks(newBreaks);
  };

  const reverseUniqueValueColors = () => {
    const colors = uniqueValues.map(uv => uv.color);
    const reversed = SymbologyService.reverseColors(colors);
    const newValues = uniqueValues.map((uv, idx) => ({
      ...uv,
      color: reversed[idx]
    }));
    setUniqueValues(newValues);
  };

  const generateUniqueValues = async () => {
    if (!selectedLayer || !selectedFields[0]) return;
    
    try {
      const renderer = await SymbologyService.generateUniqueValueRenderer(selectedLayer, selectedFields[0]);
      const newValues = renderer.uniqueValueInfos.map(info => ({
        value: info.value,
        color: (info.symbol as any).color ? (info.symbol as any).color.toHex() : "#cccccc",
        label: info.label || String(info.value),
        style: (info.symbol as any).style || "circle"
      }));
      setUniqueValues(newValues);
    } catch (error) {
      console.error("Error generating unique values:", error);
      // Fallback
      setUniqueValues([{ value: "", color: "#ff0000", label: "New Value" }]);
    }
  };

  const generateClassBreaks = async () => {
    if (!selectedLayer || !selectedFields[0]) return;

    try {
      const renderer = await SymbologyService.generateClassBreaksRenderer(selectedLayer, selectedFields[0], classificationMethod, classCount);
      const newBreaks = renderer.classBreakInfos.map(info => ({
        min: info.minValue,
        max: info.maxValue,
        color: (info.symbol as any).color ? (info.symbol as any).color.toHex() : "#cccccc",
        label: info.label || `${info.minValue} - ${info.maxValue}`,
        style: (info.symbol as any).style || "circle"
      }));
      setClassBreaks(newBreaks);
    } catch (error) {
      console.error("Error generating class breaks:", error);
      // Fallback
      setClassBreaks([{ min: 0, max: 100, color: "#ff0000", label: "New Class" }]);
    }
  };

  const addUniqueValue = () => {
    setUniqueValues([...uniqueValues, { value: "", color: "#" + Math.floor(Math.random()*16777215).toString(16), label: "", style: simpleStyle }]);
  };

  const addClassBreak = () => {
    setClassBreaks([...classBreaks, { min: 0, max: 100, color: "#" + Math.floor(Math.random()*16777215).toString(16), label: "", style: simpleStyle }]);
  };

  const getStyleOptions = () => {
    if (!selectedLayer) return [];
    if (selectedLayer.geometryType === "point" || selectedLayer.geometryType === "multipoint") {
      return [
        { value: "circle", label: "Circle" },
        { value: "square", label: "Square" },
        { value: "cross", label: "Cross" },
        { value: "x", label: "X" },
        { value: "diamond", label: "Diamond" },
        { value: "triangle", label: "Triangle" },
      ];
    } else if (selectedLayer.geometryType === "polyline") {
      return [
        { value: "solid", label: "Solid" },
        { value: "dash", label: "Dash" },
        { value: "dot", label: "Dot" },
        { value: "dash-dot", label: "Dash Dot" },
      ];
    } else {
      return [
        { value: "solid", label: "Solid" },
        { value: "backward-diagonal", label: "Backward Diagonal" },
        { value: "forward-diagonal", label: "Forward Diagonal" },
        { value: "diagonal-cross", label: "Diagonal Cross" },
        { value: "horizontal", label: "Horizontal" },
        { value: "vertical", label: "Vertical" },
      ];
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      
      <div className="flex flex-col gap-2">
        <LayerSelector 
          label={t("widgets.symbology.selectLayer")}
          value={selectedLayerId} 
          onChange={setSelectedLayerId} 
          view={view}
          filter={(l) => l.type === "feature"}
        />
      </div>

      {selectedLayer && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t("widgets.symbology.rendererType")}</label>
            <SelectDropdown
              options={RENDERER_TYPES}
              value={rendererType}
              onChange={(val) => setRendererType(val as string)}
            />
          </div>

          {rendererType === "simple" && (
            <div className="flex flex-col gap-3 p-3 bg-black/10 rounded-lg">
              <div className="flex items-center justify-between">
            <label className="text-sm">{t("widgets.symbology.color")}</label>
            <input 
              type="color" 
              value={simpleColor} 
              onChange={(e) => setSimpleColor(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer"
            />
              </div>
              <div className="flex flex-col gap-1">
            <label className="text-sm">{t("widgets.symbology.style") || "Style"}</label>
            <SelectDropdown
              options={getStyleOptions()}
              value={simpleStyle}
              onChange={(val) => setSimpleStyle(val as string)}
            />
              </div>
              <div className="flex flex-col gap-1">
            <label className="text-sm">{t("widgets.symbology.size")}</label>
            <NumberInput 
              label=""
              value={simpleSize} 
              onChange={setSimpleSize} 
              min={1} 
              max={50} 
            />
              </div>
              <div className="flex flex-col gap-1">
            <label className="text-sm">{t("widgets.symbology.opacity")} ({simpleOpacity})</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={simpleOpacity} 
              onChange={(e) => setSimpleOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
              </div>
              {(selectedLayer?.geometryType === "point" || selectedLayer?.geometryType === "polygon") && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">{t("widgets.symbology.outlineColor") || "Outline Color"}</label>
                    <input 
                      type="color" 
                      value={outlineColor} 
                      onChange={(e) => setOutlineColor(e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">{t("widgets.symbology.outlineWidth") || "Outline Width"}</label>
                    <NumberInput 
                      label=""
                      value={outlineWidth} 
                      onChange={setOutlineWidth} 
                      min={0} 
                      max={10} 
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {rendererType === "heatmap" && (
            <div className="flex flex-col gap-3 p-3 bg-black/10 rounded-lg">
              <p className="text-xs opacity-70">{t("widgets.symbology.heatmapInfo") || "Heatmap visualizes point density with a smooth color gradient. Optionally select a field to weight the intensity."}</p>
              {fields.filter(f => f.type === "integer" || f.type === "double").length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm">{t("widgets.symbology.weightField") || "Weight Field (Optional)"}</label>
                  <SelectDropdown
                    options={[
                      { value: "", label: "None" },
                      ...fields.filter(f => f.type === "integer" || f.type === "double").map(f => ({ value: f.name, label: f.alias || f.name }))
                    ]}
                    value={selectedFields[0] || ""}
                    onChange={(val) => setSelectedFields([val as string])}
                  />
                </div>
              )}
            </div>
          )}

          {(rendererType === "unique-value" || rendererType === "class-breaks") && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("widgets.symbology.selectField")}</label>
              {rendererType === "unique-value" ? (
                <div className="flex flex-col gap-2">
                  {selectedFields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <SelectDropdown
                        options={[{ value: "", label: "None" }, ...fields.map(f => ({ value: f.name, label: f.alias || f.name }))]}
                        value={field}
                        onChange={(val) => {
                          const newFields = [...selectedFields];
                          newFields[idx] = val as string;
                          setSelectedFields(newFields);
                        }}
                      />
                      {idx > 0 && (
                        <button onClick={() => setSelectedFields(selectedFields.filter((_, i) => i !== idx))} className="text-red-500">×</button>
                      )}
                    </div>
                  ))}
                  {selectedFields.length < 3 && (
                    <Button onClick={() => setSelectedFields([...selectedFields, ""])} variant="secondary" className="w-fit">+ Add Field</Button>
                  )}
                </div>
              ) : (
                <SelectDropdown
                  options={fields.filter(f => 
                    f.type === "integer" || f.type === "double" || f.type === "small-integer" || f.type === "single"
                  ).map(f => ({ value: f.name, label: f.alias || f.name }))}
                  value={selectedFields[0]}
                  onChange={(val) => setSelectedFields([val as string])}
                />
              )}
            </div>
          )}

          {rendererType === "unique-value" && selectedFields.some(f => f !== "") && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 mb-2 p-2 bg-black/5 rounded">
                <label className="text-sm font-medium">{t("widgets.symbology.colorScheme") || "Color Scheme"}</label>
                <div className="flex gap-2">
                  <SelectDropdown
                    options={COLOR_RAMPS.map(r => ({ value: r.name, label: r.name }))}
                    value={selectedColorRamp}
                    onChange={(val) => setSelectedColorRamp(val as string)}
                  />
                  <Button onClick={applyColorRampToUniqueValues} variant="secondary" className="w-fit text-xs px-2">Apply</Button>
                  <Button onClick={reverseUniqueValueColors} variant="secondary" className="w-fit text-xs px-2">⇅</Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">{t("widgets.symbology.values")}</label>
                <div className="flex gap-2">
                  <Button onClick={generateUniqueValues} variant="primary" className="w-fit text-xs px-2 py-1">Generate</Button>
                  <Button onClick={addUniqueValue} variant="secondary" className="w-fit px-2">+</Button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                {uniqueValues.map((uv, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-black/5 p-2 rounded">
                    <TextInput 
                      id={`uv-${idx}`}
                      placeholder="Value"
                      value={uv.value} 
                      onChange={(val) => {
                        const newValues = [...uniqueValues];
                        newValues[idx].value = val;
                        setUniqueValues(newValues);
                      }}
                      className="flex-1"
                    />
                    <input 
                      type="color" 
                      value={uv.color} 
                      onChange={(e) => {
                        const newValues = [...uniqueValues];
                        newValues[idx].color = e.target.value;
                        setUniqueValues(newValues);
                      }}
                      className="w-8 h-6"
                    />
                    {/* Style Selector for UV */}
                    <select
                      value={uv.style || "circle"}
                      onChange={(e) => {
                        const newValues = [...uniqueValues];
                        newValues[idx].style = e.target.value;
                        setUniqueValues(newValues);
                      }}
                      className="w-20 text-xs bg-transparent border-b border-white/20"
                    >
                      {getStyleOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setUniqueValues(uniqueValues.filter((_, i) => i !== idx))}
                      className="text-red-500 px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rendererType === "class-breaks" && selectedFields[0] && (
            <div className="flex flex-col gap-2">
              {fieldStats && (
                <div className="p-2 bg-blue-500/10 rounded text-xs">
                  <div className="font-medium mb-1">{t("widgets.symbology.fieldStatistics") || "Field Statistics"}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <span>Min: {fieldStats.min?.toFixed(2)}</span>
                    <span>Max: {fieldStats.max?.toFixed(2)}</span>
                    <span>Avg: {fieldStats.avg?.toFixed(2)}</span>
                    <span>Count: {fieldStats.count}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 mb-2 p-2 bg-black/5 rounded">
                <label className="text-sm font-medium">{t("widgets.symbology.colorScheme") || "Color Scheme"}</label>
                <div className="flex gap-2">
                  <SelectDropdown
                    options={COLOR_RAMPS.map(r => ({ value: r.name, label: r.name }))}
                    value={selectedColorRamp}
                    onChange={(val) => setSelectedColorRamp(val as string)}
                  />
                  <Button onClick={applyColorRampToClasses} variant="secondary" className="w-fit text-xs px-2">Apply</Button>
                  <Button onClick={reverseClassBreakColors} variant="secondary" className="w-fit text-xs px-2">⇅</Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-2 p-2 bg-black/5 rounded">
                <label className="text-sm font-medium">{t("widgets.symbology.classification") || "Classification"}</label>
                <SelectDropdown
                  options={[
                    { value: "natural-breaks", label: "Natural Breaks" },
                    { value: "equal-interval", label: "Equal Interval" },
                    { value: "quantile", label: "Quantile" },
                    { value: "standard-deviation", label: "Standard Deviation" },
                  ]}
                  value={classificationMethod}
                  onChange={(val) => setClassificationMethod(val as any)}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm">Classes:</label>
                  <NumberInput 
                    label=""
                    value={classCount} 
                    onChange={setClassCount} 
                    min={2} 
                    max={10} 
                  />
                </div>
                <Button onClick={generateClassBreaks} variant="primary" className="w-full text-xs">Generate Breaks</Button>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">{t("widgets.symbology.breaks")}</label>
                <Button onClick={addClassBreak} variant="secondary" className="w-fit px-2">+</Button>
              </div>
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                {classBreaks.map((cb, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-black/5 p-2 rounded">
                    <div className="flex gap-2 items-center">
                      <NumberInput 
                        label=""
                        value={cb.min} 
                        onChange={(val) => {
                          const newBreaks = [...classBreaks];
                          newBreaks[idx].min = val;
                          setClassBreaks(newBreaks);
                        }}
                      />
                      <span>-</span>
                      <NumberInput 
                        label=""
                        value={cb.max} 
                        onChange={(val) => {
                          const newBreaks = [...classBreaks];
                          newBreaks[idx].max = val;
                          setClassBreaks(newBreaks);
                        }}
                      />
                      <input 
                        type="color" 
                        value={cb.color} 
                        onChange={(e) => {
                          const newBreaks = [...classBreaks];
                          newBreaks[idx].color = e.target.value;
                          setClassBreaks(newBreaks);
                        }}
                        className="w-8 h-6"
                      />
                      {/* Style Selector for CB */}
                      <select
                        value={cb.style || "circle"}
                        onChange={(e) => {
                          const newBreaks = [...classBreaks];
                          newBreaks[idx].style = e.target.value;
                          setClassBreaks(newBreaks);
                        }}
                        className="w-20 text-xs bg-transparent border-b border-white/20"
                      >
                        {getStyleOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setClassBreaks(classBreaks.filter((_, i) => i !== idx))}
                        className="text-red-500 px-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={handleApply} 
              className="w-full"
              disabled={!selectedLayer || (rendererType !== "simple" && rendererType !== "heatmap" && !selectedFields.some(f => f !== ""))}
            >
              {t("widgets.symbology.apply")}
            </Button>
            <Button 
              onClick={handleReset} 
              variant="secondary"
              className="w-full"
              disabled={!originalRenderer}
            >
              {t("widgets.symbology.reset") || "Reset"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SymbologyManager;
