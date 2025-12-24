
import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from "./main-menu.module.css";
import MenuButton from './menu-button';
import useStateStore from "@/stateStore";

const menuOptions = ['analysis', 'settings', 'layers', 'query', 'tools'];

interface MainMenuButtonsProps {
  onMenuChange: (menu: string) => void;
}

export const MainMenuButtons: React.FC<MainMenuButtonsProps> = ({ onMenuChange }) => {
  const updateActivity = useStateStore((state) => state.updateActivity);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  // New state to handle container rotation
  const [containerRotation, setContainerRotation] = useState(0);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);

  const handleButtonClick = useCallback((index: number) => {
    updateActivity();
    setActiveButtonIndex(index);

    const buttons = buttonsContainerRef.current?.children;
    const angleStep = (2 * Math.PI) / (buttons?.length || 1);
    const rotationAngle = 325 - (index * angleStep) * (180 / Math.PI);
    setContainerRotation(rotationAngle);

    onMenuChange(menuOptions[index]);
  }, [onMenuChange]);

  useEffect(() => {
    const buttons = buttonsContainerRef.current?.children;
    if (buttons) {
      const radius = 77;
      const centerX = 100;
      const centerY = 100;
      const angleStep = (2 * Math.PI) / buttons.length;
      Array.from(buttons).forEach((button, index) => {
        const angle = 120 + index * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle) - (button as HTMLElement).offsetWidth / 2;
        const y = centerY + radius * Math.sin(angle) - (button as HTMLElement).offsetHeight / 2;
        (button as HTMLElement).style.left = `${x}px`;
        (button as HTMLElement).style.top = `${y}px`;
      });
    }
  }, []);

  return (
    <div
      className={styles.mainMenuButtons}
      ref={buttonsContainerRef}
      // Rotate the container based on the active button
      style={{ transform: `rotate(${containerRotation}deg)` }}
    >
      {menuOptions.map((option, index) => (
        <MenuButton
          key={option}
          option={option}
          onClick={() => handleButtonClick(index)}
          containerRotation={containerRotation}
        />
      ))}
    </div>
  );
};


export default MainMenuButtons;