import React from "react";
import dynamic from "next/dynamic";
const MainMap = dynamic(() => import("./main-map"), { ssr: false });
const MainScene = dynamic(() => import("./main-scene"), { ssr: false });
import useAppStore from "../stateManager";
import Loading from "./sub_components/loading";

function ContentView() {
  const viewMode = useAppStore((state) => state.viewMode); // Access the current view mode (2D or 3D)

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <React.Suspense fallback={<Loading />}>
        {viewMode === "2D" ? <MainMap /> : <MainScene />}
      </React.Suspense>
    </div>
  );
}

export default ContentView;
