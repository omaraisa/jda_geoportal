import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"; // Set direction
  };

  return (
    <div className="flex items-center">
      <button
        className="text-gray-700 p-2 bg-white rounded-full hover:bg-gray-200 focus:outline-none"
        onClick={() => changeLanguage(i18n.language === "ar" ? "en" : "ar")}
        title={i18n.language === "ar" ? "English" : "عربي"}
      >
        <img
          src={i18n.language === "ar" ? "/uk_flag.svg" : "/ksa_flag.svg"}
          alt={i18n.language === "ar" ? "UK Flag" : "KSA Flag"}
          className="w-6 h-6"
        />
      </button>
    </div>
  );
};

export default LanguageSwitcher;
