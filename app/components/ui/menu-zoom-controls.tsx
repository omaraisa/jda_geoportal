import React from "react";
import styles from "./main-menu.module.css";
import useStateStore from "@/stateStore";



const ZoomControls: React.FC = () => {
    const view = useStateStore((state) => state.targetView);
  
    return (
      <>
        <div className={`${styles.fixedButton} ${styles.zoomIn}`} onClick={() => view?.goTo({ zoom: view.zoom + 1 })}></div>
        <div className={`${styles.fixedButton} ${styles.home}`} onClick={() => view?.goTo({ center: [39.19797, 21.51581], zoom: 12 })}></div>
        <div className={`${styles.fixedButton} ${styles.zoomOut}`} onClick={() => view?.goTo({ zoom: view.zoom - 1 })}></div>
      </>
    );
  };


export default ZoomControls;
