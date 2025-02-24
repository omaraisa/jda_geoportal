// components/Option.tsx
import React from "react";
import styles from "./main-menu.module.css";
import { useTranslation } from 'react-i18next';
import useStateStore from "@/stateStore";

interface OptionProps {
    icon: string;
    name: string;
}

const MenuOption: React.FC<OptionProps> = ({ icon, name }) => {
    const { t } = useTranslation();
    const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);
    const toggleSidebar = useStateStore((state) => state.toggleSidebar);
    const activeSideBar = useStateStore((state) => state.activeSideBar);
    const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);


    const handleClick = () => {
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
    };

    return (
        <div className={styles.option} onClick={handleClick}>
            <calcite-icon icon={icon} scale="m" />
            <p>{t(`menu.${name}`)}</p>
        </div>
    );
};

export default MenuOption;
