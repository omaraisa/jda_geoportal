// components/Option.tsx
import React from "react";
import styles from "./main-menu.module.css";
import { useTranslation } from 'react-i18next';
import useStateStore from "@/stateStore";
import { CalciteIcon } from '@esri/calcite-components-react';

interface OptionProps {
    icon: string;
    name: string;
    subMenuComponent: string | undefined;
    toggleSubOptionsMenu: () => void;
    toggleOptionsMenu: () => void;
}

const MenuOption: React.FC<OptionProps> = ({ icon, name, subMenuComponent, toggleSubOptionsMenu, toggleOptionsMenu }) => {
    const { t } = useTranslation();
    const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);
    const setActiveBottomPane = useStateStore((state) => state.setActiveBottomPane);
    const toggleSidebar = useStateStore((state) => state.toggleSidebar);
    const toggleBottomPane = useStateStore((state) => state.toggleBottomPane);
    const activeSideBar = useStateStore((state) => state.activeSideBar);
    const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);
    const bottomPaneOpen = useStateStore((state) => state.layout.bottomPaneOpen);
    const setSidebarWidgetStatus = useStateStore((state) => state.setSidebarWidgetStatus);
    const closeAllSidebarWidgets = useStateStore((state) => state.closeAllSidebarWidgets);


    const handleClick = () => {
        if (subMenuComponent) {
            toggleSubOptionsMenu();
        } else {
            // Special handling for TimeSliderComponent - activate bottom pane
            if (name === 'TimeSliderComponent') {
                toggleOptionsMenu();
                setActiveBottomPane(name);
                toggleBottomPane(true);
                return;
            }

            // Special handling for MapLayout - go directly to layout mode
            if (name === 'MapLayout') {
                toggleOptionsMenu();
                // Close all sidebar widgets and hide sidebar
                closeAllSidebarWidgets();
                toggleSidebar(false);
                const setLayoutModeActive = useStateStore.getState().setLayoutModeActive;
                setLayoutModeActive(true);
                return;
            }

            toggleOptionsMenu();
            
            // Close all sidebar widgets when switching to a new widget
            closeAllSidebarWidgets();
            
            if (sidebarOpen) {
                if (activeSideBar !== name) {
                    toggleSidebar(false);
                    setTimeout(() => {
                        setActiveSideBar(name);
                        toggleSidebar(true);
                        // Activate the specific widget
                        if (name === 'PrintComponent') {
                            setSidebarWidgetStatus('printWidget', true);
                        }
                    }, 1000);
                }
            } else {
                setActiveSideBar(name);
                toggleSidebar(true);
                // Activate the specific widget
                if (name === 'PrintComponent') {
                    setSidebarWidgetStatus('printWidget', true);
                }
            }
        }
    };

    return (
        <div className={styles.option} onClick={handleClick}>
            <CalciteIcon icon={icon} scale="m" />
            <p>{t(`menu.${name}`)}</p>
        </div>
    );
};

export default MenuOption;
