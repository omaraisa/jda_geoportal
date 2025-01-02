import useStateStore from "../../stateManager";

const ViewSwitcher = () => {
  const viewMode = useStateStore((state) => state.viewMode);
  const switchViewMode = useStateStore((state) => state.switchViewMode);

  const toggleView = () => {
    if (viewMode === "2D") {
      switchViewMode("3D");
    } else {
      switchViewMode("2D");
    }
  };

  return (
    <div
      className="relative w-20 h-10 bg-white rounded-full p-1 flex items-center cursor-pointer"
      onClick={toggleView} // Add onClick here for the entire switch
    >
      <div
        className={`absolute left-1 transition-transform duration-300 ease-in-out w-8 h-8 bg-primary rounded-full ${
          viewMode === "3D" ? "translate-x-10" : ""
        }`}
      ></div>
      <div
        className={`absolute left-2 text-xs font-bold ${
          viewMode === "2D" ? "text-white" : "text-gray-500"
        }`}
      >
        2D
      </div>
      <div
        className={`absolute right-2 text-xs font-bold ${
          viewMode === "3D" ? "text-white" : "text-gray-500"
        }`}
      >
        3D
      </div>
    </div>
  );
}  
export default ViewSwitcher;
