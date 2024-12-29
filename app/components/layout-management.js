export const defaultLayout = {
  // Left Pane
  leftPaneSize: 20, // Percentage width of the left pane
  leftPaneMinSize: 10, // Minimum percentage width
  leftPaneMaxSize: 30, // Maximum percentage width
  leftPaneArrow: "▶",
  leftPaneMinimized: false,

  // Right Pane
  rightPaneSize: 20, // Percentage width of the right pane
  rightPaneMinSize: 10, // Minimum percentage width
  rightPaneMaxSize: 30, // Maximum percentage width
  rightPaneArrow: "▶",
  rightPaneMinimized: false,

  // Middle Pane (Map View)
  middlePaneSize: 60, // Percentage width of the middle pane
  middlePaneMinSize: 40, // Minimum percentage width

  // Bottom Pane
  bottomPaneSize: 20, // Percentage height of the bottom pane
  bottomPaneMinSize: 10, // Minimum percentage height
  bottomPaneMaxSize: 40, // Maximum percentage height
  bottomPaneArrow: "▲",
  bottomPaneMinimized: false,

  // Animation
  animationOn: true, // Enables smooth resizing animations

  // Submenu and Bottom Pane States
  subMenuCurrentComponent: "DefaultPane", // Active component in the submenu
  bottomPaneCurrentComponent: "DefaultPane", // Active component in the bottom pane
};


export const LayoutManager = (state,action) => {
  switch (action.type) {
    case 'goToSubMenu':
      return goToSubMenu(state, action.targetComponent);
      case 'goToPreSubMenu':
        return goToPreSubMenu(state,action)
        case 'goToBottomPane':
          return goToBottomPane(state, action.targetComponent);
    case 'goToPreBottomPane':
      return goToPreBottomPane(state, action);
    case 'changeLayout':
      return changeLayout(state,action)
    case 'resizeMenu':
      return resizeMenu(state,action)
    case 'toggleMenus':
      return toggleMenus(state,action)
    default:
      return {type:"error", title:"إجراء خاطئ", body:"تعذر تعديل واجهة التطبيق بالشكل الذي تريده"}
     
  }


}

   const updateMenusProps = ([side,newMiddlePaneFlex,paneArrow,paneFlex,paneMinSize,paneMaxSize,paneMinimized,animationOn]) => {
    const updatedMenuProps = {}
    updatedMenuProps[`middlePaneFlex`] = newMiddlePaneFlex
    updatedMenuProps[`${side}PaneArrow`] = paneArrow
    updatedMenuProps[`${side}PaneFlex`] = paneFlex
    updatedMenuProps[`${side}PaneMinSize`] = paneMinSize
    updatedMenuProps[`${side}PaneMaxSize`] = paneMaxSize
    updatedMenuProps[`${side}PaneMinimized`] = paneMinimized
    updatedMenuProps[`animationOn`] = animationOn
    return updatedMenuProps
  }
   const updateMiddlePaneProps = (mapPaneFlex,bottomPaneFlex,bottomPaneMaxSize,bottomPaneMinSize,bottomPaneArrow,bottomPaneMinimized) => {
    return {mapPaneFlex,bottomPaneFlex,bottomPaneMaxSize,bottomPaneMinSize,bottomPaneArrow,bottomPaneMinimized}
  }

   const toggleMenus = (state,{side})  =>  {
     const toggleSides = {
       right: () => toogleRightMenu(),
       left: () => toogleLeftMenu(),
       bottom: () => toogleBottomMenu(),
     }
     function toogleRightMenu() {
       const newLayout = state.layout.rightPaneMinimized?
       {...state.layout,...updateMenusProps(["right",(state.layout.middlePaneFlex - 0.2),"▶",0.21,200,500,false,true])}
       :
       {...state.layout,...updateMenusProps(["right",(state.layout.middlePaneFlex + state.layout.rightPaneFlex),"◀",0,0,1,true,true])}
       const newState = {...state,layout:newLayout}
       return newState
      }

     function toogleLeftMenu() {
       const newLayout = state.layout.leftPaneMinimized?
       {...state.layout,...updateMenusProps(["left",(state.layout.middlePaneFlex - 0.2),"◀",0.21,250,500,false,true])}
       :
       {...state.layout,...updateMenusProps(["left",(state.layout.middlePaneFlex + state.layout.leftPaneFlex),"▶",0,0,1,true,true])}
       const newState = {...state,layout:newLayout}
       return newState
      }
      
      function toogleBottomMenu() {
       const newLayout = state.layout.bottomPaneMinimized?
       {...state.layout,...updateMiddlePaneProps(0.6,0.4,2000,50,"▼",false)}
       :
       {...state.layout,...updateMiddlePaneProps(1,0,1,0,"▲",true)}
       const newState = {...state,layout:newLayout}
       return newState
      }

      return toggleSides[side]()
   
  }

  
   const changeLayout = (state,{event, targetPaneFlex})   => {
    const newPaneFlex = event.component.props.flex;
    const deltaFlex = newPaneFlex - state.layout[targetPaneFlex];
    const newMiddlePaneFlex = state.layout.middlePaneFlex - deltaFlex;
    let newState = {...state,layout:{...state.layout,middlePaneFlex:newMiddlePaneFlex}} 
    newState.layout[targetPaneFlex] = newPaneFlex;
    return newState
  }
  
   const resizeMenu = (state,{dragStatus})   => {
    if(dragStatus === "start")  
    return {...state,layout:{...state.layout,animationOn:false}};
    if(dragStatus === "end")   
    return {...state,layout:{...state.layout,animationOn:true}};
  }
  
   const goToSubMenu =  (state,targetComponent)  =>  {
    const expandPaneProps = {
          leftPaneArrow: "◀",
          leftPaneFlex: 0.2,
          leftPaneMinSize: 250,
          leftPaneMaxSize: 500,
          leftPaneMinimized: false,
          middlePaneFlex: state.layout.middlePaneFlex - 0.2,
    }
    const minimizePaneProps = {
          leftPaneArrow: "▶",
          leftPaneFlex: 0,
          leftPaneMinSize: 0,
          leftPaneMaxSize: 1,
          leftPaneMinimized: true,
          middlePaneFlex: state.layout.middlePaneFlex + 0.2,
    }

    let newLayout = {...state.layout,subMenuCurrentComponent:targetComponent}
    
    if (state.layout.leftPaneMinimized) 
    newLayout = {...newLayout,...expandPaneProps}

    if (targetComponent === 'DefaultPane') 
    newLayout = {...newLayout,...minimizePaneProps}

    return {...state,layout:newLayout} 

    // return {...state,layout:{...state.layout,subMenuCurrentComponent:targetComponent}} 
  }
  
  const goToPreSubMenu =  (state,{previousComponent})  =>  {
    if(previousComponent)
    return {...state,layout:{...state.layout,subMenuCurrentComponent:previousComponent}}
  }
  
   const goToBottomPane =  (state,targetComponent)  =>  {
     const expandPaneProps = {
      mapPaneFlex:0.6,
      bottomPaneFlex:0.4,
      bottomPaneArrow:"▼",
      bottomPaneMaxSize: 2000,
      bottomPaneMinimized: false,
    }

    let newLayout = {...state.layout,bottomPaneCurrentComponent:targetComponent}
    if (state.layout.bottomPaneMinimized) 
    newLayout = {...newLayout,...expandPaneProps}

    return {...state,layout:newLayout} 
  }
  
   const goToPreBottomPane =  (state,{previousComponent})  =>  {
    return {...state,layout:{...state.layout,bottomPaneCurrentComponent:previousComponent}} 
  }
  
  
  