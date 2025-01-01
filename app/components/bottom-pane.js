import DefaultComponent from "./sub_components/default-component";

const components = {
    DefaultComponent,
  };

const BottomPane = () => {
    //   const currentComponentName = useStateStore((state) => state.activeSubMenu);
      const currentComponentName = "DefaultComponent";
      const CurrentComponent = components[currentComponentName];

    return (
        <div className="flex justify-center items-center h-full">
            <CurrentComponent />
        </div>
    );
};

export default BottomPane;