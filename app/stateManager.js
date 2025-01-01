import { create } from "zustand";
import { defaultLayout, LayoutManager } from "./components/layout-management";

const useStateStore = create((set, get) => ({
  // Initial State
  language: "en",
  layout: defaultLayout,
  activeSubMenu: "DefaultComponent",
  previousSubMenu: null,
  map: null,
  view: null,
  layers: [],
  widgets: {},
  targetLayers: {},
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
      set({ layout: layoutResponse  });
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
}));

export default useStateStore;
