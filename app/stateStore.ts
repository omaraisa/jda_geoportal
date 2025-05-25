import { create } from "zustand";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import { State, Bookmark, ArcGISUserInfo } from "@/interface";
import * as InitialLayersConfiguration from "@/lib/initial-layers";
import { incrementStatisticsFeature } from "@/lib/database";

const useStateStore = create<State>((set, get) => ({
  language: typeof localStorage !== "undefined" ? localStorage.getItem("appLanguage") || "en" : "en",
  layout: {
    mainMenuExpanded: false,
    sidebarOpen: true,
    sidebarHeight: 70,
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
  center: [39.19797, 21.51581],
  zoom: 10,
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

  createLayer: async ({
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
      TileLayer,
      VectorTileLayer,
      MapImageLayer
    };

    let layersToAdd: any[] = [];
    if (type === "MapImageLayer" && url) {
      try {
        const cookies = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
        const token = cookies["arcgis_token"];

        const response = await fetch(`${url}?f=json&token=${token}`);
        const data = await response.json();
        if (data.error) {
        } else if (Array.isArray(data.layers)) {
          layersToAdd = data.layers.map((sublayer: any) => {
            const newLayer = new MapImageLayer({
              ...layerConfig,
              id: `${id}_${sublayer.id}`,
              title: sublayer.name,
              url,
              sublayers: [
                {
                  id: sublayer.id,
                  visible: true,
                },
              ],
            });
            return newLayer;
          });
          layersToAdd.reverse();
        }
      } catch (error) {
        console.error("Failed to fetch sublayers:", error);
      }
      if (layersToAdd.length === 0) {
        layersToAdd = [
          new MapImageLayer({
            ...layerConfig,
            url,
          }),
        ];
      }
    } else if (type === "FeatureLayer" && url) {
      const LayerClass = layerTypes[type];
      if (LayerClass) {
        const layerConfigWithSource = {
          url,
          portalItem: portalItemId ? { id: portalItemId } : undefined,
          ...layerConfig,
        };
        const layer = new LayerClass(layerConfigWithSource);
        (layer as FeatureLayer).elevationInfo = { mode: "on-the-ground" };
        (layer as any).groups = [...(layerConfig.groups || [])];
        layersToAdd = [layer];
      }
    } else if (type === "TileLayer" && url) {
      const LayerClass = layerTypes[type];
      if (LayerClass) {
        const layerConfigWithSource = {
          url,
          portalItem: portalItemId ? { id: portalItemId } : undefined,
          ...layerConfig,
        };
        const layer = new LayerClass(layerConfigWithSource);
        (layer as any).groups = [...(layerConfig.groups || [])];
        layersToAdd = [layer];
      }
    } else if (type === "VectorTileLayer" && (url || portalItemId)) {
      const LayerClass = layerTypes[type];
      if (LayerClass) {
        const layerConfigWithSource = {
          ...(url ? { url } : {}),
          ...(portalItemId ? { portalItem: { id: portalItemId } } : {}),
          ...layerConfig,
        };
        const layer = new LayerClass(layerConfigWithSource);
        (layer as any).groups = [...(layerConfig.groups || [])];
        layersToAdd = [layer];
      }
    } else {
      const LayerClass = layerTypes[type];
      if (LayerClass) {
        const layerConfigWithSource = {
          url,
          portalItem: portalItemId ? { id: portalItemId } : undefined,
          ...layerConfig,
        };
        const layer = new LayerClass(layerConfigWithSource);
        (layer as any).groups = [...(layerConfig.groups || [])];
        layersToAdd = [layer];
      }
    }

    const targetView = get().targetView;
    if (targetView && targetView.map && layersToAdd.length) {
      layersToAdd.forEach((layer) => {
        console.log("Adding layer:", layer.title, layer.type);
        targetView.map.add(layer);
      });
    }
  },

  addBasemapLayers: () => {
    const { targetView } = get()
    if (!targetView) return;

    const selectedConfigs =
      targetView.type === "2d"
        ? InitialLayersConfiguration.baseMapLayerConfigurations
        : InitialLayersConfiguration.sceneBasemapConfigurations;

    selectedConfigs.forEach((layerConfig) => {
      get().createLayer(layerConfig);
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
   
    userInfo: {
    fullName: "",
    username: "",
    role: "",
    org_role: "",
    groups: [],
    },
    
    setUserInfo: (userInfo: ArcGISUserInfo) => {
    set({
      userInfo: {
      fullName: userInfo.fullName || get().userInfo?.fullName || "",
      username: userInfo.username || get().userInfo?.username || "",
      org_role: userInfo.role || get().userInfo?.org_role || "",
      groups:   userInfo.groups || get().userInfo?.groups || null,
      role: userInfo.role || get().userInfo?.role || "",
      },
    });
    },

    loadUserGroupLayers: async () => {
    const cookies = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
    const token = cookies["arcgis_token"];
    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET';
    const { userInfo, targetView } = get();
    if (!userInfo || !userInfo.groups || !targetView || !targetView.map) return;

    const allGroupLayers: any[] = [];
    for (const group of userInfo.groups) {
      if (!group.title.startsWith("gportal_")) {
      continue;
      }
      try {
      const groupContentRes = await fetch(
      `${portalUrl}/sharing/rest/content/groups/${group.id}?f=json&token=${token}`
      );
      const groupContent = await groupContentRes.json();
      if (!groupContent.items) continue;
      // Attach group name to each item for later use
      groupContent.items.forEach((item: any) => {
      item._groupName = group.title.replace("gportal_", "");
      });
      allGroupLayers.push(...groupContent.items);
      } catch (e) {
      console.error("Failed to fetch group content for group:", group.id, e);
      }
    }

    allGroupLayers.forEach((item) => {
       let layer: any = null;
      
       if (item.url) {
        item.url = item.url.replace(/^http:/, "https:");
       }
      
      if (item.type === "Feature Service" || item.type.includes("Feature Layer")) {
       // Try to fetch sublayers and add each as a FeatureLayer
       (async () => {
         try {
          const cookies = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
          const token = cookies["arcgis_token"];
           const serviceUrl = item.url.replace(/\/+$/, "");
           const metadataUrl = `${serviceUrl}?f=json${token ? `&token=${token}` : ''}`;
           const response = await fetch(metadataUrl);
           const data = await response.json();

           if (!data.error && Array.isArray(data.layers) && data.layers.length > 0) {
        // Add each sublayer as a separate FeatureLayer
        data.layers.reverse().forEach((sublayer: any) => {
          const subLayerInstance = new FeatureLayer({
            url: `${serviceUrl}/${sublayer.id}`,
            id: `${item.id}_${sublayer.id}`,
            title: sublayer.name,
            outFields: ["*"],
            visible: false,
          });
          if (item._groupName) {
            (subLayerInstance as any).group = item._groupName;
          }
          targetView.map.add(subLayerInstance);
        });
           } else {
        // Not a FeatureServer with multiple layers, or error fetching metadata, or no sublayers.
        const featureLayer = new FeatureLayer({
          url: item.url,
          id: item.id,
          title: item.title,
          outFields: ["*"],
          visible: false,
        });
        if (item._groupName) {
          (featureLayer as any).group = item._groupName;
        }
        targetView.map.add(featureLayer);
           }
         } catch (error) {
           // Fallback: create as a single FeatureLayer on any error during fetch/processing
           console.error(`Failed to process FeatureLayer URL ${item.url}:`, error);
           const featureLayer = new FeatureLayer({
        url: item.url,
        id: item.id,
        title: item.title,
        outFields: ["*"],
        visible: false,
           });
           if (item._groupName) {
        (featureLayer as any).group = item._groupName;
           }
           targetView.map.add(featureLayer);
         }
       })();
       return;
      } else if (item.type.includes("Map Service")) {
        // Fetch sublayers and add each as a FeatureLayer
        (async () => {
          try {
            const cookies = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
            const token = cookies["arcgis_token"];
            const response = await fetch(`${item.url}?f=json&token=${token}`);
            const data = await response.json();
            if (data.error) {
              // fallback: add as MapImageLayer if metadata fetch fails
              layer = new MapImageLayer({ url: item.url, visible: false });
            } else if (Array.isArray(data.layers)) {
              // Add each sublayer as a separate FeatureLayer
              data.layers.reverse().forEach((sublayer: any) => {
                const subLayerInstance = new FeatureLayer({
                  url: `${item.url.replace(/\/+$/, "")}/${sublayer.id}`,
                  id: `${item.id}_${sublayer.id}`,
                  title: sublayer.name,
                  outFields: ["*"],
                  visible: false,
                });
                if (item._groupName) {
                  (subLayerInstance as any).group = item._groupName;
                }
                targetView.map.add(subLayerInstance);
              });
              layer = null; // Already added sublayers
            } else {
              // fallback: add as MapImageLayer if no sublayers
              layer = new MapImageLayer({ url: item.url, visible: false });
            }
          } catch (error) {
            // fallback: add as MapImageLayer on error
            console.error("Failed to fetch sublayers:", error);
            layer = new MapImageLayer({ url: item.url, visible: false });
          }
          if (layer && item._groupName) {
            (layer as any).group = item._groupName;
          }
          if (layer) {
            targetView.map.add(layer);
          }
        })();
        return;
       } else if (item.type.includes("Tile")) {
        layer = new TileLayer({ url: item.url, visible: false });
       } else if (item.type.includes("Vector")) {
        layer = new VectorTileLayer({ url: item.url, visible: false });
       }
      
       if (layer && item._groupName) {
        (layer as any).group = item._groupName;
       }
      
       if (layer) {
        targetView.map.add(layer);
       }
      });
    },

  sessionModalOpen: false,
  setSessionModalOpen: (open: boolean) => {
    set({ sessionModalOpen: open });
  },
  handleSessionExtend: async () => {
    set({ sessionModalOpen: false });
    const now = Date.now();
    const expiry = now + 60 * 60 * 1000;
    document.cookie = `arcgis_token_expiry=${expiry}; path=/`;

  },

  updateStats: (featurename: string) => {
    incrementStatisticsFeature(featurename, get().userInfo?.fullName || "").then((response) => {
      // console.log(response.message);
    })
  }

}));

export default useStateStore;
