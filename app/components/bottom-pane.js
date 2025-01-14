import useStateStore from "../stateManager";
import DefaultComponent from "./sub_components/default-component";
import dynamic from "next/dynamic";
const AttributeTableWidgetComponent = dynamic(() => import("../widgets/attribute-table"), { ssr: false });


const components = {
    DefaultComponent,
    AttributeTableWidgetComponent
  };

const BottomPane = () => {
      const currentComponentName = useStateStore((state) => state.activeBottomPane);
      const CurrentComponent = components[currentComponentName];
      console.log(currentComponentName)

    return (
      <div className="flex justify-center items-center h-full">
        {!useStateStore((state) => state.layout.bottomPaneMinimized) && <CurrentComponent />}
      </div>
    );
};

export default BottomPane;