import React from "react";
import MainMap from "./main-map";
// import MainScene from "./main-scene";
import useAppStore from "../stateManager";

function ContentView() {
  const viewMode = useAppStore((state) => state.viewMode); // Access the current view mode (2D or 3D)

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <React.Suspense fallback={<div>Loading...</div>}>
      <MainMap />
        {/* {viewMode === "2D" ? <MainMap /> : <MainScene />} */}
      </React.Suspense>
    </div>
  );
}

export default ContentView;
