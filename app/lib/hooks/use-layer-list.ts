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

    const toggleLayerPopup = useCallback((layer: __esri.Layer, setLayers: (layers: __esri.Layer[]) => void) => {
        const featureLayer = layer as __esri.FeatureLayer;

        // Check if the feature layer already has a popup template
        if (!featureLayer.popupTemplate) {
            // Create a default popup template
            const titleField = getTitleField(featureLayer.fields);
            const popupTemplate = createPopupTemplate(titleField, featureLayer.fields);

            // Try to check for attachments using the layer's capabilities
            let hasAttachments = false;
            if (featureLayer.capabilities.operations.supportsQueryAttachments) {
                hasAttachments = true;
            } else if (
                featureLayer.capabilities.attachment.supportsName
            ) {
                hasAttachments = true;
            }

            if (hasAttachments) {
                popupTemplate.content.push({
                    type: "attachments"
                } as __esri.AttachmentsContent);
            }

            featureLayer.popupTemplate = popupTemplate;
        } else {
            // Toggle the popup visibility if the template already exists
            featureLayer.popupEnabled = !featureLayer.popupEnabled;
        }

        // Update the layers in the view
        if (view) {
            setLayers(view.map.layers.toArray());
        }
    }, [view]);
    
    // Helper function to find the title field
    function getTitleField(fields: __esri.Field[]): string {
        const titleField = fields.find(f => f?.name && /name|الاسم|id/i.test(f.name.toLowerCase()));
        return titleField?.name || "OBJECTID";
    }
    
    // Helper function to create a popup template
    function createPopupTemplate(titleField: string, fields: __esri.Field[]):any {
        return {
            title: `{${titleField}}`,
            content: [{ type: "fields" } as __esri.FieldsContent],
            fieldInfos: fields.map(field => ({
                fieldName: field.name,
                label: field.alias || field.name,
                visible: true
            })) 
        };
    }

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
        toggleLayerPopup,
        toggleLayerVisibility,
    };
};

export default useLayerActions;
