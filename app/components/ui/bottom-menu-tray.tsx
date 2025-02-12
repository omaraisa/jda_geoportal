import React from "react";
import styles from "./bottom-menu-tray.module.css";
import useStateStore from "@/stateStore";

const BottomMenuTray: React.FC = () => {
  // Type inferred correctly if Zustand store is typed properly
  const mainMenuExpanded = useStateStore((state) => state.layout.mainMenuExpanded);

  return (
    <div
      className={styles.BottomMenuTray}
      style={{ width: mainMenuExpanded ? "900px" : "100px" }}
    >
    </div>
  );
};

export default BottomMenuTray;
