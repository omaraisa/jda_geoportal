import { useEffect, useRef } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import TableTemplate from "@arcgis/core/widgets/FeatureTable/support/TableTemplate";
import FieldColumnTemplate from "@arcgis/core/widgets/FeatureTable/support/FieldColumnTemplate";
import useStateStore from "@/stateStore";

let featureTableWidget: FeatureTable | null;

export default function FeatureTableComponent() {
  const tableRef = useRef<HTMLDivElement>(null);

  const view = useStateStore((state) => state.targetView);
  const targetLayerId = useStateStore((state) => state.targetLayerId);
  const addWidget = useStateStore((state) => state.addWidget);
  const bottomPaneOpen = useStateStore((state) => state.layout.bottomPaneOpen);

  useEffect(() => {
    if (!view || !tableRef.current) return;

    const targetLayer = targetLayerId
      ? (view.map.findLayerById(targetLayerId) as __esri.FeatureLayer)
      : null;

    if (!targetLayer) {
      return;
    }

    const columnTemplates = targetLayer.fields.map((field, index) => {
      return {
        type: "field",
        fieldName: field.name,
        label: field.alias || field.name,
        direction: "asc",
        initialSortPriority: index,
      } as FieldColumnTemplate;
    });

    const tableTemplate = new TableTemplate({
      columnTemplates: columnTemplates,
    });

    if (
      featureTableWidget &&
      featureTableWidget.container instanceof HTMLElement &&
      tableRef.current.contains(featureTableWidget.container)
    ) {
      featureTableWidget.layer = targetLayer;
      featureTableWidget.tableTemplate = tableTemplate;
    } else {
      if (featureTableWidget) {
        featureTableWidget.destroy();
        featureTableWidget = null;
      }
      featureTableWidget = new FeatureTable({
        view: view,
        layer: targetLayer,
        tableTemplate: tableTemplate,
        container: tableRef.current,
      });
      addWidget("featureTableWidget", featureTableWidget);
    }

    return () => {
      // Widget destruction is disabled to preserve state.
      // Uncomment to enable cleanup:
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
