import React from "react";
import { useTranslation } from "react-i18next";

const DefaultComponent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full flex justify-center items-center text-white">
      <h4>{t("defaultComponent.noToolsActivated")}</h4>
    </div>
  );
};

export default DefaultComponent;
