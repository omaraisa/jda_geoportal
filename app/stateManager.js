import { create } from "zustand";
import { defaultLayout, LayoutManager } from "./components/layout-management";

const useStateStore = create((set, get) => ({
  // Initial State
  language: "en",
  layout: defaultLayout,
  activeSubMenu: "DefaultComponent",
  previousSubMenu: null,
  activeBottomPane: "DefaultComponent",
  map: null,
  view: null,
  layers: [],
  widgets: {},
  targetLayerId: null,
  mapDefinition: {
    layerSources: [],
  },
  previousSubMenus: {
    DefaultComponent: null,
  },

  // Actions
  setLanguage: (lang) => {
    set({ language: lang });
    document.documentElement.lang = lang; // Update <html> lang attribute
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; // Set direction
  },

  toggleMenus: (side) => {
    const state = get();
    const action = { type: "toggleMenus", side };
    const layoutResponse = LayoutManager(state.layout, action);
    if (layoutResponse.type !== "error") {
      set({ layout: layoutResponse });
    }
  },

  setActiveSubMenu: (component) => {
    const state = get();
    const previousSubMenu = state.previousSubMenus[component] || null;
    set({
      activeSubMenu: component,
      previousSubMenu: previousSubMenu,
    });
  },

  setActiveBottomPane: (component) => {
    set({ activeBottomPane: component });
  },

  updateMap: (map) => set({ map }),
  updateView: (view) => set({ view }),
  updateLayers: (layers) => set({ layers }),
  updateLayerSources: (layerSources) =>
    set((state) => ({
      mapDefinition: { ...state.mapDefinition, layerSources },
    })),
  updateTargetLayers: (layer) =>
    set((state) => ({
      targetLayers: { ...state.targetLayers, ...layer },
    })),

    setTargetLayerId: (id) => {
        console.log("Setting target layer id:", id );
        console.log("Current state:", get());
    set({ targetLayerId: id });
  },

  // Get the target layer from the map
  getTargetLayer: () => {
    const map = get().map;
    const targetLayerId = get().targetLayerId;
    return map ? map.findLayerById(targetLayerId) : null;
  },
}));

export default useStateStore;
