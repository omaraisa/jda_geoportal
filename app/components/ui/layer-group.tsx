import { useEffect, useState } from 'react';
import styles from './layer-group.module.css';
import LayerItem from "../ui/layer-item";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";

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

  function toggleContent() {
    setIsExpanded(!isExpanded);
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
         {t(`layerList.groupTitles.${toTranslationKey(group)}`, group)}
      </div>
      <div className={`${styles.content} ${isExpanded ? styles.contentExpanded : ''}`} id="content">
        {view?.map.layers
          .toArray()
          .filter((layer) =>
            group === "MyLayers"
              ? !(layer as any).group // Only layers without a group
              : (layer as any).group === group
          )
          .map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              activeLayerId={activeLayerId}
              setactiveLayerId={setactiveLayerId}
              setLayers={setLayers}
            />
        ))}
      </div>
    </div>
  );
}
