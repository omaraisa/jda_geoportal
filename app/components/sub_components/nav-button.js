import useStateStore from "../../stateManager"; // Import Zustand state

export default function NavButton({ toolTip, iconClass, targetComponent }) {
  const activeSubMenu = useStateStore((state) => state.activeSubMenu);
  const setActiveSubMenu = useStateStore((state) => state.setActiveSubMenu);

  // Dynamic Tailwind class based on active state
  const isActive = activeSubMenu === targetComponent;
  const NavButtonClass = isActive
  ? "bg-white text-primary shadow-md cursor-pointer" 
  : "text-white cursor-pointer hover:bg-white hover:text-primary";


  // Handle Button Click
  const handleClick = () => {
    // setActiveSubMenu(isActive ? "DefaultComponent" : targetComponent);
    // setActiveSubMenu("DefaultComponent");
    setActiveSubMenu("BasemapGalleryComponent");
  };

  return (
    <div className="relative group">
      {/* Button */}
      <div
        onClick={handleClick}
        className={`${NavButtonClass} w-10 h-10 flex items-center justify-center`}
      >
        <i className={`${iconClass}`} style={{ width: "24px", height: "24px", fontSize: "24px" }}></i>
      </div>

      {/* Tooltip Below the Button */}
      {toolTip && (
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {toolTip}
        </div>
      )}
    </div>
  );
}
