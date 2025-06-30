import useStateStore from "@/stateStore";
import { useState, useCallback, useEffect } from "react";
import Basemap from "@arcgis/core/Basemap";
import { useTranslation } from "react-i18next";

interface BasemapProps {
    label: string;
    value: string;
    src: string;
}

const basemaps: BasemapProps[] = [
    { label: "Atkins", value: "atkins-basemap", src: "/atkins-basemap.jpg" },
    { label: "Topo", value: "topo-vector", src: "/topographic-basemap.jpg" },
    { label: "Satellite", value: "satellite", src: "/satellite-basemap.jpg" },
    { label: "Street", value: "streets-vector", src: "/streets-basemap.jpg" },
    { label: "DarkGray", value: "dark-gray-vector", src: "/darkgray-basemap.jpg" }
];

const BasemapSwitcher: React.FC = () => {
    const { t } = useTranslation();
    const { targetView, customBasemap } = useStateStore();
    const [activeIndex, setActiveIndex] = useState(0);

    const setBasemap = (basemapId: string | undefined) => {
        if (targetView && targetView.map && basemapId) {
            const currentBasemapId = targetView.map.basemap?.id;
            if (currentBasemapId !== basemapId) {
                let newBasemap;

                // Use shared custom basemap from state store
                if (basemapId === "atkins-basemap" && customBasemap) {
                    newBasemap = customBasemap;
                } else {
                    // Handle standard Esri basemaps
                    newBasemap = Basemap.fromId(basemapId);
                }

                if (newBasemap) {
                    targetView.map.basemap = newBasemap;

                    // Handle scale constraints based on basemap
                    if (basemapId === "atkins-basemap") {
                        // Apply constraints for Atkins basemap
                        targetView.constraints = {
                            ...targetView.constraints,
                            minScale: 350000,
                            maxScale: 5000
                        };
                    } else {
                        // Remove constraints for other basemaps
                        targetView.constraints = {
                            ...targetView.constraints,
                            minScale: 0,
                            maxScale: 0
                        };
                    }
                }
            }
        }
    };


    useEffect(() => {
        if (targetView && targetView.map && targetView.map.basemap) {
            const currentBasemapId = targetView.map.basemap.id;
            const foundIndex = basemaps.findIndex(basemap => basemap.value === currentBasemapId);
            if (foundIndex !== -1 && foundIndex !== activeIndex) {
                setActiveIndex(foundIndex);
            }
        }
    }, [targetView]);

    const handleClick = useCallback((index: number) => {
        if (index !== activeIndex) {
            setActiveIndex(index);
            setBasemap(basemaps[index].value);
        }
    }, [activeIndex]);

    return (
        <div className="w-full flex flex-col items-center">
            {basemaps.map((basemap, index) => (
                <button
                    key={basemap.value}
                    onClick={() => handleClick(index)}
                    className={`w-full flex text-foreground items-center space-x-2 rtl:space-x-reverse rounded transition ${activeIndex === index ? 'bg-primary-transparent' : 'bg-transparent'
                        } hover:bg-white/50 text-left`}
                >
                    <img src={basemap.src} alt={basemap.label} className="w-12 h-12" />
                    <span>{t(`widgets.basemap.${basemap.label}`)}</span>
                </button>
            ))}
        </div>
    );
};

export default BasemapSwitcher;
