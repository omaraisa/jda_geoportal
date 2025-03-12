import React, { useState } from "react";
import styles from "./main-menu.module.css";
import menuOptions from "@/lib/menu-options";
import MenuOption from "./menu-option";
import OptionsMenuHeader from "./options-menu-header";
import SubOptionsMenu from "./sub-options-menu";

interface OptionsProps {
  isExpanded: boolean;
  selectedMenu: string;
  setIsOptionsMenuExpanded: (value: boolean) => void;
}

const OptionsMenu: React.FC<OptionsProps> = ({ isExpanded, selectedMenu, setIsOptionsMenuExpanded }) => {
  const [isSubOptionsMenuExpanded, setIsSubOptionsMenuExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");

  const toggleSubOptionsMenu = (optionName: string) => {
    setSelectedOption(optionName);
    setIsSubOptionsMenuExpanded(!isSubOptionsMenuExpanded);
  };

  return (
    <div className={`${styles.options} ${isExpanded ? styles.expanded : ""}`}>
      <OptionsMenuHeader selectedMenu={selectedMenu} hideMenu={(status: boolean) => setIsOptionsMenuExpanded(status)} />
      {menuOptions[selectedMenu]?.map((option, index) => (
        <MenuOption key={index} icon={option.icon} name={option.name} subMenuComponent={option.subMenuComponent} toggleSubOptionsMenu={() => toggleSubOptionsMenu(option.name)} />
      ))}
      <SubOptionsMenu selectedOption={selectedOption} isExpanded={isSubOptionsMenuExpanded} />
    </div>
  );
};

export default OptionsMenu;
