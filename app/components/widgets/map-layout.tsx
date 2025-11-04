"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";

const MapLayoutComponent: React.FC = () => {
  const { t } = useTranslation();
  const setLayoutModeActive = useStateStore((state) => state.setLayoutModeActive);
  const setPrintBoundaryVisible = useStateStore((state) => state.setPrintBoundaryVisible);

  // Show print boundary when component mounts, hide when unmounts
  useEffect(() => {
    setPrintBoundaryVisible(true);
    return () => {
      setPrintBoundaryVisible(false);
    };
  }, [setPrintBoundaryVisible]);

  const handleEnterLayoutMode = () => {
    setLayoutModeActive(true);
  };

  return (
    <div className="p-4 text-black w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">{t('mapLayouts.title', 'Map Print')}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {t('mapLayouts.description', 'Enter full-screen layout mode to design your map with draggable elements.')}
      </p>
      <button
        onClick={handleEnterLayoutMode}
        className="w-full font-medium py-2 px-4 rounded-md transition-colors bg-[#253080] hover:bg-[#1e2660] text-white"
      >
        {t('mapLayouts.enterLayoutMode', 'Enter Layout Mode')}
      </button>
    </div>
  );
};

export default MapLayoutComponent;