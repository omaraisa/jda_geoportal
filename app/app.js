"use client";

import React from "react";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import ContentView from "./components/contentview";
import useStateStore from "./stateStore";
import "./i18n";
import AppLoader from "./components/ui/app-loader";
import BottomPane from "./components/bottom-pane";
import LogoMenu from "./components/advanced-main-menu";

export default function App() {
  // Extract necessary state and actions from the store
  const {
    layout: layoutState,
    setLanguage,
    appReady,
    setAppReady,
    language,
  } = useStateStore((state) => state);

  // Simulate app loading | Must be removed in production
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 200); // 50 seconds delay
    // }, 5000); // 50 seconds delay

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    setLanguage(language);
  }, [appReady]);

  return (
    <div className="absolute w-screen h-screen flex flex-col overflow-hidden">
      {/* App Loader - Covers the entire screen */}
      {!appReady && (
        <div className="absolute inset-0 z-50 bg-[#182726]  text-white flex justify-center items-center">
          <AppLoader />
        </div>
      )}

      <Header />
      <div
        className="relative w-full h-full border-1 border-transparent"
        style={{
          background:
            "linear-gradient(to right,  #18def8 ,  #44747a,  #18def8)",
          backgroundSize: "200% 50%",
          animation: "shine 3s linear infinite",
        }}
      >
        <div className="absolute inset-y-1 left-0 right-0 bg-[#182726] flex flex-col">
          <div className="flex-1 relative">
            <ContentView />
          </div>

          <div
            className={`absolute top-1/2 py-6 transform -translate-y-1/2 w-[250px] bg-transparent z-20 transition-all duration-1000 overflow-hidden ${
              language === "en" ? "left-5" : "right-5" // Flip position based on language
            }`}
            style={{ height: `${layoutState.sidebarHeight}vh` }} // Add "vh" here
          >
            <Sidebar />
          </div>

          <div
            className={`absolute px-6 py-3 bottom-20 left-1/2 transform -translate-x-1/2 w-[calc(100%-600px)] h-[40vh] max-w-[1200px] bg-transparent rounded-lg overflow-hidden transition-all duration-1000 ${
              layoutState.bottomPaneOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
          >
            <BottomPane />
          </div>
          <LogoMenu />

        </div>
      </div>
    </div>
  );
}
