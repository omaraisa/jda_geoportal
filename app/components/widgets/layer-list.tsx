import { useEffect, useRef } from "react";
import LayerList from "@arcgis/core/widgets/LayerList";
import useStateStore from "@/stateManager";
import { useTranslation } from "react-i18next";

export default function LayerListComponent() {
  const { t } = useTranslation();
  const layerListRef = useRef(null);
  const view = useStateStore((state) => state.targetView);
  const setActiveBottomPane = useStateStore((state) => state.setActiveBottomPane);
  
  const setTargetLayerId = useStateStore((state) => state.setTargetLayerId);
  const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);

  const layerListWidget = useRef<LayerList | null>(null); // Persist LayerList widget
  let triggerActionHandler: { remove: () => void; }; // Reference to the event handler

  useEffect(() => {
    if (!view) return;

    if (layerListWidget.current) {
      layerListWidget.current.view = view;
    } else {
      layerListWidget.current = new LayerList({
        view: view,
        container: layerListRef.current || undefined,
        listItemCreatedFunction: (event) => {
          const item = event.item;
          item.actionsSections = [
            [
              {
                title: t("layerList.showHideLabels"),
                className: "esri-icon-labels",
                id: "toggle-labels",
              },
              {
                title: t("layerList.showAttributeTable"),
                className: "esri-icon-table",
                id: "show-attribute-table",
              },
              {
                title: t("layerList.zoomToLayer"),
                className: "esri-icon-zoom-out-fixed",
                id: "zoom-to-layer",
              },
              {
                title: t("layerList.moveLayerUp"),
                className: "esri-icon-up",
                id: "move-layer-up",
              },
              {
                title: t("layerList.moveLayerDown"),
                className: "esri-icon-down",
                id: "move-layer-down",
              },
              {
                title: t("layerList.removeLayer"),
                className: "esri-icon-close",
                id: "remove-layer",
              },
            ],
          ];
        },
      });
    }

    // Remove existing event handler if it exists
    if (triggerActionHandler) {
      triggerActionHandler.remove();
    }

    // Add a new event handler and store the reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    triggerActionHandler = layerListWidget.current.on("trigger-action", (event) => {
      const layer = event.item.layer;
      switch (event.action.id) {
        case "zoom-to-layer":
          view.goTo(layer.fullExtent).catch((error) => console.error(error));
          break;
        case "move-layer-up":
          moveLayer(view.map, layer, "up");
          break;
        case "move-layer-down":
          moveLayer(view.map, layer, "down");
          break;
        case "remove-layer":
          view.map.remove(layer);
          break;
        case "toggle-labels":
          toggleLayerLabels(layer);
          break;
        case "show-attribute-table":
          showAttributeTable(layer);
          break;
        default:
          console.log(`${t("layerList.unknownAction")}: ${event.action.id}`);
      }
    });

    return () => {
      
      if (triggerActionHandler) {
        triggerActionHandler.remove();
        // Widget destruction is disabled to preserve state. Uncomment to enable cleanup:
        // layerListWidget.current.destroy();
        // layerListWidget.current = null;
        
      }
    };
  }, [view]);

  const moveLayer = (map: __esri.Map, layer: __esri.Layer, direction: string) => {
    const layers = map.layers.toArray();
    const layerIndex = layers.indexOf(layer);

    if (direction === "up" && layerIndex < layers.length - 1) {
      map.layers.reorder(layer, layerIndex + 1);
    } else if (direction === "down" && layerIndex > 0) {
      map.layers.reorder(layer, layerIndex - 1);
    }
  };

  const toggleLayerLabels = (layer: __esri.Layer) => {
    if (layer instanceof __esri.FeatureLayer) { // Narrowing to FeatureLayer
      layer.labelsVisible = !layer.labelsVisible;
    } else {
      console.log(t("layerList.noLabelsSupport"));
    }
  };

  const showAttributeTable   = (layer: __esri.Layer) => {
    if (layer.type === "feature") {
      openAttributeTable(layer);
    } else {
      console.log(t("layerList.noAttributeTableSupport"));
    }
  };

  const openAttributeTable  = (layer: __esri.Layer) => {
  setTargetLayerId(layer.id);
  setActiveBottomPane("FeatureTableComponent");

    toggleBottomPane(true);
};


  return (
    <div
      ref={layerListRef}
      className="h-full w-full"
    ></div>
  );
}
