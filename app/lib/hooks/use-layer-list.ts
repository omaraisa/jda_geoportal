import { useCallback } from "react";
import useStateStore from "@/stateStore";

const useLayerActions = () => {
    const setActiveBottomPane = useStateStore((state) => state.setActiveBottomPane);
    const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);
    const setTargetLayerId = useStateStore((state) => state.setTargetLayerId);
    const view = useStateStore((state) => state.targetView);

    const moveLayer = useCallback((map: __esri.Map | undefined, layer: __esri.Layer, direction: string, setLayers: (layers: __esri.Layer[]) => void) => {
        if (!map) return;
        const layers = map.layers.toArray();
        const layerIndex = layers.indexOf(layer);

        if (direction === "up" && layerIndex < layers.length - 1) {
            map.layers.reorder(layer, layerIndex + 1);
        } else if (direction === "down" && layerIndex > 0) {
            map.layers.reorder(layer, layerIndex - 1);
        }
        setLayers(map.layers.toArray());
    }, []);

    const toggleLayerLabels = useCallback((layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void) => {
        (layer as __esri.FeatureLayer).labelsVisible = !(layer as __esri.FeatureLayer).labelsVisible;
        if (view) setLayers(view.map.layers.toArray());
    }, [view]);

    const showAttributeTable = useCallback((layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void) => {
        setTargetLayerId(layer.id);
        setActiveBottomPane("FeatureTableComponent");
        toggleBottomPane(true);
        if (view) setLayers(view.map.layers.toArray());
    }, [setTargetLayerId, setActiveBottomPane, toggleBottomPane, view]);

    const handleOptionsClick = useCallback((layerId: string, activeLayerId: string | null, setActiveLayerId: (activeLayerId: string | null) => void, setLayers: (layers: __esri.Layer[]) => void) => {
        setActiveLayerId(activeLayerId === layerId ? null : layerId);
        if (view) setLayers(view.map.layers.toArray());
    }, [view]);

    const handleRemoveLayer = useCallback((layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void) => {
        if (view) {
            view.map.remove(layer);
            setLayers(view.map.layers.toArray());
        }
    }, [view]);

    const toggleLayerVisibility = useCallback((layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void) => {
        layer.visible = !layer.visible;
        if (view) setLayers(view.map.layers.toArray());
    }, [view]);

    return {
        moveLayer,
        toggleLayerLabels,
        showAttributeTable,
        handleOptionsClick,
        handleRemoveLayer,
        toggleLayerVisibility,
    };
};

export default useLayerActions;
