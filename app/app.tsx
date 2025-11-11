"use client";

import React from "react";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import ContentView from "./components/contentview";
import useStateStore from "./stateStore";
import "./i18n";
import AppLoader from "./components/ui/app-loader";
import BottomPane from "./components/bottom-pane";
import MainMenu from "./components/ui/menu/main-menu";
import useAuthentication from "@/lib/hooks/use-authentication";
import '@esri/calcite-components/dist/components/calcite-icon';
import SessionEndModal from "./components/session-end-modal";
import FullScreenLayoutMode from "./components/layout-mode/FullScreenLayoutMode";
import MapCapturePreview from "./components/MapCapturePreview";
import { useTranslation } from "react-i18next";

export default function App() {
  useAuthentication()
  const { i18n } = useTranslation();

  const {
    layout: layoutState,
    setLanguage,
    appReady,
    language,
    updateStats,
    layoutModeActive,
  } = useStateStore((state) => state);

  // Sync language with i18n immediately on language change
  React.useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  React.useEffect(() => {
    setLanguage(language);
    updateStats("page_visit")
  }, [appReady]);

  return (
    <div className="absolute w-screen h-screen flex flex-col overflow-hidden">
      {/* Full Screen Layout Mode */}
      {layoutModeActive && <FullScreenLayoutMode />}

      {/* Map Capture Preview Overlay */}
      <MapCapturePreview />

      {/* Session Modal */}
      <SessionEndModal />

      {!appReady && (
        <div className="absolute inset-0 z-20 bg-[#182726]  text-white flex justify-center items-center">
          <AppLoader />
        </div>
      )}

      <Header />
      <div
        className="relative w-full h-full "
      >
        <div className="absolute inset-y-0 left-0 right-0 bg-[#182726] flex flex-col">
          <div className="flex-1 relative">
            <ContentView />
          </div>

          <div
            className={`absolute top-1/2 py-6 transform -translate-y-1/2 w-[270px] bg-transparent z-4 transition-all duration-1000 overflow-hidden left-5`}
            style={{ height: `${layoutState.sidebarHeight}vh` }} 
          >
            <Sidebar />
          </div>

          <div
            className={`absolute px-6 py-3 bottom-20 left-1/2 transform -translate-x-1/2 w-[calc(100%-600px)] max-w-[1200px] bg-transparent rounded-lg overflow-hidden transition-all duration-1000 ${
              layoutState.bottomPaneOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
            style={{ height: `${layoutState.bottomPaneHeight}px` }}
          >
            <BottomPane />
          </div>
          <MainMenu />

        </div>
      </div>
    </div>
  );
}
