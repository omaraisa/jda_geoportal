export const defaultLayout = {
  toolsMenuExpanded: false,
  sidebarOpen: false,
  sidebarHeight: 0, 
  bottomPaneOpen: false,

};

export const LayoutManager = (layout, action) => {
  switch (action.type) {
    case "goToSideBar":
      return goToSideBar(layout, action.targetComponent);
    case "goToPreSideBar":
      return goToPreSideBar(layout, action.previousComponent);
    case "goToBottomPane":
      return goToBottomPane(layout, action.targetComponent);
    case "goToPreBottomPane":
      return goToPreBottomPane(layout, action.previousComponent);
    case "changeLayout":
      return changeLayout(layout, action);
    case "resizeMenu":
      return resizeMenu(layout, action.dragStatus);
    case "toggleMenus":
      return toggleMenus(layout, action.side);
    default:
      return layout; // Return the original layout if the action type is unknown
  }
};

const goToSideBar = (layout, targetComponent) => {
  const expandPaneProps = {
    primaryPaneArrow: "◀",
    primaryPaneSize: 20,
    primaryPaneMinimized: false,
    middlePaneSize: layout.middlePaneSize - 20,
  };
  const minimizePaneProps = {
    primaryPaneArrow: "▶",
    primaryPaneSize: 0,
    primaryPaneMinimized: true,
    middlePaneSize: layout.middlePaneSize + 20,
  };

  let newLayout = { ...layout, sidebarCurrentComponent: targetComponent };

  if (layout.primaryPaneMinimized) newLayout = { ...newLayout, ...expandPaneProps };

  if (targetComponent === "DefaultPane")
    newLayout = { ...newLayout, ...minimizePaneProps };

  return newLayout;
};

const goToPreSideBar = (layout, previousComponent) => {
  if (previousComponent)
    return { ...layout, sidebarCurrentComponent: previousComponent };
  return layout;
};

const goToBottomPane = (layout, targetComponent) => {
  const expandPaneProps = {
    mapContainerSize: 60,
    bottomPaneSize: 40,
    bottomPaneArrow: "▼",
    bottomPaneOpen: false,
  };

  let newLayout = { ...layout, bottomPaneCurrentComponent: targetComponent };

  if (layout.bottomPaneOpen)
    newLayout = { ...newLayout, ...expandPaneProps };

  return newLayout;
};

const goToPreBottomPane = (layout, previousComponent) => {
  return { ...layout, bottomPaneCurrentComponent: previousComponent };
};
