import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export interface Message {
  id: string;
  title: string;
  body: string;
  type: "error" | "warning" | "info";
  duration: number;
  expireAt: Date;
  expired: boolean;
}

export interface Bookmark {
  id: string;
  name: string;
  center: { x: number; y: number };
  zoom: number;
  view?: {
    goTo: (params: { center: [number, number]; zoom: number }) => void;
  };
  deleteBookmark: (id: string) => void;
}

export interface ViewLocation {
  center: [number, number];
  zoom: number;
  scale: number;
}

export interface InitialLayersConfiguration {
  id: string;
  title: string;
  type: "FeatureLayer" | "MapImageLayer" | "TileLayer" | "VectorTileLayer";
  sourceType: string;
  url?: string;
  portalItemId?: string | null;
  group?: string;
  visible?: boolean;
  labelsEnabled?: boolean;
  labelingInfo?: any;
  renderer?: any;
  opacity?: number;
  minScale?: number;
  maxScale?: number;
  visualVariables?: __esri.VisualVariable[] | [];
}

export interface State {
  language: string;
  layout: {
    mainMenuExpanded: boolean;
    sidebarOpen: boolean;
    sidebarHeight: number;
    bottomPaneOpen: boolean;
  };
  activeSideBar: string;
  appReady: boolean;
  previousSideBar: string | null;
  activeBottomPane: string;
  viewMode: "2D" | "3D" | "Dual";
  mapView: __esri.MapView | null;
  sceneView: __esri.SceneView | null;
  targetView: __esri.MapView | __esri.SceneView | null;
  widgets: Record<string, __esri.Widget>;
  targetLayerId: string | null;
  center: [number, number];
  zoom: number;
  scale: number;
  viewsSyncOn: boolean;
  previousSideBars: Record<string, string | null>;
  messages: Record<number, Message>;
  bookmarks: Bookmark[];
  userInfo: ArcGISUserInfo | null;
  setAppReady: (isReady: boolean) => void;
  setLanguage: (lang: string) => void;
  setMainMenuExpansion: (isExpanded: boolean) => void;
  toggleSidebar: (isOpen: boolean) => void;
  toggleBottomPane: (isOpen: boolean) => void;
  setActiveSideBar: (component: string) => void;
  setActiveBottomPane: (component: string) => void;
  updateTargetView: (targetView: __esri.MapView | __esri.SceneView | null) => void;
  updateMapView: (mapView: __esri.MapView | null) => void;
  updateSceneView: (sceneView: __esri.SceneView | null) => void;
  createLayer: (params: InitialLayersConfiguration) => void;
  addBasemapLayers: () => void;
  setTargetLayerId: (id: string) => void;
  setSyncing: (isOn: boolean) => void;
  getTargetLayer: () => __esri.FeatureLayer | null;
  switchViewMode: (mode: "2D" | "3D" | "Dual") => void;
  addWidget: (widgetId: string, widgetInstance: __esri.Widget) => void;
  removeWidget: (widgetId: string) => void;
  sendMessage: (params: { title: string; body: string; type: "error" | "warning" | "info"; duration?: number }) => void;
  expireMessage: (id: number) => void;
  removeMessage: (id: number) => void;
  addBookmark: (name: string, view: __esri.MapView | __esri.SceneView) => void;
  deleteBookmark: (id: number) => void;
  loadBookmarks: () => void;
  loadUserGroupLayers: () => void;
  setUserInfo: (userInfo: ArcGISUserInfo) => void;

  // Session modal state and handlers
  sessionModalOpen: boolean;
  setSessionModalOpen: (open: boolean) => void;
  handleSessionExtend: () => void;
  // Optionally, if you want to expose handleSessionExit:
  // handleSessionExit: () => void;
}

export interface AttributeQueryState {
  targetLayer: FeatureLayer | null;
  queryResultLayer: FeatureLayer | null;
  resultLayerSource: Graphic[] | null;
  fieldsNames: string[];
  inputMethod: string;
  downloadBtnDisabled: boolean;
  uniqueValues: string[];
  graphicsLayer: GraphicsLayer | null;
  queryResult?: any[];
  selectedField: string;
}

export interface ArcGISUserInfo {
  fullName: string | null;
  username: string | null;
  org_role: string | null;
  role: string | null;
  groups: {
    id: string;
    title: string;
    isInvitationOnly: boolean;
    owner: string;
    description: null | string;
    snippet: null | string;
    tags: string[];
    typeKeywords: string[];
    phone: null | string;
    sortField: string;
    sortOrder: string;
    isViewOnly: boolean;
    featuredItemsId: null | string;
    thumbnail: null | string;
    created: number;
    modified: number;
    access: string;
    capabilities: string[];
    isFav: boolean;
    isReadOnly: boolean;
    protected: boolean;
    autoJoin: boolean;
    notificationsEnabled: boolean;
    provider: null | string;
    providerGroupName: null | string;
    leavingDisallowed: boolean;
    hiddenMembers: boolean;
    membershipAccess: string;
    displaySettings: {
      itemTypes: string;
    } | null;
    properties: null | string | null;
    userMembership: {
      username: string | null;
      memberType: string | null;
    } | null;
  }[] | null;
};