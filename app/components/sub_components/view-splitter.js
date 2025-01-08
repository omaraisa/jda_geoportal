import React from "react";
import useStateStore from "../../stateManager";

const ViewSplitter = () => {
  const switchViewMode = useStateStore((state) => state.switchViewMode);
  const setSyncing = useStateStore((state) => state.setSyncing);
  const viewsSyncOn = useStateStore((state) => state.viewsSyncOn);

  const handleSplit = () => {
    switchViewMode("Dual"); // Set viewMode to "Dual"
    setSyncing(true);
  };

  return (
    <div
      className={`w-10 h-10 flex items-center justify-center cursor-pointer ${
        viewsSyncOn ? "bg-white text-primary" : "hover:bg-white hover:text-primary"
      }`}
      onClick={handleSplit}
    >
      <i className="fa-solid fa-table-columns text-2xl"></i>
    </div>
  );
};

export default ViewSplitter;
