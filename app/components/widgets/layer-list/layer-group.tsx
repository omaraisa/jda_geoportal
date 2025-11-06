import { useEffect, useState } from 'react';
import styles from './layer-group.module.css';
import LayerItem from "./layer-item";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from '@esri/calcite-components-react';

export default function LayerGroup({group}: {group: string}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const view = useStateStore((state) => state.targetView);
  const [activeLayerId, setactiveLayerId] = useState<string | null>(null);
  const [layers, setLayers] = useState<__esri.Layer[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (view) {
      setLayers(view.map.layers.toArray());
    }
  }, [view?.map.layers]);

  // Custom setLayers function that updates both view and local state
  const updateLayers = (updatedLayers: __esri.Layer[]) => {
    setLayers(updatedLayers);
  };

  function toggleContent() {
    setIsExpanded(!isExpanded);
  }

  // Get layers in this group
  const groupLayers = view?.map.layers
    .toArray()
    .filter((layer) => {
      const layerGroup = (layer as any).group || "My Layers";
      return layerGroup === group;
    }) || [];

  // Calculate group visibility state
  const visibleLayersCount = groupLayers.filter(layer => layer.visible).length;
  const totalLayersCount = groupLayers.length;
  
  let groupVisibilityIcon = "view-visible";
  if (visibleLayersCount === 0) {
    groupVisibilityIcon = "view-hide"; // All hidden
  } else if (visibleLayersCount < totalLayersCount) {
    groupVisibilityIcon = "view-hide"; // Some hidden (mixed state)
  } else {
    groupVisibilityIcon = "view-visible"; // All visible
  }

  // Toggle all layers in the group
  function toggleGroupVisibility() {
    const shouldShow = visibleLayersCount === 0 || visibleLayersCount < totalLayersCount;
    
    groupLayers.forEach(layer => {
      layer.visible = shouldShow;
    });
    
    // Update the layers state to trigger re-render
    if (view) {
      setLayers([...view.map.layers.toArray()]);
    }
  }

  function toTranslationKey(group: string) {
    return group
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[^\w]/g, '') // Remove special characters
      .trim();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={toggleContent}>
        <div className="flex items-center justify-between w-full">
          <span className="flex-1 text-center">
            {t(`layerList.groupTitles.${toTranslationKey(group)}`, group)}
          </span>
          <CalciteIcon 
            icon={groupVisibilityIcon} 
            scale="s" 
            className="cursor-pointer ml-2" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the expand/collapse
              toggleGroupVisibility();
            }} 
          />
        </div>
      </div>
      <div className={`${styles.content} ${isExpanded ? styles.contentExpanded : ''}`} id="content">
        {groupLayers
          .reverse() // Reverse the order so top layers appear at the top of the list
          .map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              activeLayerId={activeLayerId}
              setactiveLayerId={setactiveLayerId}
              setLayers={updateLayers}
            />
        ))}
      </div>
    </div>
  );
}
