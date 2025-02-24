import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const language = useStateStore((state) => state.language);
  const setLanguage = useStateStore((state) => state.setLanguage);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
  };

  useEffect(() => {
    i18n.changeLanguage(language); // Update i18next language whenever language state changes
  }, [language, i18n]);

  return (
    <div className="flex items-center">
      <button
        className={`text-gray-500 p-2 bg-white bg-opacity-60 border border-white rounded-full hover:bg-gray-200 focus:outline-none w-10 h-10 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.8)]`}

        onClick={toggleLanguage}
      >
        {language === "ar" ? "En" : "ع"}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
