import React from "react";
import styles from "./main-menu.module.css";
import menuOptions from "@/lib/utils/menu-options";
import MenuOption from "./menu-option";
import OptionsMenuHeader from "./options-menu-header";
import SubOptionsMenu from "./sub-options-menu";
import { hasPermission } from "@/lib/utils/hasPermission";
import useStateStore from "@/stateStore";

interface OptionsProps {
  menuState: {
    selectedMenu: string;
    selectedSubMenu: string;
    isOptionsMenuExpanded: boolean;
    isSubOptionsMenuExpanded: boolean;
  },
  setMenuState: (value: any) => void;
}

const OptionsMenu: React.FC<OptionsProps> = ({ menuState, setMenuState}) => {
  // Get user role from state
  const userRole = useStateStore(state => state.userInfo?.role || "viewer...");

  const toggleSubOptionsMenu = (optionName: string) => {
    setMenuState((prev: typeof menuState) => ({
      ...prev,
      selectedSubMenu: optionName,
      isSubOptionsMenuExpanded: prev.selectedSubMenu === optionName ? !prev.isSubOptionsMenuExpanded : true
    }));
  };

  const toggleOptionsMenu = () => {
    setMenuState((prev: typeof menuState) => ({
      ...prev,
      isOptionsMenuExpanded: false
    }));
  };

  return (
    <div className={`${styles.options} ${menuState.isOptionsMenuExpanded ? styles.expanded : ""}`}>
      <OptionsMenuHeader selectedMenu={menuState.selectedMenu} hideMenu={() => setMenuState({ ...menuState, isOptionsMenuExpanded: false })} />
      {menuOptions[menuState.selectedMenu]
      ?.filter(option => {
        const hasPerm = hasPermission(userRole, option.name);
        return hasPerm;
      })
      .map((option, index) => (
        <MenuOption
        key={index}
        icon={option.icon}
        name={option.name}
        subMenuComponent={option.subMenuComponent}
        toggleSubOptionsMenu={() => toggleSubOptionsMenu(option.name)}
        toggleOptionsMenu={() => toggleOptionsMenu()}
        />
      ))}
      <SubOptionsMenu selectedOption={menuState.selectedSubMenu} isExpanded={menuState.isSubOptionsMenuExpanded} />
    </div>
  );
};

export default OptionsMenu;
