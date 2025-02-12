import { create } from "zustand";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import { State, Bookmark } from "@/interface";
import * as InitialLayersConfiguration from "@/lib/initial-layers";

const useStateStore = create<State>((set, get) => ({
  // Initial State
  language: localStorage.getItem("appLanguage") || "en",
  layout: {
    mainMenuExpanded: false,
    sidebarOpen: true,
    sidebarHeight: 80,
    bottomPaneOpen: false,
  },
  activeSideBar: "LayerListComponent",
  appReady: false,
  previousSideBar: null,
  activeBottomPane: "DefaultComponent",
  viewMode: "2D",
  targetView: null,
  mapView: null,
  sceneView: null,
  widgets: {},
  targetLayerId: null,
  center: [39.19797, 21.51581], // Default center (Jeddah, Saudi Arabia)
  zoom: 12, // Default zoom level for 2D
  scale: 500000, // Default scale for 3D
  viewsSyncOn: false,
  activeLayerTheme: "Theme1",
  previousSideBars: {
    DefaultComponent: null,
  },
  messages: {},
  bookmarks: [],

  setAppReady: (isReady: boolean) => {
    set({ appReady: isReady });
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
    document.documentElement.lang = lang; // Update <html> lang attribute
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; // Set direction
    localStorage.setItem("appLanguage", lang); // Save language to localStorage
  },

  setMainMenuExpansion: (isExpanded: boolean) => {
    set((state) => ({
      layout: {
        ...state.layout,
        mainMenuExpanded: isExpanded,
      },
    }));
  },

  toggleSidebar: (isOpen: boolean) => {
    set((state) => ({
      layout: {
        ...state.layout,
        sidebarOpen: isOpen,
        sidebarHeight: isOpen ? 80 : 0,
      },
    }));
  },

  toggleBottomPane: (isOpen: boolean) => {
    set((state) => ({
      layout: {
        ...state.layout,
        bottomPaneOpen: isOpen,
      },
    }));
  },

  setActiveSideBar: (component: string) => {
    const previousSideBar = get().previousSideBars[component] || null;
    set({
      activeSideBar: component,
      previousSideBar: previousSideBar,
    });
  },

  setActiveBottomPane: (component: string) => {
    set({ activeBottomPane: component });
  },

  updateTargetView: (targetView) => set({ targetView }),
  updateMapView: (mapView) => set({ mapView }),
  updateSceneView: (sceneView) => set({ sceneView }),

  createLayer: ({
    id,
    sourceType,
    type,
    url,
    title,
    themes,
    visible,
    opacity,
    minScale,
    maxScale,
    portalItemId,
    renderer,
    labelingInfo,
    visualVariables,
  }) => {

    if (!themes?.includes(get().activeLayerTheme)) {
      return null;
    }

    let layer;

    const layerConfig = {
      id,
      title,
      visible,
      opacity,
      minScale,
      maxScale,
      themes,
      ...(labelingInfo && { labelingInfo }),
      ...(renderer && { renderer }),
      visualVariables: visualVariables || [],
    };

    if (sourceType === "url") {
      if (type === "FeatureLayer") {
        layer = new FeatureLayer({
          url,
          ...layerConfig,
          elevationInfo: {
            mode: "on-the-ground",
          },
        });
      } else if (type === "MapImageLayer") {
        layer = new MapImageLayer({
          url,
          ...layerConfig,
        });
      } else if (type === "TileLayer") {
        layer = new TileLayer({
          url,
          ...layerConfig,
        });
      }
    } else if (sourceType === "portal") {
      if (type === "FeatureLayer") {
        layer = new FeatureLayer({
          portalItem: {
            id: portalItemId,
          },
          ...layerConfig,
        });
      } else if (type === "MapImageLayer") {
        layer = new MapImageLayer({
          portalItem: {
            id: portalItemId,
          },
          ...layerConfig,
        });
      } else if (type === "TileLayer") {
        layer = new TileLayer({
          portalItem: {
            id: portalItemId,
          },
          ...layerConfig,
        });
      }
    }

    return layer || null;
  },
    
  addBasemapLayers: (activeTheme=get().activeLayerTheme) => {
    const { targetView } = get()
    if (!targetView) return;

      const selectedConfigs =
        targetView.type === "2d"
          ? InitialLayersConfiguration.baseMapLayerConfigurations
          : InitialLayersConfiguration.sceneBasemapConfigurations;

    selectedConfigs.forEach((layerConfig) => {
      const existingLayer = targetView.map.findLayerById(layerConfig.id);
      const belongsToActiveTheme = layerConfig.themes?.includes(activeTheme);

      // If layer belongs to the active theme, add if not already in the map
      if (belongsToActiveTheme) {
        if (!existingLayer) {
          const layer = get().createLayer(layerConfig);
          if (layer) {
            layer.id = layerConfig.id;
            targetView.map.add(layer);
          }
        }
      } else {
        // If layer does not belong to the active theme, remove if it exists
        if (existingLayer) {
          targetView.map.remove(existingLayer);
        }
      }
    });
  },

  setTargetLayerId: (id: string) => {
    set({ targetLayerId: id });
  },

  setSyncing: (isOn: boolean) => {
    set({ viewsSyncOn: isOn });
  },

  getTargetLayer: () => {
    const map = (get() as any).map;
    const targetLayerId = (get() as any).targetLayerId;
    return map ? map.findLayerById(targetLayerId) : null;
  },

  switchViewMode: (mode: "2D" | "3D" | "Dual") => {
    const { targetView } = get() as any;
    if (targetView) {
      const center = targetView.center.clone();
      const zoom = targetView.zoom;
      const scale = targetView.scale;
      set({ viewMode: mode, center, zoom, scale });
      set({
        targetView:
          mode === "2D" ? (get() as any).mapView : (get() as any).sceneView,
      });
    } else {
      set({ viewMode: mode });
    }
  },

  addWidget: (widgetId: string, widgetInstance: any) => {
    set((state) => ({
      widgets: {
        ...state.widgets,
        [widgetId]: widgetInstance,
      },
    }));
  },

  removeWidget: (widgetId: string) => {
    set((state) => {
      const updatedWidgets = { ...state.widgets };
      delete updatedWidgets[widgetId];
      return { widgets: updatedWidgets };
    });
  },

  sendMessage: ({
    title,
    body,
    type,
    duration = 10,
  }: {
    title: string;
    body: string;
    type: string;
    duration?: number;
  }) => {
    const id = Date.now().toString();
    const expireAt = Date.now() + duration * 1000;
    const newMessage = {
      id,
      title,
      body,
      type,
      duration,
      expireAt,
      expired: false,
    };

    set((state) => ({
      messages: { ...state.messages, [id]: newMessage },
    }));

    setTimeout(() => (get() as any).expireMessage(id), duration * 1000);
  },

  expireMessage: (id: number) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      if (updatedMessages[id]) {
        updatedMessages[id].expired = true;
      }
      return { messages: updatedMessages };
    });
  },

  removeMessage: (id: number) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      delete updatedMessages[id];
      return { messages: updatedMessages };
    });
  },

  addBookmark: (name: string, view: any) => {
    const id = (Date.now() + Math.floor(Math.random() * 999)).toString();
    const center = view.center;
    const zoom = view.zoom;
    const newBookmark = {
      id,
      name,
      center: { x: center.longitude, y: center.latitude },
      zoom,
    };
    set((state) => {
      const updatedBookmarks = [...state.bookmarks, newBookmark as Bookmark];
      localStorage.setItem("localBookmarks", JSON.stringify(updatedBookmarks));
      return { bookmarks: updatedBookmarks };
    });
  },

  deleteBookmark: (id: number) => {
    set((state) => {
      const updatedBookmarks = state.bookmarks.filter(
        (bookmark) => bookmark.id !== id.toString()
      );
      localStorage.setItem("localBookmarks", JSON.stringify(updatedBookmarks));
      return { bookmarks: updatedBookmarks };
    });
  },

  loadBookmarks: () => {
    const savedBookmarks = JSON.parse(
      localStorage.getItem("localBookmarks") || "[]"
    );
    set({ bookmarks: savedBookmarks });
  },
  setActiveLayerTheme: (theme) => {
    set({ activeLayerTheme: theme });
  },
}));

export default useStateStore;
