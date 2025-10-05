import React from "react";
import { CalciteIcon } from '@esri/calcite-components-react';
import useStateStore from "@/stateStore";
import { useTranslation } from 'react-i18next';

interface SpatialAnalysisProps {
  setMenuState?: (value: any) => void;
  menuState?: any;
}

interface AnalysisOption {
  name: string;
  icon: string;
}

const options: AnalysisOption[] = [
  { name: "BufferComponent", icon: "buffer-polygon" },
  { name: "OverlayComponent", icon: "analysis-overlay" },
  { name: "ClipComponent", icon: "discard" },
  { name: "DissolveComponent", icon: "dissolve-features" },
  { name: "GeometryModifyComponent", icon: "vertex-edit" },
  { name: "SpatialRelationshipsComponent", icon: "geographic-link-chart-layout" },
];

const SpatialAnalysis: React.FC<SpatialAnalysisProps> = ({ setMenuState, menuState }) => {
  const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);
  const toggleSidebar = useStateStore((state) => state.toggleSidebar);
  const activeSideBar = useStateStore((state) => state.activeSideBar);
  const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);
  const { t } = useTranslation();

  const handleClick = (name: string) => {
    // Close menus
    if (setMenuState) {
      setMenuState((prev: any) => ({
        ...prev,
        isOptionsMenuExpanded: false,
        isSubOptionsMenuExpanded: false,
      }));
    }

    // Open sidebar
    if (sidebarOpen) {
      if (activeSideBar !== name) {
        toggleSidebar(false);
        setTimeout(() => {
          setActiveSideBar(name);
          toggleSidebar(true);
        }, 1000);
      }
    } else {
      setActiveSideBar(name);
      toggleSidebar(true);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {options.map((option) => (
        <button
          key={option.name}
          onClick={() => handleClick(option.name)}
          className="w-full flex text-foreground items-center space-x-2 p-2 rtl:space-x-reverse rounded transition bg-transparent hover:bg-white/50 text-left"
        >
          <CalciteIcon icon={option.icon} scale="m" />
          <span>{t(`menu.${option.name}`)}</span>
        </button>
      ))}
    </div>
  );
};

export default SpatialAnalysis;