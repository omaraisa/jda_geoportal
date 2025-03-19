
import React from 'react';
import styles from "./main-menu.module.css";
import { CalciteIcon } from '@esri/calcite-components-react';
import { useTranslation } from "react-i18next";



interface MenuButtonProps {
    option: string;
    onClick: () => void;
    containerRotation: number;
  }
  
  // Map menu names to corresponding icons
  const iconMapping: Record<string, string> = {
    analysis: "analysis",
    settings: "gear",
    layers: "layers",
    query: "search",
    tools: "annotate-tool"
  };
  
  export const MenuButton: React.FC<MenuButtonProps> = ({ option, onClick, containerRotation }) => {
  const { t } = useTranslation();

    return (
      <div
        className={`${styles.button} group relative`}
        onClick={onClick}
        style={{ transform: `rotate(${-containerRotation}deg)` }}
      >
        
        <CalciteIcon icon={iconMapping[option]} scale="l" />
        <div className="absolute hidden group-hover:block w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md mr-[3em] mb-[5em]">
        {t(`menu.${option}`)}
        </div>
      </div>
    );
  };
  

  export default MenuButton;
  