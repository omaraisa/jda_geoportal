import { useEffect, useRef } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import useStateStore from "../stateManager";

let featureTableWidget; // Global reference to the FeatureTable widget

export default function AttributeTableWidgetComponent() {
  const tableRef = useRef(null);

  // Access `view` and `targetLayerId` from Zustand state
  const view = useStateStore((state) => state.view);
  const targetLayerId = useStateStore((state) => state.targetLayerId);

  useEffect(() => {
    if (!view || !targetLayerId) return;

    // Find the target layer by ID
    const targetLayer = view.map.findLayerById(targetLayerId);

    if (!targetLayer) {
      console.error(`Layer with ID ${targetLayerId} not found.`);
      return;
    }

    // Prepare fieldConfigs for the table
    const fieldConfigs = targetLayer.fields.map((field) => ({
      name: field.name,
      label: field.alias || field.name,
      visible: true,
    }));

    // Decide to update or insert the FeatureTable
    featureTableWidget
      ? updateFeatureTable(targetLayer, fieldConfigs)
      : insertFeatureTable(targetLayer, fieldConfigs);

    function updateFeatureTable(layer, fieldConfigs) {
      featureTableWidget.layer = layer;
      featureTableWidget.fieldConfigs = fieldConfigs;
    }

    function insertFeatureTable(layer, fieldConfigs) {
      featureTableWidget = new FeatureTable({
        view: view,
        layer: layer,
        fieldConfigs: fieldConfigs,
        container: tableRef.current,
      });
      featureTableWidget.render();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (featureTableWidget) {
        // featureTableWidget.destroy();
        featureTableWidget = null;
      }
    };
  }, [view, targetLayerId]); // Re-run when view or targetLayerId changes

  return (
    <div
      ref={tableRef}
      className="h-full w-full"
    ></div>
  );
}
