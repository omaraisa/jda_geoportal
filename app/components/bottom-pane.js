import useStateStore from "@/stateManager";
import DefaultComponent from "./sub_components/default-component";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
const FeatureTableComponent = dynamic(() => import("@/widgets/feature-table"), {
  ssr: false,
});

const components = {
  DefaultComponent,
  FeatureTableComponent,
};

const BottomPane = () => {
  const { t } = useTranslation();
  const currentComponentName = useStateStore((state) => state.activeBottomPane);
  const CurrentComponent = components[currentComponentName];
  const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);
  const title = t(`bottomPane.titles.${currentComponentName}`, "");

  return (
    <div className="flex flex-col justify-center items-center h-full rounded-lg shadow-lg transition-all duration-500">
      {/* Header with Close Button */}
      <div
        className="w-full rounded-t-2xl text-white flex justify-between items-center p-2"
        style={{ backgroundColor: "var(--primary-dark-transparent" }}
      >
        {title}
        <button
          className="text-white focus:outline-none transform hover:rotate-180 transition-transform duration-300 ease-in-out w-8 h-8 flex items-center justify-center"
          onClick={() => toggleBottomPane(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Content Area */}
      <div
        className="flex h-full w-full justify-center items-center"
        style={{ backgroundColor: "var(--primary-light-transparent)" }}
      >
        {CurrentComponent && <CurrentComponent />}
      </div>
      <div
        className="w-full h-[5px] rounded-b-sm"
        style={{ backgroundColor: "var(--primary-dark-transparent" }}
      ></div>
    </div>
  );
};

export default BottomPane;
