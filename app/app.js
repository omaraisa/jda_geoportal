"use client";

import { useState } from "react";
import Header from "./components/header";
import MainMenu from "./components/main-menu";
import SubMenu from "./components/sub-menu";
import ContentView from "./components/contentview";
import React from "react";
import useStateStore from "./stateManager";
import MinimizeMenu from "./components/sub_components/minimize-menu";
import BottomPane from "./components/bottom-pane";
import Split from "react-split";
import "./i18n";

export default function App() {
  const layoutState = useStateStore((state) => state.layout);
  const toggleMenus = useStateStore((state) => state.toggleMenus);

  // Local state to control animation
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

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
          minSize={[0, 40, 0]}
          gutterSize={4}
          direction="horizontal"
          className="flex h-full"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Primary Pane */}
          <div
            className="bg-gray-100 border-r border-gray-300"
            style={{
              transition: isDragging
                ? "none"
                : layoutState.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}
          >
            <MainMenu />
          </div>

          {/* Middle Pane with Nested Vertical Split */}
          <div
            className="flex flex-col h-full"
            style={{
              transition: isDragging
                ? "none"
                : layoutState.animationOn
                ? "0.5s ease-in-out"
                : "none",
            }}
          >
            <Split
              sizes={[layoutState.mapContainerSize, layoutState.bottomPaneSize]}
              minSize={[200, 1]}
              gutterSize={4}
              direction="vertical"
              className="h-full"
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Map Pane */}
              <div
                className="bg-white"
                style={{
                  transition: isDragging
                    ? "none"
                    : layoutState.animationOn
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
                className="bg-gray-100 border-t border-gray-300"
                style={{
                  transition: isDragging
                    ? "none"
                    : layoutState.animationOn
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
            className="bg-gray-100 border-l border-gray-300"
            style={{
              transition: isDragging
                ? "none"
                : layoutState.animationOn
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
