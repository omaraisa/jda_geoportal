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

export const LayoutManager = (state, action) => {
  switch (action.type) {
    case "goToSubMenu":
      return goToSubMenu(state, action.targetComponent);
    case "goToPreSubMenu":
      return goToPreSubMenu(state, action);
    case "goToBottomPane":
      return goToBottomPane(state, action.targetComponent);
    case "goToPreBottomPane":
      return goToPreBottomPane(state, action);
    case "changeLayout":
      return changeLayout(state, action);
    case "resizeMenu":
      return resizeMenu(state, action);
    case "toggleMenus":
      return toggleMenus(state, action);
    default:
      return {
        type: "error",
        title: "إجراء خاطئ",
        body: "تعذر تعديل واجهة التطبيق بالشكل الذي تريده",
      };
  }
};

const toggleMenus = (state, { side }) => {
  const toggleSides = {
    right: () => toggleRightMenu(),
    left: () => toggleLeftMenu(),
    bottom: () => toggleBottomMenu(),
  };

  function toggleRightMenu() {
    const isMinimized = state.layout.rightPaneMinimized;

    const newLayout = {
      ...state.layout,
      rightPaneSize: isMinimized ? 20 : 0, // Restore to 20% or collapse to 0%
      rightPaneArrow: isMinimized ? "▶" : "◀", // Update arrow direction
      rightPaneMinimized: !isMinimized, // Toggle minimized state
      middlePaneSize: isMinimized
        ? state.layout.middlePaneSize - 20
        : state.layout.middlePaneSize + state.layout.rightPaneSize, // Adjust middle pane size
    };

    return { ...state, layout: newLayout };
  }

  function toggleLeftMenu() {
    const isMinimized = state.layout.leftPaneMinimized;

    const newLayout = {
      ...state.layout,
      leftPaneSize: isMinimized ? 20 : 0, // Restore to 20% or collapse to 0%
      leftPaneArrow: isMinimized ? "◀" : "▶", // Update arrow direction
      leftPaneMinimized: !isMinimized, // Toggle minimized state
      middlePaneSize: isMinimized
        ? state.layout.middlePaneSize - 20
        : state.layout.middlePaneSize + state.layout.leftPaneSize,
    };
    return { ...state, layout: newLayout };
  }

  function toggleBottomMenu() {
    const isMinimized = state.layout.bottomPaneMinimized;

    const newLayout = {
      ...state.layout,
      bottomPaneSize: isMinimized ? 20 : 0, // Restore to 20% or collapse to 0%
      // middlePaneSize: isMinimized
      //   ? state.layout.middlePaneSize - 20
      //   : state.layout.middlePaneSize + 20,
      mapContainerSize: isMinimized
        ? 80
        : 100,
      bottomPaneArrow: isMinimized ? "▼" : "▲", // Update arrow direction
      bottomPaneMinimized: !isMinimized, // Toggle minimized state
    };

    return { ...state, layout: newLayout };
  }

  return toggleSides[side]();
};

const changeLayout = (state, { event, targetPaneFlex }) => {
  const newPaneFlex = event.component.props.flex;
  const deltaFlex = newPaneFlex - state.layout[targetPaneFlex];
  const newMiddlePaneFlex = state.layout.middlePaneFlex - deltaFlex;
  let newState = {
    ...state,
    layout: { ...state.layout, middlePaneFlex: newMiddlePaneFlex },
  };
  newState.layout[targetPaneFlex] = newPaneFlex;
  return newState;
};

const resizeMenu = (state, { dragStatus }) => {
  if (dragStatus === "start")
    return { ...state, layout: { ...state.layout, animationOn: false } };
  if (dragStatus === "end")
    return { ...state, layout: { ...state.layout, animationOn: true } };
};

const goToSubMenu = (state, targetComponent) => {
  const expandPaneProps = {
    leftPaneArrow: "◀",
    leftPaneFlex: 0.2,
    leftPaneMinSize: 250,
    leftPaneMaxSize: 500,
    leftPaneMinimized: false,
    middlePaneFlex: state.layout.middlePaneFlex - 0.2,
  };
  const minimizePaneProps = {
    leftPaneArrow: "▶",
    leftPaneFlex: 0,
    leftPaneMinSize: 0,
    leftPaneMaxSize: 1,
    leftPaneMinimized: true,
    middlePaneFlex: state.layout.middlePaneFlex + 0.2,
  };

  let newLayout = { ...state.layout, subMenuCurrentComponent: targetComponent };

  if (state.layout.leftPaneMinimized)
    newLayout = { ...newLayout, ...expandPaneProps };

  if (targetComponent === "DefaultPane")
    newLayout = { ...newLayout, ...minimizePaneProps };

  return { ...state, layout: newLayout };

  // return {...state,layout:{...state.layout,subMenuCurrentComponent:targetComponent}}
};

const goToPreSubMenu = (state, { previousComponent }) => {
  if (previousComponent)
    return {
      ...state,
      layout: { ...state.layout, subMenuCurrentComponent: previousComponent },
    };
};

const goToBottomPane = (state, targetComponent) => {
  const expandPaneProps = {
    mapPaneFlex: 0.6,
    bottomPaneFlex: 0.4,
    bottomPaneArrow: "▼",
    bottomPaneMaxSize: 2000,
    bottomPaneMinimized: false,
  };

  let newLayout = {
    ...state.layout,
    bottomPaneCurrentComponent: targetComponent,
  };
  if (state.layout.bottomPaneMinimized)
    newLayout = { ...newLayout, ...expandPaneProps };

  return { ...state, layout: newLayout };
};

const goToPreBottomPane = (state, { previousComponent }) => {
  return {
    ...state,
    layout: { ...state.layout, bottomPaneCurrentComponent: previousComponent },
  };
};
