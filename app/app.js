"use client";

import React from "react";
import dynamic from "next/dynamic";
import Header from "./components/header";
import MainMenu from "./components/main-menu";
import SubMenu from "./components/sub-menu";
import ContentView from "./components/contentview";
import useStateStore from "./stateManager";
import MinimizeMenu from "./components/sub_components/minimize-menu";
import BottomPane from "./components/bottom-pane";
import Split from "react-split";
import "./i18n";

export default function App() {
  // Extract necessary state and actions from the store
  const layoutState = useStateStore((state) => state.layout);
  const toggleMenus = useStateStore((state) => state.toggleMenus);
  const startDragging = useStateStore((state) => state.startDragging);
  const endDragging = useStateStore((state) => state.endDragging);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Outer Horizontal Split: Primary Pane | Middle Pane | Secondary Pane */}
        <Split
          sizes={[
            layoutState.primaryPaneSize,
            layoutState.middlePaneSize,
            layoutState.secondaryPaneSize,
          ]}
          minSize={[layoutState.primaryPaneMinSize, layoutState.middlePaneMinSize, layoutState.secondaryPaneMinSize]}
          maxSize={[layoutState.primaryPaneMaxSize, Infinity, layoutState.secondaryPaneMaxSize]}
          gutterSize={4}
          direction="horizontal"
          className="flex h-full"
          onDragStart={startDragging}
          onDragEnd={endDragging}
        >
          {/* Primary Pane */}
          <div
            className="bg-gray-100 border-r border-gray-300 relative"
            style={{
              transition: layoutState.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}
          >
            <MainMenu />
            <MinimizeMenu
              vertical={true}
              Onducked={() => toggleMenus("primary")}
              arrow={layoutState.primaryPaneArrow}
              className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
            />
          </div>

          {/* Middle Pane with Nested Vertical Split */}
          <div
            className="flex flex-col h-full"
            style={{
              transition: layoutState.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}
          >
            <Split
              sizes={[layoutState.mapContainerSize, layoutState.bottomPaneSize]}
              minSize={[layoutState.mapContainerMinSize, layoutState.bottomPaneMinSize]}
              maxSize={[Infinity, layoutState.bottomPaneMaxSize]}
              gutterSize={4}
              direction="vertical"
              className="h-full"
              onDragStart={startDragging}
              onDragEnd={endDragging}
            >
              {/* Map Pane */}
              <div
                className="bg-white relative"
                style={{
                  transition: layoutState.animationOn
                    ? "0.5s ease-in-out"
                    : "none",
                }}
              >
                <ContentView />
                <MinimizeMenu
                  vertical={true}
                  Onducked={() => toggleMenus("primary")}
                  arrow={layoutState.primaryPaneArrow}
                  className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
                />
              </div>

              {/* Bottom Pane */}
              <div
                className="bg-gray-100 border-t border-gray-300 relative"
                style={{
                  transition: layoutState.animationOn
                    ? "0.5s ease-in-out"
                    : "none",
                }}
              >
                <MinimizeMenu
                  vertical={false}
                  Onducked={() => toggleMenus("bottom")}
                  arrow={layoutState.bottomPaneArrow}
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
                />
                <BottomPane />
              </div>
            </Split>
          </div>

          {/* Secondary Pane */}
          <div
            className="bg-gray-100 border-l border-gray-300 relative"
            style={{
              transition: layoutState.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}
          >
            <SubMenu />
            <MinimizeMenu
              vertical={true}
              Onducked={() => toggleMenus("secondary")}
              arrow={layoutState.secondaryPaneArrow}
              className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-primary text-white rounded shadow p-1 cursor-pointer"
            />
          </div>
        </Split>
      </main>
    </div>
  );
}
