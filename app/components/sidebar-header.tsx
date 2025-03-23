import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import React from "react";
import { CalciteIcon } from '@esri/calcite-components-react';

const SidebarHeader: React.FC = () => {
  const { t } = useTranslation();
  const previousComponent = useStateStore((state) => state.previousSideBar);
  const activeComponent = useStateStore((state) => state.activeSideBar);
  const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);
  const toggleSidebar = useStateStore((state) => state.toggleSidebar);

  const handleBack = () => {
    if (previousComponent) {
      setActiveSideBar(previousComponent);
    }
  };

  const title = t(`sidebar.titles.${activeComponent}`, "");

  return (
    <div className="relative flex items-center w-full py-2 px-4 text-foreground min-h-10">
      {previousComponent && (
        <button
          className="absolute left-4 text-foreground focus:outline-none transform transition-transform duration-500 ease-in-out hover:bg-white hover:text-foreground rounded-full w-8 h-8 flex items-center justify-center"
          onClick={handleBack}
        >
          <CalciteIcon icon={"chevrons-left"} scale="m" />
        </button>
      )}

      <h2 className="mx-auto text-base font-semibold text-center">{title}</h2>

      <button
        className="close-btn flex items-center justify-center"
        onClick={() => toggleSidebar(false)}
      >
       <CalciteIcon icon={"x"} scale="m" />
      </button>
    </div>
  );
};

export default SidebarHeader;
