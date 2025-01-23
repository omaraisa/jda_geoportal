import useStateStore from "../../stateManager";
import { useTranslation } from "react-i18next";

export default function SidebarHeader() {
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

  // Dynamically fetch the title for the active component
  const title = t(`sidebar.titles.${activeComponent}`, "");

  return (
    <div className="relative flex items-center w-full py-2 px-4 text-white min-h-10">
      {/* Back Button */}
      {previousComponent && (
        <button
          className="absolute left-4 text-white focus:outline-none transform transition-transform duration-500 ease-in-out hover:bg-white hover:text-primary rounded-full w-8 h-8 flex items-center justify-center"
          onClick={handleBack}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
      )}

      {/* Title */}
      <h2 className="mx-auto text-base font-semibold text-center">{title}</h2>

      {/* Close Button */}
      <button
        className="absolute right-4 text-white focus:outline-none transform hover:rotate-180 transition-transform duration-300 ease-in-out w-8 h-8 flex items-center justify-center"
        onClick={()=> toggleSidebar(false)} // Close the 
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};
