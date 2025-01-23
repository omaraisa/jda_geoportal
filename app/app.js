"use client";

import React from "react";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import ContentView from "./components/contentview";
import useStateStore from "./stateManager";
import "./i18n";
import AppLoader from "./components/app-loader";
import ToolsMenu from "./components/tools-menu";
import BottomMenuTray from "./components/sub_components/bottom-menu-tray";
import BottomPane from "./components/bottom-pane";

export default function App() {
  // Extract necessary state and actions from the store
  const layoutState = useStateStore((state) => state.layout);
  const appReady = useStateStore((state) => state.appReady);
  const setAppReady = useStateStore((state) => state.setAppReady);

  // Simulate app loading | Must be removed in production
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 0); // 50 seconds delay
    // }, 5000); // 50 seconds delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute w-screen h-screen flex flex-col overflow-hidden">
      {/* App Loader - Covers the entire screen */}
      {!appReady && (
        <div className="absolute inset-0 z-50 bg-[#182726]  text-white flex justify-center items-center">
          <AppLoader />
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div
        className="relative w-full h-full border-1 border-transparent"
        style={{
          background: "linear-gradient(to right, #00ffff, #ff00ff, #00ffff)",
          backgroundSize: "200% 100%",
          animation: "shine 3s linear infinite",
        }}
      >
        {/* Inner content area */}
        <div className="absolute inset-1 bg-[#182726] flex flex-col">
          {/* ContentView (fills remaining space) */}
          <div className="flex-1 relative">
            <ContentView />
          </div>

          <div
            className={`absolute top-1/2 py-6 transform -translate-y-1/2 w-[300px] bg-transparent z-20 transition-all duration-1000 overflow-hidden ${
              useStateStore((state) => state.language) === "en" ? "left-5" : "right-5" // Flip position based on language
            }`}
            style={{ height: `${layoutState.sidebarHeight}vh` }} // Add "vh" here
            >
            <Sidebar />
            </div>

            <div
            className={`absolute px-6 py-3 bottom-20 left-1/2 transform -translate-x-1/2 w-[calc(100%-600px)] h-[40vh] max-w-[1200px] bg-transparent rounded-lg overflow-hidden transition-all duration-1000 ${
              layoutState.bottomPaneOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
            >
            <BottomPane />
            </div>

            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
            <ToolsMenu />
            </div>

            {/* Bottom Menu Tray */}
          <BottomMenuTray />
        </div>
      </div>
    </div>
  );
}
