import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { LayerSelector, AnalysisControls } from "../analysis-tools";
import { SpatialRelationshipsService, SpatialRelationship, RelationshipResult } from "./spatial-relationships-service";
import OutputLayerList from "../analysis-tools/output-layer-list";

const SPATIAL_RELATIONSHIPS: Array<{ value: SpatialRelationship; label: string; description: string }> = [
  {
    value: "intersects",
    label: "Intersects",
    description: "Features that share any portion of space"
  },
  {
    value: "within",
    label: "Within",
    description: "Features from Layer 1 completely inside Layer 2"
  },
  {
    value: "contains",
    label: "Contains",
    description: "Features from Layer 1 that completely contain Layer 2"
  },
  {
    value: "touches",
    label: "Touches",
    description: "Features that touch at a single point or along an edge"
  },
  {
    value: "crosses",
    label: "Crosses",
    description: "Features that cross each other"
  },
  {
    value: "overlaps",
    label: "Overlaps",
    description: "Features that overlap in space"
  },
  {
    value: "equals",
    label: "Equals",
    description: "Features that are spatially identical"
  }
];

const SpatialRelationships: React.FC = () => {
  const { t } = useTranslation();
  const updateStats = useStateStore((state) => state.updateStats);
  const view = useStateStore((state) => state.targetView);

  const [layer1Id, setLayer1Id] = useState<string>("");
  const [layer2Id, setLayer2Id] = useState<string>("");
  const [relationship, setRelationship] = useState<SpatialRelationship>("intersects");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [outputLayers, setOutputLayers] = useState<__esri.Layer[]>([]);

  // Get the selected layers
  const layer1 = view?.map.findLayerById(layer1Id) as __esri.FeatureLayer | __esri.GraphicsLayer;
  const layer2 = view?.map.findLayerById(layer2Id) as __esri.FeatureLayer | __esri.GraphicsLayer;

  const handleRun = async () => {
    if (!layer1 || !layer2) {
      setStatusType("error");
      setStatus(t("widgets.spatialRelationships.errors.noLayers") || "Please select both input layers");
      return;
    }

    if (layer1Id === layer2Id) {
      setStatusType("error");
      setStatus(t("widgets.spatialRelationships.errors.sameLayer") || "Please select different layers");
      return;
    }

    setIsRunning(true);
    setStatusType("info");
    setStatus(t("widgets.spatialRelationships.status.running") || `Checking ${relationship} relationships...`);

    try {
      const analysisResult = await SpatialRelationshipsService.runSpatialRelationshipsAnalysis(
        layer1,
        layer2,
        relationship
      );

      setResult(analysisResult.result);
      setOutputLayers(prev => [analysisResult.resultLayer, ...prev]);

      setStatusType("success");
      setStatus(t("widgets.spatialRelationships.status.success") || `Spatial relationship check completed successfully`);
      updateStats("Spatial Relationships Analysis");
    } catch (error: any) {
      setStatusType("error");
      setStatus(error.message || `Spatial relationship check failed`);
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleVisibility = (layer: __esri.Layer) => {
    layer.visible = !layer.visible;
    setOutputLayers([...outputLayers]);
  };

  const handleRename = (layer: __esri.Layer, newName: string) => {
    layer.title = newName;
    setOutputLayers([...outputLayers]);
  };

  const handleDelete = (layer: __esri.Layer) => {
    if (view) {
        view.map.remove(layer);
    }
    setOutputLayers(outputLayers.filter(l => l.id !== layer.id));
  };

  const handleZoomTo = (layer: __esri.Layer) => {
    if (view) {
        view.goTo(layer.fullExtent);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="font-semibold text-lg mb-2">
        {t("widgets.spatialRelationships.title") || "Spatial Relationships"}
      </h2>

      <LayerSelector
        label={t("widgets.spatialRelationships.layer1") || "Layer 1"}
        value={layer1Id}
        onChange={setLayer1Id}
        view={view}
      />

      <LayerSelector
        label={t("widgets.spatialRelationships.layer2") || "Layer 2"}
        value={layer2Id}
        onChange={setLayer2Id}
        view={view}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("widgets.spatialRelationships.relationship") || "Spatial Relationship"}
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as SpatialRelationship)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {SPATIAL_RELATIONSHIPS.map((rel) => (
            <option key={rel.value} value={rel.value}>
              {rel.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-600">
        {SPATIAL_RELATIONSHIPS.find(rel => rel.value === relationship)?.description}
      </div>

      <AnalysisControls
        onRun={handleRun}
        status={status}
        statusType={statusType}
        isRunning={isRunning}
      />

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold text-md mb-2">
            {t("widgets.spatialRelationships.results") || "Results"}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="font-medium capitalize">{result.relationship}:</span>
              <span className="text-blue-600 font-mono">
                {result.count} {t("widgets.spatialRelationships.features") || "features"}
              </span>
            </div>
          </div>
        </div>
      )}

      <OutputLayerList 
        layers={outputLayers}
        onToggleVisibility={handleToggleVisibility}
        onRename={handleRename}
        onDelete={handleDelete}
        onZoomTo={handleZoomTo}
      />
    </div>
  );
};

export default SpatialRelationships;