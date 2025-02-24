import React from "react";
import useStateStore from "@/stateStore"; // Import Zustand state

interface NavButtonProps {
  toolTip?: string;
  iconClass: string;
  targetComponent: string;
}

const NavButton: React.FC<NavButtonProps> = ({ toolTip, iconClass, targetComponent }) => {
  const activeSideBar = useStateStore((state) => state.activeSideBar);
  const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);


  // Dynamic Tailwind class based on active state
  const isActive = activeSideBar === targetComponent;
  const NavButtonClass = isActive
    ? "bg-white text-primary shadow-md cursor-pointer"
    : "text-white cursor-pointer hover:bg-white hover:text-primary";

  // Handle Button Click
  const handleClick = () => {
    console.log("Nav button under construction");
  };

  return (
    <div className="relative group">
      {/* Button */}
      <div
        onClick={handleClick}
        className={`${NavButtonClass} text-gray-800 p-2 bg-white bg-opacity-60 border border-white rounded-full hover:bg-gray-200 focus:outline-none w-10 h-10 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.8)]`}
      >
        <calcite-icon icon={iconClass} scale="m" />
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
