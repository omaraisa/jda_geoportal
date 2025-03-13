import React from 'react';
import styles from "./main-menu.module.css";
import { useTranslation } from 'react-i18next';

interface OptionsMenuHeaderProps {
    selectedMenu: string;
    hideMenu: () => void;
}

const OptionsMenuHeader: React.FC<OptionsMenuHeaderProps> = ({ selectedMenu, hideMenu }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.title} onClick={() => hideMenu()}>
            {t(`menu.${selectedMenu}`)}
        </div>
    );
};

export default OptionsMenuHeader;