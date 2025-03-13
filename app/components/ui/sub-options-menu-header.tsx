import React from 'react';
import styles from "./main-menu.module.css";
import { useTranslation } from 'react-i18next';

interface SubOptionsMenuHeaderProps {
    selectedMenu: string;
    setIsSubOptionsMenuExpanded?: (status: boolean) => void;
}

const SubOptionsMenuHeader: React.FC<SubOptionsMenuHeaderProps> = ({ selectedMenu, setIsSubOptionsMenuExpanded }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.title} onClick={() => setIsSubOptionsMenuExpanded && setIsSubOptionsMenuExpanded(false)}>
            {t(`menu.${selectedMenu}`)}
        </div>
    );
};

export default SubOptionsMenuHeader;