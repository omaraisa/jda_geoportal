import { useEffect, useRef } from "react";
import LayerList from "@arcgis/core/widgets/LayerList";
import useStateStore from "../stateManager";

export default function LayerListComponent() {
  const layerListRef = useRef(null);
  const view = useStateStore((state) => state.targetView);
  const setActiveBottomPane = useStateStore((state) => state.setActiveBottomPane);
  
  const setTargetLayerId = useStateStore((state) => state.setTargetLayerId);
  const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);

  const layerListWidgetRef = useRef(null); // Persist LayerList widget
  let triggerActionHandler; // Reference to the event handler

  useEffect(() => {
    if (!view) return;

    if (layerListWidgetRef.current) {
      layerListWidgetRef.current.view = view;
    } else {
      layerListWidgetRef.current = new LayerList({
        view: view,
        container: layerListRef.current,
        listItemCreatedFunction: (event) => {
          const item = event.item;
          item.actionsSections = [
            [
              {
                title: "Show/Hide Labels",
                className: "esri-icon-labels",
                id: "toggle-labels",
              },
              {
                title: "Show Attribute Table",
                className: "esri-icon-table",
                id: "show-attribute-table",
              },
              {
                title: "Zoom to Layer",
                className: "esri-icon-zoom-out-fixed",
                id: "zoom-to-layer",
              },
              {
                title: "Move Layer Up",
                className: "esri-icon-up",
                id: "move-layer-up",
              },
              {
                title: "Move Layer Down",
                className: "esri-icon-down",
                id: "move-layer-down",
              },
              {
                title: "Remove Layer",
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
    triggerActionHandler = layerListWidgetRef.current.on("trigger-action", (event) => {
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
          console.log(`Unknown action: ${event.action.id}`);
      }
    });

    return () => {
      if (layerListWidgetRef.current) {
        layerListWidgetRef.current.view = null;
      }
      // Remove the event handler when the component unmounts
      if (triggerActionHandler) {
        triggerActionHandler.remove();
        
      }
    };
  }, [view]);

  const moveLayer = (map, layer, direction) => {
    const layers = map.layers.items;
    const layerIndex = layers.indexOf(layer);

    if (direction === "up" && layerIndex < layers.length - 1) {
      map.layers.reorder(layer, layerIndex + 1);
    } else if (direction === "down" && layerIndex > 0) {
      map.layers.reorder(layer, layerIndex - 1);
    }
  };

  const toggleLayerLabels = (layer) => {
    if (layer.hasOwnProperty("labelsVisible")) {
      layer.labelsVisible = !layer.labelsVisible;
    } else {
      console.log("This layer does not support labels.");
    }
  };

  const showAttributeTable = (layer) => {
    if (layer.type === "feature") {
      openAttributeTable(layer);
    } else {
      console.log("This layer does not support attribute tables.");
    }
  };

  const openAttributeTable = (layer) => {
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
