import { useEffect, useRef } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import TableTemplate from "@arcgis/core/widgets/FeatureTable/support/TableTemplate"; // Correct import
import FieldColumnTemplate from "@arcgis/core/widgets/FeatureTable/support/FieldColumnTemplate"; // Correct import
import useStateStore from "@/stateStore";

let featureTableWidget: FeatureTable | null; // Keep the widget as a persistent instance

export default function FeatureTableComponent() {
  const tableRef = useRef<HTMLDivElement>(null);

  // Access `view` and `targetLayerId` from Zustand state
  const view = useStateStore((state) => state.targetView);
  const targetLayerId = useStateStore((state) => state.targetLayerId);
  const addWidget = useStateStore((state) => state.addWidget);
  const bottomPaneOpen = useStateStore((state) => state.layout.bottomPaneOpen);

  useEffect(() => {
    if (!view || !tableRef.current) return;

    // Find the target layer by ID
    const targetLayer = targetLayerId
      ? (view.map.findLayerById(targetLayerId) as __esri.FeatureLayer)
      : null;

    if (!targetLayer) {
      // If no target layer, reset the widget to show nothing
      return;
    }

    // Prepare column templates for the table
    const columnTemplates = targetLayer.fields.map((field, index) => {
      return {
        type: "field", // Always set the type to "field"
        fieldName: field.name,
        label: field.alias || field.name,
        direction: "asc", // You can customize sorting as needed
        initialSortPriority: index, // Set the priority based on index or other criteria
      } as FieldColumnTemplate;
    });

    // Create the TableTemplate with the column templates
    const tableTemplate = new TableTemplate({
      columnTemplates: columnTemplates, // Correct property name
    });

    // Initialize or update the FeatureTable widget
    if (
      featureTableWidget &&
      featureTableWidget.container instanceof HTMLElement &&
      tableRef.current.contains(featureTableWidget.container)
    ) {
      // Update if widget exists and container is valid
      featureTableWidget.layer = targetLayer;
      featureTableWidget.tableTemplate = tableTemplate; // Assign the tableTemplate
    } else {
      // Destroy and reinitialize if container is invalid or widget doesn't exist
      if (featureTableWidget) {
        featureTableWidget.destroy();
        featureTableWidget = null;
      }
      featureTableWidget = new FeatureTable({
        view: view,
        layer: targetLayer,
        tableTemplate: tableTemplate, // Use the new tableTemplate
        container: tableRef.current,
      });
      addWidget("featureTableWidget", featureTableWidget);
    }

    return () => {
     // Widget destruction is disabled to preserve state. Uncomment to enable cleanup:
        // featureTableWidget.destroy();
        // featureTableWidget = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, targetLayerId, bottomPaneOpen]);

  return (
    <div
      ref={tableRef}
      className="h-full w-full"
    ></div>
  );
}