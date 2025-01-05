import React from "react";
import useStateStore from "../../stateManager";

const ViewSplitter = () => {
  const switchViewMode = useStateStore((state) => state.switchViewMode);

  const handleSplit = () => {
    switchViewMode("Dual"); // Set viewMode to "Dual"
  };

  return (
    <div
      className="w-10 h-10 flex items-center justify-center hover:bg-white hover:text-primary cursor-pointer"
      onClick={handleSplit}
    >
      <i className="fa-solid fa-table-columns text-2xl"></i>
    </div>
  );
};

export default ViewSplitter;
