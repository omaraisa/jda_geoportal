import useStateStore from "../../stateManager";

const SubmenuHeader = () => {
  const previousComponent = useStateStore((state) => state.previousSubMenu);
  const setActiveSubMenu = useStateStore((state) => state.setActiveSubMenu);
  const setPreviousSubMenu = useStateStore((state) => state.setPreviousSubMenu);

  const handleBack = () => {
    if (previousComponent) {
      setActiveSubMenu(previousComponent);
    }
  };

  return (
    <div
      className="flex justify-between items-center w-full py-2 px-4 text-white bg-primary transition-all duration-300 ease-in-out"
    >
      {/* Back Button */}
      {previousComponent && (
        <button
          className="text-white focus:outline-none mr-4 transform transition-transform duration-300 ease-in-out"
          onClick={handleBack}
        >
          <i className="fas fa-arrow-left"></i> 
        </button>
      )}

      {/* Close Button */}
      <button className="text-white focus:outline-none ml-auto transform hover:rotate-180 transition-transform duration-300 ease-in-out">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default SubmenuHeader;
