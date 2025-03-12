import React from 'react';
import OptionsMenu from './options-menu';
import styles from "./main-menu.module.css";
import MainMenuButtons from './main-menu-buttons';
import ZoomControls from './menu-zoom-controls';

const MainMenu: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = React.useState<string>('settings');
  const [isOptionsMenuExpanded, setIsOptionsMenuExpanded] = React.useState(false);

  const handleMenuChange = (menu: string) => {
    setSelectedMenu(menu);
    setIsOptionsMenuExpanded(true);
  };

  return (
    <div className={styles.mainmenu}>
      <MainMenuButtons onMenuChange={handleMenuChange} />
      <OptionsMenu isExpanded={isOptionsMenuExpanded} selectedMenu={selectedMenu} setIsOptionsMenuExpanded={setIsOptionsMenuExpanded} />
      <ZoomControls />
    </div>
  );
};

export default MainMenu;