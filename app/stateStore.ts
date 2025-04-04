import { create } from "zustand";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import { State, Bookmark } from "@/interface";
import * as InitialLayersConfiguration from "@/lib/initial-layers";

const useStateStore = create<State>((set, get) => ({
  language: typeof localStorage !== "undefined" ? localStorage.getItem("appLanguage") || "en" : "en",
  layout: {
    mainMenuExpanded: false,
    sidebarOpen: false,
    sidebarHeight: 0,
    bottomPaneOpen: false,
  },
  activeSideBar: "",
  appReady: false,
  previousSideBar: null,
  activeBottomPane: "DefaultComponent",
  viewMode: "2D",
  targetView: null,
  mapView: null,
  sceneView: null,
  widgets: {},
  targetLayerId: null,
  center: [39.19797, 21.51581],
  zoom: 12,
  scale: 500000,
  viewsSyncOn: false,
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
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("appLanguage", lang);
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
        sidebarHeight: isOpen ? 70 : 0,
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
    groups,
    visible,
    opacity,
    minScale,
    maxScale,
    portalItemId,
    renderer,
    labelingInfo,
    visualVariables,
  }) => {

    let layer;

    const layerConfig = {
      id,
      title,
      visible,
      opacity,
      minScale,
      maxScale,
      groups,
      ...(labelingInfo && { labelingInfo }),
      ...(renderer && { renderer }),
      visualVariables: visualVariables || [],
    };

    const layerTypes = {
      FeatureLayer,
      MapImageLayer,
      TileLayer,
      VectorTileLayer,
    };

    const layerConfigWithSource = {
      url,
      portalItem: portalItemId ? { id: portalItemId } : undefined,
      ...layerConfig,
    };

    if (sourceType === "url" || sourceType === "portal") {
      const LayerClass = layerTypes[type];
      if (LayerClass) {
      layer = new LayerClass(layerConfigWithSource);
      if (type === "FeatureLayer" && sourceType === "url") {
        (layer as FeatureLayer).elevationInfo = { mode: "on-the-ground" };
      }
      }
    }

    return layer || null;
  },
    
  addBasemapLayers: () => {
    const { targetView } = get()
    if (!targetView) return;

      const selectedConfigs =
        targetView.type === "2d"
          ? InitialLayersConfiguration.baseMapLayerConfigurations
          : InitialLayersConfiguration.sceneBasemapConfigurations;

    selectedConfigs.forEach((layerConfig) => {
      const layer = get().createLayer(layerConfig);
      if (layer) {
        (layer as any).groups = [...(layerConfig.groups || [])];
        targetView.map.add(layer);
      }
      })
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
    duration = 100,
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
}));

export default useStateStore;
