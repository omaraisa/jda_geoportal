import React from "react";
import dynamic from "next/dynamic";
import Split from "react-split";
const MainMap = dynamic(() => import("./main-map"), { ssr: false });
const MainScene = dynamic(() => import("./main-scene"), { ssr: false });
import useStateStore from "../stateManager";
import Loading from "./sub_components/loading";
import MessageContainer from "./messages-container";

function ContentView() {
  // const viewMode = "Dual";
  const viewMode = useStateStore((state) => state.viewMode); // Access the current view mode (2D, 3D, or Dual)

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MessageContainer />
      <React.Suspense fallback={<Loading />}>
        {viewMode === "2D" && <MainMap />}
        {viewMode === "3D" && <MainScene />}
        {viewMode === "Dual" && (
          
          <Split
            sizes={[50, 50]} // Equal size split
            minSize={10} // Minimum size of each panel
            gutterSize={5} // Size of the draggable gutter
            gutterAlign="center"
            direction="horizontal" // Horizontal split
            style={{ display: "flex", width: "100%", height: "100%" }}
            cursor="col-resize"
          >
            {/* First pane (2D View) */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <MainMap />
            </div>
            {/* Second pane (3D View) */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <MainScene />
            </div>
          </Split>
        )}
      </React.Suspense>
    </div>
  );
}

export default ContentView;
