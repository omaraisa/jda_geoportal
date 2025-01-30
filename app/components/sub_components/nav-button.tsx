import React from "react";
import useStateStore from "@/stateManager"; // Import Zustand state

interface NavButtonProps {
  toolTip?: string;
  iconClass: string;
  targetComponent: string;
}

const NavButton: React.FC<NavButtonProps> = ({ toolTip, iconClass, targetComponent }) => {
  const activeSideBar = useStateStore((state) => state.activeSideBar);
  const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);
  const toggleMenus = useStateStore((state) => state.toggleMenus);
  const secondaryPaneMinimized = useStateStore(
    (state) => state.layout.secondaryPaneMinimized
  );

  // Dynamic Tailwind class based on active state
  const isActive = activeSideBar === targetComponent;
  const NavButtonClass = isActive
    ? "bg-white text-primary shadow-md cursor-pointer"
    : "text-white cursor-pointer hover:bg-white hover:text-primary";

  // Handle Button Click
  const handleClick = () => {
    if (secondaryPaneMinimized) {
      toggleMenus("secondary"); // Open the secondary pane if minimized
    }
    setActiveSideBar(targetComponent); // Set the target SideBar
  };

  return (
    <div className="relative group">
      {/* Button */}
      <div
        onClick={handleClick}
        className={`${NavButtonClass} w-10 h-10 flex items-center justify-center`}
      >
        <i
          className={iconClass}
          style={{
            width: "24px",
            height: "24px",
            fontSize: "24px",
            textShadow: "0px 1px 3px rgba(0, 0, 0, 0.8)", // Text shadow for better contrast
          }}
        ></i>
      </div>

      {/* Tooltip Below the Button */}
      {toolTip && (
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {toolTip}
        </div>
      )}
    </div>
  );
};

export default NavButton;
