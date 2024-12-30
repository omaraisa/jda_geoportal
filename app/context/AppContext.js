"use client";

import React, { createContext, useReducer, useContext } from "react";
import { defaultLayout, LayoutManager } from "../components/layout-management";

// Create the Context
const AppContext = createContext();

// Initial State
const initialState = {
  layout: defaultLayout,
  map: null,
  view: null,
  layers: [],
  widgets: {},
  targetLayers: {},
  mapDefinition: {
    layerSources: [],
  },
};

// Reducer for managing state
const reducer = (state, action) => {
  switch (action.type) {
    case "goToSubMenu":
    case "changeLayout":
    case "goToPreSubMenu":
    case "goToPreBottomPane":
    case "goToBottomPane":
    case "resizeMenu":
    case "toggleMenus":
      const LayoutResponse = LayoutManager(state, action);
      return LayoutResponse.type === "error" ? state : LayoutResponse;

    default:
      return state;
  }
};

// Provider Component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Define actions that wrap dispatch
  const actions = {
    goToSubMenu: (targetComponent) =>
      dispatch({ type: "goToSubMenu", targetComponent }),
    goToBottomPane: (targetComponent) =>
      dispatch({ type: "goToBottomPane", targetComponent }),
    updateLayers: (layers) => dispatch({ type: "updateLayers", layers }),
    updateLayerSources: (layerSources) =>
      dispatch({ type: "updateLayerSources", layerSources }),
    updateTargetLayers: (layer) =>
      dispatch({ type: "updateTargetLayers", layer }),
    sendBackMapView: (map, view) =>
      dispatch({ type: "sendBackMapView", map, view }),
  };

  // Expose both state and actions through context
  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook to Use Context
export const useAppContext = () => {
  return useContext(AppContext);
};
