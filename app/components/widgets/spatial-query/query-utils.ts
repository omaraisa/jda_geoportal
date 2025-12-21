import { MessagePayload } from './types';

export const getSelectedTargetLayer = (
  view: __esri.MapView | __esri.SceneView | null,
  targetLayerValue: string
): __esri.FeatureLayer | null => {
  if (!view || !targetLayerValue) return null;

  const layer = view.map.findLayerById(targetLayerValue);

  // Only allow FeatureLayer types that have queryFeatures method
  if (layer && layer.type === "feature" && typeof (layer as any).queryFeatures === "function") {
    return layer as __esri.FeatureLayer;
  }

  return null;
};

export const getSelectedSelectionLayer = (
  view: __esri.MapView | __esri.SceneView | null,
  selectionLayerValue: string
): __esri.FeatureLayer | null => {
  if (!view || !selectionLayerValue) return null;

  const layer = view.map.findLayerById(selectionLayerValue);

  // Only allow FeatureLayer types that have queryFeatures method
  if (layer && layer.type === "feature" && typeof (layer as any).queryFeatures === "function") {
    return layer as __esri.FeatureLayer;
  }

  return null;
};

export const createErrorMessage = (
  title: string,
  body: string,
  duration: number = 10
): MessagePayload => ({
  type: "error",
  title,
  body,
  duration,
});

export const showLayerSelectionError = (
  sendMessage: (message: MessagePayload) => void,
  t: (key: string) => string
) => {
  sendMessage(createErrorMessage(
    t("systemMessages.error.queryError.title"),
    t("systemMessages.error.completeSearchRequirements.body")
  ));
};

export const showNoResultsError = (
  sendMessage: (message: MessagePayload) => void,
  t: (key: string) => string
) => {
  sendMessage(createErrorMessage(
    t("systemMessages.error.queryError.title"),
    t("systemMessages.error.noResultsFound.body")
  ));
};

export const showSearchError = (
  sendMessage: (message: MessagePayload) => void,
  t: (key: string) => string
) => {
  sendMessage(createErrorMessage(
    t("systemMessages.error.queryError.title"),
    t("systemMessages.error.searchError.body")
  ));
};

export const showInvalidLayerError = (
  sendMessage: (message: MessagePayload) => void,
  t: (key: string) => string
) => {
  sendMessage(createErrorMessage(
    t("systemMessages.error.queryError.title"),
    "Selected layer does not support spatial queries. Please select a Feature Layer."
  ));
};
