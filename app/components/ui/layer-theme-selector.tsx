import React, { useEffect, useState } from 'react';
import useStateStore from '@/stateStore';
import {layerThemes} from "@/lib/globalConstants";


const LayerThemeSelector: React.FC = () => {
  const { activeLayerTheme, setActiveLayerTheme } = useStateStore((state) => state);
  const addBasemapLayers = useStateStore((state) => state.addBasemapLayers);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    // Set the initial selected theme based on activeLayerTheme
    const initialThemeIndex = layerThemes.indexOf(activeLayerTheme);
    if (initialThemeIndex !== -1) {
      handleClick(initialThemeIndex);
    }
  }, [activeLayerTheme]);

  const handleClick = (index: number) => {
    const selectedTheme = layerThemes[index];
    setActiveLayerTheme(selectedTheme);
    setActiveIndex(index);
    addBasemapLayers(selectedTheme);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.classList.add('scale-95');
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('scale-95');
    e.stopPropagation(); // Prevent the event from bubbling up to the parent div
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.classList.add('scale-120');
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('scale-120');
  };

  return (
    <div>
      <div className="flex justify-between items-stretch h-9">
        {layerThemes.map((theme, index) => (
            <div
            key={index}
            className={`flex flex-1 justify-center items-center text-center transition-colors duration-500 ${activeIndex === index ? 'bg-white text-primary' : 'bg-primary-darkTransparent text-white'}`}
            onClick={() => handleClick(index)}
            >
            <i
              className={`esri-icon-${index === 0 ? 'legend' : index === 1 ? 'measure' : 'settings'} transition-transform duration-200`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            ></i>
            </div>
        ))}
      </div>
      <div className="w-full bg-white text-primary flex justify-center items-center text-center py-2 font-bold">
        {activeLayerTheme}
      </div>
    </div>
  );
};

export default LayerThemeSelector;
