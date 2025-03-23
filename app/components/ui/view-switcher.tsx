import useStateStore from "@/stateStore";
import { useState, useCallback, useEffect } from "react";
import { CalciteIcon } from '@esri/calcite-components-react';

interface Mode {
  label: string;
  value: string;
  icon: string;
}

const modes: Mode[] = [
  { label: "2D", value: "2D", icon: "color-coded-map" },
  { label: "3D", value: "3D", icon: "3d-building" },
  { label: "Dual", value: "Dual", icon: "split-units" }
];

const ViewSwitcher: React.FC = () => {
  const { switchViewMode, setSyncing } = useStateStore();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const activeMode = modes[activeIndex].value as "2D" | "3D" | "Dual";
    switchViewMode(activeMode);
    setSyncing(activeMode === 'Dual');
  }, [activeIndex, switchViewMode, setSyncing]);

  const handleClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {modes.map((mode, index) => (
        <button
          key={mode.value}
          onClick={() => handleClick(index)}
          className={`w-full flex text-foreground items-center space-x-2 p-2 rtl:space-x-reverse  rounded transition ${
            activeIndex === index ? 'bg-primary-transparent' : 'bg-transparent'
          } hover:bg-white/50 text-left`}
        >
           <CalciteIcon icon={mode.icon} scale="m" />
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
