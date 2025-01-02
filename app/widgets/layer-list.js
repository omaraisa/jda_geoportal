import { useEffect, useRef } from "react";
import LayerList from "@arcgis/core/widgets/LayerList";
import useStateStore from "../stateManager";

export default function LayerListWidgetComponent() {
  const layerListRef = useRef(null);
  const view = useStateStore((state) => state.view);
  const setActiveBottomPane = useStateStore((state) => state.setActiveBottomPane);
  const setTargetLayerId = useStateStore((state) => state.setTargetLayerId);


  useEffect(() => {
    if (!view) return;

    // Initialize the LayerList widget with custom actions
    const layerListWidget = new LayerList({
      view: view,
      container: layerListRef.current,
      listItemCreatedFunction: (event) => {
        const item = event.item;

        // Add custom actions based on the layer type
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

    // Add event listener for actions
    layerListWidget.on("trigger-action", (event) => {
      const layer = event.item.layer; // Get the layer for which the action was triggered

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

    // Cleanup on unmount
    return () => {
      if (layerListWidget) {
        layerListWidget.destroy();
      }
    };
  }, [view]);

  // Function to move layers up or down in the map
  const moveLayer = (map, layer, direction) => {
    const layers = map.layers.items; // Get all layers in the map
    const layerIndex = layers.indexOf(layer); // Find the current index of the layer

    if (direction === "up" && layerIndex < layers.length - 1) {
      // Move layer up (visually lower in LayerList)
      map.layers.reorder(layer, layerIndex + 1);
    } else if (direction === "down" && layerIndex > 0) {
      // Move layer down (visually higher in LayerList)
      map.layers.reorder(layer, layerIndex - 1);
    }
  };

  // Function to toggle layer labels
  const toggleLayerLabels = (layer) => {
    if (layer.hasOwnProperty("labelsVisible")) {
      layer.labelsVisible = !layer.labelsVisible; // Toggle the labelsVisible property
    } else {
      console.log("This layer does not support labels.");
    }
  };

// Function to show the attribute table for a layer
const showAttributeTable = (layer) => {
    if (layer.type === "feature") {
        openAttributeTable(layer);
    } else {
        console.log("This layer does not support attribute tables.");
    }
};

const openAttributeTable = (layer) => {
    setTargetLayerId(layer.id);
    setActiveBottomPane("AttributeTableWidgetComponent");
  };
  

  return (
    <div
      ref={layerListRef}
      className="h-full w-full"
    ></div>
  );
}
