"use client";

import Header from "./components/header";
import MainMenu from "./components/main-menu";
import SubMenu from "./components/sub-menu";
import ContentView from "./components/contentview";
import React from "react";
// import Loading from "./components/sub_components/loading";
// import MessagesContainer from "./components/messages-container";
import { defaultLayout, LayoutManager } from "./components/layout-management";
// import {
  //   updateMessageStatus,
  //   msgExpirationChecker,
  //   attachMessage,
  // } from "./components/messages-manager";
  import MinimizeMenu from "./components/sub_components/minimize-menu";
  import BottomPane from "./components/bottom-pane";
  import { useAppContext  } from "./context/AppContext"; 
  import Split from "react-split";

export default function App() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Outer Horizontal Split: Left Pane | Middle Pane | Right Pane */}
        <Split
          sizes={[
            state.layout.leftPaneSize,
            state.layout.middlePaneSize,
            state.layout.rightPaneSize,
          ]} // Initial sizes in percentages
          minSize={[0, 40, 0]} // Minimum sizes in percentages
          gutterSize={4} // Gutter width in pixels
          direction="horizontal"
          className="flex h-full"
        >
          {/* Left Pane */}
          <div
            className="bg-gray-100 border-r border-gray-300"
            style={{
              transition: state.layout.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}
          >
            <SubMenu />
          </div>

          {/* Middle Pane with Nested Vertical Split */}
          <div className="flex flex-col h-full" style={{
              transition: state.layout.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}>
            <Split
              sizes={[state.layout.mapContainerSize, state.layout.bottomPaneSize]} // Map Pane (80%) | Bottom Pane (20%)
              minSize={[200, 1]} // Minimum sizes in pixels
              gutterSize={4} // Gutter height in pixels
              direction="vertical"
              className="h-full" // Gutter background color
            >
              {/* Map Pane */}
              <div className="bg-white" style={{
              transition: state.layout.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}>
                <ContentView />
                <MinimizeMenu
                  vertical={true}
                  Onducked={() =>
                    dispatch({ type: "toggleMenus", side: "left" })
                  }
                  arrow={state.layout.leftPaneArrow}
                  className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
                />
              </div>

              {/* Bottom Pane */}
              <div className="bg-gray-100 border-t border-gray-300" style={{
              transition: state.layout.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}>
                <MinimizeMenu
                  vertical={false}
                  Onducked={() =>
                    dispatch({ type: "toggleMenus", side: "bottom" })
                  }
                  arrow={state.layout.bottomPaneArrow}
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
                />
                <BottomPane />
              </div>
            </Split>
          </div>

          {/* Right Pane */}
          <div className="bg-gray-100 border-l border-gray-300" style={{
              transition: state.layout.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}>
            <MainMenu />
            <MinimizeMenu
              vertical={true}
              Onducked={() => dispatch({ type: "toggleMenus", side: "right" })}
              arrow={state.layout.rightPaneArrow}
              className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
            />
          </div>
        </Split>
      </main>
    </div>
  );
}
