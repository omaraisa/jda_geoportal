import React from "react";
import styles from "./main-menu.module.css";
import useStateStore from "@/stateStore";



const ZoomControls: React.FC = () => {
  const {mapView,extent} = useStateStore((state) => state);

  return (
    <>
      <div 
        className={`${styles.fixedButton} ${styles.zoomIn}`} 
        onClick={() => mapView?.goTo({ scale: mapView.scale / 1.1 })}
      ></div>
      <div 
        className={`${styles.fixedButton} ${styles.home}`} 
        onClick={() => mapView?.goTo({ 
          extent, 
        })}
      ></div>
      <div 
        className={`${styles.fixedButton} ${styles.zoomOut}`} 
        onClick={() => mapView?.goTo({ scale: mapView.scale * 1.1 })}
      ></div>
    </>
  );
};



export default ZoomControls;
