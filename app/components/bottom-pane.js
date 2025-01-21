import useStateStore from "../stateManager";
import DefaultComponent from "./sub_components/default-component";
import dynamic from "next/dynamic";
const AttributeTableWidgetComponent = dynamic(() => import("../widgets/attribute-table"), { ssr: false });

const components = {
  DefaultComponent,
  AttributeTableWidgetComponent,
};

const BottomPane = () => {
  const currentComponentName = useStateStore((state) => state.activeBottomPane);
  const CurrentComponent = components[currentComponentName];
  const isOpen = useStateStore((state) => state.layout.bottomPaneOpen);
  const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);

  return (
    <div
      className="flex flex-col justify-center items-center h-full rounded-lg mx-5 shadow-lg transition-all duration-500"
      style={{
        transform: `perspective(700px) rotateX(10deg) translateY(${isOpen ? '0' : '100%'})`,
        transformOrigin: "center",
        backfaceVisibility: "hidden",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Header with Close Button */}
      <div
        className="w-full rounded-t-2xl text-white flex justify-between items-center p-2"
        style={{ backgroundColor: "#5b245dd7" }}
      >
        <span>Attribute Table</span>
        <button
          className="absolute right-4 text-white focus:outline-none transform hover:rotate-180 transition-transform duration-300 ease-in-out w-8 h-8 flex items-center justify-center"
          onClick={() => toggleBottomPane(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Content Area */}
      <div
        className="flex h-full w-full justify-center items-center"
        style={{ backgroundColor: "#934b9647" }}
      >
        {CurrentComponent && <CurrentComponent />}
      </div>
    </div>
  );
};

export default BottomPane;