import React, { useEffect, useRef, useState, useCallback } from 'react';
import OptionsMenu from './options-menu';
import styles from "./main-menu.module.css";
import useStateStore from "@/stateStore";

const menuOptions = ['analysis', 'settings', 'layers', 'query', 'tools'];

const MainMenu: React.FC = () => {
  const [isOptionsMenuExpanded, setIsOptionsMenuExpanded] = useState(false);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string>('settings');
  const buttonsRef = useRef<HTMLDivElement>(null);
  const view = useStateStore((state) => state.targetView);

  const handleButtonClick = useCallback((index: number) => {
    setActiveButtonIndex(index);

    const buttons = buttonsRef.current?.children;
    const angleStep = (2 * Math.PI) / (buttons?.length || 1);
    const rotationAngle = 325 - (index * angleStep) * (180 / Math.PI);

    if (buttonsRef.current) {
      buttonsRef.current.style.transform = `rotate(${rotationAngle}deg)`;
    }

    Array.from(buttons || []).forEach(btn => {
      (btn as HTMLElement).style.transform = `rotate(${-rotationAngle}deg)`;
    });

    if (isOptionsMenuExpanded && activeButtonIndex !== index) {
      // setIsOptionsMenuExpanded(false);
      // setTimeout(() => setIsOptionsMenuExpanded(true), 600); // Adjust timeout as needed
    } else {
      setIsOptionsMenuExpanded(!isOptionsMenuExpanded);
    }

    // Set the selected menu based on the clicked button index
    setSelectedMenu(menuOptions[index]);
  }, [isOptionsMenuExpanded, activeButtonIndex]);

  useEffect(() => {
    const buttons = buttonsRef.current?.children;
    const radius = 77;
    const centerX = 100;
    const centerY = 100;
    const angleStep = (2 * Math.PI) / (buttons?.length || 1);

    Array.from(buttons || []).forEach((button, index) => {
      const angle = 120 + index * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - (button as HTMLElement).offsetWidth / 2;
      const y = centerY + radius * Math.sin(angle) - (button as HTMLElement).offsetHeight / 2;
      (button as HTMLElement).style.left = `${x}px`;
      (button as HTMLElement).style.top = `${y}px`;

      // Remove previous listener to avoid multiple event listeners
      button.removeEventListener('click', () => handleButtonClick(index)); // Correct way to remove the listener
      button.addEventListener('click', () => handleButtonClick(index));
    });

    return () => { // Cleanup function to remove listeners
      Array.from(buttons || []).forEach((button, index) => {
        button.removeEventListener('click', () => handleButtonClick(index));
      });
    };
  }, [handleButtonClick]); // Add handleButtonClick to the dependency array

  const renderMenu = () => (
    <div className={styles.mainmenu}>
      <div className={styles.buttons} ref={buttonsRef}>
        <div className={styles.button}><calcite-icon icon="analysis" scale="l" /></div>
        <div className={styles.button}><calcite-icon icon="gear" scale="l" /></div>
        <div className={styles.button}><calcite-icon icon="layers" scale="l" /></div>
        <div className={styles.button}><calcite-icon icon="search" scale="l" /></div>
        <div className={styles.button}><calcite-icon icon="annotate-tool" scale="l" /></div>
      </div>
      <OptionsMenu isExpanded={isOptionsMenuExpanded} selectedMenu={selectedMenu} setIsOptionsMenuExpanded={setIsOptionsMenuExpanded} />
      <div className={`${styles.fixedButton} ${styles.zoomIn}`} onClick={() => view?.goTo({ zoom: view.zoom + 1 })}></div>
      <div className={`${styles.fixedButton} ${styles.home}`} onClick={() => view?.goTo({ center: [39.19797, 21.51581], zoom: 12 })}></div>
      <div className={`${styles.fixedButton} ${styles.zoomOut}`} onClick={() => view?.goTo({ zoom: view.zoom - 1 })}></div>
    </div>
  );

  return renderMenu();
};

export default MainMenu;