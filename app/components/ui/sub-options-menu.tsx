
import React, { Suspense } from "react";
import styles from "./main-menu.module.css";
import SubOptionsMenuHeader from "./sub-options-menu-header";
import dynamic from "next/dynamic";
import Loading from "./loading";

const BasemapSwitcher = dynamic(
    () => import("@/components/ui/basemap-switcher"),
    { ssr: false }
);
const ViewSwitcher = dynamic(
    () => import("@/components/ui/view-switcher"),
    { ssr: false }
);

const components = {
    BasemapSwitcher,
    ViewSwitcher
};

interface SubOptionsProps {
    isExpanded: boolean;
    selectedOption: string;
}

const SubOptionsMenu: React.FC<SubOptionsProps> = ({ selectedOption, isExpanded }) => {
    const currentComponentName: string = selectedOption || "DefaultComponent";
    const CurrentComponent = components[currentComponentName as keyof typeof components];

    if (!CurrentComponent) {
        return
    }

    return (
        <div className={`${styles.subOptions} ${isExpanded ? styles.expanded : ""}`}>
            <SubOptionsMenuHeader selectedMenu={selectedOption}/>

            <Suspense fallback={<Loading />}>
                <CurrentComponent />
            </Suspense>
        </div>
    );
};

export default SubOptionsMenu;