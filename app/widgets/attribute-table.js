import { useEffect, useRef } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import useStateStore from "../stateManager";

let featureTableWidget;
export default function AttributeTableWidgetComponent() {
  const tableRef = useRef(null);

  // Access `view` and `targetLayerId` from Zustand state
  const view = useStateStore((state) => state.view);
  const targetLayerId = useStateStore((state) => state.targetLayerId);

  useEffect(() => {
    if (!view || !targetLayerId) return;

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

    // Create or update the FeatureTable widget
    if (featureTableWidget) {
      updateFeatureTable(targetLayer, fieldConfigs);
    } else {
      featureTableWidget = new FeatureTable({
        view: view,
        layer: targetLayer,
        fieldConfigs: fieldConfigs,
        container: tableRef.current,
      });
    }

    function updateFeatureTable(layer, fieldConfigs) {
      featureTableWidget.layer = layer;
      featureTableWidget.fieldConfigs = fieldConfigs;
    }

    
  }, [view, targetLayerId]); // Re-run when view or targetLayerId changes

  return (
    <div
      ref={tableRef}
      style={{ direction: "ltr" }} // Enforce LTR direction
      className="h-full w-full"
    ></div>
  );
}
