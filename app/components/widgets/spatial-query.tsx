"use client";

import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { 
  LayerSelector, 
  SelectionMethodToggle, 
  QueryActions, 
  useSpatialQuery 
} from "./spatial-query/";

export default function SpatialQueryComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const widgets = useStateStore((state) => state.widgets);
  const updateStats = useStateStore((state) => state.updateStats);

  const { state, refs, handlers } = useSpatialQuery(
    view,
    sendMessage,
    widgets,
    updateStats,
    t
  );

  return (
    <div className="flex flex-col space-y-4 p-4">
      <LayerSelector
        view={view}
        targetLayerRef={refs.targetLayerRef}
        selectionLayerRef={refs.selectionLayerRef}
        selectionMethodChecked={state.selectionMethodChecked}
      />

      <SelectionMethodToggle
        selectionMethodChecked={state.selectionMethodChecked}
        onToggle={handlers.selectionMethodHandler}
      />

      <div
        ref={refs.sketchContainerRef}
        style={{
          display: state.selectionMethodChecked ? "block" : "none",
        }}
      ></div>

      <QueryActions
        selectionMethodChecked={state.selectionMethodChecked}
        onRunQueryByLayer={handlers.runQueryByLayer}
        onClearSelection={handlers.handleClearSelection}
        onSwitchSelection={handlers.handleSwitchSelection}
      />
    </div>
  );
}
