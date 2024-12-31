import { create } from "zustand";
import { defaultLayout, LayoutManager } from "../components/layout-management";

// Zustand store
export const useAppStore = create((set, get) => ({
  // Initial State
  layout: defaultLayout,
  map: null,
  view: null,
  layers: [],
  widgets: {},
  targetLayers: {},
  mapDefinition: {
    layerSources: [],
  },

  // Actions
  goToSubMenu: (targetComponent) => {
    const state = get();
    const action = { type: "goToSubMenu", targetComponent };
    const layoutResponse = LayoutManager(state, action);
    if (layoutResponse.type !== "error") {
      set({ layout: layoutResponse });
    }
  },
  goToBottomPane: (targetComponent) => {
    const state = get();
    const action = { type: "goToBottomPane", targetComponent };
    const layoutResponse = LayoutManager(state, action);
    if (layoutResponse.type !== "error") {
      set({ layout: layoutResponse });
    }
  },
  updateLayers: (layers) => set({ layers }),
  updateLayerSources: (layerSources) =>
    set((state) => ({
      mapDefinition: { ...state.mapDefinition, layerSources },
    })),
  updateTargetLayers: (layer) =>
    set((state) => ({
      targetLayers: { ...state.targetLayers, ...layer },
    })),
  sendBackMapView: (map, view) => set({ map, view }),
}));
