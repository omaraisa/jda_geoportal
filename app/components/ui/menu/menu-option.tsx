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
    const toggleSidebar = useStateStore((state) => state.toggleSidebar);
    const activeSideBar = useStateStore((state) => state.activeSideBar);
    const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);


    const handleClick = () => {
        if (subMenuComponent) {
            toggleSubOptionsMenu();
        } else {
            toggleOptionsMenu();
            if (sidebarOpen) {
                if (activeSideBar !== name) {
                    toggleSidebar(false);
                    setTimeout(() => {
                        setActiveSideBar(name);
                        toggleSidebar(true);
                    }, 1000);
                }
            } else {
                setActiveSideBar(name);
                toggleSidebar(true);
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
