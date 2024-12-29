import React, { createContext, useReducer, useContext } from "react";

const LayoutContext = createContext();

export const defaultLayout = {
  leftPaneArrow: "▶",
  leftPaneFlex: 0,
  leftPaneMinSize: 0,
  leftPaneMaxSize: 1,
  leftPaneMinimized: true,
  rightPaneArrow: "▶",
  rightPaneFlex: 0.2,
  rightPaneMinSize: 300,
  rightPaneMaxSize: 500,
  rightPaneMinimized: false,
  middlePaneFlex: 0.8,
  middlePaneMinSize: 600,
  mapPaneFlex: 1,
  bottomPaneFlex: 0,
  bottomPaneArrow: "▲",
  bottomPaneMinSize: 0,
  bottomPaneMaxSize: 1,
  bottomPaneMinimized: true,
  animationOn: false,
  subMenuCurrentComponent: "DefaultPane",
  bottomPaneCurrentComponent: "DefaultPane",
};

function layoutReducer(state, action) {
    switch (action.type) {
      case "togglePane": {
        const { side } = action;
        const pane = state[`${side}Pane`];
  
        return {
          ...state,
          [`${side}Pane`]: {
            ...pane,
            minimized: !pane.minimized,
            arrow: pane.minimized
              ? side === "left"
                ? "◀"
                : side === "right"
                ? "▶"
                : side === "bottom"
                ? "▼"
                : "▲"
              : side === "left"
              ? "▶"
              : side === "right"
              ? "◀"
              : side === "bottom"
              ? "▲"
              : "▼",
            flex: pane.minimized ? pane.maxSize : pane.minSize,
          },
        };
      }
      default:
        return state;
    }
  }
  

// Context Provider
export function LayoutProvider({ children }) {
  const [state, dispatch] = useReducer(layoutReducer, defaultLayout);

  return (
    <LayoutContext.Provider value={{ state, dispatch }}>
      {children}
    </LayoutContext.Provider>
  );
}

// Custom hook for consuming the layout context
export function useLayout() {
  return useContext(LayoutContext);
}
