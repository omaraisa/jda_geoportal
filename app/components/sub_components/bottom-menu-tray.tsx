import React from "react";
import styles from "./bottom-menu-tray.module.css";
import useStateStore from "@/stateManager";

const BottomMenuTray: React.FC = () => {
  // Type inferred correctly if Zustand store is typed properly
  const toolsMenuExpanded = useStateStore((state) => state.layout.toolsMenuExpanded);

  return (
    <div
      className={styles.BottomMenuTray}
      style={{ width: toolsMenuExpanded ? "900px" : "100px" }}
    >
    </div>
  );
};

export default BottomMenuTray;
