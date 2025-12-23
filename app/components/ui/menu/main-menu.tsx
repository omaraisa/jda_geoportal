import React, { useState } from 'react';
import OptionsMenu from './options-menu';
import styles from "./main-menu.module.css";
import MainMenuButtons from './main-menu-buttons';
import ZoomControls from './menu-zoom-controls';
import useStateStore from "@/stateStore";

interface MenuState {
  selectedMenu: string;
  selectedSubMenu: string;
  isOptionsMenuExpanded: boolean;
  isSubOptionsMenuExpanded: boolean;
}

const MainMenu: React.FC = () => {
  const [menuState, setMenuState] = useState<MenuState>({
    selectedMenu: 'settings',
    selectedSubMenu: '',
    isOptionsMenuExpanded: false,
    isSubOptionsMenuExpanded: false,
  });

  const handleMenuChange = (menu: string) => {
    setMenuState(prev => ({
      ...prev,
      selectedMenu: menu,
      isOptionsMenuExpanded: prev.selectedMenu === menu ? !prev.isOptionsMenuExpanded : true,
      isSubOptionsMenuExpanded: false,
    }));

    // Exception for layers: automatically open Layer List as default
    if (menu === 'layers') {
      const setActiveSideBar = useStateStore.getState().setActiveSideBar;
      const toggleSidebar = useStateStore.getState().toggleSidebar;
      const closeAllSidebarWidgets = useStateStore.getState().closeAllSidebarWidgets;
      closeAllSidebarWidgets();
      setActiveSideBar("LayerListComponent");
      toggleSidebar(true);
    }
  };

  return (
    <div className={styles.mainmenu}>
      <MainMenuButtons onMenuChange={handleMenuChange} />
      <OptionsMenu setMenuState={setMenuState} menuState={menuState} />
      <ZoomControls />
    </div>
  );
};

export default MainMenu;