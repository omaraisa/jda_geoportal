// components/Options.tsx
import React from "react";
import styles from "./main-menu.module.css";
import menuOptions from "@/lib/menu-options";
import MenuOption from "./menu-option";
import OptionsMenuHeader from "./options-menu-header";

interface OptionsProps {
  isExpanded: boolean;
  selectedMenu: string;
  setIsOptionsMenuExpanded: (value: boolean) => void;
}

const OptionsMenu: React.FC<OptionsProps> = ({ isExpanded, selectedMenu, setIsOptionsMenuExpanded }) => {

  return (
    <div className={`${styles.options} ${isExpanded ? styles.expanded : ""}`}>
      <OptionsMenuHeader selectedMenu={selectedMenu}  hideMenu ={(status :boolean) => setIsOptionsMenuExpanded(status)} />
      {menuOptions[selectedMenu]?.map((option, index) => (
        <MenuOption key={index} icon={option.icon} name={option.name}/>
      ))}
    </div>
  );
};

export default OptionsMenu;
