import useStateStore from "../stateManager";
import DefaultComponent from "./sub_components/default-component";
import AttributeTableWidgetComponent from "../widgets/attribute-table";

const components = {
    DefaultComponent,
    AttributeTableWidgetComponent
  };

const BottomPane = () => {
      const currentComponentName = useStateStore((state) => state.activeBottomPane);
      const CurrentComponent = components[currentComponentName];

    return (
        <div className="flex justify-center items-center h-full">
            <CurrentComponent />
        </div>
    );
};

export default BottomPane;