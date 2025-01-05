import { create } from "zustand";
import { defaultLayout, LayoutManager } from "./components/layout-management";

const useStateStore = create((set, get) => ({
  // Initial State
  language: "en",
  layout: defaultLayout,
  activeSubMenu: "DefaultComponent",
  previousSubMenu: null,
  activeBottomPane: "DefaultComponent",
  viewMode: "2D",
  map: null,
  view: null,
  layers: [],
  widgets: {},
  targetLayerId: null,
  center: [39.19797, 21.48581], // Default center (Jeddah, Saudi Arabia)
  zoom: 12, // Default zoom level for 2D
  scale: 500000, // Default scale for 3D
  mapDefinition: {
    layerSources: [],
  },
  previousSubMenus: {
    DefaultComponent: null,
  },
  messages: {},

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
    set({ targetLayerId: id });
  },

  // Update center and zoom/scale when switching views
  updateViewLocation: (center, zoom, scale) => {
    set({ center, zoom, scale });
  },

  // Get the target layer from the map
  getTargetLayer: () => {
    const map = get().map;
    const targetLayerId = get().targetLayerId;
    return map ? map.findLayerById(targetLayerId) : null;
  },

  // Switch between 2D and 3D views
  switchViewMode: (mode) => {
    const { view } = get();
    if (view) {
      // Save the current center, zoom, and scale before switching
      const center = view.center.clone();
      const zoom = view.zoom;
      const scale = view.scale;
      set({ viewMode: mode, center, zoom, scale });
    } else {
      set({ viewMode: mode });
    }
  },

  addMessage: ({ title, body, type, duration = 10 }) => {
    const id = Date.now(); // Unique ID based on timestamp
    const expireAt = Date.now() + duration * 1000;
    const newMessage = { id, title, body, type, expireAt, expired: false };

    set((state) => ({
      messages: { ...state.messages, [id]: newMessage },
    }));

    setTimeout(() => get().expireMessage(id), duration * 1000);
  },

  expireMessage: (id) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      if (updatedMessages[id]) {
        updatedMessages[id].expired = true;
      }
      return { messages: updatedMessages };
    });
  },

  removeMessage: (id) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      delete updatedMessages[id];
      return { messages: updatedMessages };
    });
  },

}));

export default useStateStore;
