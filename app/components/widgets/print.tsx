"use client";

import React from "react";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import { PrintForm, StatusDisplay, usePrint } from "./print/";

const PrintComponent: React.FC = () => {
  const view = useStateStore((state) => state.targetView);
  const { t } = useTranslation();
  const userInfo = useStateStore((state) => state.userInfo);
  const updateStats = useStateStore((state) => state.updateStats);

  const {
    isLoading,
    error,
    progress,
    resolution,
    formData,
    handleInputChange,
    handleCheckboxChange,
    handleResolutionChange,
    handlePrint,
  } = usePrint(view, userInfo, updateStats, t);

  return (
    <div className="p-4 text-black w-full max-w-md">
      <PrintForm
        formData={formData}
        resolution={resolution}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onCheckboxChange={handleCheckboxChange}
        onResolutionChange={handleResolutionChange}
        onSubmit={handlePrint}
        t={t}
      />

      <StatusDisplay error={error} progress={progress} t={t} />
    </div>
  );
};

export default PrintComponent;
