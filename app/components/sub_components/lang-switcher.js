import React from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateManager";
import Image from 'next/image';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const language = useStateStore((state) => state.language);
    const setLanguage = useStateStore((state) => state.setLanguage);
    
    const toggleLanguage = () => {
        const newLang = language === "en" ? "ar" : "en";
        setLanguage(newLang);
        i18n.changeLanguage(newLang); // Update i18next language
      };
    

  return (
    <div className="flex items-center">
      <button
        className="text-gray-700 p-2 bg-white rounded-full hover:bg-gray-200 focus:outline-none w-10 h-10 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
        onClick={toggleLanguage}
      >
        {i18n.language === "ar" ? "En" : "ع"}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
