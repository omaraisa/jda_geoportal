import { useEffect, useState } from 'react';
import styles from './layer-group.module.css';
import LayerItem from "./layer-item";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from '@esri/calcite-components-react';
import { getTranslatedGroupTitle } from '@/lib/utils/auth-group-translations';

export default function LayerGroup({group}: {group: string}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const view = useStateStore((state) => state.targetView);
  const userInfo = useStateStore((state) => state.userInfo);
  const groupTranslations = useStateStore((state) => state.groupTranslations);
  const [activeLayerId, setactiveLayerId] = useState<string | null>(null);
  const [layers, setLayers] = useState<__esri.Layer[]>([]);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (view) {
      setLayers(view.map.layers.toArray());
    }
  }, [view?.map.layers]);

  // Function to get group title with translations
  const getGroupTitle = (groupName: string): string => {
    // Priority 1: Use translations from auth_gate (stored in state)
    if (groupTranslations) {
      const authGateTranslation = getTranslatedGroupTitle(
        groupName,
        i18n.language as 'en' | 'ar',
        groupTranslations
      );
      // Only use if it's not just the fallback (cleaned name)
      if (authGateTranslation !== groupName.replace(/^gportal_/, '')) {
        return authGateTranslation;
      }
    }
    
    // Priority 2: Check if userInfo has groupTitles with translations (JWT format)
    if (userInfo?.groupTitles) {
      const currentLang = i18n.language;
      const groupKey = groupName; // Use group name as key
      
      // Check if we have a translation for this group
      if (currentLang === 'ar' && userInfo.groupTitles.ar?.[groupKey]) {
        return userInfo.groupTitles.ar[groupKey];
      } else if (userInfo.groupTitles.en?.[groupKey]) {
        return userInfo.groupTitles.en[groupKey];
      }
    }
    
    // Priority 3: Check if userInfo has groups with translations (old object array format)
    if (userInfo?.groups && Array.isArray(userInfo.groups)) {
      for (const userGroup of userInfo.groups) {
        // Handle object format with translations
        if (typeof userGroup === 'object' && userGroup?.name) {
          // Match by comparing the group name without gportal_ prefix
          const cleanUserGroupName = userGroup.name.replace('gportal_', '');
          const cleanGroupName = groupName;
          
          if (cleanUserGroupName === cleanGroupName) {
            // Return appropriate translation based on current language
            if (i18n.language === 'ar' && userGroup.titleAr) {
              return userGroup.titleAr;
            } else if (userGroup.titleEn) {
              return userGroup.titleEn;
            }
          }
        }
      }
    }
    
    // Priority 4: Fallback to hardcoded i18n translation files
    return t(`layerList.groupTitles.${toTranslationKey(groupName)}`, groupName);
  };

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
            {getGroupTitle(group)}
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
