import useStateStore from "@/stateManager";
import styles from "./view-switcher.module.css";
import { useState, useCallback, useEffect } from "react";

const modes = [
  { label: "2D", value: "2D" },
  { label: "3D", value: "3D" },
  { label: "◧", value: "Dual" }
];

const ViewSwitcher = () => {
  const { switchViewMode, setSyncing } = useStateStore();
  const [step, setStep] = useState(0);

  const positions = [
    { left: '28%', top: '20%' },
    { left: '50%', top: '65%' },
    { left: '73%', top: '20%' },
  ];

  const activeIndex = step % modes.length;

  const reorderedPositions = [
    positions[(activeIndex + 1) % modes.length],
    positions[activeIndex],
    positions[(activeIndex + 2) % modes.length],
  ];

  useEffect(() => {
    const activeMode = modes[activeIndex].value;
    switchViewMode(activeMode);
    setSyncing(activeMode === 'Dual');
    console.log('Active mode:', activeMode);
  }, [activeIndex, switchViewMode]);

  const toggleView = useCallback(() => {
    setStep(prev => (prev + 1) % modes.length);
  }, []);

  return (
    <button className={styles.switcher} onClick={toggleView}>
      {modes.map((mode, index) => {
        const position = reorderedPositions[index];
        return (
          <div
            key={mode.value}
            className={`${styles.modeBtn} ${
              activeIndex === index ? styles.activeModeBtn : ''
            }`}
            style={{
              left: position.left,
              top: position.top
            }}
          >
            {mode.label}
          </div>
        );
      })}
    </button>
  );
};

export default ViewSwitcher;
