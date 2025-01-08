// ContentView.jsx
import React from "react";
import dynamic from "next/dynamic";
import Split from "react-split";
import useStateStore from "../stateManager";
import Loading from "./sub_components/loading";
import MessageContainer from "./messages-container";

const MainMap = dynamic(() => import("./main-map"), { ssr: false });
const MainScene = dynamic(() => import("./main-scene"), { ssr: false });

function ContentView() {
  // Extract necessary state and actions from the store
  const viewMode = useStateStore((state) => state.viewMode);
  const layoutState = useStateStore((state) => state.layout);
  const startDragging = useStateStore((state) => state.startDragging);
  const endDragging = useStateStore((state) => state.endDragging);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MessageContainer />
      <React.Suspense fallback={<Loading />}>
        {viewMode === "2D" && <MainMap />}
        {viewMode === "3D" && <MainScene />}
        {viewMode === "Dual" && (
          <Split
            sizes={[50, 50]} // Equal size split
            minSize={[10, 10]} // Minimum size for each pane
            gutterSize={4} // Draggable gutter size
            direction="horizontal" // Horizontal split
            className="flex h-full"
            onDragStart={startDragging}
            onDragEnd={endDragging}
          >
            {/* First Pane */}
            <div
              className="bg-lightblue flex items-center justify-center h-full relative"
              style={{
                transition: layoutState.animationOn
                  ? "0.5s ease-in-out"
                  : "none",
              }}
            >
              <MainMap />
            </div>

            {/* Second Pane */}
            <div
              className="bg-lightcoral flex items-center justify-center h-full relative"
              style={{
                transition: layoutState.animationOn
                  ? "0.5s ease-in-out"
                  : "none",
              }}
            >
              <MainScene />
            </div>
          </Split>
        )}
      </React.Suspense>
    </div>
  );
}

export default ContentView;
