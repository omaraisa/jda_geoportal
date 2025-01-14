import { useEffect, useRef } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import useStateStore from "../stateManager";

let featureTableWidget; // Keep the widget as a persistent instance
export default function AttributeTableWidgetComponent() {
  const tableRef = useRef(null);

  // Access `view` and `targetLayerId` from Zustand state
  const view = useStateStore((state) => state.view);
  const targetLayerId = useStateStore((state) => state.targetLayerId);
  const bottomPaneMinimized = useStateStore((state) => state.layout.bottomPaneMinimized);

  useEffect(() => {
    if (!view || !tableRef.current) return;

    // Find the target layer by ID
    const targetLayer = targetLayerId
      ? view.map.findLayerById(targetLayerId)
      : null;

    if (!targetLayer) {
      // If no target layer, reset the widget to show nothing
      resetFeatureTable();
      return;
    }

    // Prepare fieldConfigs for the table
    const fieldConfigs = targetLayer.fields.map((field) => ({
      name: field.name,
      label: field.alias || field.name,
      visible: true,
    }));

    // Initialize or update the FeatureTable widget
    if (featureTableWidget && tableRef.current.contains(featureTableWidget.container)) {
      // Update if widget exists and container is valid
      featureTableWidget.layer = targetLayer;
      featureTableWidget.fieldConfigs = fieldConfigs;
    } else {
      // Destroy and reinitialize if container is invalid or widget doesn't exist
      if (featureTableWidget) {
        featureTableWidget.destroy();
        featureTableWidget = null;
      }
      featureTableWidget = new FeatureTable({
        view: view,
        layer: targetLayer,
        fieldConfigs: fieldConfigs,
        container: tableRef.current,
      });
    }

    function resetFeatureTable() {
      if (featureTableWidget) {
        // Reset the table by clearing its layer and field configurations
        featureTableWidget.layer = null;
        featureTableWidget.fieldConfigs = [];
      }
    }

    // Cleanup: Reset the widget without destroying it
    return () => {
      if (featureTableWidget) {
        resetFeatureTable(); // Reset the widget during unmount or dependency change
      }
    };
  }, [view, targetLayerId, bottomPaneMinimized]); // Re-run when view, targetLayerId, or bottomPaneMinimized changes

  return (
    <div
      ref={tableRef}
      style={{ direction: "ltr" }} // Enforce LTR direction
      className="h-full w-full"
    ></div>
  );
}
