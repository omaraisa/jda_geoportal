export const defaultLayout = {
  // Left Pane
  leftPaneSize: 20, // Percentage width of the left pane
  leftPaneMinSize: 0.1, // Minimum percentage width
  leftPaneMaxSize: 30, // Maximum percentage width
  leftPaneArrow: "◀",
  leftPaneMinimized: false,

  // Right Pane
  rightPaneSize: 20, // Percentage width of the right pane
  rightPaneMinSize: 0.1, // Minimum percentage width
  rightPaneMaxSize: 30, // Maximum percentage width
  rightPaneArrow: "▶",
  rightPaneMinimized: false,

  // Middle Pane (Map View)
  middlePaneSize: 100, // Percentage width of the middle pane
  middlePaneMinSize: 20, // Minimum percentage width

  // Map Container
  mapContainerSize: 100, // Percentage width of the map container
  mapContainerMinSize: 20, // Minimum percentage width

  // Bottom Pane
  bottomPaneSize: 0, // Percentage height of the bottom pane
  bottomPaneMinSize: 0.1, // Minimum percentage height
  bottomPaneMaxSize: 80, // Maximum percentage height
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
    right: () => toggleRightMenu(),
    left: () => toggleLeftMenu(),
    bottom: () => toggleBottomMenu(),
  };

  function toggleRightMenu() {
    const isMinimized = layout.rightPaneMinimized;

    return {
      ...layout,
      rightPaneSize: isMinimized ? 20 : 0, // Restore or collapse
      rightPaneArrow: isMinimized ? "▶" : "◀", // Update arrow direction
      rightPaneMinimized: !isMinimized, // Toggle state
      middlePaneSize: isMinimized
        ? layout.middlePaneSize - 20
        : layout.middlePaneSize + layout.rightPaneSize, // Adjust middle pane
    };
  }

  function toggleLeftMenu() {
    const isMinimized = layout.leftPaneMinimized;

    return {
      ...layout,
      leftPaneSize: isMinimized ? 20 : 0, // Restore or collapse
      leftPaneArrow: isMinimized ? "◀" : "▶", // Update arrow direction
      leftPaneMinimized: !isMinimized, // Toggle state
      middlePaneSize: isMinimized
        ? layout.middlePaneSize - 20
        : layout.middlePaneSize + layout.leftPaneSize, // Adjust middle pane
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

const changeLayout = (layout, { event, targetPaneFlex }) => {
  const newPaneFlex = event.component.props.flex;
  const deltaFlex = newPaneFlex - layout[targetPaneFlex];
  const newMiddlePaneFlex = layout.middlePaneFlex - deltaFlex;

  return {
    ...layout,
    [targetPaneFlex]: newPaneFlex,
    middlePaneFlex: newMiddlePaneFlex,
  };
};

const resizeMenu = (layout, dragStatus) => {
  return {
    ...layout,
    animationOn: dragStatus === "end",
  };
};

const goToSubMenu = (layout, targetComponent) => {
  const expandPaneProps = {
    leftPaneArrow: "◀",
    leftPaneSize: 20,
    leftPaneMinimized: false,
    middlePaneSize: layout.middlePaneSize - 20,
  };
  const minimizePaneProps = {
    leftPaneArrow: "▶",
    leftPaneSize: 0,
    leftPaneMinimized: true,
    middlePaneSize: layout.middlePaneSize + 20,
  };

  let newLayout = { ...layout, subMenuCurrentComponent: targetComponent };

  if (layout.leftPaneMinimized) newLayout = { ...newLayout, ...expandPaneProps };

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
