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
  title: string;
  type: string;
  sourceType: string;
  url?: string;
  portalItemId?: string | null;
  groups?: any[];
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
    toolsMenuExpanded: boolean;
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
  maplayers: __esri.Layer[];
  scenelayers: __esri.Layer[];
  widgets: Record<string, __esri.Widget>;
  targetLayerId: string | null;
  center: [number, number];
  zoom: number;
  scale: number;
  viewsSyncOn: boolean;
  previousSideBars: Record<string, string | null>;
  messages: Record<number, Message>;
  bookmarks: Bookmark[];
  setAppReady: (isReady: boolean) => void;
  setLanguage: (lang: string) => void;
  setToolsMenuExpansion: (isExpanded: boolean) => void;
  toggleSidebar: (isOpen: boolean) => void;
  toggleBottomPane: (isOpen: boolean) => void;
  setActiveSideBar: (component: string) => void;
  setActiveBottomPane: (component: string) => void;
  updateTargetView: (targetView: __esri.MapView | __esri.SceneView | null) => void;
  updateMapView: (mapView: __esri.MapView | null) => void;
  updateSceneView: (sceneView: __esri.SceneView | null) => void;
  createLayer: (params: InitialLayersConfiguration) => __esri.FeatureLayer;
  addInitialLayers: (layers: InitialLayersConfiguration[], targetView: __esri.MapView | __esri.SceneView) => void;
  setTargetLayerId: (id: string) => void;
  setSyncing: (isOn: boolean) => void;
  getTargetLayer: () => __esri.FeatureLayer | null;
  switchViewMode: (mode: "2D" | "3D" | "Dual") => void;
  addWidget: (widgetId: string, widgetInstance: __esri.Widget) => void;
  removeWidget: (widgetId: string) => void;
  addMessage: (params: { title: string; body: string; type: "error" | "warning" | "info"; duration?: number }) => void;
  expireMessage: (id: number) => void;
  removeMessage: (id: number) => void;
  addBookmark: (name: string, view: __esri.MapView | __esri.SceneView) => void;
  deleteBookmark: (id: number) => void;
  loadBookmarks: () => void;
}
