import { SpatialQueryService } from './spatial-query-service';
import { 
  getSelectedTargetLayer, 
  getSelectedSelectionLayer, 
  showLayerSelectionError,
  showInvalidLayerError,
  showNoResultsError,
  showSearchError
} from './query-utils';
import { MessagePayload } from './types';

export const createSketchCompleteHandler = (
  view: __esri.MapView | __esri.SceneView | null,
  targetLayerValueRef: React.MutableRefObject<string>,
  graphicsLayerRef: React.RefObject<__esri.GraphicsLayer | null>,
  widgets: any,
  sendMessage: (message: MessagePayload) => void,
  t: (key: string) => string,
  setHasResults: (hasResults: boolean) => void
) => {
  return async (graphic: __esri.Graphic) => {
    const targetLayer = getSelectedTargetLayer(view, targetLayerValueRef.current);
    if (!targetLayer) {
      showInvalidLayerError(sendMessage, t);
      return;
    }

    try {
      const response = await SpatialQueryService.queryByGeometry(targetLayer, graphic.geometry);
      if (response && response.features.length) {
        SpatialQueryService.processQueryResult(
          response,
          graphicsLayerRef.current!,
          view!,
          targetLayer,
          widgets
        );
        setHasResults(true);
      } else {
        showNoResultsError(sendMessage, t);
        setHasResults(false);
      }
    } catch (error) {
      showSearchError(sendMessage, t);
      setHasResults(false);
    }
  };
};

export const createQueryByLayerHandler = (
  view: __esri.MapView | __esri.SceneView | null,
  targetLayerValue: string,
  selectionLayerValue: string,
  graphicsLayerRef: React.RefObject<__esri.GraphicsLayer | null>,
  widgets: any,
  sendMessage: (message: MessagePayload) => void,
  updateStats: (action: string) => void,
  t: (key: string) => string,
  setHasResults: (hasResults: boolean) => void
) => {
  return async () => {
    const targetLayer = getSelectedTargetLayer(view, targetLayerValue);
    const selectionLayer = getSelectedSelectionLayer(view, selectionLayerValue);

    if (!targetLayer || !selectionLayer) {
      if (!targetLayer) {
        showInvalidLayerError(sendMessage, t);
      } else {
        showLayerSelectionError(sendMessage, t);
      }
      return;
    }

    try {
      const response = await SpatialQueryService.queryByLayer(targetLayer, selectionLayer);
      if (response && response.features.length) {
        SpatialQueryService.processQueryResult(
          response,
          graphicsLayerRef.current!,
          view!,
          targetLayer,
          widgets
        );
        setHasResults(true);
      } else {
        showNoResultsError(sendMessage, t);
        setHasResults(false);
      }
    } catch (error) {
      showSearchError(sendMessage, t);
      setHasResults(false);
    }
    updateStats("Spatial Query");
  };
};
