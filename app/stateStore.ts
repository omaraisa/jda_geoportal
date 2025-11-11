import { create } from "zustand";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import { State, Bookmark, ArcGISUserInfo } from "@/interface";
import { incrementStatisticsFeature } from "@/lib/utils/statistics-client";
import { getCookie } from "@/lib/utils/token";

const useStateStore = create<State>((set, get) => ({
  language: typeof localStorage !== "undefined" ? localStorage.getItem("appLanguage") || "en" : "en",
  layout: {
    mainMenuExpanded: false,
    sidebarOpen: true,
    sidebarHeight: 70,
    bottomPaneOpen: false,
    bottomPaneHeight: 200,
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
  center: [39.19, 21.60],
  extent: null,
  zoom: 18,
  scale: 280000,
  viewsSyncOn: false,
  previousSideBars: {
    DefaultComponent: null,
  },
  messages: {},
  bookmarks: [],
  layoutModeActive: false,
  mapPrintWidgetOpen: false,

  setAppReady: (isReady: boolean) => {
    setTimeout(() => set({ appReady: isReady }), 3000);
  },
  updateExtent: (extent: __esri.Extent | null) => {
    set({ extent });
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
    // Set different heights based on component type
    const height = component === 'FeatureTableComponent' ? 400 : 200;
    set((state) => ({ 
      activeBottomPane: component,
      layout: {
        ...state.layout,
        bottomPaneHeight: height,
      }
    }));
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
        targetView.map.add(layer);
      });
    }
  },

  setTargetLayerId: (id: string) => {
    set({ targetLayerId: id });
  },

  setSyncing: (isOn: boolean) => {
    set({ viewsSyncOn: isOn });
  },

  setLayoutModeActive: (active: boolean) => {
    set({ layoutModeActive: active });
  },

  setMapPrintWidgetOpen: (open: boolean) => {
    set({ mapPrintWidgetOpen: open });
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

  accessToken: null,
  isAuthenticated: false,

  initializeAuth: () => {
    const accessToken = getCookie('access_token');
    const isAuthenticated = getCookie('is_authenticated') === 'true';

    if (accessToken && isAuthenticated) {
      set({
        accessToken,
        isAuthenticated
      });
    }
  },

  checkAuthStatus: () => {
    const { accessToken } = get();

    if (!accessToken) {
      return false;
    }

    // Since we're not decoding tokens anymore, we'll rely on the browser's cookie expiration
    // or the authentication check in the useAuthentication hook
    return true;
  },

  clearAuth: () => {
    set({
      accessToken: null,
      isAuthenticated: false,
      userInfo: {
        fullName: "",
        username: "",
        role: "",
        groups: [],
      }
    });
  },

  userInfo: {
    fullName: "",
    username: "",
    role: "",
    groups: [],
    arcgisCredentials: null,
  },

  gisToken: null,

  setGisToken: (token: string | null) => {
    set({ gisToken: token });
  },

  setUserInfo: (userInfo: ArcGISUserInfo) => {
    set({
      userInfo: {
        fullName: userInfo.fullName || "",
        username: userInfo.username || "",
        role: userInfo.role || "",
        firstName: userInfo.firstName || null,
        lastName: userInfo.lastName || null,
        userId: userInfo.userId || null,
        groups: Array.isArray(userInfo.groups) ? userInfo.groups : [],
      },
    });
  },

  // Backup function to load basemap layers when user group fetching fails
  loadBackupBasemapLayers: async (portalUrl: string, gisToken: string, targetView: any, groupNameToIdMap: { [key: string]: string }) => {
    console.log("🛡️ Loading backup basemap layers from gportal_Basemap group...");
    
    const basemapGroupId = groupNameToIdMap["gportal_Basemap"];
    if (!basemapGroupId) {
      console.error("❌ No gportal_Basemap group found in portal");
      return;
    }

    try {
      const groupContentUrl = `${portalUrl}/sharing/rest/content/groups/${basemapGroupId}/items?f=json&token=${gisToken}`;
      const groupContentRes = await fetch(groupContentUrl);
      
      if (!groupContentRes.ok) {
        console.error(`❌ Failed to fetch basemap group content: ${groupContentRes.status}`);
        return;
      }

      const groupContent = await groupContentRes.json();
      
      if (groupContent.error) {
        console.error("❌ Basemap group API error:", groupContent.error);
        return;
      }

      if (!groupContent.items || groupContent.items.length === 0) {
        console.warn("⚠️ No items found in gportal_Basemap group");
        return;
      }

      console.log(`🗺️ Found ${groupContent.items.length} basemap items`);
      
      // Add basemap layers using the same sophisticated approach as user group layers
      const layerPromises: Promise<number>[] = [];
      
      for (const item of groupContent.items) {
        item._groupName = "Basemap"; // Remove gportal_ prefix for display
        
        if (item.url) {
          item.url = item.url.replace(/^http:/, "https:");
        }

        if (item.type === "Feature Service" || item.type.includes("Feature Layer")) {
          // Handle Feature Services with sublayers approach
          const featureLayerPromise = (async (): Promise<number> => {
            let addedCount = 0;
            try {
              const serviceUrl = item.url.replace(/\/+$/, "");
              const metadataUrl = `${serviceUrl}?f=json${gisToken ? `&token=${gisToken}` : ''}`;

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
                    visible: sublayer.defaultVisibility !== false,
                  });
                  (subLayerInstance as any).group = item._groupName;
                  targetView.map.add(subLayerInstance);
                  console.log(`✅ Added backup FeatureLayer: ${sublayer.name}`);
                  addedCount++;
                });
              } else {
                // Single feature layer or error fetching metadata
                const featureLayer = new FeatureLayer({
                  url: item.url,
                  id: item.id,
                  title: item.title,
                  outFields: ["*"],
                  visible: true,
                });
                (featureLayer as any).group = item._groupName;
                targetView.map.add(featureLayer);
                console.log(`✅ Added backup single FeatureLayer: ${item.title}`);
                addedCount++;
              }
            } catch (error) {
              console.error(`❌ Failed to process backup FeatureLayer URL ${item.url}:`, error);
              // Fallback: create as a single FeatureLayer
              const featureLayer = new FeatureLayer({
                url: item.url,
                id: item.id,
                title: item.title,
                outFields: ["*"],
                visible: true,
              });
              (featureLayer as any).group = item._groupName;
              targetView.map.add(featureLayer);
              console.log(`✅ Added backup fallback FeatureLayer: ${item.title}`);
              addedCount++;
            }
            return addedCount;
          })();
          layerPromises.push(featureLayerPromise);
        } else if (item.type.includes("Map Service")) {
          // Handle Map Services with FeatureLayer sublayers approach
          const mapServicePromise = (async (): Promise<number> => {
            let addedCount = 0;
            try {
              const response = await fetch(`${item.url}?f=json&token=${gisToken}`);
              const data = await response.json();

              if (data.error) {
                console.warn(`⚠️ Map Service metadata fetch error for ${item.title}, skipping`);
              } else if (Array.isArray(data.layers)) {
                // Add each sublayer as a separate FeatureLayer
                data.layers.reverse().forEach((sublayer: any) => {
                  const subLayerInstance = new FeatureLayer({
                    url: `${item.url.replace(/\/+$/, "")}/${sublayer.id}`,
                    id: `${item.id}_${sublayer.id}`,
                    title: sublayer.name,
                    outFields: ["*"],
                    visible: sublayer.defaultVisibility !== false,
                  });
                  (subLayerInstance as any).group = item._groupName;
                  targetView.map.add(subLayerInstance);
                  console.log(`✅ Added backup Map Service FeatureLayer: ${sublayer.name}`);
                  addedCount++;
                });
              } else {
                console.warn(`⚠️ Map Service ${item.title} has no sublayers, skipping`);
              }
            } catch (error) {
              console.error("❌ Failed to fetch backup Map Service sublayers:", error);
            }
            return addedCount;
          })();
          layerPromises.push(mapServicePromise);
        } else if (item.type.includes("Tile")) {
          const layer = new TileLayer({ 
            url: item.url, 
            id: item.id,
            title: item.title,
            visible: true 
          });
          (layer as any).group = item._groupName;
          targetView.map.add(layer);
          console.log(`✅ Added backup TileLayer: ${item.title}`);
        } else if (item.type.includes("Vector")) {
          const layer = new VectorTileLayer({ 
            url: item.url, 
            id: item.id,
            title: item.title,
            visible: true 
          });
          (layer as any).group = item._groupName;
          targetView.map.add(layer);
          console.log(`✅ Added backup VectorTileLayer: ${item.title}`);
        }
      }

      // Wait for all async backup layer operations to complete
      if (layerPromises.length > 0) {
        console.log(`⏳ Waiting for ${layerPromises.length} backup async layer operations to complete...`);
        try {
          const layerCounts = await Promise.all(layerPromises);
          const asyncLayersAdded = layerCounts.reduce((sum, count) => sum + count, 0);
          console.log(`✅ Backup async layer operations completed. Added ${asyncLayersAdded} backup async layers`);
        } catch (error) {
          console.error("❌ Error waiting for backup async layer operations:", error);
        }
      }
      
    } catch (error) {
      console.error("❌ Failed to load backup basemap layers:", error);
    }
  },

  loadUserGroupLayers: async () => {
    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET';
    const { userInfo, targetView } = get();

    // Get token from authenticateArcGIS module (this will now validate expiry)
    const { getArcGISToken, clearArcGISToken } = await import('./lib/utils/authenticate-arcgis');
    let gisToken = await getArcGISToken();

    if (!gisToken) {
      console.error("❌ No valid ArcGIS token available from authenticateArcGIS");
      return;
    }

    // Update state with the token
    set({ gisToken });

    // Test the token immediately before using it
    try {
      const testUrl = `${portalUrl}/sharing/rest/portals/self?f=json&token=${gisToken}`;

      const testResponse = await fetch(testUrl);
      const testData = await testResponse.json();

      if (testData.error) {
        console.error('❌ Token test failed, token is invalid:', testData.error);
        console.log('🔄 Attempting to generate a new token...');

        // Clear the invalid token
        clearArcGISToken();
        set({ gisToken: null });

        // Clear invalid cookies
        document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        // Try to get a new token
        gisToken = await getArcGISToken();

        if (!gisToken) {
          console.error("❌ Failed to generate new token after validation failure");
          return;
        }

        set({ gisToken });

        // Test the new token
        const newTestResponse = await fetch(`${portalUrl}/sharing/rest/portals/self?f=json&token=${gisToken}`);
        const newTestData = await newTestResponse.json();

        if (newTestData.error) {
          console.error('❌ New token also failed validation:', newTestData.error);
          return;
        }
      } else {
      }
    } catch (testError) {
      console.error('❌ Token test error:', testError);
      console.log('🔄 Attempting to generate a new token due to test error...');

      // Clear the problematic token and try again
      clearArcGISToken();
      set({ gisToken: null });

      gisToken = await getArcGISToken();
      if (!gisToken) {
        console.error("❌ Failed to generate new token after test error");
        return;
      }

      set({ gisToken });
    }

    // Fetch all groups and create a mapping of group names to IDs
    const groupNameToIdMap: { [key: string]: string } = {};
    try {
      const groupsUrl = `${portalUrl}/sharing/rest/community/groups?f=json&q=gportal_&token=${gisToken}&num=100`;

      const allGroupsRes = await fetch(groupsUrl);

      const allGroupsData = await allGroupsRes.json();

      if (allGroupsData.error) {
        console.error("❌ Portal groups API error:", allGroupsData.error);
        return;
      }

      if (allGroupsData.results) {

        // Create mapping of group titles to IDs
        allGroupsData.results.forEach((group: any) => {
          if (group.title.startsWith("gportal_")) {
            groupNameToIdMap[group.title] = group.id;
            // Mapped group title to ID
          }
        });

        // Created mapping for portal groups
      } else {
        console.error("⚠️ No groups data returned from portal");
        return;
      }
    } catch (error) {
      console.error("❌ Failed to fetch portal groups:", error);
      return;
    }

    if (!userInfo || !userInfo.groups || !targetView || !targetView.map) {
      console.error("❌ Missing required data for loading layers");
      return;
    }

    // 🔥 CLEAR EXISTING LAYERS TO PREVENT CACHING ISSUES
    console.log("🧹 Clearing existing layers before loading user groups");
    const existingLayers = targetView.map.layers.toArray();
    existingLayers.forEach(layer => {
      if ((layer as any).group) {
        targetView.map.remove(layer);
        console.log(`🗑️ Removed cached layer: ${layer.title} (group: ${(layer as any).group})`);
      }
    });

    // Processing user groups from JWT token
    console.log(`👤 Loading layers for user: ${userInfo.username}`);
    console.log(`🏷️ User JWT groups: ${JSON.stringify(userInfo.groups)}`);
    const allGroupLayers: any[] = [];

    for (const groupName of userInfo.groups) {
      // Skip if group doesn't start with gportal_
      if (!groupName.startsWith("gportal_")) {
        console.log(`⏭️ Skipping non-gportal group: ${groupName}`);
        continue;
      }

      console.log(`🔍 Processing group: ${groupName}`);

      // Get the group ID from our mapping
      const groupId = groupNameToIdMap[groupName];
      if (!groupId) {
        console.error(`❌ No group ID found for: ${groupName}`);
        console.log(`📋 Available groups in portal: ${Object.keys(groupNameToIdMap).join(', ')}`);
        continue;
      }

      console.log(`✅ Found group ID ${groupId} for ${groupName}`);

      try {
        // Use the correct API endpoint to get group content
        const groupContentUrl = `${portalUrl}/sharing/rest/content/groups/${groupId}/items?f=json&token=${gisToken}`;

        const groupContentRes = await fetch(groupContentUrl);

        if (!groupContentRes.ok) {
          console.error(`Failed to fetch group content for ${groupName}: ${groupContentRes.status}`);
          continue;
        }

        const groupContent = await groupContentRes.json();

        if (groupContent.error) {
          console.error(`❌ Group ${groupName} API error:`, groupContent.error);
          continue;
        }

        if (!groupContent.items || groupContent.items.length === 0) {
          continue;
        }

        // Attach group name to each item for later use (remove gportal_ prefix)
        groupContent.items.forEach((item: any) => {
          item._groupName = groupName.replace("gportal_", "");
        });

        console.log(`📦 Found ${groupContent.items.length} items in group ${groupName}`);
        allGroupLayers.push(...groupContent.items);
      } catch (e) {
        console.error("❌ Failed to fetch group content for group:", groupName, e);
      }
    }

    console.log(`🎯 Total layers found across all user groups: ${allGroupLayers.length}`);
    console.log(`📊 Processing layers for user: ${userInfo.username} with groups: ${userInfo.groups?.join(', ')}`);

    // Check if we have any layers to process
    if (allGroupLayers.length === 0) {
      console.warn("⚠️ No layers found from user groups, attempting backup basemap loading...");
      const { loadBackupBasemapLayers } = get();
      await loadBackupBasemapLayers(portalUrl, gisToken, targetView, groupNameToIdMap);
      return;
    }

    let successfullyAddedLayers = 0;
    const layerPromises: Promise<number>[] = [];

    allGroupLayers.forEach((item) => {
      let layer: any = null;

      if (item.url) {
        item.url = item.url.replace(/^http:/, "https:");
      }

      if (item.type === "Feature Service" || item.type.includes("Feature Layer")) {
        // Try to fetch sublayers and add each as a FeatureLayer
        const featureLayerPromise = (async (): Promise<number> => {
          let addedCount = 0;
          try {
            const serviceUrl = item.url.replace(/\/+$/, "");
            const metadataUrl = `${serviceUrl}?f=json${gisToken ? `&token=${gisToken}` : ''}`;

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
                  visible: sublayer.defaultVisibility !== false, // Use default visibility from service
                });
                if (item._groupName) {
                  (subLayerInstance as any).group = item._groupName;
                }
                targetView.map.add(subLayerInstance);
                addedCount++;
              });
            } else {
              // Not a FeatureServer with multiple layers, or error fetching metadata, or no sublayers.
              const featureLayer = new FeatureLayer({
                url: item.url,
                id: item.id,
                title: item.title,
                outFields: ["*"],
                visible: true, // Single feature layers are usually visible by default
              });
              if (item._groupName) {
                (featureLayer as any).group = item._groupName;
              }
              targetView.map.add(featureLayer);
              addedCount++;
            }
          } catch (error) {
            console.error(`❌ Failed to process FeatureLayer URL ${item.url}:`, error);
            // Fallback: create as a single FeatureLayer on any error during fetch/processing
            const featureLayer = new FeatureLayer({
              url: item.url,
              id: item.id,
              title: item.title,
              outFields: ["*"],
              visible: true, // Single feature layers are usually visible by default
            });
            if (item._groupName) {
              (featureLayer as any).group = item._groupName;
            }
            targetView.map.add(featureLayer);
            addedCount++;
          }
          return addedCount;
        })();
        layerPromises.push(featureLayerPromise);
        return;
      } else if (item.type.includes("Map Service")) {
        // Fetch sublayers and add each as a FeatureLayer
        const mapServicePromise = (async (): Promise<number> => {
          let addedCount = 0;
          try {
            const response = await fetch(`${item.url}?f=json&token=${gisToken}`);
            const data = await response.json();

            if (data.error) {
              // fallback: add as MapImageLayer if metadata fetch fails
              layer = new MapImageLayer({ url: item.url, visible: false });
              if (item._groupName) {
                (layer as any).group = item._groupName;
              }
              targetView.map.add(layer);
              addedCount++;
            } else if (Array.isArray(data.layers)) {
              // Add each sublayer as a separate FeatureLayer
              data.layers.reverse().forEach((sublayer: any) => {
                const subLayerInstance = new FeatureLayer({
                  url: `${item.url.replace(/\/+$/, "")}/${sublayer.id}`,
                  id: `${item.id}_${sublayer.id}`,
                  title: sublayer.name,
                  outFields: ["*"],
                  visible: sublayer.defaultVisibility !== false, // Use default visibility from service
                });
                if (item._groupName) {
                  (subLayerInstance as any).group = item._groupName;
                }
                targetView.map.add(subLayerInstance);
                addedCount++;
              });
            } else {
              // fallback: add as MapImageLayer if no sublayers
              layer = new MapImageLayer({ url: item.url, visible: false });
              if (item._groupName) {
                (layer as any).group = item._groupName;
              }
              targetView.map.add(layer);
              addedCount++;
            }
          } catch (error) {
            console.error("❌ Failed to fetch Map Service sublayers:", error);
            // fallback: add as MapImageLayer on error
            layer = new MapImageLayer({ url: item.url, visible: false });
            if (item._groupName) {
              (layer as any).group = item._groupName;
            }
            targetView.map.add(layer);
            addedCount++;
          }
          return addedCount;
        })();
        layerPromises.push(mapServicePromise);
        return;
      } else if (item.type.includes("Tile")) {
        layer = new TileLayer({ url: item.url, visible: true }); // Tile layers are usually visible by default
      } else if (item.type.includes("Vector")) {
        layer = new VectorTileLayer({ url: item.url, visible: true }); // Vector tile layers are usually visible by default
      }

      if (layer && item._groupName) {
        (layer as any).group = item._groupName;
      }

      if (layer) {
        targetView.map.add(layer);
        successfullyAddedLayers++;
      } else {
      }
    });

    // Wait for all async layer operations to complete
    if (layerPromises.length > 0) {
      console.log(`⏳ Waiting for ${layerPromises.length} async layer operations to complete...`);
      try {
        const layerCounts = await Promise.all(layerPromises);
        const asyncLayersAdded = layerCounts.reduce((sum, count) => sum + count, 0);
        successfullyAddedLayers += asyncLayersAdded;
        console.log(`✅ Async layer operations completed. Added ${asyncLayersAdded} async layers`);
      } catch (error) {
        console.error("❌ Error waiting for async layer operations:", error);
      }
    }

    // Check if we successfully added any layers from user groups
    console.log(`🎯 Successfully added ${successfullyAddedLayers} layers from user groups`);
    
    if (successfullyAddedLayers === 0) {
      console.warn("⚠️ No layers were successfully added from user groups, attempting backup basemap loading...");
      const { loadBackupBasemapLayers } = get();
      await loadBackupBasemapLayers(portalUrl, gisToken, targetView, groupNameToIdMap);
    }
  },

  sessionModalOpen: false,
  setSessionModalOpen: (open: boolean) => {
    set({ sessionModalOpen: open });
  },
  handleSessionExtend: async () => {
    set({ sessionModalOpen: false });
    // Actually refresh the token when extending the session
    try {
      // Import authenticateArcGIS dynamically to avoid circular dependencies
      const { authenticateArcGIS } = await import('./lib/utils/authenticate-arcgis');
      const success = await authenticateArcGIS();
      if (success) {
        // Set a new expiry time in cookie
        const now = Date.now();
        const expiry = now + 60 * 60 * 1000; // 1 hour
        document.cookie = `arcgis_token_expiry=${expiry}; path=/; secure; samesite=strict`;
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  },
  updateStats: (featurename: string) => {
    incrementStatisticsFeature(featurename, get().userInfo?.fullName || "").then((response) => {
      // console.log(response.message);
    })
  }

}));

export default useStateStore;
