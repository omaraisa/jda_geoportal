import useStateStore from "@/stateStore";
import DefaultComponent from "./widgets/default-component";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { CalciteIcon } from '@esri/calcite-components-react';

const FeatureTableComponent = dynamic(() => import("@/components/widgets/feature-table"), {
  ssr: false,
});

const TimeSliderComponent = dynamic(() => import("@/components/widgets/time-slider"), {
  ssr: false,
});

const ChartingComponent = dynamic(() => import("@/components/widgets/charting").then(mod => ({ default: mod.ChartingDisplay })), {
  ssr: false,
});

const components: { [key: string]: React.ComponentType } = {
  DefaultComponent,
  FeatureTableComponent,
  TimeSliderComponent,
  ChartingComponent,
};

const BottomPane: React.FC = () => {
  const { t } = useTranslation();
  const currentComponentName = useStateStore((state) => state.activeBottomPane);
  const CurrentComponent = components[currentComponentName];
  const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);
  
  const title = t(`bottomPane.titles.${currentComponentName}`, "");

  return (
    <div className="flex flex-col justify-center items-center h-full rounded-lg shadow-lg transition-all duration-500">
      <div
        className="w-full rounded-t-2xl text-white flex justify-between items-center p-2"
        style={{ backgroundColor: "var(--primary-dark-transparent)" }}
      >
        {title}
        <button
          className="close-btn flex items-center justify-center"
          onClick={() => toggleBottomPane(false)}
        >
          <CalciteIcon icon={"x"} scale="m" />
        </button>
      </div>

      <div
        className="flex h-full w-full justify-center items-center"
        style={{ backgroundColor: "var(--primary-light-transparent)" }}
      >
        {CurrentComponent && <CurrentComponent />}
      </div>

      <div
        className="w-full h-[5px] rounded-b-sm"
        style={{ backgroundColor: "var(--primary-dark-transparent)" }}
      ></div>
    </div>
  );
};

export default BottomPane;
