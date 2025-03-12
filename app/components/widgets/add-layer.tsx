import React from "react";
import { useTranslation } from "react-i18next";

const AddLayer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full flex justify-center items-center text-white">
      <h4>{t("sidebar.titles.UnderDevelopment")}</h4>
    </div>
  );
};

export default AddLayer;
