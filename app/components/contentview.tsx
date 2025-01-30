import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Split from "react-split";
import useStateStore from "@/stateManager";
import Loading from "./sub_components/loading";
import MessageContainer from "./messages-container";

// Dynamically import components
const MainMap = dynamic(() => import("./main-map"), { ssr: false });
const MainScene = dynamic(() => import("./main-scene"), { ssr: false });

const ContentView: React.FC = () => {
  // Extract necessary state and actions from the store
  const viewMode = useStateStore((state) => state.viewMode);

  // State to manage split sizes
  const [splitSizes, setSplitSizes] = useState<number[]>([50, 50]);

  // Effect to adjust split sizes based on viewMode
  useEffect(() => {
    if (viewMode === "2D") {
      setSplitSizes([100, 0]); // Full width for MainMap, hide MainScene
    } else if (viewMode === "3D") {
      setSplitSizes([0, 100]); // Full width for MainScene, hide MainMap
    } else if (viewMode === "Dual") {
      setSplitSizes([50, 50]); // Equal split for both
    }
  }, [viewMode]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MessageContainer />
      <React.Suspense fallback={<Loading />}>
        <Split
          sizes={splitSizes} // Dynamic sizes based on viewMode
          minSize={[0, 0]} // Minimum size for each pane
          gutterSize={viewMode === "Dual" ? 6 : 0} // Hide gutter when not in Dual mode
          direction="horizontal" // Horizontal split
          style={{ display: "flex", width: "100%", height: "100%" }}
        >
          {/* First Pane - MainMap */}
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: splitSizes[0] > 0 ? "block" : "none", // Hide if width is 0
            }}
          >
            <MainMap />
          </div>

          {/* Second Pane - MainScene */}
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: splitSizes[1] > 0 ? "block" : "none", // Hide if width is 0
            }}
          >
            <MainScene />
          </div>
        </Split>
      </React.Suspense>
    </div>
  );
};

export default ContentView;
