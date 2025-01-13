export const defaultLayout = {
  // Primary Pane
  primaryPaneSize: 20, // Percentage width of the primary pane
  primaryPaneMinSize: 0, // Minimum percentage width
  primaryPaneArrow: "◀",
  primaryPaneMinimized: false,

  // Secondary Pane
  secondaryPaneSize: 0, // Percentage width of the secondary pane
  secondaryPaneMinSize: 0, // Minimum percentage width
  secondaryPaneArrow: "◀",
  secondaryPaneMinimized: true,

  // Middle Pane (Map View)
  middlePaneSize: 80, // Percentage width of the middle pane
  middlePaneMinSize: 60, // Minimum percentage width

  // Map Container
  mapContainerSize: 100, // Percentage width of the map container
  mapContainerMinSize: 20, // Minimum percentage width

  // Bottom Pane
  bottomPaneSize: 0, // Percentage height of the bottom pane
  bottomPaneMinSize: 0, // Minimum percentage height
  bottomPaneArrow: "▲",
  bottomPaneMinimized: true,

  // Animation
  animationOn: true, // Enables smooth resizing animations

  // Submenu and Bottom Pane States
  subMenuCurrentComponent: "DefaultPane", // Active component in the submenu
  bottomPaneCurrentComponent: "DefaultPane", // Active component in the bottom pane
};

export const LayoutManager = (layout, action) => {
  switch (action.type) {
    case "goToSubMenu":
      return goToSubMenu(layout, action.targetComponent);
    case "goToPreSubMenu":
      return goToPreSubMenu(layout, action.previousComponent);
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

const toggleMenus = (layout, side) => {
  const toggleSides = {
    secondary: () => toggleSecondaryMenu(),
    primary: () => togglePrimaryMenu(),
    bottom: () => toggleBottomMenu(),
  };

  function toggleSecondaryMenu() {
    const isMinimized = layout.secondaryPaneMinimized;

    return {
      ...layout,
      secondaryPaneSize: isMinimized ? 20 : 0, // Restore or collapse
      secondaryPaneArrow: isMinimized ? "▶" : "◀", // Update arrow direction
      secondaryPaneMinimized: !isMinimized, // Toggle state
      middlePaneSize: isMinimized
        ? layout.middlePaneSize - 20
        : layout.middlePaneSize + layout.secondaryPaneSize, // Adjust middle pane
    };
  }

  function togglePrimaryMenu() {
    const isMinimized = layout.primaryPaneMinimized;

    return {
      ...layout,
      primaryPaneSize: isMinimized ? 20 : 0, // Restore or collapse
      primaryPaneArrow: isMinimized ? "◀" : "▶", // Update arrow direction
      primaryPaneMinimized: !isMinimized, // Toggle state
      middlePaneSize: isMinimized
        ? layout.middlePaneSize - 20
        : layout.middlePaneSize + layout.primaryPaneSize, // Adjust middle pane
    };
  }

  function toggleBottomMenu() {
    const isMinimized = layout.bottomPaneMinimized;

    return {
      ...layout,
      bottomPaneSize: isMinimized ? 20 : 0, // Restore or collapse
      mapContainerSize: isMinimized ? 80 : 100, // Adjust map container size
      bottomPaneArrow: isMinimized ? "▼" : "▲", // Update arrow direction
      bottomPaneMinimized: !isMinimized, // Toggle state
    };
  }

  return toggleSides[side]();
};


const goToSubMenu = (layout, targetComponent) => {
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

  let newLayout = { ...layout, subMenuCurrentComponent: targetComponent };

  if (layout.primaryPaneMinimized) newLayout = { ...newLayout, ...expandPaneProps };

  if (targetComponent === "DefaultPane")
    newLayout = { ...newLayout, ...minimizePaneProps };

  return newLayout;
};

const goToPreSubMenu = (layout, previousComponent) => {
  if (previousComponent)
    return { ...layout, subMenuCurrentComponent: previousComponent };
  return layout;
};

const goToBottomPane = (layout, targetComponent) => {
  const expandPaneProps = {
    mapContainerSize: 60,
    bottomPaneSize: 40,
    bottomPaneArrow: "▼",
    bottomPaneMinimized: false,
  };

  let newLayout = { ...layout, bottomPaneCurrentComponent: targetComponent };

  if (layout.bottomPaneMinimized)
    newLayout = { ...newLayout, ...expandPaneProps };

  return newLayout;
};

const goToPreBottomPane = (layout, previousComponent) => {
  return { ...layout, bottomPaneCurrentComponent: previousComponent };
};
