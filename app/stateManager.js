import { create } from "zustand";
import { initialMapLayers ,initialSceneLayers } from "./components/initial-layers";
import { defaultLayout, LayoutManager } from "./components/layout-management";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

const useStateStore = create((set, get) => ({
  // Initial State
  language: "en",
  layout: defaultLayout,
  activeSideBar: "DefaultComponent",
  appReady: false,
  previousSideBar: null,
  activeBottomPane: "DefaultComponent",
  viewMode: "2D",
  targetView: null, 
  mapView: null,    
  sceneView: null,
  maplayers: initialMapLayers,
  scenelayers: initialSceneLayers,
  widgets: {},
  targetLayerId: null,
  center: [39.19797, 21.51581], // Default center (Jeddah, Saudi Arabia)
  zoom: 12, // Default zoom level for 2D
  scale: 500000, // Default scale for 3D
  viewsSyncOn: false,
  previousSideBars: {
    DefaultComponent: null,
  },
  messages: {},
  bookmarks: [],

  setAppReady: (isReady) => {
    set({ appReady: isReady });
  },
  // Actions
  setLanguage: (lang) => {
    set({ language: lang });
    document.documentElement.lang = lang; // Update <html> lang attribute
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; // Set direction
  },

  setToolsMenuExpansion: (isExpanded) => {
    set((state) => ({
      layout: {
        ...state.layout,
        toolsMenuExpanded: isExpanded,
      },
    }))
  },

  toggleSidebar: (isOpen) => {
    set((state) => ({
      layout: {
        ...state.layout,
        sidebarOpen: isOpen,
        sidebarHeight:isOpen? 80 :0,
      },
    }));
  },

  toggleBottomPane: (isOpen) => {
    set((state) => ({
      layout: {
        ...state.layout,
        bottomPaneOpen: isOpen,
      },
    }));
  },


  setActiveSideBar: (component) => {
    const state = get();
    const previousSideBar = state.previousSideBars[component] || null;
    set({
      activeSideBar: component,
      previousSideBar: previousSideBar,
    });
  },

  setActiveBottomPane: (component) => {
    set({ activeBottomPane: component });
  },

  updateTargetView: (targetView) => set({ targetView }),
  updateMapView: (mapView) => set({ mapView }),       
  updateSceneView: (sceneView) => set({ sceneView }),
 
// Function to create a layer from the configuration
createLayer: ({ sourceType, url, title, visible, opacity, minScale, maxScale, portalItemId, renderer, labelingInfo,visualVariables }) => {
  let layer;

  // Base configuration for the layer
  const layerConfig = {
    title,
    visible,
    opacity,
    minScale,
    maxScale,
    ...(labelingInfo && { labelingInfo }),
    ...(renderer && { renderer }),
  };

  if (sourceType === "url") {
    layer = new FeatureLayer({
      url,
      ...layerConfig,
      elevationInfo: {
        mode: 'on-the-ground', // Ensure buildings are extruded from the ground
      },
      
    });
  } else if (sourceType === "portal") {
    layer = new FeatureLayer({
      portalItem: {
        id: portalItemId,
      },
      ...layerConfig // Spread the base configuration
    });
  }

  return layer;
},

// Add layers to the map or scene
addInitialLayers: (layers, targetView) => {
  if (!targetView) return;

  layers.forEach((layerConfig) => {
    const layer = get().createLayer(layerConfig);
    if (layer) {
      targetView.map.add(layer);
    }
  });
},


  removeLayer: (layerId) => {
    const { view, layers } = get();
    if (!view) {
      return;
    }

    // Find the layer by ID
    const layerToRemove = view.map.findLayerById(layerId);
    if (!layerToRemove) {
      return;
    }

    // Remove the layer from the map
    view.map.remove(layerToRemove);

    // Update the layers array in the state
    const updatedLayers = layers.filter((layer) => layer.id !== layerId);
    set({ layers: updatedLayers });
  },

  // Update layers in the state (e.g., after reordering)
  updateLayers: (newLayers) => {
    set({ layers: newLayers });
  },

  setTargetLayerId: (id) => {
    set({ targetLayerId: id });
  },

  // Update center and zoom/scale when switching views
  updateViewLocation: (center, zoom, scale) => {
    set({ center, zoom, scale });
  },

  setSyncing: (isOn) =>
    set((state) => ({
      viewsSyncOn: isOn,
    })),

  // Get the target layer from the map
  getTargetLayer: () => {
    const map = get().map;
    const targetLayerId = get().targetLayerId;
    return map ? map.findLayerById(targetLayerId) : null;
  },

  // Switch between 2D and 3D views
  switchViewMode: (mode) => {
    const { targetView } = get();
    if (targetView) {
      // Save the current center, zoom, and scale before switching
      const center = targetView.center.clone();
      const zoom = targetView.zoom;
      const scale = targetView.scale;
      set({ viewMode: mode, center, zoom, scale });
      set({ targetView: mode === "2D" ? get().mapView : get().sceneView });
    } else {
      set({ viewMode: mode });
    }
  },


   // Add a new widget instance
   addWidget: (widgetId, widgetInstance) => {
    set((state) => {
      const updatedWidgets = { ...state.widgets };
      updatedWidgets[widgetId] = widgetInstance; // Store the widget instance
      return { widgets: updatedWidgets };
    });
  },

  // Remove a widget
  removeWidget: (widgetId) => {
    set((state) => {
      const updatedWidgets = { ...state.widgets };
      delete updatedWidgets[widgetId]; // Remove the widget
      return { widgets: updatedWidgets };
    });
  },


  addMessage: ({ title, body, type, duration = 10 }) => {
    const id = Date.now(); // Unique ID based on timestamp
    const expireAt = Date.now() + duration * 1000;
    const newMessage = { id, title, body, type, duration, expireAt, expired: false };
  
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

  addBookmark: (name, view) => {
    const id = Date.now() + Math.floor(Math.random() * 999);
    const center = view.center; // Get the center of the view
    const zoom = view.zoom; // Get the current zoom level
    const newBookmark = {
      id,
      name,
      center: { x: center.longitude, y: center.latitude }, // Save center as x, y
      zoom, // Save zoom level
    };
    set((state) => {
      const updatedBookmarks = [...state.bookmarks, newBookmark];
      localStorage.setItem("localBookmarks", JSON.stringify(updatedBookmarks));
      return { bookmarks: updatedBookmarks };
    });
  },

  deleteBookmark: (id) => {
    set((state) => {
      const updatedBookmarks = state.bookmarks.filter(
        (bookmark) => bookmark.id !== id
      );
      localStorage.setItem("localBookmarks", JSON.stringify(updatedBookmarks));
      return { bookmarks: updatedBookmarks };
    });
  },

  loadBookmarks: () => {
  const savedBookmarks = JSON.parse(localStorage.getItem("localBookmarks")) || [];
  set({ bookmarks: savedBookmarks });
},
}));

export default useStateStore;
