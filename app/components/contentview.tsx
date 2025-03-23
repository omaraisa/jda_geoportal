import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Split from "react-split";
import useStateStore from "@/stateStore";
import Loading from "./ui/loading";
import MessageContainer from "./messages-container";

const MainMap = dynamic(() => import("./mapview"), { ssr: false });
const MainScene = dynamic(() => import("./sceneview"), { ssr: false });

const ContentView: React.FC = () => {
  const viewMode = useStateStore((state) => state.viewMode);
  const [splitSizes, setSplitSizes] = useState<number[]>([50, 50]);

  useEffect(() => {
    if (viewMode === "2D") {
      setSplitSizes([100, 0]);
    } else if (viewMode === "3D") {
      setSplitSizes([0, 100]);
    } else if (viewMode === "Dual") {
      setSplitSizes([50, 50]);
    }
  }, [viewMode]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MessageContainer />
      
      <React.Suspense fallback={<Loading />}>
        <Split
          sizes={splitSizes}
          minSize={[0, 0]}
          gutterSize={viewMode === "Dual" ? 6 : 0}
          direction="horizontal"
          style={{ display: "flex", width: "100%", height: "100%" }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: splitSizes[0] > 0 ? "block" : "none",
            }}
          >
            <MainMap />
          </div>

          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: splitSizes[1] > 0 ? "block" : "none",
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
